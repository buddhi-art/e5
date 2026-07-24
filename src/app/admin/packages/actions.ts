'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { PackageSchema, PackagePaymentSchema } from '@/lib/validations'

export async function getPackagesList(params: {
    search?: string
    status?: string
    paymentStatus?: string
    startDate?: string
    endDate?: string
    page?: number
    limit?: number
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { data: [], total: 0, error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { data: [], total: 0, error: 'Permission denied.' }

        const page = params.page || 1
        const limit = params.limit || 10
        const from = (page - 1) * limit
        const to = from + limit - 1

        let query = supabase
            .from('packages')
            .select(`
                *,
                clients!inner ( id, company_name, contact_person, contact_email, phone_number )
            `, { count: 'exact' })
            .is('deleted_at', null)
            .order('created_at', { ascending: false })

        if (params.search && params.search.trim()) {
            const term = params.search.trim()
            query = query.or(`title.ilike.%${term}%,package_number.ilike.%${term}%,clients.company_name.ilike.%${term}%,clients.contact_person.ilike.%${term}%`)
        }

        if (params.status && params.status !== 'all') {
            query = query.eq('status', params.status)
        }

        if (params.paymentStatus && params.paymentStatus !== 'all') {
            query = query.eq('payment_status', params.paymentStatus)
        }

        if (params.startDate) {
            query = query.gte('creation_date', params.startDate)
        }

        if (params.endDate) {
            query = query.lte('creation_date', params.endDate)
        }

        const { data, count, error } = await query.range(from, to)

        if (error) {
            console.error('Error fetching packages:', error)
            return { data: [], total: 0, error: error.message }
        }

        return { data: data || [], total: count || 0 }
    } catch (err: unknown) {
        return { data: [], total: 0, error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function getPackageDashboardMetrics() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        const { data: packages, error } = await supabase
            .from('packages')
            .select('grand_total, paid_amount, status, payment_status')
            .is('deleted_at', null)

        if (error) return { error: error.message }

        const totalPackages = packages?.length || 0
        const totalRevenue = packages?.reduce((sum, p) => sum + Number(p.grand_total || 0), 0) || 0
        const activePackages = packages?.filter(p => p.status === 'in_progress').length || 0
        const pendingPaymentsCount = packages?.filter(p => p.payment_status === 'unpaid' || p.payment_status === 'partially_paid').length || 0

        return {
            metrics: {
                totalPackages,
                totalRevenue,
                activePackages,
                pendingPaymentsCount,
            }
        }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function createPackage(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        const parsed = PackageSchema.safeParse({
            client_id: formData.get('client_id'),
            title: formData.get('title'),
            preset_template: formData.get('preset_template'),
            creation_date: formData.get('creation_date'),
            status: formData.get('status') || 'in_progress',
            payment_status: formData.get('payment_status') || 'unpaid',
            payment_method: formData.get('payment_method') || 'bank_transfer',
            discount_amount: Number(formData.get('discount_amount') || 0),
            tax_percent: Number(formData.get('tax_percent') || 0),
            notes: formData.get('notes'),
            itemsRaw: formData.get('items'),
        })

        if (!parsed.success) {
            return { error: 'Validation failed: ' + parsed.error.issues[0].message }
        }

        const pkg = parsed.data
        const items = pkg.items || []
        if (items.length === 0) {
            return { error: 'Please add at least one line item' }
        }

        // Calculate Subtotal, Tax, Grand Total
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
        const afterDiscount = Math.max(0, subtotal - (pkg.discount_amount || 0))
        const taxAmount = (afterDiscount * (pkg.tax_percent || 0)) / 100
        const grandTotal = afterDiscount + taxAmount

        // Initial paid amount calculation
        const rawPaidAmount = Number(formData.get('paid_amount') || 0)
        const paidAmount = pkg.payment_status === 'paid'
            ? grandTotal
            : pkg.payment_status === 'partially_paid'
            ? Math.min(grandTotal, Math.max(0, rawPaidAmount))
            : 0

        // Generate Package Number e.g. PKG-2026-XXXX
        const year = new Date(pkg.creation_date).getFullYear()
        const randomCode = Math.floor(1000 + Math.random() * 9000)
        const packageNumber = `PKG-${year}-${randomCode}`

        // Insert package header
        const { data: insertedPkg, error: pkgErr } = await supabase
            .from('packages')
            .insert({
                package_number: packageNumber,
                client_id: pkg.client_id,
                title: pkg.title,
                preset_template: pkg.preset_template || null,
                status: pkg.status,
                payment_status: pkg.payment_status,
                payment_method: pkg.payment_method,
                subtotal,
                discount_amount: pkg.discount_amount || 0,
                tax_percent: pkg.tax_percent || 0,
                tax_amount: taxAmount,
                grand_total: grandTotal,
                paid_amount: paidAmount,
                creation_date: pkg.creation_date,
                notes: pkg.notes || null,
                created_by: user.id
            })
            .select()
            .single()

        if (pkgErr || !insertedPkg) {
            return { error: pkgErr?.message || 'Failed to create package' }
        }

        const packageId = insertedPkg.id

        // Record initial payment record if paid amount > 0
        if (paidAmount > 0) {
            await supabase.from('package_payments').insert({
                package_id: packageId,
                amount: paidAmount,
                payment_date: pkg.creation_date,
                payment_method: pkg.payment_method,
                notes: pkg.payment_status === 'paid'
                    ? 'Full payment received upon package creation'
                    : `Advance payment of Rs. ${paidAmount.toLocaleString()} received upon package creation`,
                received_by: user.id
            })
        }

        // Insert line items
        const itemInserts = items.map((item, idx) => ({
            package_id: packageId,
            description: item.description,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            subtotal: item.quantity * item.unit_cost,
            sort_order: idx
        }))

        const { error: itemsErr } = await supabase.from('package_items').insert(itemInserts)
        if (itemsErr) console.error('Error inserting items:', itemsErr)

        // Initialize Logistics
        await supabase.from('package_logistics').insert({
            package_id: packageId,
            revision_count: 0,
            assigned_staff_ids: [],
            vehicles_taken: []
        })

        // Initialize Editing Hub
        await supabase.from('package_post_prod').insert({
            package_id: packageId,
            assigned_editor_ids: [],
            deliverable_links: '',
            client_revision_notes: ''
        })

        // Each deliverable item is a Project with Tasks
        for (let idx = 0; idx < items.length; idx++) {
            const item = items[idx]
            const deliverableTitle = `${item.quantity > 1 ? `${item.quantity}x ` : ''}${item.description}`
            const projectTitle = `${pkg.title} - ${deliverableTitle}`

            // Create dedicated project for this deliverable
            const { data: createdProject } = await supabase
                .from('projects')
                .insert({
                    client_id: pkg.client_id,
                    title: projectTitle,
                    status: 'in_progress',
                    package: pkg.preset_template || pkg.title || null
                })
                .select('id')
                .single()

            const projectId = createdProject?.id || null

            if (projectId) {
                // Generate default 5-phase tasks for this deliverable project (Videography & Editing agency workflow)
                const defaultTasks = [
                    { project_id: projectId, phase: 'Phase 1', title: `Concept & Scripting (${deliverableTitle})`, description: 'Initial planning, storyboarding, scriptwriting, and concept approval', status: 'pending' },
                    { project_id: projectId, phase: 'Phase 2', title: `Videography & On-Site Shoot (${deliverableTitle})`, description: 'On-site camera shoot, lighting, asset capture, and audio recording', status: 'pending' },
                    { project_id: projectId, phase: 'Phase 3', title: `Editing & Graphic Design (${deliverableTitle})`, description: 'Video editing, color grading, audio sync, graphic assets, and motion design', status: 'pending' },
                    { project_id: projectId, phase: 'Phase 4', title: `QA Review & Founder Feedback (${deliverableTitle})`, description: 'Internal quality review, founder feedback, and revision round', status: 'pending' },
                    { project_id: projectId, phase: 'Phase 5', title: `Final Export & Client Delivery (${deliverableTitle})`, description: 'Exporting final 4K/HD video or design files and submitting Drive link', status: 'pending' }
                ]
                await supabase.from('tasks').insert(defaultTasks)
            }

            // Insert package deliverable linked to its project
            await supabase.from('package_deliverables').insert({
                package_id: packageId,
                title: deliverableTitle,
                status: 'UNASSIGNED',
                sort_order: idx,
                project_id: projectId
            })
        }

        // Audit Log
        await supabase.from('package_audit_logs').insert({
            package_id: packageId,
            actor_id: user.id,
            action: `Package ${packageNumber} created for total Rs. ${grandTotal.toLocaleString()} (Paid: Rs. ${paidAmount.toLocaleString()})`
        })

        revalidatePath('/admin/packages')
        revalidatePath('/admin/projects')
        revalidatePath('/founder/projects')
        return { success: true, packageId }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function getPackageDetails(packageId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        // Fetch main package with client
        const { data: pkg, error: pkgErr } = await supabase
            .from('packages')
            .select(`
                *,
                projects ( id, raw_footage_link, brand_assets_link, client_brief_notes ),
                clients!inner ( id, company_name, contact_person, contact_email, phone_number, billing_address, tax_id )
            `)
            .eq('id', packageId)
            .is('deleted_at', null)
            .single()

        if (pkgErr || !pkg) return { error: 'Package not found' }

        // Fetch child tables
        const [
            { data: items },
            { data: logistics },
            { data: siteVisits },
            { data: postProd },
            { data: deliverables },
            { data: payments },
            { data: auditLogs },
            { data: equipmentList }
        ] = await Promise.all([
            supabase.from('package_items').select('*').eq('package_id', packageId).order('sort_order', { ascending: true }),
            supabase.from('package_logistics').select('*').eq('package_id', packageId).maybeSingle(),
            supabase.from('package_site_visits').select('*, profiles!package_site_visits_logged_by_fkey(full_name)').eq('package_id', packageId).order('created_at', { ascending: false }),
            supabase.from('package_post_prod').select('*').eq('package_id', packageId).maybeSingle(),
            supabase.from('package_deliverables').select('*').eq('package_id', packageId).order('sort_order', { ascending: true }),
            supabase.from('package_payments').select('*, profiles!package_payments_received_by_fkey(full_name)').eq('package_id', packageId).order('created_at', { ascending: false }),
            supabase.from('package_audit_logs').select('*, profiles!package_audit_logs_actor_id_fkey(full_name)').eq('package_id', packageId).order('created_at', { ascending: false }),
            supabase.from('equipment').select('id, name, model, category, status').is('deleted_at', null).order('name', { ascending: true })
        ])

        return {
            package: pkg,
            items: items || [],
            logistics: logistics || { revision_count: 0, assigned_staff_ids: [], vehicles_taken: [], equipments_taken: [], start_time: '', end_time: '' },
            siteVisits: siteVisits || [],
            postProd: postProd || { assigned_editor_ids: [], deliverable_links: '', client_revision_notes: '' },
            deliverables: deliverables || [],
            payments: payments || [],
            auditLogs: auditLogs || [],
            equipmentList: equipmentList || []
        }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function deletePackage(packageId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        const { error } = await supabase
            .from('packages')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', packageId)

        if (error) return { error: error.message }

        revalidatePath('/admin/packages')
        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function incrementRevisionCount(
    packageId: string,
    visitDate: string,
    staffIds: string[],
    reason: string,
    extras?: { equipmentsTaken?: string[], startTime?: string, endTime?: string, locationAddress?: string }
) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        if (!reason || !reason.trim()) {
            return { error: 'Reason for visit is required' }
        }

        // Fetch current logistics
        const { data: current } = await supabase
            .from('package_logistics')
            .select('revision_count')
            .eq('package_id', packageId)
            .maybeSingle()

        const newCount = (current?.revision_count || 0) + 1

        // Upsert logistics
        await supabase.from('package_logistics').upsert({
            package_id: packageId,
            revision_count: newCount,
            updated_at: new Date().toISOString()
        }, { onConflict: 'package_id' })

        // Log site visit history
        await supabase.from('package_site_visits').insert({
            package_id: packageId,
            visit_date: visitDate || new Date().toISOString().split('T')[0],
            staff_ids: staffIds || [],
            reason: reason.trim(),
            equipments_taken: extras?.equipmentsTaken || [],
            start_time: extras?.startTime || null,
            end_time: extras?.endTime || null,
            location_address: extras?.locationAddress || null,
            logged_by: user.id
        })

        // Audit Log
        await supabase.from('package_audit_logs').insert({
            package_id: packageId,
            actor_id: user.id,
            action: `Site revision count incremented to ${newCount}. Reason: "${reason.trim()}"`
        })

        revalidatePath(`/admin/packages/${packageId}`)
        return { success: true, revisionCount: newCount }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function updateLogistics(packageId: string, data: {
    locationAddress?: string
    shootDate?: string
    startTime?: string
    endTime?: string
    assignedStaffIds?: string[]
    vehiclesTaken?: string[]
    equipmentsTaken?: string[]
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        const { error } = await supabase
            .from('package_logistics')
            .upsert({
                package_id: packageId,
                location_address: data.locationAddress ?? null,
                shoot_date: data.shootDate || null,
                start_time: data.startTime || null,
                end_time: data.endTime || null,
                assigned_staff_ids: data.assignedStaffIds || [],
                vehicles_taken: data.vehiclesTaken || [],
                equipments_taken: data.equipmentsTaken || [],
                updated_at: new Date().toISOString()
            }, { onConflict: 'package_id' })

        if (error) return { error: error.message }

        await supabase.from('package_audit_logs').insert({
            package_id: packageId,
            actor_id: user.id,
            action: 'Updated logistics, shoot time, equipment & staff assignments'
        })

        revalidatePath(`/admin/packages/${packageId}`)
        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}


export async function updateDeliverableStatus(deliverableId: string, packageId: string, status: 'not_started' | 'in_editing' | 'client_review' | 'approved') {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        const { data: del, error } = await supabase
            .from('package_deliverables')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', deliverableId)
            .select('title')
            .single()

        if (error) return { error: error.message }

        await supabase.from('package_audit_logs').insert({
            package_id: packageId,
            actor_id: user.id,
            action: `Deliverable "${del?.title}" status changed to ${status.replace('_', ' ').toUpperCase()}`
        })

        revalidatePath(`/admin/packages/${packageId}`)
        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function addPackageDeliverable(packageId: string, title: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        if (!title || !title.trim()) return { error: 'Deliverable title is required' }

        const { error } = await supabase
            .from('package_deliverables')
            .insert({
                package_id: packageId,
                title: title.trim(),
                status: 'UNASSIGNED'
            })

        if (error) return { error: error.message }

        await supabase.from('package_audit_logs').insert({
            package_id: packageId,
            actor_id: user.id,
            action: `Added new deliverable item: "${title.trim()}"`
        })

        revalidatePath(`/admin/packages/${packageId}`)
        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function recordPackagePayment(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        const parsed = PackagePaymentSchema.safeParse({
            package_id: formData.get('package_id'),
            amount: Number(formData.get('amount')),
            payment_date: formData.get('payment_date'),
            payment_method: formData.get('payment_method'),
            notes: formData.get('notes')
        })

        if (!parsed.success) {
            return { error: 'Validation failed: ' + parsed.error.issues[0].message }
        }

        const { package_id, amount, payment_date, payment_method, notes } = parsed.data

        // Record payment row
        const { error: pErr } = await supabase.from('package_payments').insert({
            package_id,
            amount,
            payment_date,
            payment_method,
            notes: notes || null,
            received_by: user.id
        })

        if (pErr) return { error: pErr.message }

        // Fetch package grand total & current paid amount
        const { data: pkg } = await supabase
            .from('packages')
            .select('grand_total, paid_amount')
            .eq('id', package_id)
            .single()

        if (pkg) {
            const newPaidAmount = Number(pkg.paid_amount || 0) + amount
            let newPaymentStatus = 'partially_paid'
            if (newPaidAmount >= Number(pkg.grand_total)) {
                newPaymentStatus = 'paid'
            }

            await supabase
                .from('packages')
                .update({
                    paid_amount: newPaidAmount,
                    payment_status: newPaymentStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', package_id)
        }

        await supabase.from('package_audit_logs').insert({
            package_id,
            actor_id: user.id,
            action: `Recorded payment of Rs. ${amount.toLocaleString()} via ${payment_method}`
        })

        revalidatePath(`/admin/packages/${package_id}`)
        revalidatePath('/admin/packages')
        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function quickCreateClient(data: {
    companyName: string
    contactEmail?: string
    phone?: string
    location?: string
}) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        if (!data.companyName || !data.companyName.trim()) {
            return { error: 'Company/Client Name is required' }
        }

        const { data: newClient, error } = await supabase
            .from('clients')
            .insert({
                company_name: data.companyName.trim(),
                contact_email: data.contactEmail?.trim() || null,
                phone_number: data.phone?.trim() || null,
                location: data.location?.trim() || null,
                status: 'active'
            })
            .select('id, company_name, contact_person')
            .single()

        if (error) return { error: error.message }

        return { success: true, client: newClient }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function getClientsForSelect() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data } = await supabase
            .from('clients')
            .select('id, company_name, contact_person, contact_email, phone_number')
            .is('deleted_at', null)
            .order('company_name', { ascending: true })

        return data || []
    } catch {
        return []
    }
}

export async function getEmployeesForSelect() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, designation, role, social_urls')
            .is('deleted_at', null)
            .order('full_name', { ascending: true })

        return data || []
    } catch {
        return []
    }
}

export async function assignDeliverableEmployee(deliverableId: string, packageId: string, employeeId: string | null) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        // Fetch current deliverable status and project_id
        const { data: currentDel } = await supabase
            .from('package_deliverables')
            .select('status, title, project_id')
            .eq('id', deliverableId)
            .single()

        let newStatus = currentDel?.status || 'UNASSIGNED'
        if (employeeId && (newStatus === 'UNASSIGNED' || newStatus === 'not_started')) {
            newStatus = 'ASSIGNED'
        } else if (!employeeId) {
            newStatus = 'UNASSIGNED'
        }

        const { error } = await supabase
            .from('package_deliverables')
            .update({
                assigned_employee_id: employeeId || null,
                status: newStatus,
                updated_at: new Date().toISOString()
            })
            .eq('id', deliverableId)

        if (error) return { error: error.message }

        // Sync linked project tasks assignment
        if (currentDel?.project_id) {
            await supabase
                .from('tasks')
                .update({
                    assigned_to: employeeId || null,
                    status: employeeId ? 'in_progress' : 'pending'
                })
                .eq('project_id', currentDel.project_id)
        }

        // Audit Log
        let empName = 'Unassigned'
        if (employeeId) {
            const { data: emp } = await supabase.from('profiles').select('full_name').eq('id', employeeId).single()
            if (emp) empName = emp.full_name
        }

        await supabase.from('package_audit_logs').insert({
            package_id: packageId,
            actor_id: user.id,
            action: `Assigned deliverable "${currentDel?.title || ''}" to ${empName}`
        })

        revalidatePath(`/admin/packages/${packageId}`)
        revalidatePath('/admin/tasks')
        revalidatePath('/admin/projects')
        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function submitDeliverableDriveLink(deliverableId: string, driveLink: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        if (!driveLink || !driveLink.trim()) {
            return { error: 'Google Drive link cannot be empty.' }
        }

        const trimmedLink = driveLink.trim()
        if (!trimmedLink.startsWith('http://') && !trimmedLink.startsWith('https://')) {
            return { error: 'Please enter a valid URL (e.g. https://drive.google.com/...)' }
        }

        const { data: del, error: fetchErr } = await supabase
            .from('package_deliverables')
            .select('package_id, title, status, assigned_employee_id')
            .eq('id', deliverableId)
            .single()

        if (fetchErr || !del) return { error: 'Deliverable not found.' }

        // Security check: only assigned employee (or admin/founder) can submit
        const isAuthorizedAsAdmin = await verifyAdminOrFounder(supabase, user.id)
        if (del.assigned_employee_id !== user.id && !isAuthorizedAsAdmin) {
            return { error: 'You are not authorized to submit a link for this deliverable.' }
        }

        // State validation: prevent submitting if already approved or under review
        if (del.status === 'APPROVED' || del.status === 'UNDER_REVIEW') {
            return { error: `Deliverable is currently ${del.status}, link submission is locked.` }
        }

        const { error } = await supabase
            .from('package_deliverables')
            .update({
                drive_link: trimmedLink,
                status: 'UNDER_REVIEW',
                updated_at: new Date().toISOString()
            })
            .eq('id', deliverableId)

        if (error) return { error: error.message }

        // Audit Log
        await supabase.from('package_audit_logs').insert({
            package_id: del.package_id,
            actor_id: user.id,
            action: `Submitted Google Drive link for review: "${del.title}"`
        })

        revalidatePath('/employee/tasks')
        revalidatePath('/employee/packages')
        revalidatePath(`/employee/packages/${del.package_id}`)
        revalidatePath(`/admin/packages/${del.package_id}`)
        revalidatePath('/founder/review-queue')

        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function approveDeliverable(deliverableId: string, packageId: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        const { data: del, error: updateErr } = await supabase
            .from('package_deliverables')
            .update({
                status: 'APPROVED',
                updated_at: new Date().toISOString()
            })
            .eq('id', deliverableId)
            .select('title, project_id')
            .single()

        if (updateErr) return { error: updateErr.message }

        // Update linked project status to completed
        if (del?.project_id) {
            await supabase
                .from('projects')
                .update({ status: 'completed', updated_at: new Date().toISOString() })
                .eq('id', del.project_id)
        }

        await supabase.from('package_audit_logs').insert({
            package_id: packageId,
            actor_id: user.id,
            action: `Approved deliverable "${del?.title || ''}"`
        })

        // Check if ALL deliverables for this package are APPROVED
        const { data: allDels } = await supabase
            .from('package_deliverables')
            .select('status')
            .eq('package_id', packageId)

        if (allDels && allDels.length > 0) {
            const allApproved = allDels.every(d => d.status === 'APPROVED')
            if (allApproved) {
                await supabase
                    .from('packages')
                    .update({ status: 'completed', updated_at: new Date().toISOString() })
                    .eq('id', packageId)

                await supabase.from('package_audit_logs').insert({
                    package_id: packageId,
                    actor_id: user.id,
                    action: `All deliverables approved! Package status set to COMPLETED.`
                })
            }
        }

        revalidatePath(`/admin/packages/${packageId}`)
        revalidatePath('/founder/review-queue')
        revalidatePath('/admin/packages')
        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function requestDeliverableRevision(deliverableId: string, packageId: string, founderComment: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Unauthorized' }

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return { error: 'Permission denied.' }

        if (!founderComment || !founderComment.trim()) {
            return { error: 'Feedback comment is mandatory when requesting a revision.' }
        }

        // Fetch current deliverable data
        const { data: del, error: fetchErr } = await supabase
            .from('package_deliverables')
            .select('revision_count, revision_history, drive_link, title')
            .eq('id', deliverableId)
            .single()

        if (fetchErr || !del) return { error: 'Deliverable not found.' }

        const newRevisionCount = Number(del.revision_count || 0) + 1
        const existingHistory = Array.isArray(del.revision_history) ? del.revision_history : []

        const newHistoryItem = {
            id: `rev-${Date.now()}`,
            revisionNumber: newRevisionCount,
            submittedDriveLink: del.drive_link || '',
            founderComment: founderComment.trim(),
            createdAt: new Date().toISOString()
        }

        const updatedHistory = [newHistoryItem, ...existingHistory]

        const { error: updateErr } = await supabase
            .from('package_deliverables')
            .update({
                status: 'REVISION_REQUESTED',
                revision_count: newRevisionCount,
                revision_history: updatedHistory,
                updated_at: new Date().toISOString()
            })
            .eq('id', deliverableId)

        if (updateErr) return { error: updateErr.message }

        await supabase.from('package_audit_logs').insert({
            package_id: packageId,
            actor_id: user.id,
            action: `Requested Revision #${newRevisionCount} for "${del.title}": "${founderComment.trim()}"`
        })

        revalidatePath(`/admin/packages/${packageId}`)
        revalidatePath('/founder/review-queue')
        revalidatePath('/employee/tasks')
        revalidatePath(`/employee/packages/${packageId}`)
        return { success: true }
    } catch (err: unknown) {
        return { error: (err instanceof Error ? err.message : String(err)) }
    }
}

export async function getAssignedDeliverablesForEmployee() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const { data } = await supabase
            .from('package_deliverables')
            .select(`
                *,
                packages!inner (
                    id,
                    package_number,
                    title,
                    projects ( id, raw_footage_link, brand_assets_link, client_brief_notes ),
                    clients ( id, company_name )
                )
            `)
            .eq('assigned_employee_id', user.id)
            .order('updated_at', { ascending: false })

        return data || []
    } catch {
        return []
    }
}

export async function getPendingFounderReviews() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return []

        const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
        if (!isAuthorized) return []

        const { data } = await supabase
            .from('package_deliverables')
            .select(`
                *,
                profiles:assigned_employee_id ( full_name ),
                packages!inner (
                    id,
                    package_number,
                    title,
                    projects ( id, raw_footage_link, brand_assets_link, client_brief_notes ),
                    clients ( id, company_name )
                )
            `)
            .eq('status', 'UNDER_REVIEW')
            .order('updated_at', { ascending: false })

        return data || []
    } catch {
        return []
    }
}


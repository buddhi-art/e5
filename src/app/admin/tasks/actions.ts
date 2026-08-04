'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { AssignTaskSchema, UpdateTaskSchema, UuidParamSchema } from '@/lib/validations'
import { verifyAdminOrFounder } from '@/lib/auth-utils'
import { createNotification } from '@/lib/notifications'
import { captureActionError } from '@/lib/action-error'

export async function assignTask(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = AssignTaskSchema.safeParse({
      project_id: formData.get('project_id'),
      phase: formData.get('phase'),
      assigned_to: formData.get('assigned_to'),
      title: formData.get('title'),
      description: formData.get('description'),
      start_date: formData.get('start_date'),
      deadline: formData.get('deadline'),
      subtasksRaw: formData.get('subtasks'),
      logistics: formData.get('logistics'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    const { data: taskNumber, error: numberError } = await supabase.rpc('next_task_number')
    if (numberError || taskNumber === null || taskNumber === undefined) {
      return { error: 'Failed to allocate a task number.' }
    }
    const basePrefix = `E5_Task_${taskNumber}`
    const finalTitle = `${basePrefix} - ${data.title}`

    // Insert main task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        project_id: data.project_id,
        phase: data.phase,
        assigned_to: data.assigned_to,
        title: finalTitle,
        description: data.description,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        logistics: data.logistics || null,
      })
      .select()
      .single()

    if (taskError) return { error: taskError.message }

    // Auto-link deliverables from the project's package as subtasks.
    // When a task is created on a project that belongs to a package, any
    // package_deliverables linked to this project become subtasks on the
    // new task — this is the structural connection between the package
    // deliverable workflow and the task hierarchy.
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('package_id')
        .eq('id', data.project_id)
        .maybeSingle()

      let pkgId = project?.package_id
      if (!pkgId) {
        const { data: legacyPkg } = await supabase
          .from('packages')
          .select('id')
          .eq('project_id', data.project_id)
          .maybeSingle()
        pkgId = legacyPkg?.id || null
      }

      if (pkgId) {
        const { data: deliverables } = await supabase
          .from('package_deliverables')
          .select('id, title, project_id, sort_order, assigned_employee_id, status')
          .eq('package_id', pkgId)
          .order('sort_order', { ascending: true })

        if (deliverables && deliverables.length > 0) {
          // Only link deliverables that belong to THIS project
          const projectDeliverables = deliverables.filter(d => d.project_id === data.project_id)
          if (projectDeliverables.length > 0) {
            const subtaskInserts = projectDeliverables.map(d => ({
              task_id: task.id,
              deliverable_id: d.id,
              title: d.title,
              assigned_to: d.assigned_employee_id || null,
              sort_order: d.sort_order,
              status: d.status === 'APPROVED' ? 'completed' : 'pending',
              is_completed: d.status === 'APPROVED',
            }))
            await supabase.from('subtasks').insert(subtaskInserts)
          }
        }
      }
    } catch (syncErr) {
      // Non-fatal: the task was created, deliverable sync is best-effort
      await captureActionError('assignTask:deliverableSync', syncErr)
    }

    // Notify the assignee that a task was assigned to them.
    if (data.assigned_to && data.assigned_to !== user.id) {
      await createNotification(
        data.assigned_to,
        'task_assigned',
        `New Task Assigned: ${finalTitle}`,
        data.deadline
          ? `You have been assigned a task, due ${new Date(data.deadline).toLocaleDateString()}.`
          : 'You have been assigned a new task.',
        '/employee',
        true,
      )
    }

    // Insert subtasks
    if (data.subtasksRaw) {
      try {
        const subtasks = JSON.parse(data.subtasksRaw)
        if (subtasks.length > 0) {
          let subtaskIndex = 1
          for (const st of subtasks) {
            const subtaskPrefix = `${basePrefix}.${subtaskIndex}`
            const stTitle = st.title || st // Handle both old string format and new object format just in case

            const { data: stData, error: subError } = await supabase
              .from('subtasks')
              .insert({
                task_id: task.id,
                title: `${subtaskPrefix} - ${stTitle}`,
                is_completed: false
              })
              .select()
              .single()

            if (subError) return { error: 'Task created, but failed to create subtasks: ' + subError.message }

            if (st.subSubtasks && st.subSubtasks.length > 0) {
              let subSubtaskIndex = 1
              const sstInserts = st.subSubtasks.map((sst: string) => ({
                subtask_id: stData.id,
                title: `${subtaskPrefix}.${subSubtaskIndex++} - ${sst}`,
                is_completed: false
              }))
              const { error: sstError } = await supabase
                .from('sub_subtasks')
                .insert(sstInserts)

              if (sstError) return { error: 'Task created, but failed to create sub-subtasks: ' + sstError.message }
            }
            subtaskIndex++
          }
        }
      } catch (e) {
        await captureActionError('assignTask:subtaskParse', e)
      }
    }

    revalidatePath('/admin/tasks')
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('assignTask', err) }
  }
}

export async function updateTask(id: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UpdateTaskSchema.safeParse({
      project_id: formData.get('project_id'),
      phase: formData.get('phase'),
      assigned_to: formData.get('assigned_to'),
      title: formData.get('title'),
      description: formData.get('description'),
      start_date: formData.get('start_date'),
      deadline: formData.get('deadline'),
      status: formData.get('status'),
      logistics: formData.get('logistics'),
    })

    if (!parsed.success) return { error: 'Validation failed: ' + parsed.error.issues[0].message }
    const data = parsed.data

    // If status is being set to completed, also set completed_at
    const extraUpdate: Record<string, string> = {}
    if (data.status === 'completed') {
      extraUpdate.completed_at = new Date().toISOString()
    }

    // Capture the previous assignee so we only notify on a genuine reassignment.
    const { data: prevTask } = await supabase
      .from('tasks')
      .select('assigned_to')
      .eq('id', id)
      .single()

    // Only touch the logistics column when the form actually submitted a
    // logistics payload. This prevents an edit made from a form without the
    // phase workspace (or a legacy client) from silently wiping stored data.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const logisticsUpdate: Record<string, any> = {}
    if (formData.get('logistics') !== null) {
      logisticsUpdate.logistics = data.logistics || null
    }

    const { error: taskError } = await supabase
      .from('tasks')
      .update({
        project_id: data.project_id,
        phase: data.phase,
        assigned_to: data.assigned_to,
        title: data.title,
        description: data.description,
        status: data.status,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        ...logisticsUpdate,
        ...extraUpdate,
      })
      .eq('id', id)

    if (taskError) return { error: taskError.message }

    // Notify the new assignee if the task was reassigned to someone else.
    if (
      data.assigned_to &&
      data.assigned_to !== prevTask?.assigned_to &&
      data.assigned_to !== user.id
    ) {
      await createNotification(
        data.assigned_to,
        'task_assigned',
        `Task Assigned: ${data.title}`,
        data.deadline
          ? `A task has been assigned to you, due ${new Date(data.deadline).toLocaleDateString()}.`
          : 'A task has been assigned to you.',
        '/employee',
        true,
      )
    }

    revalidatePath('/admin/tasks')
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('updateTask', err) }
  }
}

export async function deleteTask(id: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const parsed = UuidParamSchema.safeParse({ id });
    if (!parsed.success) return { error: 'Invalid task ID' };

    // Subtasks are set to ON DELETE CASCADE in db schema
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/tasks')
    revalidatePath('/admin/calendar')
    return { success: true }
  } catch (err: unknown) {
    return { error: await captureActionError('deleteTask', err) }
  }
}

/**
 * Sync deliverables → subtasks for a project's tasks.
 *
 * For each deliverable linked to the project's package, ensure a matching
 * subtask exists on the project's tasks. This is the structural connection
 * between the package deliverable workflow and the task hierarchy: each
 * deliverable item becomes a subtask, and sub-sub-tasks can be added under
 * it as actionable to-do items.
 *
 * This is idempotent — calling it multiple times for the same
 * task+deliverable pair will not create duplicates.
 */
export async function syncDeliverableSubtasks(projectId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    // 1. Find the package for this project (both directions)
    const { data: project } = await supabase
      .from('projects')
      .select('id, package_id')
      .eq('id', projectId)
      .maybeSingle()

    if (!project) return { error: 'Project not found' }

    let packageId = project.package_id
    if (!packageId) {
      const { data: legacyPkg } = await supabase
        .from('packages')
        .select('id')
        .eq('project_id', projectId)
        .maybeSingle()
      packageId = legacyPkg?.id || null
    }

    if (!packageId) return { success: true, synced: 0 } // no package = nothing to sync

    // 2. Fetch all deliverables for this package
    const { data: deliverables, error: delError } = await supabase
      .from('package_deliverables')
      .select('id, title, project_id, sort_order, assigned_employee_id, status')
      .eq('package_id', packageId)
      .order('sort_order', { ascending: true })

    if (delError) return { error: delError.message }

    if (!deliverables || deliverables.length === 0) {
      return { success: true, synced: 0 }
    }

    // 3. Fetch existing tasks for this project
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, phase')
      .eq('project_id', projectId)

    if (!tasks || tasks.length === 0) {
      return { success: true, synced: 0 } // no tasks to link to
    }

    // 4. For each deliverable that is linked to this project, ensure a
    //    subtask exists on the project's tasks. Link by deliverable_id.
    let syncedCount = 0
    for (const del of deliverables) {
      // Only sync deliverables linked to THIS project
      if (del.project_id !== projectId) continue

      // Check if a subtask already exists for this deliverable on any
      // task in this project
      const { data: existing } = await supabase
        .from('subtasks')
        .select('id, deliverable_id, task_id')
        .in('task_id', tasks.map(t => t.id))
        .eq('deliverable_id', del.id)
        .maybeSingle()

      if (existing) {
        // Update the subtask title and assignment to match the deliverable
        await supabase
          .from('subtasks')
          .update({
            title: del.title,
            assigned_to: del.assigned_employee_id || null,
            sort_order: del.sort_order,
            status: del.status === 'APPROVED' ? 'completed' : del.status === 'UNASSIGNED' ? 'pending' : 'in_progress',
          })
          .eq('id', existing.id)
        continue
      }

      // Create a subtask on the first task of this project (the main task)
      // This links the deliverable to the task hierarchy
      const targetTask = tasks[0] // primary task for the project
      const { error: subError } = await supabase
        .from('subtasks')
        .insert({
          task_id: targetTask.id,
          deliverable_id: del.id,
          title: del.title,
          assigned_to: del.assigned_employee_id || null,
          sort_order: del.sort_order,
          status: del.status === 'APPROVED' ? 'completed' : 'pending',
          is_completed: del.status === 'APPROVED',
        })

      if (subError) {
        await captureActionError('syncDeliverableSubtasks:perItem', subError)
        continue
      }
      syncedCount++
    }

    revalidatePath('/admin/tasks')
    revalidatePath(`/admin/projects/${projectId}`)
    return { success: true, synced: syncedCount }
  } catch (err: unknown) {
    return { error: await captureActionError('syncDeliverableSubtasks', err) }
  }
}

/**
 * Add a sub-sub-task (actionable to-do) under a deliverable subtask.
 * This is the finest-grained task item in the hierarchy.
 */
export async function addDeliverableSubItem(subtaskId: string, title: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    if (!title || !title.trim()) return { error: 'Title is required' }

    const { data, error } = await supabase
      .from('sub_subtasks')
      .insert({
        subtask_id: subtaskId,
        title: title.trim(),
        is_completed: false,
      })
      .select('id')
      .single()

    if (error) return { error: error.message }

    revalidatePath('/admin/tasks')
    return { success: true, id: data.id }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Toggle the completion status of a sub-sub-task.
 */
export async function toggleSubSubtask(subSubtaskId: string, isCompleted: boolean) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const { error } = await supabase
      .from('sub_subtasks')
      .update({ is_completed: isCompleted })
      .eq('id', subSubtaskId)

    if (error) return { error: error.message }

    // Check if all sub-sub-tasks for the parent subtask are done
    const { data: subSubtask } = await supabase
      .from('sub_subtasks')
      .select('subtask_id')
      .eq('id', subSubtaskId)
      .single()

    if (subSubtask) {
      const { data: allItems } = await supabase
        .from('sub_subtasks')
        .select('is_completed')
        .eq('subtask_id', subSubtask.subtask_id)

      if (allItems && allItems.length > 0) {
        const allDone = allItems.every(i => i.is_completed)
        const someDone = allItems.some(i => i.is_completed)
        const newStatus = allDone ? 'completed' : someDone ? 'in_progress' : 'pending'

        await supabase
          .from('subtasks')
          .update({
            is_completed: allDone,
            status: newStatus,
          })
          .eq('id', subSubtask.subtask_id)
      }
    }

    revalidatePath('/admin/tasks')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Remove a sub-sub-task.
 */
export async function removeSubSubtask(subSubtaskId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const { error } = await supabase
      .from('sub_subtasks')
      .delete()
      .eq('id', subSubtaskId)

    if (error) return { error: error.message }

    revalidatePath('/admin/tasks')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Assign a deliverable subtask to an employee.
 * Also syncs the linked package_deliverable row.
 */
export async function assignSubtaskEmployee(subtaskId: string, employeeId: string | null) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    // Update the subtask
    const { data: subtask, error: subError } = await supabase
      .from('subtasks')
      .update({
        assigned_to: employeeId || null,
        status: employeeId ? 'in_progress' : 'pending',
      })
      .eq('id', subtaskId)
      .select('deliverable_id')
      .single()

    if (subError) return { error: subError.message }

    // Sync to the linked deliverable if it exists
    if (subtask?.deliverable_id) {
      await supabase
        .from('package_deliverables')
        .update({
          assigned_employee_id: employeeId || null,
          status: employeeId ? 'ASSIGNED' : 'UNASSIGNED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', subtask.deliverable_id)
    }

    revalidatePath('/admin/tasks')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

/**
 * Remove a subtask (deliverable-linked or free-form).
 */
export async function removeSubtask(subtaskId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }
    const isAuthorized = await verifyAdminOrFounder(supabase, user.id)
    if (!isAuthorized) return { error: 'Permission denied.' }

    const { error } = await supabase
      .from('subtasks')
      .delete()
      .eq('id', subtaskId)

    if (error) return { error: error.message }

    revalidatePath('/admin/tasks')
    return { success: true }
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : String(err) }
  }
}

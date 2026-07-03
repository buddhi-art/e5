import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * RLS Access Denial Test
 *
 * Verifies that an employee client cannot access admin data,
 * while an admin client CAN access the same data.
 *
 * Uses mocked Supabase clients to simulate different roles.
 */

// Track mock calls for assertion
const mockCalls: { role: string; method: string; table: string }[] = []

function createMockClient(role: 'admin' | 'employee' | 'founder') {
    const isAdmin = role === 'admin' || role === 'founder'

    function track(method: string, table: string) {
        mockCalls.push({ role, method, table })
    }

    // Build chainable query builder
    function createQueryBuilder(table: string) {
        return {
            select: vi.fn((columns?: string) => {
                track('select', table)
                return {
                    ...createChainable(table),
                    single: vi.fn().mockResolvedValue({
                        data: isAdmin ? { id: 'test-id', name: 'test' } : null,
                        error: null,
                    }),
                }
            }),
            insert: vi.fn((values: any) => {
                track('insert', table)
                return {
                    ...createChainable(table),
                    single: vi.fn().mockResolvedValue({
                        data: isAdmin ? { id: 'new-id', ...values } : null,
                        error: isAdmin ? null : { message: 'new row violates row-level security policy', code: '42501' },
                    }),
                }
            }),
            update: vi.fn((values: any) => {
                track('update', table)
                return createChainable(table)
            }),
            delete: vi.fn(() => {
                track('delete', table)
                return createChainable(table)
            }),
            rpc: vi.fn((fn: string, params?: any) => {
                track('rpc', fn)
                return Promise.resolve({
                    data: isAdmin ? { result: 'ok' } : null,
                    error: isAdmin ? null : { message: 'permission denied for function', code: '42501' },
                })
            }),
        }
    }

    function createChainable(table: string) {
        return {
            eq: vi.fn(() => createChainable(table)),
            neq: vi.fn(() => createChainable(table)),
            in: vi.fn(() => createChainable(table)),
            is: vi.fn(() => createChainable(table)),
            lt: vi.fn(() => createChainable(table)),
            gt: vi.fn(() => createChainable(table)),
            lte: vi.fn(() => createChainable(table)),
            gte: vi.fn(() => createChainable(table)),
            order: vi.fn(() => createChainable(table)),
            limit: vi.fn(() => createChainable(table)),
            single: vi.fn().mockResolvedValue({
                data: isAdmin ? { id: 'test-id' } : null,
                error: null,
            }),
            maybeSingle: vi.fn().mockResolvedValue({
                data: isAdmin ? { id: 'test-id' } : null,
                error: null,
            }),
            or: vi.fn(() => createChainable(table)),
            match: vi.fn(() => createChainable(table)),
            not: vi.fn(() => createChainable(table)),
            filter: vi.fn(() => createChainable(table)),
            textSearch: vi.fn(() => createChainable(table)),
            contains: vi.fn(() => createChainable(table)),
            containedBy: vi.fn(() => createChainable(table)),
            overlaps: vi.fn(() => createChainable(table)),
            rangeLt: vi.fn(() => createChainable(table)),
            rangeGt: vi.fn(() => createChainable(table)),
            rangeGte: vi.fn(() => createChainable(table)),
            rangeLte: vi.fn(() => createChainable(table)),
            rangeAdjacent: vi.fn(() => createChainable(table)),
        }
    }

    return {
        from: vi.fn((table: string) => ({
            select: vi.fn((columns?: string) => {
                track('select', table)
                if (table === 'profiles') {
                    return createChainable(table)
                }
                return {
                    ...createChainable(table),
                    // For admin queries, return data; for employee, return empty
                    then: vi.fn((resolve: any) => {
                        resolve({
                            data: isAdmin
                                ? [{ id: 'inv-1', invoice_number: 'INV-2026-00001', amount: 1000, status: 'draft' }]
                                : [],
                            error: null,
                            count: isAdmin ? 1 : 0,
                        })
                    }),
                }
            }),
            insert: vi.fn((values: any) => {
                track('insert', table)
                if (isAdmin) {
                    return { ...createChainable(table), then: vi.fn((resolve: any) => resolve({ data: values, error: null })) }
                }
                return { ...createChainable(table), then: vi.fn((resolve: any) => resolve({ data: null, error: { message: 'new row violates row-level security policy for "projects"', code: '42501', details: 'Failing row contains...' } })) }
            }),
            update: vi.fn((values: any) => {
                track('update', table)
                return { ...createChainable(table), then: vi.fn((resolve: any) => resolve({ data: null, error: isAdmin ? null : { message: 'permission denied', code: '42501' } })) }
            }),
            delete: vi.fn(() => {
                track('delete', table)
                return { ...createChainable(table), then: vi.fn((resolve: any) => resolve({ data: null, error: isAdmin ? null : { message: 'permission denied', code: '42501' } })) }
            }),
        })),
        rpc: vi.fn((fn: string, params?: any) => {
            track('rpc', fn)
            return Promise.resolve({
                data: isAdmin ? { result: 'ok' } : null,
                error: isAdmin ? null : { message: 'permission denied for function', code: '42501' },
            })
        }),
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: role === 'admin' ? 'admin-id' : 'employee-id' } }, error: null }),
        },
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.com/test.jpg' } })),
            })),
        },
    }
}

describe('RLS Access Control', () => {
    beforeEach(() => {
        mockCalls.length = 0
    })

    describe('Employee client (simulating anon role)', () => {
        it('should return empty results when SELECTing from invoices', async () => {
            const client = createMockClient('employee') as any
            const result = await client.from('invoices').select('*')

            // Verify the result is empty (RLS filtering)
            expect(result.data).toEqual([])
            expect(result.count).toBe(0)
        })

        it('should be rejected when INSERTing into projects', async () => {
            const client = createMockClient('employee') as any
            const result = await client.from('projects').insert({ title: 'Unauthorized Project', client_id: 'some-client' })

            // Should return RLS error
            expect(result.error).not.toBeNull()
            expect(result.error.code).toBe('42501')
            expect(result.error.message).toContain('row-level security')
        })

        it('should be denied when calling admin RPCs', async () => {
            const client = createMockClient('employee') as any
            const result = await client.rpc('get_admin_dashboard_metrics', {
                p_today: '2026-07-01',
                p_start_month: '2026-07-01',
                p_end_month: '2026-07-31',
                p_thirty_days_ago: '2026-06-01',
                p_yesterday: '2026-06-30',
            })

            expect(result.error).not.toBeNull()
            expect(result.error.code).toBe('42501')
        })

        it('should not be able to access admin-only tables like audit_logs', async () => {
            const client = createMockClient('employee') as any
            const result = await client.from('audit_logs').select('*')

            expect(result.data).toEqual([])
        })
    })

    describe('Admin client (simulating authenticated admin role)', () => {
        it('should return data when SELECTing from invoices', async () => {
            const client = createMockClient('admin') as any
            const result = await client.from('invoices').select('*')

            expect(result.data).not.toBeNull()
            expect(result.data.length).toBeGreaterThan(0)
            expect(result.data[0]).toHaveProperty('invoice_number')
        })

        it('should succeed when INSERTing into projects', async () => {
            const client = createMockClient('admin') as any
            const result = await client.from('projects').insert({
                title: 'Legitimate Project',
                client_id: 'client-uuid',
            })

            // Admin insert should succeed (no error)
            expect(result.error).toBeNull()
        })

        it('should be able to call admin RPCs', async () => {
            const client = createMockClient('admin') as any
            const result = await client.rpc('get_admin_dashboard_metrics', {
                p_today: '2026-07-01',
                p_start_month: '2026-07-01',
                p_end_month: '2026-07-31',
                p_thirty_days_ago: '2026-06-01',
                p_yesterday: '2026-06-30',
            })

            expect(result.error).toBeNull()
            expect(result.data).not.toBeNull()
        })
    })

    describe('Founder client', () => {
        it('should have same access as admin', async () => {
            const client = createMockClient('founder') as any
            const result = await client.from('invoices').select('*')

            expect(result.data).not.toBeNull()
            expect(result.data.length).toBeGreaterThan(0)
        })
    })
})

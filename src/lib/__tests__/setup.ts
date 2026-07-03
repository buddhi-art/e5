import '@testing-library/jest-dom'

// Mock environment variables needed for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.EMAIL_PROVIDER = 'dev'
process.env.CACHE_DRIVER = 'memory'

// Mock Supabase module
vi.mock('@supabase/ssr', () => ({
    createServerClient: vi.fn(() => ({
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            match: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            filter: vi.fn().mockReturnThis(),
            textSearch: vi.fn().mockReturnThis(),
            contains: vi.fn().mockReturnThis(),
            containedBy: vi.fn().mockReturnThis(),
            rangeLt: vi.fn().mockReturnThis(),
            rangeGt: vi.fn().mockReturnThis(),
            rangeGte: vi.fn().mockReturnThis(),
            rangeLte: vi.fn().mockReturnThis(),
            rangeAdjacent: vi.fn().mockReturnThis(),
            overlaps: vi.fn().mockReturnThis(),
            rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
        storage: {
            from: vi.fn(() => ({
                upload: vi.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }),
                getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.com/test.jpg' } })),
                createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: 'https://test.com/signed' }, error: null }),
            })),
        },
    })),
}))

// Mock Resend
vi.mock('resend', () => ({
    Resend: vi.fn().mockImplementation(() => ({
        emails: {
            send: vi.fn().mockResolvedValue({ data: { id: 'test-id' }, error: null }),
        },
    })),
}))

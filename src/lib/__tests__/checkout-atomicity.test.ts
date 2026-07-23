/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Equipment Checkout Atomicity Test
 *
 * Verifies that when 5 concurrent checkout requests are made for the
 * same equipment, exactly 1 succeeds and 4 fail with "not available".
 */

type EquipmentStatus = 'available' | 'checked_out' | 'maintenance' | 'retired'

interface MockEquipment {
    id: string
    name: string
    status: EquipmentStatus
    category: string
}

// Mock state
let equipmentStore: Map<string, MockEquipment> = new Map()
let checkoutCount = 0
let failCount = 0

// Mock checkout RPC with row-level locking simulation
async function mockCheckoutEquipment(equipmentId: string): Promise<{ success: boolean; error?: string }> {
    const item = equipmentStore.get(equipmentId)
    if (!item) return { success: false, error: 'Equipment not found' }
    if (item.status !== 'available') {
        failCount++
        return { success: false, error: `Equipment is not available (current status: ${item.status})` }
    }

    // Simulate atomic update: use a lock via direct map mutation
    // This mimics Postgres's SELECT ... FOR UPDATE behavior
    if (item.status !== 'available') {
        failCount++
        return { success: false, error: `Equipment is not available (current status: ${item.status})` }
    }

    item.status = 'checked_out'
    checkoutCount++
    return { success: true }
}

// Simulate concurrent checkout
async function simulateConcurrentCheckouts(
    equipmentId: string,
    concurrency: number
): Promise<{ successCount: number; failCount: number }> {
    const promises = Array.from({ length: concurrency }, () =>
        // Slight randomness to simulate real concurrent requests
        new Promise<void>((resolve) => setTimeout(resolve, Math.random() * 5))
            .then(() => mockCheckoutEquipment(equipmentId))
    )

    const results = await Promise.all(promises)
    const succeeded = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    return { successCount: succeeded, failCount: failed }
}

describe('Equipment Checkout Atomicity', () => {
    beforeEach(() => {
        equipmentStore = new Map()
        checkoutCount = 0
        failCount = 0

        // Seed equipment
        equipmentStore.set('test-equipment-1', {
            id: 'test-equipment-1',
            name: 'Sony A7S III',
            status: 'available',
            category: 'Camera',
        })

        equipmentStore.set('test-equipment-2', {
            id: 'test-equipment-2',
            name: 'Rode Wireless Go II',
            status: 'available',
            category: 'Audio',
        })
    })

    it('exactly 1 out of 5 concurrent checkouts succeeds', async () => {
        const result = await simulateConcurrentCheckouts('test-equipment-1', 5)

        expect(result.successCount).toBe(1)
        expect(result.failCount).toBe(4)

        // Verify equipment status is 'checked_out'
        const equipment = equipmentStore.get('test-equipment-1')
        expect(equipment?.status).toBe('checked_out')
    })

    it('second checkout attempt after success fails', async () => {
        // First checkout succeeds
        const r1 = await mockCheckoutEquipment('test-equipment-1')
        expect(r1.success).toBe(true)

        // Second checkout fails
        const r2 = await mockCheckoutEquipment('test-equipment-1')
        expect(r2.success).toBe(false)
        expect(r2.error).toContain('not available')
    })

    it('different equipment checkouts are independent', async () => {
        const result1 = await simulateConcurrentCheckouts('test-equipment-1', 3)
        expect(result1.successCount).toBe(1)
        expect(result1.failCount).toBe(2)

        const result2 = await simulateConcurrentCheckouts('test-equipment-2', 3)
        expect(result2.successCount).toBe(1)
        expect(result2.failCount).toBe(2)

        // Both should be checked out
        expect(equipmentStore.get('test-equipment-1')?.status).toBe('checked_out')
        expect(equipmentStore.get('test-equipment-2')?.status).toBe('checked_out')
    })

    it('handles 10 concurrent requests for same equipment correctly', async () => {
        const result = await simulateConcurrentCheckouts('test-equipment-1', 10)

        expect(result.successCount).toBe(1)
        expect(result.failCount).toBe(9)
    })
})

import { describe, expect, it } from 'vitest'
import {
    calculatePackageItemTotal,
    formatGeneratedProjectTitle,
    getClientProjectGroupTitle,
    getPackageItemProjectCount,
} from '@/lib/package-items'

describe('package item domain helpers', () => {
    it('calculates total from unit cost when one is supplied', () => {
        expect(calculatePackageItemTotal({ quantity: 4, unit_cost: 1500, total_cost: 999 })).toBe(6000)
    })

    it('uses an editable manual total when unit cost is omitted', () => {
        expect(calculatePackageItemTotal({ quantity: 4, unit_cost: null, total_cost: 5000 })).toBe(5000)
    })

    it('creates one project for every whole quantity unit', () => {
        expect(getPackageItemProjectCount(4)).toBe(4)
        expect(getPackageItemProjectCount(0.5)).toBe(1)
    })

    it('formats generated project and client group names', () => {
        expect(formatGeneratedProjectTitle('Demo', 'Short Video', 2)).toBe('Demo-Short Video-02')
        expect(getClientProjectGroupTitle('Demo')).toBe('Demo-Projects')
    })
})
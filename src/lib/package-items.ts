export interface PackageItemCostInput {
    description: string
    quantity: number
    unit_cost: number | null
    total_cost: number
}

export function calculatePackageItemTotal(item: Pick<PackageItemCostInput, 'quantity' | 'unit_cost' | 'total_cost'>) {
    const quantity = Math.max(0, Number(item.quantity) || 0)
    if (item.unit_cost !== null && Number.isFinite(Number(item.unit_cost))) {
        return quantity * Math.max(0, Number(item.unit_cost))
    }
    return Math.max(0, Number(item.total_cost) || 0)
}

export function getPackageItemProjectCount(quantity: number) {
    return Math.max(1, Math.floor(Number(quantity) || 1))
}

export function formatGeneratedProjectTitle(clientName: string, itemName: string, unitIndex: number) {
    const clean = (value: string, fallback: string) => value.trim().replace(/\s+/g, ' ') || fallback
    return `${clean(clientName, 'Client')}-${clean(itemName, 'Project')}-${String(unitIndex).padStart(2, '0')}`
}

export function getClientProjectGroupTitle(clientName: string) {
    return `${clientName.trim() || 'Unknown Client'}-Projects`
}
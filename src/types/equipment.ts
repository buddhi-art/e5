export type EquipmentStatus = 'available' | 'checked_out' | 'maintenance' | 'retired';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed';

export interface Equipment {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  category: string;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  status: EquipmentStatus;
  location: string | null;
  vendor_name: string | null;
  vendor_phone: string | null;
  vendor_location: string | null;
  notes: string | null;
  image_url: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EquipmentCheckout {
  id: string;
  equipment_id: string;
  checked_out_by: string;
  checked_out_at: string;
  expected_return_at: string | null;
  project_id: string | null;
  condition_at_checkout: string | null;
  checked_in_at: string | null;
  condition_at_checkin: string | null;
  notes: string | null;
  created_at: string;
}

export interface EquipmentMaintenance {
  id: string;
  equipment_id: string;
  description: string;
  scheduled_date: string;
  completed_date: string | null;
  cost: number | null;
  vendor: string | null;
  status: MaintenanceStatus;
  notes: string | null;
  created_at: string;
}

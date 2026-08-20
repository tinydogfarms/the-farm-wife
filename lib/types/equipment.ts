export type RecurrenceType = 'none' | 'interval' | 'monthly';

export interface Equipment {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  category: string;
  year?: number | null;
  make?: string;
  model?: string;
  serial_number?: string;
  notes?: string;
}

export interface EquipmentInput {
  name: string;
  category: string;
  year?: number | null;
  make?: string;
  model?: string;
  serial_number?: string;
  notes?: string;
}

export interface ServiceRecord {
  id: string;
  created_at: string;
  user_id: string;
  equipment_id: string;
  service_type: string;
  notes?: string;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_day?: number | null;
  next_due: string;
  status: 'pending' | 'complete';
  completed_at?: string | null;
  notification_id?: string | null;
}

export interface ServiceRecordInput {
  equipment_id: string;
  service_type: string;
  notes?: string;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_day?: number | null;
  next_due: string;
}

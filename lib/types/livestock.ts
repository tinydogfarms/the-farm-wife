import type { RecurrenceType } from './equipment';

export type LivestockTrackingType = 'group' | 'individual';

export interface Livestock {
  id: string;
  created_at: string;
  user_id: string;
  tracking_type: LivestockTrackingType;
  name: string;
  species: string;
  breed?: string;
  count: number;
  tag_number?: string;
  birthdate?: string | null;
  photo_url?: string | null;
  notes?: string;
}

export interface LivestockInput {
  tracking_type: LivestockTrackingType;
  name: string;
  species: string;
  breed?: string;
  count: number;
  tag_number?: string;
  birthdate?: string | null;
  photo_url?: string | null;
  notes?: string;
}

export interface LivestockCareRecord {
  id: string;
  created_at: string;
  user_id: string;
  livestock_id: string;
  care_type: string;
  notes?: string;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_day?: number | null;
  next_due: string;
  status: 'pending' | 'complete';
  completed_at?: string | null;
  notification_id?: string | null;
}

export interface LivestockCareRecordInput {
  livestock_id: string;
  care_type: string;
  notes?: string;
  recurrence_type: RecurrenceType;
  recurrence_interval?: number | null;
  recurrence_day?: number | null;
  next_due: string;
}

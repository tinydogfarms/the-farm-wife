export type ReminderEventType = 'Birthday' | 'Anniversary' | 'Other';
export type ReminderScheduleType = 'all' | 'custom';
export type CustomOffsetUnit = 'days' | 'weeks' | 'months';

export interface Reminder {
  id: string;
  created_at: string;
  user_id: string;
  name: string;
  event_type: ReminderEventType;
  event_month: number;
  event_day: number;
  event_year?: number | null;
  is_critical: boolean;
  schedule_type?: ReminderScheduleType | null;
  custom_offset_amount?: number | null;
  custom_offset_unit?: CustomOffsetUnit | null;
  notes?: string;
  scheduled_year?: number | null;
  notification_ids: string[];
}

export interface ReminderInput {
  name: string;
  event_type: ReminderEventType;
  event_month: number;
  event_day: number;
  event_year?: number | null;
  is_critical: boolean;
  schedule_type?: ReminderScheduleType | null;
  custom_offset_amount?: number | null;
  custom_offset_unit?: CustomOffsetUnit | null;
  notes?: string;
}

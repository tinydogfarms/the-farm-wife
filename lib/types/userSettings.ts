// Module keys gate optional app sections behind a per-user flag.
// 'equipment', 'livestock', and 'reminders' exist today; field modules will add more.
export type ModuleKey = 'equipment' | 'livestock' | 'reminders';

export interface UserSettings {
  id: string;
  created_at: string;
  user_id: string;
  enabled_modules: ModuleKey[];
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  location_label: string | null;
}

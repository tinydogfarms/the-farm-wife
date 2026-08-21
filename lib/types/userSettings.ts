// Module keys gate optional app sections behind a per-user flag.
// 'equipment' and 'livestock' exist today; weather/field modules will add more.
export type ModuleKey = 'equipment' | 'livestock';

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

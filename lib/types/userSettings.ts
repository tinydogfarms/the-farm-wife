// Module keys gate optional app sections behind a per-user flag. Only
// 'equipment' exists today; livestock/weather/field modules will add more.
export type ModuleKey = 'equipment';

export interface UserSettings {
  id: string;
  created_at: string;
  user_id: string;
  enabled_modules: ModuleKey[];
}

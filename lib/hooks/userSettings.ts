import { useEffect, useState } from 'react';
import { supabase } from '../services/client';
import { useAuth } from './auth';
import { getReadableError } from '../utils/errorHandler';
import type { ModuleKey, UserSettings } from '../types';

const DEFAULT_MODULES: ModuleKey[] = ['tasks', 'lists', 'discovery', 'calendar', 'admin_medical'];

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error loading user settings:', error);
      setLoading(false);
      return;
    }

    if (data) {
      setSettings(data);
      setLoading(false);
      return;
    }

    // No row yet for this user — create the default one.
    const { data: created, error: insertError } = await supabase
      .from('user_settings')
      .insert([{ user_id: user.id }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user settings:', insertError);
    } else {
      setSettings(created);
    }
    setLoading(false);
  };

  const updateSettings = async (changes: Partial<UserSettings>) => {
    if (!user || !settings) return { error: 'User settings not loaded' };

    const { data, error } = await supabase
      .from('user_settings')
      .update(changes)
      .eq('user_id', user.id)
      .select()
      .single();

    if (!error && data) {
      setSettings(data);
    }

    return { data, error: error ? getReadableError(error) : null };
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  return {
    settings,
    loading,
    enabledModules: settings?.enabled_modules ?? DEFAULT_MODULES,
    updateSettings,
    refreshSettings: loadSettings,
  };
}

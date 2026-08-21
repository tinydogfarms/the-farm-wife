import { useEffect, useState } from 'react';
import { supabase } from '../services/client';
import { useAuth } from './auth';
import { geocodeZip } from '../services/weather';
import type { UserSettings, ModuleKey } from '../types';

export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const loadSettings = async () => {
    if (!user) return;

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
      .insert([{ user_id: user.id, enabled_modules: [] }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating user settings:', insertError);
    } else {
      setSettings(created);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, [user]);

  const setFarmLocation = async (zip: string) => {
    if (!user) return { error: 'User not authenticated' };

    const { data: geocoded, error: geocodeError } = await geocodeZip(zip);
    if (geocodeError || !geocoded) {
      return { error: geocodeError ?? 'Could not find that ZIP code.' };
    }

    const { data, error } = await supabase
      .from('user_settings')
      .update({
        zip_code: zip.trim(),
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        location_label: geocoded.label,
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error saving farm location:', error);
      return { error: 'Could not save your location. Please try again.' };
    }

    setSettings(data);
    return { error: null };
  };

  const enabledModules: ModuleKey[] = settings?.enabled_modules ?? [];

  return {
    settings,
    loading,
    enabledModules,
    isModuleEnabled: (key: ModuleKey) => enabledModules.includes(key),
    setFarmLocation,
    refreshSettings: loadSettings,
  };
}

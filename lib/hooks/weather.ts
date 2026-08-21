import { useEffect, useState } from 'react';
import { useUserSettings } from './userSettings';
import { fetchForecast } from '../services/weather';
import type { Forecast } from '../types';

export function useWeather() {
  const { settings } = useUserSettings();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const latitude = settings?.latitude ?? null;
  const longitude = settings?.longitude ?? null;

  const refresh = async () => {
    if (latitude == null || longitude == null) return;

    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await fetchForecast(latitude, longitude);

    if (fetchError) {
      setError(fetchError);
    } else {
      setForecast(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (latitude != null && longitude != null) {
      refresh();
    }
  }, [latitude, longitude]);

  return {
    forecast,
    loading,
    error,
    hasLocation: latitude != null && longitude != null,
    refresh,
  };
}

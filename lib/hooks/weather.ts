import { useEffect, useState } from 'react';
import { fetchForecast } from '../services/weather';
import type { Forecast } from '../types';

export function useWeather(latitude: number | null, longitude: number | null) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

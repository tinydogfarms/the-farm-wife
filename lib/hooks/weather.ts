import { useEffect, useState } from 'react';
import { fetchForecast } from '../services/weather';
import type { Forecast } from '../types';

// Only surface a "checking the weather" indicator if the fetch is still
// running after this long — fast fetches stay silent instead of flashing
// a loading message on screen too briefly to read.
const SLOW_LOADING_DELAY_MS = 400;

export function useWeather(latitude: number | null, longitude: number | null) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      setShowLoading(false);
      return;
    }
    const timer = setTimeout(() => setShowLoading(true), SLOW_LOADING_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading]);

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
    showLoading,
    error,
    hasLocation: latitude != null && longitude != null,
    refresh,
  };
}

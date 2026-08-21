import type { Forecast, ForecastPeriod } from '../types';

const NWS_USER_AGENT = 'the-farm-wife (tinydogfarms@gmail.com)';

interface GeocodeResult {
  latitude: number;
  longitude: number;
  label: string;
}

/**
 * Formats a forecast period into a short blurb, e.g. "Tonight: 55°F,
 * Partly Cloudy, 20% chance of rain". Always names the period — NWS's
 * forecast endpoint gives 12-hour day/night blocks, not a live current
 * reading, so "Today" carries the day's high and "Tonight" carries the
 * low; naming it avoids the low reading as if it were the current temp.
 * Always states the rain chance, defaulting a null (NWS-omitted)
 * probability to 0 rather than hiding the clause.
 */
export function formatBlurb(period: ForecastPeriod): string {
  const rainChance = period.precipitationChance ?? 0;
  return `${period.name}: ${period.temperature}°${period.temperatureUnit}, ${period.shortForecast}, ${rainChance}% chance of rain`;
}

/**
 * Looks up a US ZIP code's coordinates via Zippopotam.us (free, no API
 * key). Never throws — callers should treat a null `data` as failure.
 */
export async function geocodeZip(
  zip: string
): Promise<{ data: GeocodeResult | null; error: string | null }> {
  try {
    const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip.trim())}`);

    if (!response.ok) {
      return { data: null, error: 'Could not find that ZIP code. Please check it and try again.' };
    }

    const json = await response.json();
    const place = json?.places?.[0];
    if (!place) {
      return { data: null, error: 'Could not find that ZIP code. Please check it and try again.' };
    }

    return {
      data: {
        latitude: parseFloat(place.latitude),
        longitude: parseFloat(place.longitude),
        label: `${place['place name']}, ${place['state abbreviation']}`,
      },
      error: null,
    };
  } catch (error) {
    console.error('geocodeZip error:', error);
    return { data: null, error: 'Network error. Please check your connection and try again.' };
  }
}

/**
 * Fetches today's forecast for a coordinate from the National Weather
 * Service (free, no API key, US-only). Never throws — callers should
 * treat a null `data` as failure.
 */
export async function fetchForecast(
  latitude: number,
  longitude: number
): Promise<{ data: Forecast | null; error: string | null }> {
  try {
    const pointsResponse = await fetch(`https://api.weather.gov/points/${latitude},${longitude}`, {
      headers: { 'User-Agent': NWS_USER_AGENT, Accept: 'application/geo+json' },
    });

    if (!pointsResponse.ok) {
      return { data: null, error: 'Weather data is not available for this location.' };
    }

    const pointsJson = await pointsResponse.json();
    const forecastUrl = pointsJson?.properties?.forecast;
    if (!forecastUrl) {
      return { data: null, error: 'Weather data is not available for this location.' };
    }

    const forecastResponse = await fetch(forecastUrl, {
      headers: { 'User-Agent': NWS_USER_AGENT, Accept: 'application/geo+json' },
    });

    if (!forecastResponse.ok) {
      return { data: null, error: 'Weather data is not available for this location.' };
    }

    const forecastJson = await forecastResponse.json();
    const rawPeriods = forecastJson?.properties?.periods;
    if (!Array.isArray(rawPeriods)) {
      return { data: null, error: 'Weather data is not available for this location.' };
    }

    const periods: ForecastPeriod[] = rawPeriods.map((period: any) => ({
      name: period.name,
      isDaytime: !!period.isDaytime,
      temperature: period.temperature,
      temperatureUnit: period.temperatureUnit,
      shortForecast: period.shortForecast,
      detailedForecast: period.detailedForecast,
      precipitationChance: period.probabilityOfPrecipitation?.value ?? null,
    }));

    return {
      data: { periods, fetchedAt: new Date().toISOString() },
      error: null,
    };
  } catch (error) {
    console.error('fetchForecast error:', error);
    return { data: null, error: 'Network error. Please check your connection and try again.' };
  }
}

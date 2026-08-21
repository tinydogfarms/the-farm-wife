export interface ForecastPeriod {
  name: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: 'F' | 'C';
  shortForecast: string;
  detailedForecast: string;
  precipitationChance: number | null;
}

export interface Forecast {
  locationLabel: string;
  periods: ForecastPeriod[];
  fetchedAt: string;
}

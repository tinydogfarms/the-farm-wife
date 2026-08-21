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
  periods: ForecastPeriod[];
  fetchedAt: string;
}

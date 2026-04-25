import dotenv from 'dotenv';

dotenv.config();

function requireNonEmpty(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value == null || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parsePositiveInt(name: string, fallback: string): number {
  const value = Number(requireNonEmpty(name, fallback));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return Math.floor(value);
}

export interface AppConfig {
  port: number;
  noaaAlertsBaseUrl: string;
  noaaUserAgent: string;
  weatherCacheTtlMs: number;
  enableSeattleThunderstormDemo: boolean;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.trim() === '') {
    return fallback;
  }

  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true;
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false;
    default:
      throw new Error(
        'ENABLE_SEATTLE_THUNDERSTORM_DEMO must be a boolean-like value',
      );
  }
}

export function loadConfig(): AppConfig {
  return {
    port: parsePositiveInt('PORT', '4002'),
    noaaAlertsBaseUrl: requireNonEmpty(
      'NOAA_ALERTS_BASE_URL',
      'https://api.weather.gov',
    ).replace(/\/$/, ''),
    noaaUserAgent: requireNonEmpty(
      'NOAA_USER_AGENT',
      'cmpe-272-weather-enricher/1.0 (contact: instructor@example.com)',
    ),
    weatherCacheTtlMs: parsePositiveInt('WEATHER_CACHE_TTL_MS', '30000'),
    enableSeattleThunderstormDemo: parseBoolean(
      process.env.ENABLE_SEATTLE_THUNDERSTORM_DEMO,
      true,
    ),
  };
}

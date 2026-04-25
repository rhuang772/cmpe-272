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
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaConsumerGroupId: string;
  kafkaPlaneUpdatesTopic: string;
  kafkaWeatherImpactsTopic: string;
  noaaAlertsBaseUrl: string;
  noaaUserAgent: string;
  weatherCacheTtlMs: number;
}

export function loadConfig(): AppConfig {
  const kafkaBrokers = requireNonEmpty('KAFKA_BROKERS', 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);

  if (kafkaBrokers.length === 0) {
    throw new Error('KAFKA_BROKERS must include at least one broker');
  }

  return {
    kafkaBrokers,
    kafkaClientId: requireNonEmpty('KAFKA_CLIENT_ID', 'weather-enricher'),
    kafkaConsumerGroupId: requireNonEmpty(
      'KAFKA_CONSUMER_GROUP_ID',
      'weather-enricher-group',
    ),
    kafkaPlaneUpdatesTopic: requireNonEmpty(
      'KAFKA_TOPIC_PLANES_UPDATES',
      'planes.opensky.updates',
    ),
    kafkaWeatherImpactsTopic: requireNonEmpty(
      'KAFKA_TOPIC_WEATHER_IMPACTS',
      'planes.weather.impacts',
    ),
    noaaAlertsBaseUrl: requireNonEmpty(
      'NOAA_ALERTS_BASE_URL',
      'https://api.weather.gov',
    ).replace(/\/$/, ''),
    noaaUserAgent: requireNonEmpty(
      'NOAA_USER_AGENT',
      'cmpe-272-weather-enricher/1.0 (contact: instructor@example.com)',
    ),
    weatherCacheTtlMs: parsePositiveInt('WEATHER_CACHE_TTL_MS', '30000'),
  };
}

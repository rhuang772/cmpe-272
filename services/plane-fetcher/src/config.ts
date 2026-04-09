import dotenv from 'dotenv';
import { normalizeIcao24 } from './opensky/normalize-icao24';

dotenv.config();

function requireNonEmpty(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value == null || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

function parseTrackedIcaos(raw: string): string[] {
  const seen = new Set<string>();

  for (const part of raw.split(',')) {
    const normalized = normalizeIcao24(part);
    if (normalized) {
      seen.add(normalized);
    }
  }

  if (seen.size === 0) {
    throw new Error(
      'TRACKED_ICAO24S must include at least one valid 6-character hex ICAO24 value',
    );
  }

  return [...seen];
}

function parsePositiveInt(name: string, fallback: string): number {
  const value = Number(requireNonEmpty(name, fallback));
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return Math.floor(value);
}

export interface AppConfig {
  trackedIcao24s: string[];
  pollMs: number;
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaUpdatesTopic: string;
  kafkaErrorsTopic: string;
  openSkyClientId?: string;
  openSkyClientSecret?: string;
}

export function loadConfig(): AppConfig {
  const trackedIcao24s = parseTrackedIcaos(
    requireNonEmpty('TRACKED_ICAO24S', '4ca2b1'),
  );

  const kafkaBrokers = requireNonEmpty('KAFKA_BROKERS', 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);

  if (kafkaBrokers.length === 0) {
    throw new Error('KAFKA_BROKERS must include at least one broker');
  }

  const openSkyClientId = process.env.OPENSKY_CLIENT_ID?.trim() || undefined;
  const openSkyClientSecret =
    process.env.OPENSKY_CLIENT_SECRET?.trim() || undefined;

  if ((openSkyClientId && !openSkyClientSecret) || (!openSkyClientId && openSkyClientSecret)) {
    throw new Error(
      'OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET must either both be set or both be omitted',
    );
  }

  return {
    trackedIcao24s,
    pollMs: parsePositiveInt('POLL_MS', '10000'),
    kafkaBrokers,
    kafkaClientId: requireNonEmpty('KAFKA_CLIENT_ID', 'plane-fetcher'),
    kafkaUpdatesTopic: requireNonEmpty(
      'KAFKA_TOPIC_PLANES_UPDATES',
      'planes.opensky.updates',
    ),
    kafkaErrorsTopic: requireNonEmpty(
      'KAFKA_TOPIC_PLANES_ERRORS',
      'planes.opensky.errors',
    ),
    openSkyClientId,
    openSkyClientSecret,
  };
}

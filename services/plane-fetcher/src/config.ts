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
  pollMs: number;
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaUpdatesTopic: string;
  kafkaErrorsTopic: string;
  openSkyClientId?: string;
  openSkyClientSecret?: string;
}

export function loadConfig(): AppConfig {
  const kafkaBrokers = requireNonEmpty('KAFKA_BROKERS', 'localhost:9092')
    .split(',')
    .map((broker) => broker.trim())
    .filter(Boolean);

  if (kafkaBrokers.length === 0) {
    throw new Error('KAFKA_BROKERS must include at least one broker');
  }

  const openSkyClientId = process.env.OPENSKY_CLIENT_ID?.trim() || undefined;
  const openSkyClientSecret = process.env.OPENSKY_CLIENT_SECRET?.trim() || undefined;

  if ((openSkyClientId && !openSkyClientSecret) || (!openSkyClientId && openSkyClientSecret)) {
    throw new Error(
      'OPENSKY_CLIENT_ID and OPENSKY_CLIENT_SECRET must either both be set or both be omitted',
    );
  }

  return {
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

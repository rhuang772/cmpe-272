import dotenv from 'dotenv';

dotenv.config();

function env(name: string, fallback: string): string {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : fallback;
}

export interface AppConfig {
  port: number;
  kafkaBrokers: string[];
  kafkaClientId: string;
  kafkaGroupId: string;
  kafkaTopic: string;
}

export function loadConfig(): AppConfig {
  const brokers = env('KAFKA_BROKERS', 'localhost:9092')
    .split(',')
    .map((b) => b.trim())
    .filter(Boolean);

  return {
    port: Number(env('PORT', '4001')),
    kafkaBrokers: brokers,
    kafkaClientId: env('KAFKA_CLIENT_ID', 'analytics'),
    kafkaGroupId: env('KAFKA_CONSUMER_GROUP_ID', 'analytics-group'),
    kafkaTopic: env('KAFKA_TOPIC_PLANES_UPDATES', 'planes.opensky.updates'),
  };
}

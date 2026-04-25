import { Kafka } from 'kafkajs';
import { loadConfig } from './config';
import { WeatherImpactsProducer } from './kafka/weather-impacts-producer';
import { NoaaAlertsClient } from './noaa/noaa-alerts-client';
import type { PlaneUpdateEvent } from './types';
import { WeatherEnricher } from './weather-enricher';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const kafka = new Kafka({
    clientId: config.kafkaClientId,
    brokers: config.kafkaBrokers,
  });
  const consumer = kafka.consumer({
    groupId: config.kafkaConsumerGroupId,
  });
  const producer = new WeatherImpactsProducer(
    `${config.kafkaClientId}-producer`,
    config.kafkaBrokers,
    config.kafkaWeatherImpactsTopic,
  );
  const noaaClient = new NoaaAlertsClient(
    config.noaaAlertsBaseUrl,
    config.noaaUserAgent,
  );
  const enricher = new WeatherEnricher(
    noaaClient,
    producer,
    config.weatherCacheTtlMs,
  );

  await producer.connect();
  await consumer.connect();
  await consumer.subscribe({
    topic: config.kafkaPlaneUpdatesTopic,
    fromBeginning: true,
  });

  console.log('Weather enricher started');
  console.log(`Kafka brokers: ${config.kafkaBrokers.join(', ')}`);
  console.log(`Plane topic: ${config.kafkaPlaneUpdatesTopic}`);
  console.log(`Weather topic: ${config.kafkaWeatherImpactsTopic}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      try {
        const event = JSON.parse(message.value.toString()) as PlaneUpdateEvent;
        if (!event?.icao24) return;

        await enricher.processPlaneUpdate(event);
      } catch (error) {
        const msg =
          error instanceof Error
            ? error.message
            : 'Unknown weather enrichment error';
        console.error(`Weather enrichment failed: ${msg}`);
      }
    },
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down weather enricher...`);
    await consumer.disconnect();
    await producer.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(message);
  process.exit(1);
});

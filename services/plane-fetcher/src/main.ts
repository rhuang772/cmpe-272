import { loadConfig } from './config';
import { PlaneEventsProducer } from './kafka/plane-events-producer';
import { OpenSkyClient } from './opensky/open-sky-client';
import { PlanePoller } from './poller';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const producer = new PlaneEventsProducer(
    config.kafkaClientId,
    config.kafkaBrokers,
    config.kafkaUpdatesTopic,
    config.kafkaErrorsTopic,
  );

  const openSkyClient = new OpenSkyClient(
    config.openSkyClientId && config.openSkyClientSecret
      ? {
          clientId: config.openSkyClientId,
          clientSecret: config.openSkyClientSecret,
        }
      : undefined,
  );

  const poller = new PlanePoller(
    config.trackedIcao24s,
    config.pollMs,
    openSkyClient,
    producer,
  );

  await producer.connect();

  console.log('Plane fetcher started');
  console.log(`Tracking ICAO24 values: ${config.trackedIcao24s.join(', ')}`);
  console.log(`Kafka brokers: ${config.kafkaBrokers.join(', ')}`);
  console.log(`Update topic: ${config.kafkaUpdatesTopic}`);
  console.log(`Error topic: ${config.kafkaErrorsTopic}`);

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down plane fetcher...`);
    await poller.stop();
    await producer.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  await poller.start();
}

bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(message);
  process.exit(1);
});

import { loadConfig } from './config';
import { PlaneConsumer } from './kafka/plane-consumer';
import { createHttpServer } from './http/server';

async function bootstrap(): Promise<void> {
  const config = loadConfig();

  const consumer = new PlaneConsumer(
    config.kafkaClientId,
    config.kafkaBrokers,
    config.kafkaGroupId,
    config.kafkaTopic,
  );

  await consumer.start();

  createHttpServer(consumer.planes, config.port);

  console.log('Analytics service started');
  console.log(`Kafka brokers: ${config.kafkaBrokers.join(', ')}`);
  console.log(`Topic: ${config.kafkaTopic}`);
  console.log(`Consumer group: ${config.kafkaGroupId}`);

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down analytics service...`);
    await consumer.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? `${error.message}\n${error.stack ?? ''}`
      : String(error);
  console.error(message);
  process.exit(1);
});

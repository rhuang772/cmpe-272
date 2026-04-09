import { loadConfig } from './config';
import { PlaneEventsProducer } from './kafka/plane-events-producer';

async function main(): Promise<void> {
  const config = loadConfig();
  const icao24 = config.trackedIcao24s[0];
  const fetchedAt = Date.now();

  const producer = new PlaneEventsProducer(
    config.kafkaClientId,
    config.kafkaBrokers,
    config.kafkaUpdatesTopic,
    config.kafkaErrorsTopic,
  );

  await producer.connect();

  try {
    await producer.publishUpdate({
      icao24,
      fetchedAt,
      source: 'opensky',
      plane: {
        id: icao24,
        callsign: 'TEST123',
        originCountry: 'Test Country',
        lat: 37.6213,
        lng: -122.379,
        altitudeM: 10668,
        headingDeg: 284,
        onGround: false,
        velocityMps: 231.5,
        verticalRateMps: 0,
        timePosition: Math.floor(fetchedAt / 1000),
        lastContact: Math.floor(fetchedAt / 1000),
      },
    });

    console.log(
      `Published sample plane update for ${icao24} to ${config.kafkaUpdatesTopic}`,
    );
  } finally {
    await producer.disconnect();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error);
  console.error(message);
  process.exit(1);
});

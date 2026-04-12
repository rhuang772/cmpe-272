import { OpenSkyClient } from './opensky/open-sky-client';
import { PlaneEventsProducer } from './kafka/plane-events-producer';

export class PlanePoller {
  private intervalHandle: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    private readonly trackedIcao24s: string[],
    private readonly pollMs: number,
    private readonly openSkyClient: OpenSkyClient,
    private readonly producer: PlaneEventsProducer,
  ) {}

  async start(): Promise<void> {
    console.log('polle start() started');
    await this.pollOnce();
    this.intervalHandle = setInterval(() => {
      void this.pollOnce();
    }, this.pollMs);
  }

  async stop(): Promise<void> {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  private async pollOnce(): Promise<void> {
    console.log('pollOnce started');
    if (this.isPolling) {
      console.warn('Skipping poll tick because the previous poll is still running');
      return;
    }

    this.isPolling = true;
    const startedAt = Date.now();

    try {
      for (const icao24 of this.trackedIcao24s) {
        try {
          const plane = await this.openSkyClient.fetchPlaneByIcao24(icao24);
          await this.producer.publishUpdate({
            icao24,
            fetchedAt: Date.now(),
            source: 'opensky',
            plane,
          });

          console.log(
            plane
              ? `Published update for ${icao24} (${plane.callsign})`
              : `Published empty update for ${icao24} (no active state)`,
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : 'Unknown polling error';

          await this.producer.publishError({
            icao24,
            fetchedAt: Date.now(),
            source: 'opensky',
            error: message,
          });

          console.error(`Failed to poll ${icao24}: ${message}`);
        }
      }
    } finally {
      this.isPolling = false;
      console.log(`Poll cycle finished in ${Date.now() - startedAt}ms`);
    }
  }
}

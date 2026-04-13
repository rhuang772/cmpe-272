import { OpenSkyClient } from './opensky/open-sky-client';
import { PlaneEventsProducer } from './kafka/plane-events-producer';
import type { PlaneUpdateEvent } from './types';

export class PlanePoller {
  private intervalHandle: NodeJS.Timeout | null = null;
  private isPolling = false;

  constructor(
    private readonly pollMs: number,
    private readonly openSkyClient: OpenSkyClient,
    private readonly producer: PlaneEventsProducer,
  ) {}

  async start(): Promise<void> {
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
    if (this.isPolling) {
      console.warn('Skipping poll tick because the previous poll is still running');
      return;
    }

    this.isPolling = true;
    const startedAt = Date.now();

    try {
      const planes = await this.openSkyClient.fetchAllPlanes();
      const fetchedAt = Date.now();

      const events: PlaneUpdateEvent[] = planes.map((plane) => ({
        icao24: plane.id,
        fetchedAt,
        source: 'opensky',
        plane,
      }));

      await this.producer.publishUpdates(events);
      console.log(`Published updates for ${planes.length} planes`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown polling error';
      console.error(`Poll cycle failed: ${message}`);
    } finally {
      this.isPolling = false;
      console.log(`Poll cycle finished in ${Date.now() - startedAt}ms`);
    }
  }
}

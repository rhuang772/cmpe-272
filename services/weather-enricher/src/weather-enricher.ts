import { calculateImpact } from './impact/calculate-impact';
import { WeatherImpactsProducer } from './kafka/weather-impacts-producer';
import { NoaaAlertsClient } from './noaa/noaa-alerts-client';
import type { PlaneUpdateEvent, WeatherImpactEvent } from './types';

interface CachedWeather {
  lat: number;
  lng: number;
  checkedAt: number;
  event: WeatherImpactEvent;
}

export class WeatherEnricher {
  private readonly cache = new Map<string, CachedWeather>();

  constructor(
    private readonly noaaClient: NoaaAlertsClient,
    private readonly producer: WeatherImpactsProducer,
    private readonly cacheTtlMs: number,
  ) {}

  async processPlaneUpdate(event: PlaneUpdateEvent): Promise<void> {
    if (!event.plane) {
      return;
    }

    const cached = this.cache.get(event.icao24);
    if (
      cached &&
      Date.now() - cached.checkedAt < this.cacheTtlMs &&
      this.hasSameRoundedPoint(
        cached.lat,
        cached.lng,
        event.plane.lat,
        event.plane.lng,
      )
    ) {
      await this.producer.publishImpact({
        ...cached.event,
        fetchedAt: event.fetchedAt,
      });
      return;
    }

    const alerts = await this.noaaClient.fetchActiveAlerts(
      event.plane.lat,
      event.plane.lng,
    );
    const impact = calculateImpact(alerts);
    const weatherEvent: WeatherImpactEvent = {
      icao24: event.icao24,
      fetchedAt: event.fetchedAt,
      weatherCheckedAt: Date.now(),
      source: 'noaa-alerts',
      location: {
        lat: event.plane.lat,
        lng: event.plane.lng,
      },
      impact,
      alerts: alerts.slice(0, 5),
    };

    this.cache.set(event.icao24, {
      lat: event.plane.lat,
      lng: event.plane.lng,
      checkedAt: weatherEvent.weatherCheckedAt,
      event: weatherEvent,
    });

    await this.producer.publishImpact(weatherEvent);
  }

  private hasSameRoundedPoint(
    latA: number,
    lngA: number,
    latB: number,
    lngB: number,
  ): boolean {
    return (
      latA.toFixed(2) === latB.toFixed(2) &&
      lngA.toFixed(2) === lngB.toFixed(2)
    );
  }
}

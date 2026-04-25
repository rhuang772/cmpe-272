import { calculateImpact } from './impact/calculate-impact';
import {
  createSeattleThunderstormAlert,
  isInSeattleDemoArea,
} from './demo/seattle-thunderstorm';
import { NoaaAlertsClient } from './noaa/noaa-alerts-client';
import type {
  PlaneUpdateEvent,
  WeatherAlertSummary,
  WeatherImpactEvent,
} from './types';

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
    private readonly cacheTtlMs: number,
    private readonly enableSeattleThunderstormDemo: boolean,
  ) {}

  async enrichPlane(event: PlaneUpdateEvent): Promise<WeatherImpactEvent> {
    if (!event.plane) {
      throw new Error('Plane data is required for weather enrichment');
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
      return {
        ...cached.event,
        fetchedAt: event.fetchedAt,
      };
    }

    let noaaAlerts: WeatherAlertSummary[] = [];
    try {
      noaaAlerts = await this.noaaClient.fetchActiveAlerts(
        event.plane.lat,
        event.plane.lng,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown NOAA fetch error';
      console.warn(
        `NOAA alerts lookup failed for ${event.icao24}: ${message}. Continuing with demo alerts if applicable.`,
      );
    }
    const alerts = this.applySeattleDemoAlert(
      event.plane.lat,
      event.plane.lng,
      noaaAlerts,
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

    return weatherEvent;
  }

  private applySeattleDemoAlert(
    lat: number,
    lng: number,
    alerts: WeatherAlertSummary[],
  ): WeatherAlertSummary[] {
    if (!this.enableSeattleThunderstormDemo || !isInSeattleDemoArea(lat, lng)) {
      return alerts;
    }

    const thunderstormAlert = createSeattleThunderstormAlert();
    const withoutDuplicate = alerts.filter(
      (alert) => alert.id !== thunderstormAlert.id,
    );

    return [thunderstormAlert, ...withoutDuplicate];
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

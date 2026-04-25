import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  OpenSkyFirstPlaneDto,
  PlaneWeatherImpactDto,
} from './plane.types';
import { PlanesCacheService } from './planes-cache.service';

export interface PlaneSnapshotDto {
  plane: OpenSkyFirstPlaneDto | null;
  weatherImpact: PlaneWeatherImpactDto | null;
}

@Injectable()
export class PlanesService {
  constructor(
    private readonly cache: PlanesCacheService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Current state for one aircraft from the gateway cache, hydrated by Kafka.
   */
  async getOpenSkyPlaneByIcao24(
    icao24: string,
  ): Promise<PlaneSnapshotDto> {
    const plane = this.cache.getPlane(icao24)?.plane ?? null;

    return {
      plane,
      weatherImpact: plane ? await this.fetchWeatherImpact(icao24, plane) : null,
    };
  }

  private async fetchWeatherImpact(
    icao24: string,
    plane: OpenSkyFirstPlaneDto,
  ): Promise<PlaneWeatherImpactDto | null> {
    const baseUrl =
      this.config.get<string>('WEATHER_ENRICHER_BASE_URL') ??
      'http://localhost:4002';

    const params = new URLSearchParams({
      icao24,
      lat: String(plane.lat),
      lng: String(plane.lng),
      fetchedAt: String(Date.now()),
      callsign: plane.callsign,
      originCountry: plane.originCountry,
      altitudeM: String(plane.altitudeM),
      headingDeg: String(plane.headingDeg),
      onGround: String(plane.onGround),
    });

    if (plane.velocityMps != null) {
      params.set('velocityMps', String(plane.velocityMps));
    }
    if (plane.verticalRateMps != null) {
      params.set('verticalRateMps', String(plane.verticalRateMps));
    }
    if (plane.timePosition != null) {
      params.set('timePosition', String(plane.timePosition));
    }
    if (plane.lastContact != null) {
      params.set('lastContact', String(plane.lastContact));
    }

    try {
      const response = await fetch(
        `${baseUrl.replace(/\/$/, '')}/weather-impact?${params.toString()}`,
      );
      if (!response.ok) {
        return null;
      }

      return (await response.json()) as PlaneWeatherImpactDto;
    } catch {
      return null;
    }
  }
}

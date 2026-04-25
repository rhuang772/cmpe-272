import { Injectable } from '@nestjs/common';
import type {
  OpenSkyFirstPlaneDto,
  PlaneWeatherImpactDto,
} from './plane.types';

export interface CachedPlaneState {
  plane: OpenSkyFirstPlaneDto | null;
  updatedAt: number;
}

@Injectable()
export class PlanesCacheService {
  private readonly latestPlanes = new Map<string, CachedPlaneState>();
  private readonly latestWeatherImpacts = new Map<
    string,
    PlaneWeatherImpactDto
  >();

  setPlane(
    icao24: string,
    plane: OpenSkyFirstPlaneDto | null,
    updatedAt: number,
  ): void {
    this.latestPlanes.set(icao24, {
      plane,
      updatedAt,
    });
  }

  getPlane(icao24: string): CachedPlaneState | null {
    return this.latestPlanes.get(icao24) ?? null;
  }

  setWeatherImpact(
    icao24: string,
    weatherImpact: PlaneWeatherImpactDto,
  ): void {
    this.latestWeatherImpacts.set(icao24, weatherImpact);
  }

  getWeatherImpact(icao24: string): PlaneWeatherImpactDto | null {
    return this.latestWeatherImpacts.get(icao24) ?? null;
  }
}

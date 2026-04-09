import { Injectable } from '@nestjs/common';
import type { OpenSkyFirstPlaneDto } from './plane.types';

export interface CachedPlaneState {
  plane: OpenSkyFirstPlaneDto | null;
  updatedAt: number;
}

@Injectable()
export class PlanesCacheService {
  private readonly latestPlanes = new Map<string, CachedPlaneState>();

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
}

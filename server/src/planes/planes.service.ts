import { Injectable } from '@nestjs/common';
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
  constructor(private readonly cache: PlanesCacheService) {}

  /**
   * Current state for one aircraft from the gateway cache, hydrated by Kafka.
   */
  async getOpenSkyPlaneByIcao24(
    icao24: string,
  ): Promise<PlaneSnapshotDto> {
    return {
      plane: this.cache.getPlane(icao24)?.plane ?? null,
      weatherImpact: this.cache.getWeatherImpact(icao24),
    };
  }
}

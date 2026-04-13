import { Injectable } from '@nestjs/common';
import type { OpenSkyFirstPlaneDto } from './plane.types';
import { PlanesCacheService } from './planes-cache.service';

@Injectable()
export class PlanesService {
  constructor(private readonly cache: PlanesCacheService) {}

  /**
   * Current state for one aircraft from the gateway cache, hydrated by Kafka.
   */
  async getOpenSkyPlaneByIcao24(
    icao24: string,
  ): Promise<OpenSkyFirstPlaneDto | null> {
    return this.cache.getPlane(icao24)?.plane ?? null;
  }
}

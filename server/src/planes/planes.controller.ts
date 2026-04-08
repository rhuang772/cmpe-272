import {
  BadRequestException,
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { PlanesService } from './planes.service';
import { normalizeIcao24 } from './opensky-icao.util';
import type { OpenSkyFirstPlaneDto } from './plane.types';

@Controller('planes')
export class PlanesController {
  constructor(private readonly planesService: PlanesService) {}

  /**
   * Current state for one aircraft (OpenSky `GET /states/all?icao24=hex`).
   */
  @Get('opensky')
  async getOpenSky(
    @Query('icao24') icao24: string | undefined,
  ): Promise<{ plane: OpenSkyFirstPlaneDto | null }> {
    if (icao24 == null || icao24.trim() === '') {
      throw new BadRequestException('Query parameter icao24 is required');
    }
    const normalized = normalizeIcao24(icao24);
    if (!normalized) {
      throw new BadRequestException(
        'icao24 must be exactly 6 hexadecimal characters (e.g. 4ca2b1)',
      );
    }
    const plane = await this.planesService.getOpenSkyPlaneByIcao24(normalized);
    return { plane };
  }
}

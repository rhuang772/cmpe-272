import { HttpService } from '@nestjs/axios';
import {
  BadGatewayException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { firstValueFrom } from 'rxjs';
import type { OpenSkyFirstPlaneDto } from './plane.types';
import {
  mapOpenSkyStateRow,
  type OpenSkyStateRow,
  type OpenSkyStatesResponse,
} from './opensky.util';

@Injectable()
export class PlanesService {
  private readonly logger = new Logger(PlanesService.name);
  private readonly openskyStatesUrl =
    'https://opensky-network.org/api/states/all';

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private buildAuthHeaders(): Record<string, string> {
    const clientId = this.config.get<string>('OPENSKY_CLIENT_ID');
    const clientSecret = this.config.get<string>('OPENSKY_CLIENT_SECRET');
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (clientId && clientSecret) {
      const token = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );
      headers['Authorization'] = `Basic ${token}`;
    }
    return headers;
  }

  /**
   * Current state for one aircraft: `GET /states/all?icao24=hex`.
   * `icao24` must be normalized (6 lowercase hex chars). Optional Basic auth.
   */
  async getOpenSkyPlaneByIcao24(
    icao24: string,
  ): Promise<OpenSkyFirstPlaneDto | null> {
    const headers = this.buildAuthHeaders();
    const url = `${this.openskyStatesUrl}?icao24=${encodeURIComponent(icao24)}`;

    try {
      const { data } = await firstValueFrom(
        this.http.get<OpenSkyStatesResponse>(url, { headers }),
      );

      const states = data.states ?? [];
      const raw = states.find((s) => s != null) as OpenSkyStateRow | undefined;
      if (!raw) return null;

      return mapOpenSkyStateRow(raw);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.status
          ? `HTTP ${err.response.status}`
          : err.message
        : err instanceof Error
          ? err.message
          : 'OpenSky request failed';
      this.logger.warn(`OpenSky: ${msg}`);
      throw new BadGatewayException(`OpenSky unavailable: ${msg}`);
    }
  }
}

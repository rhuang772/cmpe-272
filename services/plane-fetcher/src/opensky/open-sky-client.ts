import axios, { type AxiosInstance } from 'axios';
import { mapOpenSkyStateRow } from './map-open-sky-state-row';
import type { OpenSkyFirstPlaneDto, OpenSkyStatesResponse, OpenSkyStateRow } from '../types';

export class OpenSkyClient {
  private readonly http: AxiosInstance;
  private readonly statesUrl = 'https://opensky-network.org/api/states/all';

  constructor(
    private readonly auth?: {
      clientId: string;
      clientSecret: string;
    },
  ) {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    if (auth) {
      const token = Buffer.from(
        `${auth.clientId}:${auth.clientSecret}`,
      ).toString('base64');
      headers.Authorization = `Basic ${token}`;
    }

    this.http = axios.create({
      timeout: 20000,
      maxRedirects: 3,
      headers,
    });
  }

  async fetchPlaneByIcao24(icao24: string): Promise<OpenSkyFirstPlaneDto | null> {
    const { data } = await this.http.get<OpenSkyStatesResponse>(this.statesUrl, {
      params: { icao24 },
    });

    const states = data.states ?? [];
    const raw = states.find((state) => state != null) as OpenSkyStateRow | undefined;
    if (!raw) return null;

    return mapOpenSkyStateRow(raw);
  }
}

import axios, { type AxiosInstance, isAxiosError } from 'axios';
import { mapOpenSkyStateRow } from './map-open-sky-state-row';
import type { OpenSkyFirstPlaneDto, OpenSkyStatesResponse, OpenSkyStateRow } from '../types';

export class OpenSkyClient {
  private readonly http: AxiosInstance;
  private readonly statesUrl = 'https://opensky-network.org/api/states/all';
  private readonly tokenUrl = 'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
  private accessToken: string | null = null;
  private expiresAt: number = 0; 

  constructor(
    private readonly auth?: {
      clientId: string;
      clientSecret: string;
    },
  ) {

    this.http = axios.create({
      timeout: 20000,
      maxRedirects: 3,
      headers:{ Accept: 'application/json' },
    });
  }

  private async refreshAccessToken(): Promise<void> {

    // Check if auth exists before accessing properties
    if (!this.auth) {
      throw new Error('OpenSkyClient: Authentication credentials are required for OAuth2 flow.');
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.auth.clientId);
    params.append('client_secret', this.auth.clientSecret);

    const { data } = await axios.post(this.tokenUrl, params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    this.accessToken = data.access_token;
    this.expiresAt = Date.now() + (data.expires_in * 1000);
  }

  async fetchPlaneByIcao24(icao24: string): Promise<OpenSkyFirstPlaneDto | null> {
    console.log('fetchPlaneByIcao24 started');
    const now = Date.now();
    if (!this.accessToken || now >= (this.expiresAt - 60000)) {
      await this.refreshAccessToken();
    }

    const { data } = await this.http.get(this.statesUrl, {
      params: { icao24: icao24.toLowerCase(), extended: 1 },
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });

    const states = data.states ?? [];
    console.log('states: ', states);
    const raw = states.find((state: OpenSkyStateRow) => state !== null) || null;
    
    return raw ? mapOpenSkyStateRow(raw) : null;

  }

  async fetchAllPlanes(): Promise<OpenSkyFirstPlaneDto[]> {
    console.log('fetchAllPlanes started');
    const now = Date.now();
    if (!this.accessToken || now >= (this.expiresAt - 60000)) {
      await this.refreshAccessToken();
    }

    try {
      const response = await this.http.get(this.statesUrl, {
        params: { extended: 1 },
        headers: { Authorization: `Bearer ${this.accessToken}` },
      });
      const remaining = response.headers['x-rate-limit-remaining'];
      const states = response.data.states ?? [];
      console.log('states: ', states);
      if (remaining != null) console.log(`Rate limit remaining: ${remaining}`);
      return states.map((state: OpenSkyStateRow) => mapOpenSkyStateRow(state)).filter((plane: OpenSkyFirstPlaneDto | null) => plane !== null);
    } catch (error) {
      if (isAxiosError(error) && error.response) {
        const retryAfter = error.response.headers['x-rate-limit-retry-after-seconds'];
        const remaining = error.response.headers['x-rate-limit-remaining'];
        console.error(`OpenSky API ${error.response.status} | Remaining: ${remaining ?? 'n/a'} | Retry after: ${retryAfter ?? 'n/a'}s`);
      }
      throw error;
    }
  }
}

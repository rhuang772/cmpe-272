import axios, { type AxiosInstance } from 'axios';
import type { NoaaAlertsResponse, WeatherAlertSummary } from '../types';

export class NoaaAlertsClient {
  private readonly http: AxiosInstance;

  constructor(baseUrl: string, userAgent: string) {
    this.http = axios.create({
      baseURL: baseUrl,
      timeout: 20000,
      headers: {
        Accept: 'application/geo+json, application/json',
        'User-Agent': userAgent,
      },
    });
  }

  async fetchActiveAlerts(
    lat: number,
    lng: number,
  ): Promise<WeatherAlertSummary[]> {
    const { data } = await this.http.get<NoaaAlertsResponse>('/alerts/active', {
      params: {
        point: `${lat},${lng}`,
      },
    });

    const features = data.features ?? [];

    return features.map((feature) => {
      const properties = feature.properties ?? {};
      return {
        id: feature.id ?? properties.id ?? 'unknown-alert',
        event: properties.event ?? 'Unknown alert',
        severity: properties.severity ?? null,
        urgency: properties.urgency ?? null,
        certainty: properties.certainty ?? null,
        headline: properties.headline ?? null,
        areaDesc: properties.areaDesc ?? null,
      };
    });
  }
}

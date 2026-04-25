export interface OpenSkyFirstPlaneDto {
  id: string;
  callsign: string;
  originCountry: string;
  lat: number;
  lng: number;
  altitudeM: number;
  headingDeg: number;
  onGround: boolean;
  velocityMps: number | null;
  verticalRateMps: number | null;
  timePosition: number | null;
  lastContact: number | null;
}

export interface PlaneUpdateEvent {
  icao24: string;
  fetchedAt: number;
  source: 'opensky';
  plane: OpenSkyFirstPlaneDto | null;
}

export type WeatherImpactLevel = 'none' | 'low' | 'medium' | 'high';

export interface WeatherAlertSummary {
  id: string;
  event: string;
  severity: string | null;
  urgency: string | null;
  certainty: string | null;
  headline: string | null;
  areaDesc: string | null;
}

export interface WeatherImpactPayload {
  level: WeatherImpactLevel;
  summary: string;
  alertCount: number;
}

export interface WeatherImpactEvent {
  icao24: string;
  fetchedAt: number;
  weatherCheckedAt: number;
  source: 'noaa-alerts';
  location: {
    lat: number;
    lng: number;
  };
  impact: WeatherImpactPayload;
  alerts: WeatherAlertSummary[];
}

export interface NoaaAlertProperties {
  id?: string;
  event?: string;
  severity?: string;
  urgency?: string;
  certainty?: string;
  headline?: string;
  areaDesc?: string;
}

export interface NoaaAlertFeature {
  id?: string;
  properties?: NoaaAlertProperties;
}

export interface NoaaAlertsResponse {
  features?: NoaaAlertFeature[];
}

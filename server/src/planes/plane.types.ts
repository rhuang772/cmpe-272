export interface PlaneDto {
  id: string;
  callsign: string;
  lat: number;
  lng: number;
  altitudeM: number;
  headingDeg: number;
}

/** First aircraft row from OpenSky `states/all`, for API + UI table */
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
  category: any | null;
}

export type WeatherImpactLevel = 'none' | 'low' | 'medium' | 'high';

export interface WeatherAlertDto {
  id: string;
  event: string;
  severity: string | null;
  urgency: string | null;
  certainty: string | null;
  headline: string | null;
  areaDesc: string | null;
}

export interface WeatherImpactDto {
  level: WeatherImpactLevel;
  summary: string;
  alertCount: number;
}

export interface PlaneWeatherImpactDto {
  icao24: string;
  fetchedAt: number;
  weatherCheckedAt: number;
  source: 'noaa-alerts';
  location: {
    lat: number;
    lng: number;
  };
  impact: WeatherImpactDto;
  alerts: WeatherAlertDto[];
}

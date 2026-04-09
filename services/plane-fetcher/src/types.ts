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

export interface PlaneFetchErrorEvent {
  icao24: string;
  fetchedAt: number;
  source: 'opensky';
  error: string;
}

export interface OpenSkyStatesResponse {
  time: number;
  states: (OpenSkyStateRow | null)[] | null;
}

export type OpenSkyStateRow = (string | number | boolean | null)[];

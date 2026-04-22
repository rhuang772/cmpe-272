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

export interface PlaneUpdateEvent {
  icao24: string;
  fetchedAt: number;
  source: 'opensky';
  plane: OpenSkyFirstPlaneDto | null;
}

export interface PlaneAnalytics {
  totalAirborne: number;
  totalOnGround: number;
  ascending: number;
  descending: number;
  cruising: number;
  countryBreakdown: { country: string; count: number }[];
  altitudeHistogram: { bucket: string; count: number }[];
  speedHistogram: { bucket: string; count: number }[];
  categoryBreakdown: { category: string; count: number }[];
  heatmapPoints: [number, number][];
  heatmapMax: number;
}

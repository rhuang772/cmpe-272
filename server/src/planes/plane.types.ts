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

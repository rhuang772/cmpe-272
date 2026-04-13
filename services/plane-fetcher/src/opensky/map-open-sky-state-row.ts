import type {
  OpenSkyFirstPlaneDto,
  OpenSkyStateRow,
} from '../types';

export function mapOpenSkyStateRow(
  row: OpenSkyStateRow,
): OpenSkyFirstPlaneDto | null {
  if (!row || row.length < 11) return null;

  const icao24 = row[0];
  const callsignRaw = row[1];
  const originCountry = row[2];
  const timePosition = row[3];
  const lastContact = row[4];
  const longitude = row[5];
  const latitude = row[6];
  const baroAltitude = row[7];
  const onGround = row[8];
  const velocity = row[9];
  const trueTrack = row[10];
  const verticalRate = row[11];

  if (typeof icao24 !== 'string' || latitude == null || longitude == null) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const callsign =
    typeof callsignRaw === 'string' ? callsignRaw.trim() || icao24 : icao24;

  return {
    id: icao24,
    callsign,
    originCountry:
      typeof originCountry === 'string' ? originCountry : '-',
    lat,
    lng,
    altitudeM:
      typeof baroAltitude === 'number' && !Number.isNaN(baroAltitude)
        ? baroAltitude
        : 0,
    headingDeg:
      typeof trueTrack === 'number' && !Number.isNaN(trueTrack) ? trueTrack : 0,
    onGround: Boolean(onGround),
    velocityMps: typeof velocity === 'number' ? velocity : null,
    verticalRateMps: typeof verticalRate === 'number' ? verticalRate : null,
    timePosition: typeof timePosition === 'number' ? timePosition : null,
    lastContact: typeof lastContact === 'number' ? lastContact : null,
  };
}

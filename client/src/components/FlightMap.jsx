import { memo, useEffect, useMemo, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import L from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * @typedef {import('../types/plane').Plane} Plane
 */

const DEFAULT_CENTER = [20, 0];
const DEFAULT_ZOOM = 4;

function planeDivIcon(headingDeg) {
  return L.divIcon({
    className: 'flight-map-plane-marker',
    html: `<div style="transform: rotate(${headingDeg}deg); line-height: 1; font-size: 22px;" aria-hidden="true">✈️</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/**
 * Fit map to aircraft only when `icaoKey` changes (new track), not on each poll.
 * @param {{ planes: Plane[]; icaoKey: string }} props
 */
function FitBoundsOnIcaoChange({ planes, icaoKey }) {
  const map = useMap();
  const lastFitForIcao = useRef(/** @type {string | null} */ (null));

  useEffect(() => {
    if (!icaoKey || planes.length === 0) return;
    if (lastFitForIcao.current === icaoKey) return;
    lastFitForIcao.current = icaoKey;
    const bounds = L.latLngBounds(planes.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 12 });
  }, [icaoKey, planes, map]);

  return null;
}

/**
 * Smooth pan when the same aircraft moves (poll updates).
 * @param {{ planes: Plane[]; icaoKey: string }} props
 */
function SmoothPanOnUpdate({ planes, icaoKey }) {
  const map = useMap();
  const prevCenter = useRef(/** @type {L.LatLng | null} */ (null));

  useEffect(() => {
    prevCenter.current = null;
  }, [icaoKey]);

  useEffect(() => {
    if (planes.length === 0) return;
    const p = planes[0];
    const center = L.latLng(p.lat, p.lng);
    if (prevCenter.current === null) {
      prevCenter.current = center;
      return;
    }
    if (!prevCenter.current.equals(center)) {
      map.panTo(center, { animate: true, duration: 0.45 });
      prevCenter.current = center;
    }
  }, [planes, map]);

  return null;
}

const PlaneMarker = memo(function PlaneMarker({ plane }) {
  const icon = useMemo(
    () => planeDivIcon(plane.headingDeg ?? 0),
    [plane.headingDeg],
  );
  return (
    <Marker position={[plane.lat, plane.lng]} icon={icon}>
      <Popup>
        <strong>{plane.callsign}</strong>
        <br />
        Alt: {Math.round(plane.altitudeM)} m · Hdg: {Math.round(plane.headingDeg)}°
      </Popup>
    </Marker>
  );
});

/**
 * @param {{
 *   planes: Plane[];
 *   title?: string;
 *   height?: number | string;
 *   fitBoundsKey: string | null;
 * }} props
 */
export default function FlightMap({
  planes,
  title = 'Live traffic',
  height = 420,
  fitBoundsKey,
}) {
  const center = useMemo(() => {
    if (planes.length === 0) return DEFAULT_CENTER;
    const p = planes[0];
    return [p.lat, p.lng];
  }, [planes]);

  return (
    <Paper
      elevation={2}
      sx={{
        overflow: 'hidden',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="subtitle1" fontWeight={600}>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {planes.length === 0
            ? 'No aircraft'
            : `${planes.length} aircraft on map`}
        </Typography>
      </Box>
      <Box
        sx={{
          height,
          width: '100%',
          position: 'relative',
          '& .leaflet-container': {
            height: '100%',
            width: '100%',
            zIndex: 0,
          },
        }}
      >
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          {fitBoundsKey && planes.length > 0 && (
            <>
              <FitBoundsOnIcaoChange planes={planes} icaoKey={fitBoundsKey} />
              <SmoothPanOnUpdate planes={planes} icaoKey={fitBoundsKey} />
            </>
          )}
          {planes.map((p) => (
            <PlaneMarker key={p.id} plane={p} />
          ))}
        </MapContainer>
      </Box>
    </Paper>
  );
}

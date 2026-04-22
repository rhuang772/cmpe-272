import { useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import FlightMap from '../components/FlightMap';
import OpenSkyPlaneTable from '../components/OpenSkyPlaneTable';
import { fetchOpenSkyPlane } from '../api/planes';
import { normalizeIcao24 } from '../utils/icao24';

const POLL_MS = 10_000;

/**
 * @param {import('../types/opensky-plane').OpenSkyFirstPlane} p
 * @returns {import('../types/plane').Plane}
 */
function openSkyToMapPlane(p) {
  return {
    id: p.id,
    callsign: p.callsign,
    lat: p.lat,
    lng: p.lng,
    altitudeM: p.altitudeM,
    headingDeg: p.headingDeg,
  };
}

export default function FlightMapTestPage() {
  const [icaoInput, setIcaoInput] = useState('');
  const [formError, setFormError] = useState(/** @type {string | null} */ (null));
  const [trackedIcao24, setTrackedIcao24] = useState(
    /** @type {string | null} */ (null),
  );

  const [openSkyPlane, setOpenSkyPlane] = useState(
    /** @type {import('../types/opensky-plane').OpenSkyFirstPlane | null} */ (
      null
    ),
  );
  const [initialLoading, setInitialLoading] = useState(false);
  const [openSkyError, setOpenSkyError] = useState(
    /** @type {string | null} */ (null),
  );
  const [lastUpdated, setLastUpdated] = useState(
    /** @type {Date | null} */ (null),
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialPollDoneRef = useRef(false);

  useEffect(() => {
    if (!trackedIcao24) {
      setOpenSkyPlane(null);
      setLastUpdated(null);
      setOpenSkyError(null);
      initialPollDoneRef.current = false;
      return;
    }

    let cancelled = false;
    initialPollDoneRef.current = false;
    setOpenSkyPlane(null);
    setLastUpdated(null);

    const poll = async () => {
      if (!initialPollDoneRef.current) {
        setInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setOpenSkyError(null);
      try {
        const { plane } = await fetchOpenSkyPlane(trackedIcao24);
        if (cancelled) return;
        setOpenSkyPlane(plane);
        setLastUpdated(new Date());
      } catch (e) {
        if (!cancelled) {
          setOpenSkyError(
            e instanceof Error ? e.message : 'OpenSky request failed',
          );
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false);
          setIsRefreshing(false);
          initialPollDoneRef.current = true;
        }
      }
    };

    poll();
    const intervalId = setInterval(poll, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [trackedIcao24]);

  const mapPlanes = useMemo(() => {
    if (!openSkyPlane) return [];
    return [openSkyToMapPlane(openSkyPlane)];
  }, [openSkyPlane]);

  const mapTitle = 'Aircraft (OpenSky)';

  const handleTrack = (e) => {
    e.preventDefault();
    const n = normalizeIcao24(icaoInput);
    if (!n) {
      setFormError('Enter a valid ICAO24: 6 hexadecimal characters (e.g. 4ca2b1).');
      return;
    }
    setFormError(null);
    setTrackedIcao24(n);
  };

  const handleStop = () => {
    setTrackedIcao24(null);
    setInitialLoading(false);
    setIsRefreshing(false);
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Button component={RouterLink} to="/" variant="text" size="small">
            ← Home
          </Button>
        </Box>
        <Typography variant="h4" component="h1" fontWeight={700}>
          Flight Map
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter an aircraft ICAO24 address (6 hex digits). Data refreshes every{' '}
          {POLL_MS / 1000}s while tracking.
        </Typography>
      </Stack>

      <Box
        component="form"
        onSubmit={handleTrack}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          alignItems: 'flex-start',
          mb: 3,
        }}
      >
        <TextField
          label="ICAO24"
          placeholder="e.g. 4ca2b1"
          value={icaoInput}
          onChange={(e) => {
            setIcaoInput(e.target.value);
            setFormError(null);
          }}
          error={Boolean(formError)}
          helperText={formError || 'Lowercase hex, 6 characters'}
          size="small"
          sx={{ minWidth: 200 }}
          inputProps={{ maxLength: 8, spellCheck: false }}
        />
        <Button type="submit" variant="contained" sx={{ mt: 0.5 }}>
          Track
        </Button>
        {trackedIcao24 && (
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            sx={{ mt: 0.5 }}
            onClick={handleStop}
          >
            Stop tracking
          </Button>
        )}
      </Box>

      {openSkyError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {openSkyError} — ensure the API is running (
          <code>cd server && npm run start:dev</code>) and OpenSky is reachable.
        </Alert>
      )}

      {trackedIcao24 && (
        <Box sx={{ mb: 3 }}>
          <OpenSkyPlaneTable
            initialLoading={initialLoading}
            trackedIcao24={trackedIcao24}
            plane={openSkyPlane}
            lastUpdated={lastUpdated}
            refreshing={isRefreshing}
          />
        </Box>
      )}

      {trackedIcao24 && (
        <FlightMap
          planes={mapPlanes}
          title={mapTitle}
          height={440}
          fitBoundsKey={trackedIcao24}
        />
      )}
    </Container>
  );
}

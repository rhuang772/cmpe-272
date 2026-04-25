import { useEffect, useMemo, useRef, useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';
import FlightMap from '../components/FlightMap';
import OpenSkyPlaneTable from '../components/OpenSkyPlaneTable';
import WeatherImpactCard from '../components/WeatherImpactCard';
import { fetchOpenSkyPlane } from '../api/planes';
import { normalizeIcao24 } from '../utils/icao24';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

const POLL_MS = 10_000;
// Constants for takeoff/landing
const ALT_THRESHOLD = 1000; 
const V_RATE_THRESHOLD = 2.5;

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

  //notification state
  const [notif, setNotif] = useState({ open: false, msg: '', severity: 'info' });
  const [persistentStatus, setPersistentStatus] = useState(null);

  const [openSkyPlane, setOpenSkyPlane] = useState(
    /** @type {import('../types/opensky-plane').OpenSkyFirstPlane | null} */ (
      null
    ),
  );
  const [weatherImpact, setWeatherImpact] = useState(
    /** @type {import('../types/weather-impact').PlaneWeatherImpact | null} */ (
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

  const prevPlaneRef = useRef(null);
  const initialPollDoneRef = useRef(false);

  useEffect(() => {
    if (!trackedIcao24) {
      setOpenSkyPlane(null);
      setWeatherImpact(null);
      setLastUpdated(null);
      setOpenSkyError(null);
      setPersistentStatus(null);
      initialPollDoneRef.current = false;
      return;
    }

    let cancelled = false;
    initialPollDoneRef.current = false;
    setOpenSkyPlane(null);
    setWeatherImpact(null);
    setLastUpdated(null);


    const poll = async () => {
      if (!initialPollDoneRef.current) {
        setInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setOpenSkyError(null);

      try {
        const { plane: curr } = await fetchOpenSkyPlane(trackedIcao24);
        if (cancelled) return;
        setOpenSkyPlane(plane);
        setWeatherImpact(nextWeatherImpact);
        
        //notification
        const prev = prevPlaneRef.current;
        if (prev && prev.id === curr.id) {
          
          //Landing Commencing
          if (!curr.onGround && curr.altitudeM < ALT_THRESHOLD && curr.verticalRateMps < -V_RATE_THRESHOLD) {
            setPersistentStatus(`Landing Commencing: ${curr.callsign} is on final approach.`);
          }

          //Takeoff Success -> Initial Climb
          if (prev.onGround && !curr.onGround) {
            setNotif({ 
              open: true, 
              msg: `Takeoff Successful: ${curr.callsign} is now airborne.`, 
              severity: 'success' 
            });
            setPersistentStatus(`Initial Climb: ${curr.callsign} is gaining altitude rapidly.`);
          }

          // Landing Success
          if (!prev.onGround && curr.onGround) {
            setPersistentStatus(null);
            setNotif({ 
              open: true, 
              msg: `Landing Successful: ${curr.callsign} has touched down.`, 
              severity: 'success' 
            });
          }

          //Climb Complete
          if (persistentStatus?.includes('Initial Climb') && curr.altitudeM > ALT_THRESHOLD) {
            setPersistentStatus(null);
          }
        }

        setOpenSkyPlane(curr);
        prevPlaneRef.current = curr;

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

    void poll();
    const intervalId = setInterval(() => {
      void poll();
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [trackedIcao24, persistentStatus]);

  const mapPlanes = useMemo(() => {
    if (!openSkyPlane) return [];
    return [openSkyToMapPlane(openSkyPlane)];
  }, [openSkyPlane]);

  const mapTitle = 'Aircraft (OpenSky)';

  const handleTrack = (e) => {
    e.preventDefault();
    const normalized = normalizeIcao24(icaoInput);
    if (!normalized) {
      setFormError(
        'Enter a valid ICAO24: 6 hexadecimal characters (e.g. 4ca2b1).',
      );
      return;
    }
    setFormError(null);
    setTrackedIcao24(normalized);
  };

  const handleStop = () => setTrackedIcao24(null);

  const handleCloseNotif = () => setNotif({ ...notif, open: false });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Button component={RouterLink} to="/" variant="text" size="small">
            {'<-'} Home
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

      <Box component="form" onSubmit={handleTrack} sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
        <TextField
          label="ICAO24"
          value={icaoInput}
          onChange={(e) => setIcaoInput(e.target.value)}
          error={Boolean(formError)}
          helperText={formError || 'Lowercase hex, 6 characters'}
          size="small"
        />
        <Button type="submit" variant="contained">Track</Button>
        {trackedIcao24 && <Button onClick={handleStop} variant="outlined" color="secondary">Stop</Button>}
      </Box>


      {openSkyError && <Alert severity="warning" sx={{ mb: 2 }}>{openSkyError}</Alert>}

      {/* Persistent Status Banner */}
      {persistentStatus && (
        <Alert 
          severity="info" 
          variant="filled" 
          sx={{ 
            mb: 2, 
            fontWeight: 600,
            backgroundColor: persistentStatus.includes('Landing') ? 'warning.main' : 'info.main'
          }}
        >
          {persistentStatus}
        </Alert>
      )}

      {trackedIcao24 && (

        <Box sx={{ mb: 3 }}>
          <WeatherImpactCard
            weatherImpact={weatherImpact}
            loading={initialLoading}
          />
        </Box>
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
          title="Aircraft (OpenSky)"
          height={440}
          fitBoundsKey={trackedIcao24}
        />
      )}

      <Snackbar 
        open={notif.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotif}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert onClose={handleCloseNotif} severity={notif.severity} variant="filled">
          {notif.msg}
        </MuiAlert>
      </Snackbar>

    </Container>
  );
}

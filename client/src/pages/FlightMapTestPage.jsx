import { useEffect, useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert, Box, Button, Container, Stack, TextField, Typography, Snackbar, Alert as MuiAlert
} from '@mui/material';

import FlightMap from '../components/FlightMap';
import OpenSkyPlaneTable from '../components/OpenSkyPlaneTable';
import WeatherImpactCard from '../components/WeatherImpactCard';
import { fetchOpenSkyPlane } from '../api/planes';
import { normalizeIcao24 } from '../utils/icao24';

const POLL_MS = 10_000;
const ALT_THRESHOLD = 1000; 
const V_RATE_THRESHOLD = 2.5;

function openSkyToMapPlane(p) {
  return {
    id: p.id, callsign: p.callsign, lat: p.lat, lng: p.lng,
    altitudeM: p.altitudeM, headingDeg: p.headingDeg,
  };
}

export default function FlightMapTestPage() {
  const [icaoInput, setIcaoInput] = useState('');
  const [formError, setFormError] = useState(null);
  const [trackedIcao24, setTrackedIcao24] = useState(null);
  
  // Data States
  const [openSkyPlane, setOpenSkyPlane] = useState(null);
  const [weatherImpact, setWeatherImpact] = useState(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [openSkyError, setOpenSkyError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Status & Notification States
  const [notif, setNotif] = useState({ open: false, msg: '', severity: 'info' });
  const [persistentStatus, setPersistentStatus] = useState(null);

  const prevPlaneRef = useRef(null);
  const initialPollDoneRef = useRef(false);

  useEffect(() => {
    if (!trackedIcao24) {
      setOpenSkyPlane(null);
      setWeatherImpact(null);
      setPersistentStatus(null);
      setLastUpdated(null);
      setOpenSkyError(null);
      initialPollDoneRef.current = false;
      prevPlaneRef.current = null;
      return;
    }

    let cancelled = false;

    const poll = async () => {
      if (!initialPollDoneRef.current) setInitialLoading(true);
      else setIsRefreshing(true);
      
      setOpenSkyError(null);

      try {
        const { plane: curr, weatherImpact: nextWeather } = await fetchOpenSkyPlane(trackedIcao24);
        if (cancelled) return;

        const prev = prevPlaneRef.current;
        if (prev && prev.id === curr.id) {
          //Landing Commencing Logic
          if (!curr.onGround && curr.altitudeM < ALT_THRESHOLD && curr.verticalRateMps < -V_RATE_THRESHOLD) {
            setPersistentStatus(s => s?.includes('Landing') ? s : `Landing Commencing: ${curr.callsign} is on final approach.`);
          }
          //Takeoff Logic
          if (prev.onGround && !curr.onGround) {
            setNotif({ open: true, msg: `Takeoff Successful: ${curr.callsign} is airborne.`, severity: 'success' });
            setPersistentStatus(`Initial Climb: ${curr.callsign} is gaining altitude.`);
          }
          //Landing Success Logic
          if (!prev.onGround && curr.onGround) {
            setPersistentStatus(null);
            setNotif({ open: true, msg: `Landing Successful: ${curr.callsign} has touched down.`, severity: 'success' });
          }
          // Clear Climb Status
          if (curr.altitudeM < ALT_THRESHOLD && curr.verticalRateMps > V_RATE_THRESHOLD) {
            setPersistentStatus(s => s?.includes('Initial Climb') ? null : s);
          }
        }

        setOpenSkyPlane(curr);
        setWeatherImpact(nextWeather);
        prevPlaneRef.current = curr;
        setLastUpdated(new Date());
      } catch (e) {
        if (!cancelled) setOpenSkyError(e instanceof Error ? e.message : 'OpenSky request failed');
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
    return () => { cancelled = true; clearInterval(intervalId); };
  }, [trackedIcao24]);

  const mapPlanes = useMemo(() => openSkyPlane ? [openSkyToMapPlane(openSkyPlane)] : [], [openSkyPlane]);

  const handleTrack = (e) => {
    e.preventDefault();
    const n = normalizeIcao24(icaoInput);
    if (!n) {
      setFormError('Enter a valid 6-character hex code.');
      return;
    }
    setFormError(null);
    setTrackedIcao24(n);
  };

  const handleStop = () => setTrackedIcao24(null);
  const handleCloseNotif = () => setNotif(prev => ({ ...prev, open: false }));

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2} sx={{ mb: 3 }}>
        <Button component={RouterLink} to="/" variant="text" size="small" sx={{ alignSelf: 'flex-start' }}>← Home</Button>
        <Typography variant="h4" fontWeight={700}>Flight Map & Weather</Typography>
        <Typography variant="body2" color="text.secondary">Tracking ICAO24: Data updates every {POLL_MS / 1000}s.</Typography>
      </Stack>

      <Box component="form" onSubmit={handleTrack} sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
        <TextField
          label="ICAO24" value={icaoInput} size="small" error={Boolean(formError)}
          helperText={formError || 'e.g. 4ca2b1'} onChange={(e) => setIcaoInput(e.target.value)}
          inputProps={{ maxLength: 6 }}
        />
        <Button type="submit" variant="contained">Track</Button>
        {trackedIcao24 && <Button onClick={handleStop} variant="outlined" color="secondary">Stop</Button>}
      </Box>

      {openSkyError && <Alert severity="warning" sx={{ mb: 2 }}>{openSkyError}</Alert>}

      {persistentStatus && (
        <Alert severity="info" variant="filled" sx={{ mb: 2, fontWeight: 600 }}>
          {persistentStatus}
        </Alert>
      )}

      {trackedIcao24 && (
        <>
          <Box sx={{ mb: 3 }}>
            <WeatherImpactCard weatherImpact={weatherImpact} loading={initialLoading} />
          </Box>
          <Box sx={{ mb: 3 }}>
            <OpenSkyPlaneTable 
                initialLoading={initialLoading} trackedIcao24={trackedIcao24} 
                plane={openSkyPlane} lastUpdated={lastUpdated} refreshing={isRefreshing} 
            />
          </Box>
          <FlightMap planes={mapPlanes} title="Aircraft (OpenSky)" height={440} fitBoundsKey={trackedIcao24} />
        </>
      )}

      <Snackbar 
        open={notif.open} autoHideDuration={6000} onClose={handleCloseNotif}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MuiAlert onClose={handleCloseNotif} severity={notif.severity} variant="filled">{notif.msg}</MuiAlert>
      </Snackbar>
    </Container>
  );
}
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * @typedef {import('../types/opensky-plane').OpenSkyFirstPlane} OpenSkyFirstPlane
 */

/**
 * @param {{
 *   initialLoading: boolean;
 *   trackedIcao24: string;
 *   plane: OpenSkyFirstPlane | null;
 *   lastUpdated: Date | null;
 *   refreshing?: boolean;
 * }} props
 */
export default function OpenSkyPlaneTable({
  initialLoading,
  trackedIcao24,
  plane,
  lastUpdated,
  refreshing = false,
}) {
  if (initialLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={22} />
          <Typography variant="body2" color="text.secondary">
            Loading OpenSky…
          </Typography>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            OpenSky — ICAO24 {trackedIcao24}
          </Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            <code>GET /states/all?icao24={trackedIcao24}</code> via Nest{' '}
            <code>/planes/opensky</code>
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {refreshing && <CircularProgress size={16} />}
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Updated {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
        </Box>
      </Box>
      <TableContainer>
        <Table size="small" aria-label="OpenSky aircraft state">
          <TableHead>
            <TableRow>
              <TableCell>ICAO24</TableCell>
              <TableCell>Callsign</TableCell>
              <TableCell>Country</TableCell>
              <TableCell align="right">Lat</TableCell>
              <TableCell align="right">Lng</TableCell>
              <TableCell align="right">Alt (m)</TableCell>
              <TableCell align="right">Hdg (°)</TableCell>
              <TableCell>On ground</TableCell>
              <TableCell align="right">V (m/s)</TableCell>
              <TableCell align="right">V/s (m/s)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!plane ? (
              <TableRow>
                <TableCell colSpan={10}>
                  <Typography variant="body2" color="text.secondary">
                    No state for this ICAO right now (out of coverage or not
                    transmitting).
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              <TableRow hover>
                <TableCell>{plane.id}</TableCell>
                <TableCell>{plane.callsign}</TableCell>
                <TableCell>{plane.originCountry}</TableCell>
                <TableCell align="right">{plane.lat.toFixed(4)}</TableCell>
                <TableCell align="right">{plane.lng.toFixed(4)}</TableCell>
                <TableCell align="right">
                  {Math.round(plane.altitudeM)}
                </TableCell>
                <TableCell align="right">
                  {Math.round(plane.headingDeg)}
                </TableCell>
                <TableCell>{plane.onGround ? 'Yes' : 'No'}</TableCell>
                <TableCell align="right">
                  {plane.velocityMps != null
                    ? plane.velocityMps.toFixed(1)
                    : '—'}
                </TableCell>
                <TableCell align="right">
                  {plane.verticalRateMps != null
                    ? plane.verticalRateMps.toFixed(1)
                    : '—'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

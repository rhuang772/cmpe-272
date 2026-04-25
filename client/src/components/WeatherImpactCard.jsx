import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';

const LEVEL_TO_SEVERITY = {
  none: 'success',
  low: 'info',
  medium: 'warning',
  high: 'error',
};

/**
 * @param {{
 *   weatherImpact: import('../types/weather-impact').PlaneWeatherImpact | null;
 *   loading: boolean;
 * }} props
 */
export default function WeatherImpactCard({ weatherImpact, loading }) {
  if (loading) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Loading weather impact...
        </Typography>
      </Paper>
    );
  }

  if (!weatherImpact) {
    return (
      <Paper variant="outlined" sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary">
          No weather impact has been computed for this aircraft yet.
        </Typography>
      </Paper>
    );
  }

  const severity = LEVEL_TO_SEVERITY[weatherImpact.impact.level] || 'info';

  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Weather impact
          </Typography>
          <Typography variant="body2" color="text.secondary">
            NOAA active alerts near the current aircraft position.
          </Typography>
        </Box>
        <Chip
          label={weatherImpact.impact.level.toUpperCase()}
          color={severity}
          variant={weatherImpact.impact.level === 'none' ? 'outlined' : 'filled'}
        />
      </Box>

      <Alert severity={severity} sx={{ mb: 2 }}>
        {weatherImpact.impact.summary}
      </Alert>

      <Typography variant="caption" color="text.secondary" component="div">
        Alerts: {weatherImpact.impact.alertCount} | Last checked{' '}
        {new Date(weatherImpact.weatherCheckedAt).toLocaleTimeString()}
      </Typography>

      {weatherImpact.alerts.length > 0 && (
        <List dense disablePadding sx={{ mt: 2 }}>
          {weatherImpact.alerts.map((alert) => (
            <ListItem key={alert.id} disableGutters sx={{ alignItems: 'flex-start' }}>
              <ListItemText
                primary={alert.event}
                secondary={`${alert.severity ?? 'Unknown severity'} | ${alert.urgency ?? 'Unknown urgency'}${alert.areaDesc ? ` | ${alert.areaDesc}` : ''}${alert.headline ? ` | ${alert.headline}` : ''}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
}

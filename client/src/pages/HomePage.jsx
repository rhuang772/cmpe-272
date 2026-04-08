import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Link as RouterLink } from 'react-router-dom';

export default function HomePage() {
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={3} alignItems="flex-start">
        <Typography variant="h3" component="h1" fontWeight={800}>
          Find My Plane
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Open the flight map test page to see the Leaflet + MUI map fed by the
          NestJS backend.
        </Typography>
        <Button
          component={RouterLink}
          to="/flight-map"
          variant="contained"
          size="large"
        >
          Flight map test
        </Button>
      </Stack>
      <Box sx={{ mt: 6, opacity: 0.6 }}>
        <Typography variant="caption">
          API: <code>http://localhost:4000/planes/opensky?icao24=…</code>
        </Typography>
      </Box>
    </Container>
  );
}

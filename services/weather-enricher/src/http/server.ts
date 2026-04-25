import cors from 'cors';
import express from 'express';
import type { OpenSkyFirstPlaneDto } from '../types';
import { WeatherEnricher } from '../weather-enricher';

export function createHttpServer(
  enricher: WeatherEnricher,
  port: number,
): void {
  const app = express();

  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    }),
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/weather-impact', async (req, res) => {
    const icao24 = String(req.query.icao24 ?? '').trim().toLowerCase();
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const fetchedAtRaw = req.query.fetchedAt;
    const fetchedAt =
      typeof fetchedAtRaw === 'string' && fetchedAtRaw.trim() !== ''
        ? Number(fetchedAtRaw)
        : Date.now();

    if (!icao24) {
      res.status(400).json({ message: 'icao24 is required' });
      return;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ message: 'lat and lng must be valid numbers' });
      return;
    }

    const plane: OpenSkyFirstPlaneDto = {
      id: icao24,
      callsign: String(req.query.callsign ?? icao24),
      originCountry: String(req.query.originCountry ?? 'Unknown'),
      lat,
      lng,
      altitudeM: Number(req.query.altitudeM ?? 0),
      headingDeg: Number(req.query.headingDeg ?? 0),
      onGround: String(req.query.onGround ?? 'false') === 'true',
      velocityMps:
        req.query.velocityMps == null ? null : Number(req.query.velocityMps),
      verticalRateMps:
        req.query.verticalRateMps == null
          ? null
          : Number(req.query.verticalRateMps),
      timePosition:
        req.query.timePosition == null ? null : Number(req.query.timePosition),
      lastContact:
        req.query.lastContact == null ? null : Number(req.query.lastContact),
    };

    try {
      const weatherImpact = await enricher.enrichPlane({
        icao24,
        fetchedAt: Number.isFinite(fetchedAt) ? fetchedAt : Date.now(),
        source: 'opensky',
        plane,
      });
      res.json(weatherImpact);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Weather lookup failed';
      res.status(502).json({ message });
    }
  });

  app.listen(port, () => {
    console.log(`Weather enricher HTTP server listening on port ${port}`);
  });
}

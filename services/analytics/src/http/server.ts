import express from 'express';
import cors from 'cors';
import type { OpenSkyFirstPlaneDto } from '../types';
import { computeAnalytics } from '../analytics/compute';

export function createHttpServer(
  planes: Map<string, OpenSkyFirstPlaneDto>,
  port: number,
): void {
  const app = express();

  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    }),
  );

  app.get('/analytics', (_req, res) => {
    const analytics = computeAnalytics(planes);
    res.json(analytics);
  });

  app.listen(port, () => {
    console.log(`Analytics HTTP server listening on port ${port}`);
  });
}

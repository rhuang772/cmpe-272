import type { OpenSkyFirstPlaneDto, PlaneAnalytics } from '../types';

const CATEGORY_LABELS: Record<number, string> = {
  0: 'No info',
  1: 'No ADS-B info',
  2: 'Light',
  3: 'Small',
  4: 'Large',
  5: 'High Vortex Large',
  6: 'Heavy',
  7: 'High Performance',
  8: 'Rotorcraft',
  9: 'Glider',
  10: 'Lighter-than-air',
  11: 'Parachutist',
  12: 'Ultralight',
  13: 'Reserved',
  14: 'UAV',
  15: 'Space vehicle',
  16: 'Emergency vehicle',
  17: 'Service vehicle',
  18: 'Point obstacle',
  19: 'Cluster obstacle',
  20: 'Line obstacle',
};

const ALTITUDE_BUCKETS = [
  { label: '0–1 km', min: 0, max: 1000 },
  { label: '1–3 km', min: 1000, max: 3000 },
  { label: '3–5 km', min: 3000, max: 5000 },
  { label: '5–8 km', min: 5000, max: 8000 },
  { label: '8–10 km', min: 8000, max: 10000 },
  { label: '10–12 km', min: 10000, max: 12000 },
  { label: '12+ km', min: 12000, max: Infinity },
];

const SPEED_BUCKETS = [
  { label: '0–100', min: 0, max: 100 },
  { label: '100–200', min: 100, max: 200 },
  { label: '200–300', min: 200, max: 300 },
  { label: '300–400', min: 300, max: 400 },
  { label: '400–500', min: 400, max: 500 },
  { label: '500–600', min: 500, max: 600 },
  { label: '600–700', min: 600, max: 700 },
  { label: '700–800', min: 700, max: 800 },
  { label: '800+', min: 800, max: Infinity },
];

export function computeAnalytics(
  planes: Map<string, OpenSkyFirstPlaneDto>,
): PlaneAnalytics {
  let totalAirborne = 0;
  let totalOnGround = 0;
  let ascending = 0;
  let descending = 0;
  let cruising = 0;

  const countryCounts = new Map<string, number>();
  const altCounts = new Array(ALTITUDE_BUCKETS.length).fill(0) as number[];
  const speedCounts = new Array(SPEED_BUCKETS.length).fill(0) as number[];
  const catCounts = new Map<string, number>();
  const heatmapPoints: [number, number][] = [];

  for (const plane of planes.values()) {
    if (plane.onGround) {
      totalOnGround++;
    } else {
      totalAirborne++;

      if (plane.verticalRateMps != null) {
        if (plane.verticalRateMps > 0.5) ascending++;
        else if (plane.verticalRateMps < -0.5) descending++;
        else cruising++;
      } else {
        cruising++;
      }
    }

    // Country
    const country = plane.originCountry || 'Unknown';
    countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);

    // Altitude (only airborne planes)
    if (!plane.onGround && plane.altitudeM > 0) {
      for (let i = 0; i < ALTITUDE_BUCKETS.length; i++) {
        if (
          plane.altitudeM >= ALTITUDE_BUCKETS[i].min &&
          plane.altitudeM < ALTITUDE_BUCKETS[i].max
        ) {
          altCounts[i]++;
          break;
        }
      }
    }

    // Speed (convert m/s to km/h)
    if (plane.velocityMps != null) {
      const kmh = plane.velocityMps * 3.6;
      for (let i = 0; i < SPEED_BUCKETS.length; i++) {
        if (kmh >= SPEED_BUCKETS[i].min && kmh < SPEED_BUCKETS[i].max) {
          speedCounts[i]++;
          break;
        }
      }
    }

    // Category
    const catLabel =
      plane.category != null
        ? (CATEGORY_LABELS[plane.category] ?? `Unknown (${plane.category})`)
        : 'No info';
    catCounts.set(catLabel, (catCounts.get(catLabel) ?? 0) + 1);

    // Heatmap
    heatmapPoints.push([plane.lat, plane.lng]);
  }

  const countryBreakdown = [...countryCounts.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  const altitudeHistogram = ALTITUDE_BUCKETS.map((b, i) => ({
    bucket: b.label,
    count: altCounts[i],
  }));

  const speedHistogram = SPEED_BUCKETS.map((b, i) => ({
    bucket: `${b.label} km/h`,
    count: speedCounts[i],
  }));

  const categoryBreakdown = [...catCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const gridCounts = new Map<string, number>();
  for (const [lat, lng] of heatmapPoints) {
    const key = `${Math.floor(lat)},${Math.floor(lng)}`;
    gridCounts.set(key, (gridCounts.get(key) ?? 0) + 1);
  }
  let heatmapMax = 0;
  for (const count of gridCounts.values()) {
    if (count > heatmapMax) heatmapMax = count;
  }

  return {
    totalAirborne,
    totalOnGround,
    ascending,
    descending,
    cruising,
    countryBreakdown,
    altitudeHistogram,
    speedHistogram,
    categoryBreakdown,
    heatmapPoints,
    heatmapMax,
  };
}

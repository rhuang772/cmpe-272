import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

/**
 * Renders a heatmap layer on the parent Leaflet map.
 * @param {{ points: [number, number][] }} props
 */
export default function HeatmapLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const heat = L.heatLayer(points, {
      radius: 12,
      blur: 15,
      maxZoom: 10,
      max: 1.0,
      gradient: {
        0.2: '#064e8a',
        0.4: '#1a8cff',
        0.6: '#4dd0e1',
        0.8: '#ffd54f',
        1.0: '#ff6f00',
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heat);
    };
  }, [map, points]);

  return null;
}

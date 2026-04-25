import type { WeatherAlertSummary } from "../types";

const SEATTLE_AREA = {
  minLat: 47.3,
  maxLat: 47.8,
  minLng: -122.9,
  maxLng: -122.15,
};

export function isInSeattleDemoArea(lat: number, lng: number): boolean {
  return (
    lat >= SEATTLE_AREA.minLat &&
    lat <= SEATTLE_AREA.maxLat &&
    lng >= SEATTLE_AREA.minLng &&
    lng <= SEATTLE_AREA.maxLng
  );
}

export function createSeattleThunderstormAlert(): WeatherAlertSummary {
  return {
    id: "demo-seattle-thunderstorm",
    event: "Severe Thunderstorm Warning",
    severity: "Severe",
    urgency: "Immediate",
    certainty: "Likely",
    headline: "Demo thunderstorm cell impacting Seattle metro airspace.",
    areaDesc: "Seattle metro area",
  };
}

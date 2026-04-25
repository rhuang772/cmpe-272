/**
 * @typedef {'none' | 'low' | 'medium' | 'high'} WeatherImpactLevel
 */

/**
 * @typedef {{
 *   id: string;
 *   event: string;
 *   severity: string | null;
 *   urgency: string | null;
 *   certainty: string | null;
 *   headline: string | null;
 *   areaDesc: string | null;
 * }} WeatherAlert
 */

/**
 * @typedef {{
 *   level: WeatherImpactLevel;
 *   summary: string;
 *   alertCount: number;
 * }} WeatherImpactSummary
 */

/**
 * @typedef {{
 *   icao24: string;
 *   fetchedAt: number;
 *   weatherCheckedAt: number;
 *   source: 'noaa-alerts';
 *   location: {
 *     lat: number;
 *     lng: number;
 *   };
 *   impact: WeatherImpactSummary;
 *   alerts: WeatherAlert[];
 * }} PlaneWeatherImpact
 */

export {};

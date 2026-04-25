import type {
  WeatherAlertSummary,
  WeatherImpactLevel,
  WeatherImpactPayload,
} from '../types';

const HIGH_EVENTS = new Set([
  'Tornado Warning',
  'Severe Thunderstorm Warning',
  'Flash Flood Warning',
  'Hurricane Warning',
  'Tsunami Warning',
]);

const MEDIUM_EVENTS = new Set([
  'Dense Fog Advisory',
  'Wind Advisory',
  'Winter Weather Advisory',
  'Flood Advisory',
  'Heat Advisory',
]);

function levelForAlert(alert: WeatherAlertSummary): WeatherImpactLevel {
  if (HIGH_EVENTS.has(alert.event)) return 'high';
  if (MEDIUM_EVENTS.has(alert.event)) return 'medium';

  switch ((alert.severity ?? '').toLowerCase()) {
    case 'extreme':
    case 'severe':
      return 'high';
    case 'moderate':
      return 'medium';
    case 'minor':
      return 'low';
    default:
      return 'low';
  }
}

function rank(level: WeatherImpactLevel): number {
  switch (level) {
    case 'high':
      return 3;
    case 'medium':
      return 2;
    case 'low':
      return 1;
    default:
      return 0;
  }
}

export function calculateImpact(
  alerts: WeatherAlertSummary[],
): WeatherImpactPayload {
  if (alerts.length === 0) {
    return {
      level: 'none',
      summary: 'No active NOAA weather alerts near the aircraft position.',
      alertCount: 0,
    };
  }

  let highestLevel: WeatherImpactLevel = 'none';
  for (const alert of alerts) {
    const level = levelForAlert(alert);
    if (rank(level) > rank(highestLevel)) {
      highestLevel = level;
    }
  }

  const topAlert = alerts[0];
  const summaryPrefix =
    highestLevel === 'high'
      ? 'High weather impact'
      : highestLevel === 'medium'
        ? 'Moderate weather impact'
        : 'Low weather impact';

  return {
    level: highestLevel,
    summary: `${summaryPrefix}: ${topAlert.event}${alerts.length > 1 ? ` plus ${alerts.length - 1} additional active alert${alerts.length > 2 ? 's' : ''}` : ''}.`,
    alertCount: alerts.length,
  };
}

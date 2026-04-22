const apiBase = () => {
  const raw = import.meta.env.VITE_API_URL;
  if (raw == null || raw === '') return '/api';
  return String(raw).replace(/\/$/, '');
};

/**
 * @param {string} icao24 Normalized 6-char lowercase hex
 * @returns {Promise<{ plane: import('../types/opensky-plane').OpenSkyFirstPlane | null }>}
 */
export async function fetchOpenSkyPlane(icao24) {
  const params = new URLSearchParams({ icao24 });
  const res = await fetch(`${apiBase()}/planes/opensky?${params.toString()}`);
  if (!res.ok) {
    const errText = await res.text();
    let msg = `Request failed: ${res.status}`;
    try {
      const j = JSON.parse(errText);
      if (j.message) msg = Array.isArray(j.message) ? j.message[0] : j.message;
    } catch {
      if (errText) msg = errText.slice(0, 120);
    }
    throw new Error(msg);
  }
  return res.json();
}

/**
 * Fetches aggregated analytics from the analytics microservice.
 * @returns {Promise<import('../types/opensky-plane').PlaneAnalytics>}
 */
export async function fetchAnalytics() {
  const res = await fetch('/analytics-api/analytics');
  if (!res.ok) {
    throw new Error(`Analytics request failed: ${res.status}`);
  }
  return res.json();
}

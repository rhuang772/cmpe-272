/**
 * @param {string} input
 * @returns {string | null} Lowercase 6-char hex or null
 */
export function normalizeIcao24(input) {
  const s = String(input).trim().toLowerCase().replace(/^0x/i, '');
  if (!/^[0-9a-f]{6}$/.test(s)) return null;
  return s;
}

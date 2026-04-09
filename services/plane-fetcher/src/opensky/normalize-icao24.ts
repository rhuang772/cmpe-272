export function normalizeIcao24(raw: string): string | null {
  const s = raw.trim().toLowerCase().replace(/^0x/i, '');
  if (!/^[0-9a-f]{6}$/.test(s)) {
    return null;
  }
  return s;
}

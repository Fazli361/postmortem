/**
 * Anonymous Browser Identifier
 * Used solely as an additional local anti-duplicate barrier.
 * Strictly NO device fingerprinting, NO IP address, NO hardware info, NO geolocation, NO user identity.
 * Strictly NEVER stored with or linked to the anonymous feedback response.
 */
const STORAGE_KEY = 'suara_urusetia_anon_bid';

export function getAnonymousBrowserId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = 'bid-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    return 'temp-' + Math.random().toString(36).substring(2, 10);
  }
}

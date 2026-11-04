/**
 * SMART ROUTE — Google Maps Configuration
 */

function resolveApiKey() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAPS_KEY) {
    return import.meta.env.VITE_GOOGLE_MAPS_KEY;
  }
  if (typeof process !== 'undefined' && process.env && process.env.GOOGLE_MAPS_API_KEY) {
    return process.env.GOOGLE_MAPS_API_KEY;
  }
  if (typeof window !== 'undefined' && window.__GOOGLE_MAPS_API_KEY__) {
    return window.__GOOGLE_MAPS_API_KEY__;
  }
  return '';
}

function resolveMapId() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_MAP_ID) {
    return import.meta.env.VITE_GOOGLE_MAP_ID;
  }
  if (typeof process !== 'undefined' && process.env && process.env.GOOGLE_MAP_ID) {
    return process.env.GOOGLE_MAP_ID;
  }
  return null;
}

export const GOOGLE_MAPS_CONFIG = {
  get apiKey() {
    return resolveApiKey();
  },
  libraries: ['places', 'geometry', 'directions'],
  defaultCenter: { lat: 12.9716, lng: 77.5946 },
  defaultZoom: 7,
  get mapId() {
    return resolveMapId();
  },
};

export function isGoogleMapsConfigured(key = GOOGLE_MAPS_CONFIG.apiKey) {
  const effectiveKey = key || resolveApiKey();
  return Boolean(
    effectiveKey &&
    effectiveKey !== 'your_google_maps_api_key_here' &&
    effectiveKey.trim().length > 10
  );
}

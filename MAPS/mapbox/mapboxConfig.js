/**
 * SMART ROUTE — Mapbox Configuration
 */

export const MAPBOX_CONFIG = {
  accessToken: process.env.MAPBOX_ACCESS_TOKEN || '',
  style: 'mapbox://styles/mapbox/navigation-day-v1',
  defaultCenter: [77.5946, 12.9716], // [lng, lat] for Mapbox
  defaultZoom: 7,
};

export function isMapboxConfigured() {
  return Boolean(
    MAPBOX_CONFIG.accessToken &&
    MAPBOX_CONFIG.accessToken !== 'your_mapbox_token_here'
  );
}

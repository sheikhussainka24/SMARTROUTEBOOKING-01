/**
 * SMART ROUTE — Leaflet Configuration & Tile Providers
 * Free, open-source OpenStreetMap tiles for development and staging.
 */

export const LEAFLET_CONFIG = {
  tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  defaultCenter: [12.9716, 77.5946], // Bangalore center
  defaultZoom: 7,
  maxZoom: 19,
  minZoom: 4,
};

export const MARKER_ICONS = {
  busIconUrl: '/markers/bus-marker.svg',
  boardingIconUrl: '/markers/boarding-marker.svg',
  droppingIconUrl: '/markers/dropping-marker.svg',
  stopIconUrl: '/markers/stop-marker.svg',
};

# SMART ROUTE — Map Provider Abstraction Guide

## Zero Static Maps Policy
Static map screenshots or fake CSS road sketches are prohibited. All maps are interactive, road-accurate maps rendered via standard WebGL or Leaflet canvas.

## Supported Providers
1. **Leaflet / OpenStreetMap**: Zero-cost, zero-API-key default for local development and integration testing.
2. **Google Maps JavaScript API**: High precision, road traffic layer, Advanced Markers for production.
3. **Mapbox GL JS**: Vector tile styling, customized night/day navigation maps.

## Switching Providers
Change `MAP_PROVIDER` in `.env`:
```bash
# Development
MAP_PROVIDER=leaflet

# Production (Google Maps)
MAP_PROVIDER=google
GOOGLE_MAPS_API_KEY=AIzaSy...

# Production (Mapbox)
MAP_PROVIDER=mapbox
MAPBOX_ACCESS_TOKEN=pk.eyJ1...
```

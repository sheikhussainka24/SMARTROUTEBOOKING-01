# SMART ROUTE — MAP SYSTEM

Interactive map abstraction supporting Leaflet / OpenStreetMap (free development mode) and Google Maps / Mapbox (production enterprise mode).

## Structure

```
MAPS/
├── providers/   # Map provider interface & provider factory
├── leaflet/     # OpenStreetMap tile config & Leaflet setup
├── google/      # Google Maps Directions & Marker configuration
├── mapbox/      # Mapbox GL JS configuration
├── routes/      # Polyline parsing, stop distance, and ETA calculations
└── README.md
```

## Features

- Real road polylines
- Boarding / Dropping point markers
- Live moving bus marker with direction heading
- Stop-by-stop progress tracking
- Zero static/fake screenshot maps

# SMART ROUTE — REAL-TIME WEBSOCKET SUBSYSTEM

Socket.IO real-time architecture for low-latency driver GPS telemetry broadcast, live passenger map synchronization, and multi-user seat lock concurrency updates.

## Architecture

```
Driver Mobile/Device GPS
       ↓ (WebSocket / REST fallback)
  BACKEND / REALTIME
       ↓ (Room broadcast)
  trip_${tripId} Room
       ↓
  Passenger Live Map View
```

## Directory Structure

```
REALTIME/
├── socket/      # Socket.IO connection manager & lifecycle
├── events/      # Canonical event name constants
├── rooms/       # Tenant and trip room isolation
├── gps/         # GPS validation, filtering & speed calculations
└── README.md
```

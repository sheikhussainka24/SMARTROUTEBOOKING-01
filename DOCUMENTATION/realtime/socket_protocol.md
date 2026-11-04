

# SMART ROUTE — Socket.IO Real-Time Protocol

## Event Lifecycle

### Driver GPS Broadcast
```
[Driver Device] 
   ── emit('driver_gps_update', { tripId, latitude, longitude, speed, heading }) ──>
[Backend Socket Server]
   ── write to db('gps_telemetry')
   ── io.to('trip_' + tripId).emit('bus_location_updated', { latitude, longitude, speed, heading })
[Passenger Browser]
   ── Marker moves smoothly along road polyline
```

### Multi-User Seat Hold Synchronization
```
[User A locks seat 14-L]
   ── emit('seat_locked_notify', { tripId, seatIds: ['...'], lockedUntil })
   ── Broadcast to other users viewing same trip
   ── Seat turns yellow/grey with "Held" status on User B's screen
```

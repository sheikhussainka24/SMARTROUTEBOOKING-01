# SMART ROUTE — Database Schema & ER Guide

## Normalized Relational Architecture
The database is structured around high-concurrency relational safety in PostgreSQL:

1. **`users`**: Base identity records with bcrypt password hashes, OTP salts, lock counters.
2. **`travels`**: Fleet operator profiles and legal business metadata.
3. **`travel_staff`**: Granular assignments mapping users to operator roles and JSONB permission arrays.
4. **`buses`**: Physical chassis and body specs (TATA chassis, Prakash body, 2+1 layout).
5. **`bus_seats`**: Accurate physical seats with deck enum (`lower`, `upper`), window/aisle flags.
6. **`routes` & `route_stops`**: Ordered sequence of stops (`stop_order`) with latitude/longitude.
7. **`trips`**: Concrete schedules combining route, bus, primary driver, and base fares.
8. **`seat_locks`**: High-concurrency lock table with `locked_until` timestamps.
9. **`bookings` & `booking_passengers`**: PNR generation, passenger details, boarding flags.
10. **`payments`**: Razorpay gateway orders, payment IDs, and signatures.
11. **`gps_telemetry`**: Time-series coordinates emitted by driver hardware.
12. **`audit_logs`**: Immutable forensic log of all administrative actions.

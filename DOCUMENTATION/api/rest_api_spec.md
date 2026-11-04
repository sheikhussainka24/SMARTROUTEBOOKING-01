# SMART ROUTE — REST API Specification

## Base URL
`/api`

## Core Endpoint Catalog

### Authentication (`/api/auth`)
- `POST /register`: Register user (Passenger, Operator, Staff)
- `POST /login`: Universal passenger login
- `POST /driver-login`: Dedicated driver login (blocks unapproved drivers)
- `POST /owner-login`: Travel owner login
- `POST /manager-login`: Fleet manager login
- `POST /admin-login`: Super Admin login
- `POST /otp/send`: Request SMS OTP
- `POST /otp/verify`: Verify SMS OTP
- `POST /refresh-token`: Rotate refresh token
- `POST /logout`: Invalidate session

### Trips (`/api/trips`)
- `GET /search?fromCity=...&toCity=...&date=...`: Search published trips with available seat inventory
- `GET /:tripId`: Get comprehensive trip details, stops, fares
- `GET /:tripId/stops`: Get all boarding and dropping points with orders
- `POST /`: Schedule new trip (Owner/Manager)
- `PUT /:tripId`: Update trip details

### Seats & Concurrency (`/api/seats`)
- `GET /trip/:tripId`: Retrieve real-time 2+1 physical seat map (Lower/Upper decks)
- `POST /lock`: Transactionally hold seats for 10 minutes (`FOR UPDATE`)
- `POST /release`: Release temporary hold immediately

### Bookings (`/api/bookings`)
- `POST /`: Finalize booking and generate PNR
- `GET /pnr/:pnr`: Fetch ticket details with PNR and QR
- `GET /my-bookings`: Passenger journey history
- `POST /verify-qr`: Verify passenger boarding via QR code (Driver/Staff)

### Driver Operations (`/api/driver`)
- `GET /current-trip`: Active assigned trip
- `GET /trip/:tripId/passengers`: Passenger boarding manifest chart
- `POST /passenger/boarding`: Mark passenger boarded
- `POST /location`: Ingest live GPS coordinates
- `POST /trip/:tripId/advance-stop`: Update current stop

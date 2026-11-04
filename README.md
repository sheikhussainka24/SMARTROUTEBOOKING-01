# SMART ROUTE — Real-Time Bus Booking & Travel Operations Platform

SMART ROUTE is a production-grade, real-time private bus booking and fleet operations platform engineered for private travel operators in India.

## Top-Level System Architecture

```
SMART ROUTE/
├── FRONTEND/        # React + Vite client, physical 2+1 bus seat layouts, role dashboards
├── BACKEND/         # Node.js + Express REST API, Knex, JWT/OTP auth, Socket.IO
├── DATABASE/        # PostgreSQL schema, Knex migrations, seeds, queries, indexes
├── AI/              # Google Gemini AI assistant, prompts, agents, voice IVR integration
├── REALTIME/        # Socket.IO telemetry, driver GPS ingestion, seat lock concurrency
├── MAPS/            # Interactive maps abstraction (Leaflet / Google Maps / Mapbox)
├── PAYMENTS/        # Razorpay integration layer, signature verification, webhooks
├── NOTIFICATIONS/   # Email (SMTP), SMS Gateway (Twilio), Web Push (VAPID)
├── DOCUMENTATION/   # In-depth architectural guides, API specs, database ER schemas
├── TESTS/           # Unit, integration, concurrency, and RBAC test suites
├── .env.example     # Master environment configuration template
├── .gitignore       # Version control exclusions
└── README.md        # Master system overview
```

## Role Hierarchy & Dashboards

```
SUPER ADMIN / FOUNDER
        ↓
   TRAVEL OWNER
        ↓
     MANAGER
        ↓
  DRIVER / STAFF

PASSENGER (Independent customer role)
```

Each role has an independent dashboard and login flow:
- **Passenger**: Search routes, view 2+1 coach layouts, book seats, live map tracking
- **Driver**: Assigned trip view, passenger boarding manifest checklist, GPS broadcasting
- **Manager**: Route configuration, trip dispatching, fleet management
- **Travel Owner**: Fleet registration, business metrics, driver/staff approval
- **Super Admin**: Platform-wide aggregate audit, manual travel operator verification

## Physical Indian Bus Specification

- **Chassis & Body**: TATA chassis + Capella coach body
- **Layout**: 2+1 AC Seat-cum-Sleeper
- **Cockpit**: Driver steering on the RIGHT, entrance/stairs on driver's LEFT
- **Lower Deck**: 24 seats + 6 sleepers
- **Upper Deck**: 18 sleepers

## Getting Started

### 1. Database Setup
Ensure PostgreSQL is running and configure `.env` from `.env.example`:
```bash
# Run migrations and seeds
npm run migrate --prefix BACKEND
npm run seed --prefix BACKEND
```

### 2. Backend Setup
```bash
cd BACKEND
npm install
npm run dev
```

### 3. Frontend Setup
```bash
cd FRONTEND
npm install
npm run dev
```

## Security & Concurrency Principles
- Concurrency-safe seat locks with pessimistic transactions (`FOR UPDATE`) preventing race conditions.
- Zero fake functionality: Real interactive maps, real database models, real WebSocket telemetry.
- External credentials (Gemini, Razorpay, Twilio, SMTP) managed via `.env`.

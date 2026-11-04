# SMART ROUTE — BACKEND ARCHITECTURE

Production Node.js & Express REST API and Real-Time WebSocket backend for the SMART ROUTE platform.

## Directory Structure

```
BACKEND/
├── src/
│   ├── controllers/      # Route controllers (Auth, Trip, Seat, Booking, Driver, Owner, Admin)
│   ├── routes/           # Express router endpoints
│   ├── services/         # Business logic & audit logging
│   ├── middleware/       # Authentication, validation, error handling
│   ├── models/           # Domain data models
│   ├── validators/       # Request input schema validators
│   ├── utils/            # Helper utilities
│   ├── config/           # Configuration, DB connection, logger
│   ├── auth/             # Token service, OTP service, password policy
│   ├── permissions/      # Role hierarchy and granular permissions
│   ├── realtime/         # Socket.IO telemetry and seat locking
│   ├── ai/               # Gemini AI assistant integration layer
│   ├── payments/         # Razorpay gateway integration
│   ├── notifications/    # Email (SMTP), SMS (Twilio), Web Push
│   └── server.js         # Production server entry point
├── tests/                # Unit and integration test suites
├── package.json          # Dependencies & scripts
└── README.md
```

## Running the Server

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run migrations
npm run migrate

# Run tests
npm test
```

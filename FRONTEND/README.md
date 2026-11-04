# SMART ROUTE — FRONTEND APPLICATION

Modern React 18 + Vite client for passenger booking, interactive bus seat selection, live GPS telemetry map tracking, and role-segregated operations consoles (Driver, Manager, Owner, Super Admin).

## Architecture

- **React 18 + Vite**: Instant hot module replacement and optimized bundle size
- **Physical Indian Bus Layout**: 2+1 AC Seat/Cum/Sleeper with accurate cockpit (driver right, stairs left), lower deck (24 seats + 6 sleepers) and upper deck (18 sleepers)
- **Zero Fake Maps**: Interactive Leaflet / OpenStreetMap maps with live moving markers via Socket.IO
- **Role Isolation**: Dedicated protected portals for Super Admin, Travel Owner, Fleet Manager, Driver, and Staff
- **Security**: Zero backend secrets or DB credentials exposed in frontend

## Running Locally

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# Build for production
npm run build
```

# SMART ROUTE — DATABASE ARCHITECTURE

This folder encapsulates all PostgreSQL schema definitions, Knex migrations, seed datasets, specialized queries, functions, and performance indexes for the SMART ROUTE platform.

## Directory Structure

```
DATABASE/
├── migrations/          # Knex schema migrations with versioning
├── seeds/               # Development and test seed datasets
├── schema/              # Raw PostgreSQL DDL (schema.sql)
├── queries/             # Optimized parameterized SQL queries
├── functions/           # Stored functions and triggers
├── indexes/             # Performance index definitions
├── config/              # Knex and DB connection configurations
└── README.md            # This documentation
```

## Running Migrations and Seeds

```bash
# From DATABASE or BACKEND
npm run migrate
npm run seed
```

## Key Architectural Principles

1. **Multi-Tenant Isolation**: Every travel operator data belongs to a unique `travel_id`. Data cannot leak across operators.
2. **Physical Indian Bus Layout**: Supports 2+1 AC Seat-cum-Sleeper buses (24 seats + 6 lower sleepers, 18 upper sleepers, driver seat on the right, front entry on driver's left).
3. **Route Segment Concurrency**: Prevents race conditions and double bookings on intermediate stops using strict transactional seat locking (`seat_locks` table) with timed expiration.
4. **Auditability**: Every mutation logs into `audit_logs` tracking IP, user, and action.

-- ============================================================
-- SMART ROUTE — PRODUCTION POSTGRESQL DATABASE SCHEMA
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Custom Enum Types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'super_admin', 'travel_owner', 'manager', 'staff', 'driver', 'passenger'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE account_status AS ENUM (
    'pending', 'active', 'suspended', 'rejected', 'deactivated'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM (
    'unverified', 'pending', 'verified', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE bus_type AS ENUM (
    'ac_seater', 'non_ac_seater', 'ac_sleeper', 'non_ac_sleeper',
    'ac_seat_cum_sleeper', 'non_ac_seat_cum_sleeper'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE seat_type AS ENUM ('seat', 'sleeper', 'semi_sleeper');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE seat_status AS ENUM (
    'available', 'selected', 'held', 'booked', 'disabled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE deck_type AS ENUM ('lower', 'upper');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE trip_status AS ENUM (
    'draft', 'published', 'boarding', 'in_transit', 'completed', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending', 'confirmed', 'cancelled', 'completed', 'refunded', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'created', 'authorized', 'captured', 'refunded', 'failed'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  mobile VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  role user_role NOT NULL DEFAULT 'passenger',
  status account_status NOT NULL DEFAULT 'active',
  verification_status verification_status NOT NULL DEFAULT 'unverified',
  email_verified BOOLEAN DEFAULT FALSE,
  mobile_verified BOOLEAN DEFAULT FALSE,
  avatar_url TEXT,
  refresh_token_hash VARCHAR(255),
  otp_code VARCHAR(10),
  otp_expires_at TIMESTAMPTZ,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Travels (Tenants)
CREATE TABLE IF NOT EXISTS travels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  registration_number VARCHAR(100),
  gst_number VARCHAR(50),
  official_website VARCHAR(255),
  support_email VARCHAR(255),
  support_phone VARCHAR(20),
  logo_url TEXT,
  banner_url TEXT,
  address JSONB,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  status account_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Travel Staff & Driver Profiles
CREATE TABLE IF NOT EXISTS travel_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID NOT NULL REFERENCES travels(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  department VARCHAR(100),
  permissions JSONB DEFAULT '[]',
  status account_status NOT NULL DEFAULT 'pending',
  license_number VARCHAR(100),
  license_expiry DATE,
  experience_years INT,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(travel_id, user_id)
);

-- 4. Buses
CREATE TABLE IF NOT EXISTS buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID NOT NULL REFERENCES travels(id) ON DELETE CASCADE,
  bus_number VARCHAR(50) NOT NULL,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  chassis_brand VARCHAR(100) NOT NULL DEFAULT 'TATA',
  body_builder VARCHAR(100) NOT NULL DEFAULT 'Prakash',
  bus_type bus_type NOT NULL DEFAULT 'ac_seat_cum_sleeper',
  layout_type VARCHAR(50) NOT NULL DEFAULT '2+1',
  total_lower_seats INT NOT NULL DEFAULT 24,
  total_lower_sleepers INT NOT NULL DEFAULT 6,
  total_upper_sleepers INT NOT NULL DEFAULT 18,
  total_capacity INT NOT NULL DEFAULT 48,
  has_wifi BOOLEAN DEFAULT TRUE,
  has_charging_point BOOLEAN DEFAULT TRUE,
  has_reading_light BOOLEAN DEFAULT TRUE,
  has_emergency_exit BOOLEAN DEFAULT TRUE,
  has_cctv BOOLEAN DEFAULT TRUE,
  has_gps BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bus Layout Decks and Physical Seats
CREATE TABLE IF NOT EXISTS bus_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  deck deck_type NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  seat_type seat_type NOT NULL,
  row_num INT NOT NULL,
  col_num INT NOT NULL,
  is_window BOOLEAN DEFAULT FALSE,
  is_aisle BOOLEAN DEFAULT FALSE,
  is_ladies_preferred BOOLEAN DEFAULT FALSE,
  base_price_factor NUMERIC(4,2) DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(bus_id, deck, seat_number)
);

-- 6. Routes & Stops
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID NOT NULL REFERENCES travels(id) ON DELETE CASCADE,
  source_city VARCHAR(100) NOT NULL,
  destination_city VARCHAR(100) NOT NULL,
  distance_km NUMERIC(8,2) NOT NULL,
  estimated_duration_mins INT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  stop_order INT NOT NULL,
  latitude NUMERIC(10,8),
  longitude NUMERIC(11,8),
  address TEXT,
  landmark TEXT,
  duration_from_origin_mins INT NOT NULL DEFAULT 0,
  is_boarding_point BOOLEAN DEFAULT TRUE,
  is_dropping_point BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(route_id, stop_order)
);

-- 7. Trips
CREATE TABLE IF NOT EXISTS trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID NOT NULL REFERENCES travels(id) ON DELETE CASCADE,
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
  primary_driver_id UUID REFERENCES users(id),
  departure_time TIMESTAMPTZ NOT NULL,
  arrival_time TIMESTAMPTZ NOT NULL,
  base_seat_fare NUMERIC(10,2) NOT NULL,
  base_sleeper_fare NUMERIC(10,2) NOT NULL,
  status trip_status NOT NULL DEFAULT 'published',
  current_stop_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Seat Inventory Locks (Transaction Safe)
CREATE TABLE IF NOT EXISTS seat_locks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  bus_seat_id UUID NOT NULL REFERENCES bus_seats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  session_id VARCHAR(100) NOT NULL,
  from_stop_order INT NOT NULL,
  to_stop_order INT NOT NULL,
  locked_until TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'locked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Bookings & Passengers
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pnr_number VARCHAR(20) UNIQUE NOT NULL,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  boarding_stop_id UUID NOT NULL REFERENCES route_stops(id),
  dropping_stop_id UUID NOT NULL REFERENCES route_stops(id),
  total_fare NUMERIC(10,2) NOT NULL,
  gst_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status booking_status NOT NULL DEFAULT 'pending',
  qr_code TEXT,
  passenger_contact JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS booking_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  bus_seat_id UUID NOT NULL REFERENCES bus_seats(id),
  name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(10) NOT NULL,
  seat_number VARCHAR(10) NOT NULL,
  seat_fare NUMERIC(10,2) NOT NULL,
  is_boarded BOOLEAN DEFAULT FALSE,
  boarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Payments & Refunds
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  order_id VARCHAR(100) NOT NULL,
  payment_id VARCHAR(100),
  signature VARCHAR(255),
  amount NUMERIC(10,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  status payment_status NOT NULL DEFAULT 'created',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. GPS Telemetry & Live Tracking
CREATE TABLE IF NOT EXISTS gps_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES users(id),
  latitude NUMERIC(10,8) NOT NULL,
  longitude NUMERIC(11,8) NOT NULL,
  speed NUMERIC(6,2) DEFAULT 0,
  heading NUMERIC(5,2) DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_id UUID REFERENCES travels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

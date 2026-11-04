# SMART ROUTE — Operator & Passenger Lifecycle Workflows

## 1. Travel Operator Onboarding
1. Travel Owner registers with legal business name, GST number, and website.
2. Account status set to `pending`.
3. Super Admin inspects business documentation and approves travel.
4. Travel Owner gains access to fleet, driver, manager, and route configuration.

## 2. Driver Onboarding & Dispatch
1. Driver registers via mobile/email.
2. Account status set to `pending` (Driver has zero dashboard access).
3. Travel Owner or Fleet Manager verifies commercial driving license and approves driver.
4. Driver is assigned to a scheduled trip.
5. On trip day, Driver logs in, views boarding passenger manifest, emits GPS telemetry, and scans passenger QR tickets.

## 3. Passenger Booking Lifecycle
1. Passenger searches route (e.g. Bangalore -> Chennai).
2. Passenger selects physical seat/sleeper from accurate 2+1 bus layout (Lower/Upper deck).
3. Backend acquires 10-minute pessimistic hold lock.
4. Passenger fills details and completes Razorpay payment.
5. PNR generated with cryptographic QR code, ticket email, and SMS confirmation.
6. Passenger tracks bus live on interactive map.

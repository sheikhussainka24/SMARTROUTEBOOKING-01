import {
  getBookingStatus,
  getPassengerTripDetails,
  getBusLocationAndETA,
  getBoardingAndDroppingDetails,
  getNextRouteStop,
  getDriverBoardingManifest,
  verifyBookingOwnership,
} from '../../BACKEND/src/services/voiceAssistantService.js';
import {
  setTripTelemetry,
  primaryTripId,
  driver1Id,
  driver2Id,
  passenger1Id,
  passenger2Id,
  ownerId,
  superAdminId,
  smartRouteTravelId,
  veeVeeTravelId,
} from '../../BACKEND/src/services/dataStore.js';

describe('SMART ROUTE AI Voice — Backend Tools & Security Permissions', () => {
  const verifiedPnr = 'SR4102';
  const passengerUser = { id: passenger1Id, role: 'passenger' };
  const unauthorizedUser = { id: passenger2Id, role: 'passenger' };
  const driverUser = { id: driver1Id, role: 'driver' };
  const unassignedDriver = { id: driver2Id, role: 'driver' };
  const ownerUser = { id: ownerId, role: 'travel_owner', travel_id: smartRouteTravelId };
  const otherOwnerUser = { id: 'usr-owner-other', role: 'travel_owner', travel_id: veeVeeTravelId };
  const adminUser = { id: superAdminId, role: 'super_admin' };

  describe('1. getBookingStatus Tool & Ownership Verification', () => {
    test('allows passenger to view their own booking status', async () => {
      const res = await getBookingStatus({ pnr: verifiedPnr, user: passengerUser });
      expect(res.success).toBe(true);
      expect(res.data.pnr).toBe(verifiedPnr);
      expect(res.data.status).toBe('confirmed');
      expect(res.data.source).toBeDefined();
      expect(res.data.destination).toBeDefined();
    });

    test('allows caller with matching mobile number (last 4 or 10 digits) to view status', async () => {
      const res = await getBookingStatus({ pnr: verifiedPnr, mobile: '9000000006' });
      expect(res.success).toBe(true);
      expect(res.data.pnr).toBe(verifiedPnr);
    });

    test('rejects unauthorized passenger guessing a valid PNR without matching mobile', async () => {
      const res = await getBookingStatus({ pnr: verifiedPnr, user: unauthorizedUser, mobile: '9888888888' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('UNAUTHORIZED');
      expect(res.requiresVerification).toBe(true);
    });

    test('handles missing or non-existent PNR gracefully', async () => {
      const res = await getBookingStatus({ pnr: 'SR999999', user: passengerUser });
      expect(res.success).toBe(false);
      expect(res.error).toBe('BOOKING_NOT_FOUND');
    });

    test('allows Travel Owner to view bookings belonging to their company only', async () => {
      const ownerRes = await getBookingStatus({ pnr: verifiedPnr, user: ownerUser });
      expect(ownerRes.success).toBe(true);

      const otherOwnerRes = await getBookingStatus({ pnr: verifiedPnr, user: otherOwnerUser });
      expect(otherOwnerRes.success).toBe(false);
      expect(otherOwnerRes.error).toBe('UNAUTHORIZED');
    });

    test('allows Super Admin full operational oversight', async () => {
      const adminRes = await getBookingStatus({ pnr: verifiedPnr, user: adminUser });
      expect(adminRes.success).toBe(true);
    });
  });

  describe('2. getPassengerTripDetails Tool', () => {
    test('returns confirmed seat numbers and amenities for verified passenger', async () => {
      const res = await getPassengerTripDetails({ pnr: verifiedPnr, user: passengerUser });
      expect(res.success).toBe(true);
      expect(res.data.seatNumbers).toBeDefined();
      expect(res.data.passengers.length).toBeGreaterThan(0);
      expect(res.data.amenities).toContain('WiFi');
    });

    test('rejects unverified caller requesting trip seat details', async () => {
      const res = await getPassengerTripDetails({ pnr: verifiedPnr, mobile: '9111111111' });
      expect(res.success).toBe(false);
      expect(res.error).toBe('UNAUTHORIZED');
    });
  });

  describe('3. getBusLocationAndETA — Honest Telemetry & Freshness Enforcement', () => {
    test('returns active live GPS data when telemetry is fresh (< 5 mins old)', async () => {
      // Simulate fresh telemetry
      setTripTelemetry(primaryTripId, {
        bus_id: 'bus-1',
        driver_id: driver1Id,
        latitude: 11.0168,
        longitude: 76.9558,
        speed: 62,
        heading: 140,
        current_stop_id: 'stop-101',
        next_stop_name: 'Singanallur',
        eta: '12 mins',
      });

      const res = await getBusLocationAndETA({ tripId: primaryTripId, user: passengerUser });
      expect(res.success).toBe(true);
      expect(res.hasLiveTracking).toBe(true);
      expect(res.status).toBe('active');
      expect(res.data.speedKmH).toBe(62);
      expect(res.data.nextStop).toBe('Singanallur');
      expect(res.data.eta).toBe('12 mins');
    });

    test('honestly reports stale GPS when telemetry timestamp is older than 5 minutes', async () => {
      // Artificially inject stale telemetry
      const sixMinutesAgo = Date.now() - 6 * 60 * 1000;
      setTripTelemetry(primaryTripId, {
        bus_id: 'bus-1',
        driver_id: driver1Id,
        latitude: 10.995,
        longitude: 77.0002,
        speed: 0,
        heading: 0,
        recorded_at_ms: sixMinutesAgo,
        recorded_at: new Date(sixMinutesAgo).toISOString(),
      });

      const res = await getBusLocationAndETA({ tripId: primaryTripId, user: passengerUser });
      expect(res.success).toBe(true);
      expect(res.hasLiveTracking).toBe(false);
      expect(res.status).toBe('stale_gps');
      expect(res.message).toContain('cannot be reliably confirmed');
    });

    test('honestly explains standby status when tracking has not started yet', async () => {
      const res = await getBusLocationAndETA({ tripId: 'non-existent-trip-id', user: passengerUser });
      expect(res.success).toBe(true);
      expect(res.hasLiveTracking).toBe(false);
      expect(res.message).toBeDefined();
    });
  });

  describe('4. getBoardingAndDroppingDetails Tool', () => {
    test('returns exact scheduled boarding stop, platform bay, and dropping stop', async () => {
      const res = await getBoardingAndDroppingDetails({ pnr: verifiedPnr, user: passengerUser });
      expect(res.success).toBe(true);
      expect(res.data.boardingPoint.name).toBeDefined();
      expect(res.data.boardingPoint.scheduledTime).toBeDefined();
      expect(res.data.droppingPoint.name).toBeDefined();
    });
  });

  describe('5. getNextRouteStop Tool', () => {
    test('returns next route stop in sequential order', async () => {
      const res = await getNextRouteStop({ tripId: primaryTripId });
      expect(res.success).toBe(true);
      expect(res.data.nextStopName).toBeDefined();
      expect(res.data.totalStops).toBeGreaterThan(0);
    });
  });

  describe('6. getDriverBoardingManifest Tool — Strict RBAC', () => {
    test('allows authenticated assigned driver to view trip passenger manifest', async () => {
      const res = await getDriverBoardingManifest({ tripId: primaryTripId, user: driverUser });
      expect(res.success).toBe(true);
      expect(res.data.passengers).toBeDefined();
      expect(res.data.totalPassengers).toBeGreaterThan(0);
      expect(res.data.boardedCount).toBeDefined();
    });

    test('strictly denies passengers from accessing driver manifest', async () => {
      const res = await getDriverBoardingManifest({ tripId: primaryTripId, user: passengerUser });
      expect(res.success).toBe(false);
      expect(res.error).toBe('FORBIDDEN');
    });

    test('strictly denies driver assigned to a different trip', async () => {
      const res = await getDriverBoardingManifest({ tripId: primaryTripId, user: unassignedDriver });
      expect(res.success).toBe(false);
      expect(res.error).toBe('NOT_ASSIGNED');
    });

    test('denies unauthenticated requests without credentials', async () => {
      const res = await getDriverBoardingManifest({ tripId: primaryTripId, user: null });
      expect(res.success).toBe(false);
      expect(res.error).toBe('UNAUTHENTICATED');
    });
  });
});

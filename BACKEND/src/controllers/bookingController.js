import crypto from 'crypto';
import db, { isDbConnected, isDurableStorageRequired } from '../config/database.js';
import logger from '../config/logger.js';
import { createAuditLog } from '../services/auditService.js';
import {
  createNewBooking,
  getBookingByPnr,
  getTripTrackingPayload,
  bookings as inMemoryBookings,
  trips,
  travels,
  buses,
  routes,
  payments,
  refunds,
  cancelPassengerBooking,
} from '../services/dataStore.js';
import { validateSeatGenders, DEFAULT_SEAT_PAIRS } from '../utils/genderAllocation.js';
import { generateTicketPdf } from '../services/ticketPdfService.js';

/**
 * Create booking
 * POST /api/bookings
 */
export async function createBooking(req, res) {
  try {
    const {
      tripId, busId, operatorName, serviceNumber, busNumber,
      departureTime, arrivalTime, originCity, destinationCity,
      journeyDate, boardingPoint, droppingPoint,
      boardingStopId, droppingStopId, seatIds, seats,
      passengers, contactMobile, contactEmail, specialRequests,
      totalAmount: reqTotalAmount,
    } = req.body;

    const userId = req.user ? req.user.id : (contactEmail ? `usr-${contactEmail.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}` : 'usr-passenger-001');

    // Strict validation: if busId and operatorName are missing and no tripId, reject explicitly
    if (!busId && !operatorName && !tripId) {
      return res.status(400).json({
        success: false,
        error: 'Bus ID (busId) or Operator Name (operatorName) is required for booking reservation.',
        code: 'MISSING_BUS_DETAILS',
      });
    }

    // Reject booking writes when durable persistence is required but database is unavailable
    if (isDurableStorageRequired() && !isDbConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Durable database persistence is required for booking, but PostgreSQL is currently unavailable. Booking writes are disabled.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    if (!isDbConnected()) {
      // Find the bus record specifically matching req.body.busId if provided
      let matchedBus = null;
      if (busId) {
        matchedBus = buses.find((b) => b.id === busId || b.bus_number === busId || b.registration_number === busNumber);
        if (!matchedBus && !operatorName) {
          return res.status(404).json({
            success: false,
            error: `Bus with ID ${busId} not found in fleet.`,
            code: 'BUS_NOT_FOUND',
          });
        }
      }

      const passengerList = (passengers || []).map((p, idx) => ({
        seatNumber: p.seatNumber || (seatIds && seatIds[idx]) || (seats && seats[idx]) || `L${idx + 1}`,
        name: p.name || p.passengerName || 'Passenger',
        age: p.age || 28,
        gender: p.gender || 'male',
        fare: p.fare || 850,
      }));

      const newBooking = createNewBooking({
        tripId,
        busId: matchedBus?.id || busId,
        operatorName: matchedBus?.operator_name || operatorName,
        serviceNumber: matchedBus?.service_number || serviceNumber,
        busNumber: matchedBus?.registration_number || busNumber,
        departureTime: matchedBus?.departure_time || departureTime,
        arrivalTime: matchedBus?.arrival_time || arrivalTime,
        originCity,
        destinationCity,
        journeyDate,
        boardingPoint,
        droppingPoint,
        passengerDetails: passengerList,
        contactDetails: {
          name: passengerList[0]?.name || 'Passenger',
          email: contactEmail || 'passenger@smartroute.in',
          phone: contactMobile || '9000000006',
        },
        boardingStopId,
        droppingStopId,
        userId,
        passengerId: userId,
        paymentMethod: req.body.paymentMethod || 'upi',
      });

      const bookingSummary = {
        id: newBooking.id,
        bookingNumber: newBooking.pnr_number,
        pnr: newBooking.pnr_number,
        pnr_number: newBooking.pnr_number,
        status: 'confirmed',
        operatorName: newBooking.operator_name || newBooking.travel_name,
        operator_name: newBooking.operator_name || newBooking.travel_name,
        travel_name: newBooking.travel_name,
        serviceNumber: newBooking.service_number,
        service_number: newBooking.service_number,
        busNumber: newBooking.bus_number,
        bus_number: newBooking.bus_number,
        registration_number: newBooking.registration_number,
        departureTime: newBooking.departure_time,
        departure_time: newBooking.departure_time,
        arrivalTime: newBooking.arrival_time,
        estimated_arrival_time: newBooking.estimated_arrival_time,
        journeyDate: newBooking.journey_date,
        journey_date: newBooking.journey_date,
        travelDate: newBooking.travel_date,
        travel_date: newBooking.travel_date,
        boardingPoint: newBooking.boarding_stop_name,
        droppingPoint: newBooking.dropping_stop_name,
        boarding_stop_name: newBooking.boarding_stop_name,
        dropping_stop_name: newBooking.dropping_stop_name,
        totalAmount: newBooking.total_fare,
        baseAmount: newBooking.total_fare,
        taxAmount: Math.round(newBooking.total_fare * 0.05),
        bus: newBooking.bus,
        trip: newBooking.trip,
        passengers: newBooking.passengers,
      };

      return res.status(201).json({
        success: true,
        booking: bookingSummary,
        data: {
          booking: bookingSummary,
          seats: newBooking.passengers.map((p) => ({
            seatNumber: p.seat_number,
            fare: p.fare,
          })),
          boardingStop: { name: newBooking.trip.boarding_stop_name },
          droppingStop: { name: newBooking.trip.dropping_stop_name },
          message: 'Booking confirmed successfully',
        },
        meta: {
          persistence: 'ephemeral_memory',
          warning: 'Non-durable storage: booking stored in ephemeral in-memory fallback store. Data will not persist across server restarts.',
        },
      });
    }

    // Use transaction for atomic booking
    const result = await db.transaction(async (trx) => {
      // Find the bus record specifically matching req.body.busId
      let bus = null;
      if (req.body.busId) {
        bus = await trx('buses').where({ id: req.body.busId }).first();
        if (!bus) {
          throw { code: 'BUS_NOT_FOUND', message: `Bus with ID ${req.body.busId} not found in fleet.` };
        }
      }

      // Verify trip exists and is bookable
      const trip = await trx('trips')
        .where('id', tripId)
        .whereIn('status', ['published', 'boarding'])
        .first();

      if (!trip) {
        throw { code: 'TRIP_NOT_AVAILABLE', message: 'Trip is not available for booking' };
      }

      if (!bus && trip.bus_id) {
        bus = await trx('buses').where({ id: trip.bus_id }).first();
      }

      const travel = await trx('travels').where({ id: trip.travel_id }).first();
      const finalOperator = bus?.operator_name || req.body.operatorName || travel?.name;
      const finalServiceNo = bus?.service_number || req.body.serviceNumber || trip.trip_number;
      const finalBusReg = bus?.registration_number || req.body.busNumber || bus?.bus_number;
      const finalDepTime = bus?.departure_time || req.body.departureTime || trip.departure_time;
      const finalArrTime = bus?.arrival_time || req.body.arrivalTime || trip.estimated_arrival_time;

      if (!trip) {
        throw { code: 'TRIP_NOT_AVAILABLE', message: 'Trip is not available for booking' };
      }

      // Get stops
      const boardingStop = await trx('route_stops').where('id', boardingStopId).first();
      const droppingStop = await trx('route_stops').where('id', droppingStopId).first();

      if (!boardingStop || !droppingStop) {
        throw { code: 'INVALID_STOPS', message: 'Invalid boarding or dropping stop' };
      }

      if (boardingStop.stop_order >= droppingStop.stop_order) {
        throw { code: 'INVALID_STOP_ORDER', message: 'Boarding stop must be before dropping stop' };
      }

      // Lock and verify seats
      const seats = await trx('trip_seats')
        .where('trip_id', tripId)
        .whereIn('id', seatIds)
        .forUpdate();

      if (seats.length !== seatIds.length) {
        throw { code: 'SEATS_NOT_FOUND', message: 'Some seats were not found' };
      }

      // Verify all seats are either held by this user or available
      for (const seat of seats) {
        if (seat.status === 'booked') {
          throw { code: 'SEAT_ALREADY_BOOKED', message: `Seat ${seat.seat_number} is already booked` };
        }
        if (seat.status === 'held' && seat.held_by !== userId) {
          throw { code: 'SEAT_HELD', message: `Seat ${seat.seat_number} is held by another user` };
        }
        if (seat.status === 'disabled') {
          throw { code: 'SEAT_DISABLED', message: `Seat ${seat.seat_number} is not available` };
        }
      }

      // Check for overlapping segment bookings
      const seatNumbers = seats.map((s) => s.seat_number);
      const overlapping = await trx('trip_seats')
        .where('trip_id', tripId)
        .whereIn('seat_number', seatNumbers)
        .where('status', 'booked')
        .where(function () {
          this.where('boarding_stop_order', '<', droppingStop.stop_order)
            .andWhere('dropping_stop_order', '>', boardingStop.stop_order);
        });

      if (overlapping.length > 0) {
        throw { code: 'SEGMENT_CONFLICT', message: 'Seats have conflicting bookings for this route segment' };
      }

      // Commercial Bus Gender Allocation check against separate existing bookings
      const existingPassengerBookings = await trx('booking_passengers')
        .join('bookings', 'booking_passengers.booking_id', 'bookings.id')
        .where('bookings.trip_id', tripId)
        .whereIn('bookings.status', ['confirmed', 'pending', 'booked'])
        .select(
          'booking_passengers.seat_number as seatNumber',
          'booking_passengers.gender',
          'booking_passengers.booking_id as bookingId'
        );

      const passengerList = (passengers || []).map((p, idx) => ({
        seatNumber: p.seatNumber || (seats[idx] && seats[idx].seat_number) || (seatIds && seatIds[idx]),
        gender: p.gender || 'male',
        name: p.name || `Passenger ${idx + 1}`,
      }));

      const genderCheck = validateSeatGenders(passengerList, DEFAULT_SEAT_PAIRS, existingPassengerBookings);
      if (!genderCheck.valid) {
        throw { code: 'GENDER_SEAT_RULE_VIOLATION', message: genderCheck.message };
      }

      // Calculate amounts
      const totalBaseFare = seats.reduce((sum, s) => sum + parseFloat(s.fare), 0);
      const taxRate = 0.05; // 5% GST
      const taxAmount = Math.round(totalBaseFare * taxRate * 100) / 100;
      const totalAmount = totalBaseFare + taxAmount;

      // Generate booking number
      const bookingNumber = `SR${Date.now().toString(36).toUpperCase()}${crypto.randomInt(100, 999)}`;

      // Create booking
      const [booking] = await trx('bookings')
        .insert({
          booking_number: bookingNumber,
          passenger_id: userId,
          trip_id: tripId,
          travel_id: trip.travel_id,
          boarding_stop_id: boardingStopId,
          dropping_stop_id: droppingStopId,
          boarding_stop_order: boardingStop.stop_order,
          dropping_stop_order: droppingStop.stop_order,
          total_passengers: passengers.length,
          total_seats: seatIds.length,
          base_amount: totalBaseFare,
          tax_amount: taxAmount,
          discount_amount: 0,
          total_amount: totalAmount,
          status: 'pending', // Will be confirmed after payment
          contact_mobile: contactMobile || null,
          contact_email: contactEmail || null,
          special_requests: specialRequests || null,
          booked_by: userId,
        })
        .returning('*');

      // Update seat status to booked
      await trx('trip_seats')
        .where('trip_id', tripId)
        .whereIn('id', seatIds)
        .update({
          status: 'booked',
          booking_id: booking.id,
          held_by: null,
          held_until: null,
          boarding_stop_order: boardingStop.stop_order,
          dropping_stop_order: droppingStop.stop_order,
        });

      // Create booking passengers
      const bookingPassengers = passengers.map((p, idx) => ({
        booking_id: booking.id,
        trip_seat_id: seatIds[idx] || seatIds[0],
        name: p.name,
        age: p.age || null,
        gender: p.gender || null,
        mobile: p.mobile || null,
        seat_number: seats[idx]?.seat_number || seats[0]?.seat_number,
        boarding_status: 'not_yet',
      }));

      await trx('booking_passengers').insert(bookingPassengers);

      // Update trip available seats
      await trx('trips')
        .where('id', tripId)
        .decrement('total_available_seats', seatIds.length)
        .increment('total_booked_seats', seatIds.length);

      return {
        booking,
        seats: seats.map((s) => ({
          id: s.id,
          seatNumber: s.seat_number,
          seatType: s.seat_type,
          deck: s.deck,
          fare: s.fare,
        })),
        boardingStop,
        droppingStop,
        totalAmount,
      };
    });

    await createAuditLog({
      userId,
      userRole: req.user.role,
      travelId: result.booking.travel_id,
      action: 'create_booking',
      resourceType: 'booking',
      resourceId: result.booking.id,
      newValues: {
        bookingNumber: result.booking.booking_number,
        tripId,
        seatCount: seatIds.length,
        amount: result.totalAmount,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const finalSummary = {
      id: result.booking.id,
      bookingNumber: result.booking.booking_number,
      pnr: result.booking.booking_number,
      pnr_number: result.booking.booking_number,
      status: result.booking.status,
      operatorName: finalOperator,
      operator_name: finalOperator,
      travel_name: finalOperator,
      serviceNumber: finalServiceNo,
      service_number: finalServiceNo,
      busNumber: finalBusReg,
      bus_number: finalBusReg,
      registration_number: finalBusReg,
      departureTime: finalDepTime,
      departure_time: finalDepTime,
      arrivalTime: finalArrTime,
      estimated_arrival_time: finalArrTime,
      journeyDate: req.body.journeyDate || trip.departure_date,
      journey_date: req.body.journeyDate || trip.departure_date,
      travelDate: req.body.journeyDate || trip.departure_date,
      travel_date: req.body.journeyDate || trip.departure_date,
      boardingPoint: result.boardingStop.name,
      droppingPoint: result.droppingStop.name,
      boarding_stop_name: result.boardingStop.name,
      dropping_stop_name: result.droppingStop.name,
      totalAmount: result.totalAmount,
      baseAmount: result.booking.base_amount,
      taxAmount: result.booking.tax_amount,
      passengers: req.body.passengers,
    };

    return res.status(201).json({
      success: true,
      booking: finalSummary,
      data: {
        booking: finalSummary,
        seats: result.seats,
        boardingStop: { name: result.boardingStop.name },
        droppingStop: { name: result.droppingStop.name },
        message: 'Booking created. Please complete payment.',
      },
    });
  } catch (error) {
    if (error.code) {
      const statusCode = (error.code === 'TRIP_NOT_AVAILABLE' || error.code === 'BUS_NOT_FOUND') ? 404 : error.code === 'GENDER_SEAT_RULE_VIOLATION' ? 400 : 409;
      return res.status(statusCode).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
    logger.error('Create booking error:', error);
    return res.status(500).json({
      success: false,
      error: 'Booking failed',
      code: 'BOOKING_ERROR',
    });
  }
}

/**
 * Get booking details
 * GET /api/bookings/:id
 */
export async function getBooking(req, res) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const bkg = getBookingByPnr(id) || inMemoryBookings.find((b) => b.id === id || b.pnr_number === id);
      if (!bkg) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found',
          code: 'BOOKING_NOT_FOUND',
        });
      }
      return res.json({
        success: true,
        booking: bkg,
        data: { booking: bkg, passengers: bkg.passengers || [] },
      });
    }

    const booking = await db('bookings')
      .join('trips', 'bookings.trip_id', 'trips.id')
      .join('routes', 'trips.route_id', 'routes.id')
      .join('buses', 'trips.bus_id', 'buses.id')
      .join('travels', 'bookings.travel_id', 'travels.id')
      .join('route_stops as boarding', 'bookings.boarding_stop_id', 'boarding.id')
      .join('route_stops as dropping', 'bookings.dropping_stop_id', 'dropping.id')
      .where('bookings.id', id)
      .modify((qb) => {
        if (req.user.role === 'passenger') {
          qb.where('bookings.passenger_id', req.user.id);
        } else if (req.user.role !== 'super_admin') {
          qb.where('bookings.travel_id', req.user.travelId);
        }
      })
      .select(
        'bookings.*',
        'trips.trip_number', 'trips.departure_date', 'trips.departure_time',
        'trips.estimated_arrival_time', 'trips.status as trip_status',
        'routes.name as route_name', 'routes.source', 'routes.destination',
        'buses.name as bus_name', 'buses.registration_number', 'buses.bus_type',
        'buses.has_ac',
        'travels.name as travel_name', 'travels.logo_url as travel_logo',
        'boarding.name as boarding_stop_name', 'boarding.latitude as boarding_lat',
        'boarding.longitude as boarding_lng',
        'dropping.name as dropping_stop_name'
      )
      .first();

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    // Get passengers
    const passengers = await db('booking_passengers')
      .where('booking_id', id)
      .select('*');

    // Get payment info
    const payment = await db('payments')
      .where('booking_id', id)
      .orderBy('created_at', 'desc')
      .first();

    // Get ticket
    const ticket = await db('tickets')
      .where('booking_id', id)
      .first();

    return res.json({
      success: true,
      data: { booking, passengers, payment, ticket },
    });
  } catch (error) {
    logger.error('Get booking error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get booking',
      code: 'GET_BOOKING_ERROR',
    });
  }
}

/**
 * List passenger's bookings & e-tickets
 * GET /api/bookings/my-bookings
 * GET /api/bookings/my-tickets
 */
export async function getMyBookings(req, res) {
  try {
    const { page = 1, limit = 50, status, type } = req.query;
    const filterStatus = (status || type || 'all').toLowerCase();
    const currentUserId = req.user ? req.user.id : null;
    const userEmail = req.user?.email ? req.user.email.toLowerCase() : null;
    const userMobile = req.user?.mobile || null;

    // Helper to compute lifecycle status based on journey timing and explicit cancellations
    const computeStatus = (b) => {
      if (b.status === 'cancelled' || b.booking_status === 'cancelled') {
        return 'cancelled';
      }
      if (b.trip?.status === 'completed' || b.trip_status === 'completed') {
        return 'completed';
      }
      const depDate = b.journey_date || b.travel_date || b.departure_date || b.trip?.departure_date;
      const arrTime = b.estimated_arrival_time || b.arrival_time || b.trip?.estimated_arrival_time || '23:59';
      if (depDate && depDate !== 'Today') {
        try {
          const [arrH = 23, arrM = 59] = String(arrTime).split(':').map(Number);
          const arrivalDt = new Date(`${depDate}T${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}:00`);
          if (new Date() > arrivalDt) {
            return 'completed';
          }
        } catch {
          // ignore parsing error
        }
      }
      return 'upcoming';
    };

    if (!isDbConnected()) {
      // Filter bookings strictly by authenticated user ownership
      const userBookings = inMemoryBookings.filter((b) => {
        if (req.user?.role === 'super_admin') return true;
        const matchesUser = b.user_id === currentUserId || b.passenger_id === currentUserId;
        const matchesEmail = userEmail && b.contact_email && b.contact_email.toLowerCase() === userEmail;
        const matchesMobile = userMobile && b.contact_mobile && b.contact_mobile === userMobile;
        return matchesUser || matchesEmail || matchesMobile;
      });

      const list = userBookings.map((b) => {
        const computedStatus = computeStatus(b);
        const pnr = b.pnr_number || b.pnr || b.booking_number;
        const totalAmount = Number(b.total_fare || b.total_amount || 850);
        const isCancelled = computedStatus === 'cancelled';
        const cancellationFee = b.cancellation_fee !== undefined ? b.cancellation_fee : (isCancelled ? Math.round(totalAmount * 0.1) : 0);
        const refundAmount = b.refund_amount !== undefined ? b.refund_amount : (isCancelled ? Math.max(0, totalAmount - cancellationFee) : 0);
        const refundStatus = b.refund_status || (isCancelled ? 'completed' : 'none');
        const refundRef = b.refund_reference || (isCancelled ? `REF-${pnr}` : null);

        const bTrip = (trips || []).find((t) => t.id === b.trip_id) || b.trip;
        const bBus = (buses || []).find((bus) => bus.id === (b.bus_id || bTrip?.bus_id)) || b.bus;

        const paxList = b.passengers || [];
        const seatNumbers = paxList.map((p) => p.seat_number || p.seatNumber).filter(Boolean);

        return {
          id: b.id,
          booking_id: b.id,
          booking_number: pnr,
          pnr: pnr,
          pnr_number: pnr,
          user_id: b.user_id,
          passenger_id: b.passenger_id,
          operator_name: b.operator_name || b.travel_name || b.trip?.travel_name || bBus?.operatorName || 'SMART ROUTE Travels',
          travel_name: b.travel_name || b.operator_name || b.trip?.travel_name || 'SMART ROUTE Travels',
          bus_name: bBus?.name || b.bus_name || 'TATA Capella 2+1 AC Sleeper',
          bus_number: b.bus_number || b.registration_number || bBus?.registration_number || '',
          registration_number: b.registration_number || b.bus_number || bBus?.registration_number || '',
          service_number: b.service_number || b.trip_number || bTrip?.trip_number || 'SR-101',
          trip_number: b.trip_number || b.service_number || bTrip?.trip_number || 'SR-101',
          source: b.source || b.source_city || bTrip?.source || 'Coimbatore',
          destination: b.destination || b.destination_city || bTrip?.destination || 'Tenkasi',
          source_city: b.source_city || b.source || bTrip?.source || 'Coimbatore',
          destination_city: b.destination_city || b.destination || bTrip?.destination || 'Tenkasi',
          boarding_stop_name: b.boarding_stop_name || b.boardingPoint || bTrip?.boarding_stop_name || 'Coimbatore Omni Bus Stand',
          dropping_stop_name: b.dropping_stop_name || b.droppingPoint || bTrip?.dropping_stop_name || 'Tenkasi New Bus Stand',
          departure_date: b.journey_date || b.travel_date || b.departure_date || bTrip?.departure_date || 'Today',
          journey_date: b.journey_date || b.travel_date || b.departure_date || bTrip?.departure_date || 'Today',
          travel_date: b.journey_date || b.travel_date || b.departure_date || bTrip?.departure_date || 'Today',
          departure_time: b.departure_time || bTrip?.departure_time || '21:30',
          arrival_time: b.arrival_time || b.estimated_arrival_time || bTrip?.estimated_arrival_time || '05:30',
          estimated_arrival_time: b.estimated_arrival_time || b.arrival_time || bTrip?.estimated_arrival_time || '05:30',
          total_fare: totalAmount,
          total_amount: totalAmount,
          total_passengers: paxList.length || b.total_passengers || 1,
          passengers_count: paxList.length || b.total_passengers || 1,
          seats: seatNumbers,
          seat_numbers: seatNumbers.join(', '),
          status: isCancelled ? 'cancelled' : (computedStatus === 'completed' ? 'completed' : 'confirmed'),
          booking_status: isCancelled ? 'cancelled' : (computedStatus === 'completed' ? 'completed' : 'confirmed'),
          computed_status: computedStatus,
          payment_status: isCancelled ? (refundStatus === 'completed' ? 'refunded' : 'paid') : (b.payment_status || 'paid'),
          cancellation_reason: b.cancellation_reason || null,
          cancelled_at: b.cancelled_at || null,
          cancellation_fee: cancellationFee,
          refund_amount: refundAmount,
          refund_status: refundStatus,
          refund_reference: refundRef,
          passengers: paxList,
          created_at: b.created_at || new Date().toISOString(),
          download_url: `/api/bookings/pnr/${pnr}/pdf`,
        };
      });

      // Filter by requested status category
      let filtered = list;
      if (filterStatus === 'upcoming' || filterStatus === 'confirmed') {
        filtered = list.filter((b) => b.computed_status === 'upcoming');
      } else if (filterStatus === 'cancelled') {
        filtered = list.filter((b) => b.computed_status === 'cancelled');
      } else if (filterStatus === 'completed' || filterStatus === 'past') {
        filtered = list.filter((b) => b.computed_status === 'completed');
      }

      return res.json({
        success: true,
        bookings: filtered,
        data: {
          bookings: filtered,
          pagination: {
            page: 1,
            limit: parseInt(limit, 10),
            total: filtered.length,
            totalPages: 1,
          },
        },
      });
    }

    // Database Connected Query
    const offset = (page - 1) * limit;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    let query = db('bookings')
      .join('trips', 'bookings.trip_id', 'trips.id')
      .join('routes', 'trips.route_id', 'routes.id')
      .join('buses', 'trips.bus_id', 'buses.id')
      .join('travels', 'bookings.travel_id', 'travels.id')
      .join('route_stops as boarding', 'bookings.boarding_stop_id', 'boarding.id')
      .join('route_stops as dropping', 'bookings.dropping_stop_id', 'dropping.id')
      .where('bookings.passenger_id', req.user.id);

    if (filterStatus === 'cancelled') {
      query = query.where('bookings.status', 'cancelled');
    } else if (filterStatus === 'upcoming' || filterStatus === 'confirmed') {
      query = query.where('bookings.status', '!=', 'cancelled')
        .where('trips.departure_date', '>=', todayStr);
    } else if (filterStatus === 'completed' || filterStatus === 'past') {
      query = query.where('bookings.status', '!=', 'cancelled')
        .where('trips.departure_date', '<', todayStr);
    }

    const [{ count }] = await query.clone().count('bookings.id as count');

    const rawRows = await query
      .select(
        'bookings.id', 'bookings.booking_number', 'bookings.pnr_number', 'bookings.status',
        'bookings.total_amount', 'bookings.total_passengers', 'bookings.created_at',
        'bookings.cancellation_reason', 'bookings.cancelled_at',
        'trips.departure_date', 'trips.departure_time', 'trips.estimated_arrival_time', 'trips.status as trip_status',
        'trips.trip_number',
        'routes.source', 'routes.destination',
        'buses.name as bus_name', 'buses.bus_type', 'buses.has_ac', 'buses.registration_number',
        'travels.name as travel_name', 'travels.logo_url',
        'boarding.name as boarding_stop',
        'dropping.name as dropping_stop'
      )
      .orderBy('trips.departure_date', 'desc')
      .limit(limit)
      .offset(offset);

    const formattedList = rawRows.map((r) => {
      const computedStatus = r.status === 'cancelled' ? 'cancelled' : (r.departure_date < todayStr ? 'completed' : 'upcoming');
      const pnr = r.pnr_number || r.booking_number;
      return {
        ...r,
        id: r.id,
        booking_id: r.id,
        booking_number: pnr,
        pnr: pnr,
        pnr_number: pnr,
        operator_name: r.travel_name,
        travel_name: r.travel_name,
        source_city: r.source,
        destination_city: r.destination,
        boarding_stop_name: r.boarding_stop,
        dropping_stop_name: r.dropping_stop,
        journey_date: r.departure_date,
        arrival_time: r.estimated_arrival_time,
        total_fare: Number(r.total_amount),
        computed_status: computedStatus,
        download_url: `/api/bookings/pnr/${pnr}/pdf`,
      };
    });

    return res.json({
      success: true,
      bookings: formattedList,
      data: {
        bookings: formattedList,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total: parseInt(count, 10),
          totalPages: Math.ceil(count / limit),
        },
      },
    });
  } catch (error) {
    logger.error('Get my bookings error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get bookings',
      code: 'GET_BOOKINGS_ERROR',
    });
  }
}

/**
 * Cancel booking
 * POST /api/bookings/:id/cancel
 * POST /api/bookings/:bookingId/cancel
 */
export async function cancelBooking(req, res) {
  try {
    const bookingId = req.params.bookingId || req.params.id;
    const { reason } = req.body || {};

    if (!isDbConnected()) {
      const isPrivileged = ['super_admin', 'travel_owner', 'manager'].includes(req.user.role);
      const result = cancelPassengerBooking(bookingId, req.user.id, { reason, isPrivileged });

      await createAuditLog({
        userId: req.user.id,
        userRole: req.user.role,
        travelId: result.booking.travel_id,
        action: 'cancel_booking',
        resourceType: 'booking',
        resourceId: bookingId,
        oldValues: { status: 'confirmed' },
        newValues: { status: 'cancelled', reason },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      }).catch(() => {});

      return res.json({
        success: true,
        message: 'Booking cancelled successfully. Refund processed according to operator policy.',
        booking: result.booking,
        refund: result.refund,
        data: {
          message: 'Booking cancelled successfully',
          bookingId: result.booking.id,
          refund: result.refund,
        },
      });
    }

    const result = await db.transaction(async (trx) => {
      const booking = await trx('bookings')
        .where('id', bookingId)
        .modify((qb) => {
          if (req.user.role === 'passenger') {
            qb.where('passenger_id', req.user.id);
          } else if (req.user.role !== 'super_admin') {
            qb.where('travel_id', req.user.travelId);
          }
        })
        .first();

      if (!booking) {
        throw { code: 'NOT_FOUND', message: 'Booking not found' };
      }

      if (['cancelled', 'refunded'].includes(booking.status)) {
        throw { code: 'INVALID_STATUS', message: `Cannot cancel booking with status: ${booking.status}` };
      }

      const totalFare = Number(booking.total_amount || 0);
      const cancellationFee = Math.round(totalFare * 0.10);
      const refundAmount = Math.max(0, totalFare - cancellationFee);
      const refundId = `REF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Update booking
      await trx('bookings').where('id', bookingId).update({
        status: 'cancelled',
        cancelled_at: trx.fn.now(),
        cancellation_reason: reason || 'Cancelled by user',
      });

      // Release booked seats
      await trx('trip_seats')
        .where('booking_id', bookingId)
        .update({
          status: 'available',
          booking_id: null,
          held_by: null,
          held_until: null,
          boarding_stop_order: null,
          dropping_stop_order: null,
        });

      // Update trip seat counts
      await trx('trips')
        .where('id', booking.trip_id)
        .increment('total_available_seats', booking.total_seats || 1)
        .decrement('total_booked_seats', booking.total_seats || 1);

      // Update boarding passengers
      await trx('booking_passengers')
        .where('booking_id', bookingId)
        .update({ boarding_status: 'cancelled' });

      // Create refund record
      await trx('refunds').insert({
        booking_id: bookingId,
        refund_id: refundId,
        amount: refundAmount,
        reason: reason || 'Cancelled by user',
        status: 'completed',
        initiated_by: req.user.id,
      }).catch(() => {});

      return { ...booking, refund_amount: refundAmount, refund_reference: refundId };
    });

    await createAuditLog({
      userId: req.user.id,
      userRole: req.user.role,
      travelId: result.travel_id,
      action: 'cancel_booking',
      resourceType: 'booking',
      resourceId: bookingId,
      oldValues: { status: result.status },
      newValues: { status: 'cancelled', reason },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    return res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { message: 'Booking cancelled successfully', bookingId, refund: { amount: result.refund_amount, reference: result.refund_reference } },
    });
  } catch (error) {
    if (error.code) {
      return res.status(error.code === 'NOT_FOUND' ? 404 : 400).json({
        success: false,
        error: error.message,
        code: error.code,
      });
    }
    logger.error('Cancel booking error:', error);
    return res.status(500).json({
      success: false,
      error: 'Cancellation failed',
      code: 'CANCEL_ERROR',
    });
  }
}

/**
 * Get booking by PNR number
 */
export async function getBookingByPNR(req, res) {
  try {
    const { pnr } = req.params;

    if (!isDbConnected()) {
      const bkg = getBookingByPnr(pnr);
      if (!bkg) {
        return res.status(404).json({ success: false, error: 'Booking not found' });
      }

      const bTrip = (trips || []).find((t) => t.id === bkg.trip_id) || bkg.trip;
      const bTravel = (travels || []).find((tr) => tr.id === (bkg.travel_id || bTrip?.travel_id));
      const bBus = (buses || []).find((b) => b.id === (bkg.bus_id || bTrip?.bus_id)) || bkg.bus;
      const travelName =
        bkg.operatorName ||
        bkg.operator_name ||
        bkg.travel_name ||
        bkg.travelName ||
        bkg.bus?.operatorName ||
        bkg.bus?.operator_name ||
        bkg.trip?.travel_name ||
        bkg.trip?.operator_name ||
        bTravel?.name ||
        bTrip?.travel_name ||
        '';
      const busNumber =
        bkg.busNumber ||
        bkg.bus_number ||
        bkg.bus_registration_number ||
        bkg.registrationNumber ||
        bkg.registration_number ||
        bkg.bus?.registrationNumber ||
        bkg.bus?.registration_number ||
        bkg.trip?.registration_number ||
        bBus?.registration_number ||
        bBus?.bus_number ||
        '';
      const serviceNumber =
        bkg.serviceNumber ||
        bkg.service_number ||
        bkg.bus?.serviceNumber ||
        bkg.bus?.service_number ||
        bkg.trip_number ||
        bkg.trip?.trip_number ||
        bkg.trip?.service_number ||
        bTrip?.trip_number ||
        '';
      const departureTime =
        bkg.departureTime ||
        bkg.departure_time ||
        bkg.trip?.departure_time ||
        bTrip?.departure_time ||
        '';
      const operatorLogo = bTravel?.logo_url || bkg.operator_logo || null;
      const rawJourneyDate =
        bkg.journeyDate ||
        bkg.journey_date ||
        bkg.travelDate ||
        bkg.travel_date ||
        bkg.departureDate ||
        bkg.departure_date ||
        bkg.trip?.departure_date ||
        bTrip?.departure_date;
      const travelDate = rawJourneyDate || new Date().toISOString().split('T')[0];

      return res.json({
        success: true,
        booking: {
          ...bkg,
          booking_number: bkg.pnr_number,
          travel_name: travelName,
          operator_name: travelName,
          operatorName: travelName,
          bus_number: busNumber,
          busNumber: busNumber,
          bus_registration_number: busNumber,
          registration_number: busNumber,
          registrationNumber: busNumber,
          service_number: serviceNumber,
          serviceNumber: serviceNumber,
          trip_number: serviceNumber,
          departure_time: departureTime,
          departureTime: departureTime,
          travel_date: travelDate,
          travelDate: travelDate,
          journey_date: travelDate,
          journeyDate: travelDate,
          departure_date: travelDate,
          departureDate: travelDate,
          date: travelDate,
          operator_logo: operatorLogo,
          operatorLogo: operatorLogo,
          boarding_stop_name: bkg.boarding_stop_name || bkg.boardingPoint || bkg.trip?.boarding_stop_name || '',
          dropping_stop_name: bkg.dropping_stop_name || bkg.droppingPoint || bkg.trip?.dropping_stop_name || '',
          passengers: bkg.passengers,
          bus: {
            operatorName: travelName,
            serviceNumber,
            registrationNumber: busNumber,
            registration_number: busNumber,
          },
        },
      });
    }

    const booking = await db('bookings')
      .where('pnr_number', pnr)
      .first();

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const trip = await db('trips').where('id', booking.trip_id).first();
    const travel = trip ? await db('travels').where('id', trip.travel_id).first() : null;
    const bus = trip ? await db('buses').where('id', trip.bus_id).first() : null;
    const boardingStop = await db('route_stops').where('id', booking.boarding_stop_id).first();
    const droppingStop = await db('route_stops').where('id', booking.dropping_stop_id).first();
    const passengers = await db('booking_passengers').where('booking_id', booking.id);

    const travelName =
      booking.operatorName ||
      booking.operator_name ||
      booking.travel_name ||
      travel?.name ||
      trip?.travel_name ||
      '';
    const busNumber =
      booking.busNumber ||
      booking.bus_number ||
      booking.bus_registration_number ||
      bus?.registration_number ||
      bus?.bus_number ||
      booking.bus_number ||
      trip?.registration_number ||
      '';
    const serviceNumber =
      booking.serviceNumber ||
      booking.service_number ||
      trip?.trip_number ||
      booking.trip_number ||
      '';
    const departureTime =
      booking.departureTime ||
      booking.departure_time ||
      trip?.departure_time ||
      '';
    const operatorLogo = travel?.logo_url || null;
    const rawJourneyDate =
      booking.journeyDate ||
      booking.journey_date ||
      booking.travelDate ||
      booking.travel_date ||
      booking.departureDate ||
      booking.departure_date ||
      trip?.departure_date;
    const travelDate = rawJourneyDate || new Date().toISOString().split('T')[0];

    return res.json({
      success: true,
      booking: {
        ...booking,
        travel_name: travelName,
        operator_name: travelName,
        operatorName: travelName,
        bus_number: busNumber,
        busNumber: busNumber,
        bus_registration_number: busNumber,
        registration_number: busNumber,
        registrationNumber: busNumber,
        service_number: serviceNumber,
        serviceNumber: serviceNumber,
        trip_number: serviceNumber,
        departure_time: departureTime,
        departureTime: departureTime,
        travel_date: travelDate,
        travelDate: travelDate,
        journey_date: travelDate,
        journeyDate: travelDate,
        departure_date: travelDate,
        departureDate: travelDate,
        date: travelDate,
        operator_logo: operatorLogo,
        operatorLogo: operatorLogo,
        boarding_stop_name: boardingStop?.name || boardingStop?.stop_name || booking.boarding_stop_name || '',
        dropping_stop_name: droppingStop?.name || droppingStop?.stop_name || booking.dropping_stop_name || '',
        passengers,
        bus: {
          operatorName: travelName,
          serviceNumber,
          registrationNumber: busNumber,
          registration_number: busNumber,
        },
      },
    });
  } catch (error) {
    logger.error('Get booking by PNR error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * Verify passenger boarding via QR code scan
 */
export async function verifyTicketQR(req, res) {
  try {
    const { qrPayload } = req.body;
    let pnr = qrPayload;
    try {
      const parsed = JSON.parse(qrPayload);
      pnr = parsed.pnr || qrPayload;
    } catch {
      // payload was plain string
    }

    const booking = await db('bookings').where('pnr_number', pnr).first();
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Invalid Ticket QR: PNR not found' });
    }

    const passengers = await db('booking_passengers').where('booking_id', booking.id);
    return res.json({
      success: true,
      valid: booking.status === 'confirmed',
      booking,
      passengers,
    });
  } catch (error) {
    logger.error('QR verification error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

// Aliases
export const getPassengerBookings = getMyBookings;

/**
 * GET /api/bookings/pnr/:pnr/tracking
 * Get real-time transit tracking data, road stops, and live GPS telemetry for a booked passenger
 */
export async function getBookingTracking(req, res) {
  try {
    const { pnr } = req.params;
    const cleanPnr = String(pnr || '').trim().toUpperCase();

    let booking = null;
    if (isDbConnected()) {
      booking = await db('bookings').where('pnr_number', cleanPnr).first();
      if (booking) {
        const boardingStop = await db('route_stops').where('id', booking.boarding_stop_id).first();
        const droppingStop = await db('route_stops').where('id', booking.dropping_stop_id).first();
        const passengers = await db('booking_passengers').where('booking_id', booking.id);
        booking.boarding_stop_name = boardingStop?.stop_name || '';
        booking.dropping_stop_name = droppingStop?.stop_name || '';
        booking.passengers = passengers;
      }
    } else {
      booking = getBookingByPnr(cleanPnr);
    }

    if (!booking) {
      return res.status(404).json({ success: false, error: 'Booking not found for this PNR reference', code: 'BOOKING_NOT_FOUND' });
    }

    const tracking = getTripTrackingPayload(booking.trip_id, booking);
    if (!tracking) {
      return res.status(404).json({ success: false, error: 'Trip schedule not found for booking', code: 'TRIP_NOT_FOUND' });
    }

    return res.json({
      success: true,
      booking,
      tracking,
      data: {
        booking,
        tracking,
      },
    });
  } catch (error) {
    logger.error('Get booking tracking error:', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve booking tracking details' });
  }
}

/**
 * GET /api/bookings/:pnr/pdf or /api/bookings/pnr/:pnr/pdf
 * Generate and stream an exact single-page A4 commercial E-Ticket PDF
 */
export async function downloadBookingTicketPdf(req, res) {
  try {
    const { pnr } = req.params;
    const cleanPnr = String(pnr || '').trim().toUpperCase();

    if (!cleanPnr) {
      return res.status(400).json({ success: false, error: 'PNR number is required', code: 'MISSING_PNR' });
    }

    let booking = null;
    if (!isDbConnected()) {
      const bkg = getBookingByPnr(cleanPnr);
      if (!bkg) {
        return res.status(404).json({ success: false, error: 'Booking not found for this PNR reference', code: 'BOOKING_NOT_FOUND' });
      }
      const bTrip = (trips || []).find((t) => t.id === bkg.trip_id) || bkg.trip;
      const bTravel = (travels || []).find((tr) => tr.id === (bkg.travel_id || bTrip?.travel_id));
      const bBus = (buses || []).find((b) => b.id === (bkg.bus_id || bTrip?.bus_id));

      const travelName =
        bkg.operatorName ||
        bkg.operator_name ||
        bkg.travel_name ||
        bkg.travelName ||
        bkg.bus?.operatorName ||
        bkg.bus?.operator_name ||
        bkg.trip?.travel_name ||
        bkg.trip?.operator_name ||
        bTravel?.name ||
        'SMART ROUTE Travels';

      const busNumber =
        bkg.busNumber ||
        bkg.bus_number ||
        bkg.bus_registration_number ||
        bkg.registrationNumber ||
        bkg.registration_number ||
        bkg.bus?.registrationNumber ||
        bkg.bus?.registration_number ||
        bkg.trip?.registration_number ||
        bBus?.registration_number ||
        bBus?.bus_number ||
        'TN-38-SR-0001';

      const serviceNumber =
        bkg.serviceNumber ||
        bkg.service_number ||
        bkg.bus?.serviceNumber ||
        bkg.bus?.service_number ||
        bkg.trip_number ||
        bkg.trip?.trip_number ||
        bkg.trip?.service_number ||
        bTrip?.trip_number ||
        'SR-101';

      const departureTime =
        bkg.departureTime ||
        bkg.departure_time ||
        bkg.trip?.departure_time ||
        bTrip?.departure_time ||
        '21:30';

      const arrivalTime =
        bkg.arrivalTime ||
        bkg.arrival_time ||
        bkg.trip?.estimated_arrival_time ||
        bTrip?.estimated_arrival_time ||
        '06:00';

      const rawJourneyDate =
        bkg.journeyDate ||
        bkg.journey_date ||
        bkg.travelDate ||
        bkg.travel_date ||
        bkg.departureDate ||
        bkg.departure_date ||
        bkg.trip?.departure_date ||
        bTrip?.departure_date ||
        new Date().toISOString().split('T')[0];

      booking = {
        ...bkg,
        pnr_number: cleanPnr,
        operatorName: travelName,
        busNumber,
        serviceNumber,
        departureTime,
        arrivalTime,
        journeyDate: rawJourneyDate,
        boarding_stop_name: bkg.boarding_stop_name || bkg.boardingPoint || bkg.trip?.boarding_stop_name || '',
        dropping_stop_name: bkg.dropping_stop_name || bkg.droppingPoint || bkg.trip?.dropping_stop_name || '',
        passengers: bkg.passengers,
        total_fare: bkg.total_fare || bkg.total_amount,
      };
    } else {
      const dbBooking = await db('bookings').where('pnr_number', cleanPnr).first();
      if (!dbBooking) {
        return res.status(404).json({ success: false, error: 'Booking not found for this PNR reference', code: 'BOOKING_NOT_FOUND' });
      }

      const trip = await db('trips').where('id', dbBooking.trip_id).first();
      const travel = trip ? await db('travels').where('id', trip.travel_id).first() : null;
      const bus = trip ? await db('buses').where('id', trip.bus_id).first() : null;
      const boardingStop = await db('route_stops').where('id', dbBooking.boarding_stop_id).first();
      const droppingStop = await db('route_stops').where('id', dbBooking.dropping_stop_id).first();
      const passengers = await db('booking_passengers').where('booking_id', dbBooking.id);

      const travelName =
        dbBooking.operatorName ||
        dbBooking.operator_name ||
        dbBooking.travel_name ||
        travel?.name ||
        trip?.travel_name ||
        'SMART ROUTE Travels';

      const busNumber =
        dbBooking.busNumber ||
        dbBooking.bus_number ||
        dbBooking.bus_registration_number ||
        bus?.registration_number ||
        bus?.bus_number ||
        'TN-38-SR-0001';

      const serviceNumber =
        dbBooking.serviceNumber ||
        dbBooking.service_number ||
        trip?.trip_number ||
        dbBooking.trip_number ||
        'SR-101';

      const departureTime =
        dbBooking.departureTime ||
        dbBooking.departure_time ||
        trip?.departure_time ||
        '21:30';

      const arrivalTime =
        dbBooking.arrivalTime ||
        dbBooking.arrival_time ||
        trip?.estimated_arrival_time ||
        '06:00';

      const journeyDate =
        dbBooking.journeyDate ||
        dbBooking.journey_date ||
        dbBooking.travelDate ||
        trip?.departure_date ||
        new Date().toISOString().split('T')[0];

      booking = {
        ...dbBooking,
        pnr_number: cleanPnr,
        operatorName: travelName,
        busNumber,
        serviceNumber,
        departureTime,
        arrivalTime,
        journeyDate,
        boarding_stop_name: boardingStop?.stop_name || '',
        dropping_stop_name: droppingStop?.stop_name || '',
        total_fare: dbBooking.total_amount,
        passengers: passengers.map((p) => ({
          passenger_name: p.name,
          passenger_age: p.age,
          passenger_gender: p.gender,
          seat_number: p.seat_number,
          fare: Math.round(Number(dbBooking.total_amount) / (passengers.length || 1)),
        })),
      };
    }

    const pdfBuffer = await generateTicketPdf(booking);
    const filename = `SMART-ROUTE-Ticket-${cleanPnr}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.end(pdfBuffer);
  } catch (error) {
    logger.error('Download ticket PDF error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate ticket PDF' });
  }
}

/**
 * Passenger Transactions History
 * GET /api/bookings/transactions
 */
export async function getPassengerTransactions(req, res) {
  try {
    const { status = 'all' } = req.query;
    const userId = req.user ? req.user.id : null;
    const userEmail = req.user?.email ? req.user.email.toLowerCase() : null;

    if (!isDbConnected()) {
      // Find all payments belonging to this user or user's bookings
      const userPayments = (payments || []).filter((p) => {
        if (req.user?.role === 'super_admin') return true;
        if (userId && p.user_id === userId) return true;
        const b = (inMemoryBookings || []).find((bk) => bk.id === p.booking_id);
        if (b && (b.user_id === userId || b.passenger_id === userId || (userEmail && b.contact_email?.toLowerCase() === userEmail))) {
          return true;
        }
        return false;
      });

      const transactions = userPayments.map((p) => {
        const b = (inMemoryBookings || []).find((bk) => bk.id === p.booking_id);
        const ref = (refunds || []).find((r) => r.payment_id === p.id || r.booking_id === p.booking_id);
        const pnr = b?.pnr_number || b?.pnr || 'PNR';
        const isCancelled = b?.status === 'cancelled' || b?.booking_status === 'cancelled';
        const refundStatus = ref ? ref.status : (b?.refund_status || (isCancelled ? 'completed' : 'none'));
        const refundAmount = ref ? Number(ref.amount) : (b?.refund_amount !== undefined ? Number(b.refund_amount) : (isCancelled ? Math.round(Number(p.amount) * 0.9) : 0));
        const refundRef = ref ? ref.refund_id : (b?.refund_reference || (isCancelled ? `REF-${pnr}` : null));

        return {
          id: p.id,
          transaction_id: p.payment_id || p.payment_order_id || p.id,
          transaction_reference: p.payment_id || p.payment_order_id || p.id,
          payment_id: p.payment_id || p.id,
          payment_order_id: p.payment_order_id || null,
          booking_id: p.booking_id,
          pnr_number: pnr,
          pnr,
          operator_name: b?.operator_name || b?.travel_name || 'SMART ROUTE Travels',
          source_city: b?.source_city || b?.source || b?.trip?.source || 'Coimbatore',
          destination_city: b?.destination_city || b?.destination || b?.trip?.destination || 'Tenkasi',
          journey_date: b?.journey_date || b?.travel_date || b?.trip?.departure_date || 'Today',
          departure_time: b?.departure_time || b?.trip?.departure_time || '21:30',
          amount: Number(p.amount),
          currency: p.currency || 'INR',
          payment_method: (p.method || 'upi').toUpperCase(),
          payment_status: p.status, // 'completed', 'pending', 'failed', 'refunded'
          booking_status: b?.status || b?.booking_status || 'confirmed',
          cancellation_status: isCancelled ? 'cancelled' : 'not_cancelled',
          cancellation_reason: b?.cancellation_reason || ref?.reason || null,
          refund_status: refundStatus, // 'none', 'pending', 'completed'
          refund_amount: refundAmount,
          refund_reference: refundRef,
          created_at: p.created_at || b?.created_at || new Date().toISOString(),
          date: p.created_at || b?.created_at || new Date().toISOString(),
        };
      });

      // Filter by status criteria
      let filtered = transactions;
      const s = status.toLowerCase();
      if (s === 'successful') {
        filtered = transactions.filter((t) => t.payment_status === 'completed' || t.payment_status === 'paid');
      } else if (s === 'pending') {
        filtered = transactions.filter((t) => t.payment_status === 'pending');
      } else if (s === 'failed') {
        filtered = transactions.filter((t) => t.payment_status === 'failed');
      } else if (s === 'cancelled') {
        filtered = transactions.filter((t) => t.cancellation_status === 'cancelled');
      } else if (s === 'refund_pending') {
        filtered = transactions.filter((t) => t.refund_status === 'pending');
      } else if (s === 'refund_completed') {
        filtered = transactions.filter((t) => t.refund_status === 'completed' || t.refund_status === 'processed');
      }

      return res.json({
        success: true,
        transactions: filtered,
        data: {
          transactions: filtered,
          total: filtered.length,
        },
      });
    }

    // Database Connected Query
    let query = db('payments')
      .join('bookings', 'payments.booking_id', 'bookings.id')
      .leftJoin('refunds', 'refunds.payment_id', 'payments.id')
      .where('payments.user_id', userId);

    const s = status.toLowerCase();
    if (s === 'successful') {
      query = query.where('payments.status', 'completed');
    } else if (s === 'pending') {
      query = query.where('payments.status', 'pending');
    } else if (s === 'failed') {
      query = query.where('payments.status', 'failed');
    } else if (s === 'cancelled') {
      query = query.where('bookings.status', 'cancelled');
    } else if (s === 'refund_pending') {
      query = query.where('refunds.status', 'pending');
    } else if (s === 'refund_completed') {
      query = query.where('refunds.status', 'completed');
    }

    const rows = await query.select(
      'payments.id',
      'payments.payment_id',
      'payments.payment_order_id',
      'payments.method as payment_method',
      'payments.status as payment_status',
      'payments.amount',
      'payments.currency',
      'payments.created_at',
      'bookings.id as booking_id',
      'bookings.pnr_number',
      'bookings.status as booking_status',
      'bookings.cancellation_reason',
      'refunds.status as refund_status',
      'refunds.amount as refund_amount',
      'refunds.refund_id as refund_reference'
    );

    return res.json({
      success: true,
      transactions: rows,
      data: { transactions: rows, total: rows.length },
    });
  } catch (err) {
    logger.error('Get passenger transactions error:', err);
    return res.status(500).json({ success: false, error: 'Failed to retrieve transaction history' });
  }
}

/**
 * Public & Authenticated PNR Search
 * GET /api/bookings/pnr-search/:pnr
 * POST /api/bookings/pnr-search
 */
export async function searchBookingByPnr(req, res) {
  try {
    const rawPnr = req.params.pnr || req.body?.pnr || req.query?.pnr;
    const cleanPnr = String(rawPnr || '').trim().toUpperCase();

    // 1. Format validation: must be alphanumeric between 4 and 15 chars
    const pnrRegex = /^[A-Z0-9_-]{4,15}$/;
    if (!cleanPnr || !pnrRegex.test(cleanPnr)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid PNR format. PNR should be 4 to 15 alphanumeric characters (e.g., SR4102, VV8820).',
        code: 'INVALID_PNR_FORMAT',
      });
    }

    // 2. Fetch booking
    let bkg = null;
    let bTrip = null;
    let bTravel = null;
    let bBus = null;
    let bBoarding = null;
    let bDropping = null;
    let bPassengers = [];

    if (!isDbConnected()) {
      bkg = getBookingByPnr(cleanPnr);
      if (!bkg) {
        return res.status(404).json({
          success: false,
          error: `No booking found with PNR: ${cleanPnr}. Please check the code and try again.`,
          code: 'BOOKING_NOT_FOUND',
        });
      }
      bTrip = (trips || []).find((t) => t.id === bkg.trip_id) || bkg.trip;
      bTravel = (travels || []).find((tr) => tr.id === (bkg.travel_id || bTrip?.travel_id));
      bBus = (buses || []).find((b) => b.id === (bkg.bus_id || bTrip?.bus_id)) || bkg.bus;
      bPassengers = bkg.passengers || [];
    } else {
      bkg = await db('bookings').where('pnr_number', cleanPnr).first();
      if (!bkg) {
        return res.status(404).json({
          success: false,
          error: `No booking found with PNR: ${cleanPnr}. Please check the code and try again.`,
          code: 'BOOKING_NOT_FOUND',
        });
      }
      bTrip = await db('trips').where('id', bkg.trip_id).first();
      bTravel = bTrip ? await db('travels').where('id', bTrip.travel_id).first() : null;
      bBus = bTrip ? await db('buses').where('id', bTrip.bus_id).first() : null;
      bBoarding = await db('route_stops').where('id', bkg.boarding_stop_id).first();
      bDropping = await db('route_stops').where('id', bkg.dropping_stop_id).first();
      bPassengers = await db('booking_passengers').where('booking_id', bkg.id);
    }

    // 3. Compute journey lifecycle status
    let computedStatus = 'upcoming';
    const isCancelled = bkg.status === 'cancelled' || bkg.booking_status === 'cancelled';
    if (isCancelled) {
      computedStatus = 'cancelled';
    } else {
      const departureDate = bkg.journey_date || bkg.travel_date || bTrip?.departure_date;
      const arrivalTime = bkg.estimated_arrival_time || bkg.arrival_time || bTrip?.estimated_arrival_time || '23:59';
      if (bTrip?.status === 'completed') {
        computedStatus = 'completed';
      } else if (departureDate && departureDate !== 'Today') {
        try {
          const [arrH = 23, arrM = 59] = String(arrivalTime).split(':').map(Number);
          const arrivalDt = new Date(`${departureDate}T${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}:00`);
          if (new Date() > arrivalDt) {
            computedStatus = 'completed';
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    // 4. Privacy & Authorization Check
    const currentUserId = req.user ? req.user.id : null;
    const isOwner = Boolean(
      currentUserId && (
        bkg.user_id === currentUserId ||
        bkg.passenger_id === currentUserId ||
        (req.user?.email && bkg.contact_email && bkg.contact_email.toLowerCase() === req.user.email.toLowerCase())
      )
    );
    const isPrivileged = Boolean(
      req.user && ['super_admin', 'travel_owner', 'manager', 'driver', 'staff'].includes(req.user.role)
    );

    const operatorName =
      bkg.operator_name ||
      bkg.travel_name ||
      bTravel?.name ||
      bBus?.operatorName ||
      bBus?.operator_name ||
      bTrip?.travel_name ||
      'SMART ROUTE Travels';

    const busNumber =
      bkg.bus_number ||
      bkg.registration_number ||
      bBus?.registration_number ||
      bBus?.bus_number ||
      '';

    const serviceNumber =
      bkg.service_number ||
      bkg.trip_number ||
      bTrip?.trip_number ||
      'SR-101';

    const bRoute = (routes || []).find((r) => r.id === bTrip?.route_id);
    const sourceCity =
      bkg.source_city ||
      bkg.source ||
      bkg.trip?.source ||
      bTrip?.source ||
      bRoute?.source ||
      'Coimbatore';

    const destinationCity =
      bkg.destination_city ||
      bkg.destination ||
      bkg.trip?.destination ||
      bTrip?.destination ||
      bRoute?.destination ||
      'Tenkasi';

    const journeyDate =
      bkg.journey_date ||
      bkg.travel_date ||
      bTrip?.departure_date ||
      'Today';

    const departureTime =
      bkg.departure_time ||
      bTrip?.departure_time ||
      '21:30';

    const arrivalTime =
      bkg.estimated_arrival_time ||
      bkg.arrival_time ||
      bTrip?.estimated_arrival_time ||
      '05:30';

    const boardingStop =
      bkg.boarding_stop_name ||
      bkg.boardingPoint ||
      bBoarding?.name ||
      bTrip?.boarding_stop_name ||
      'Boarding Point';

    const droppingStop =
      bkg.dropping_stop_name ||
      bkg.droppingPoint ||
      bDropping?.name ||
      bTrip?.dropping_stop_name ||
      'Dropping Point';

    // Mask contact info if not verified owner
    const rawMobile = bkg.contact_mobile || '';
    const rawEmail = bkg.contact_email || '';
    const maskedMobile = (isOwner || isPrivileged)
      ? rawMobile
      : (rawMobile.length > 4 ? `••••••${rawMobile.slice(-4)}` : '••••••••');
    const maskedEmail = (isOwner || isPrivileged)
      ? rawEmail
      : (rawEmail.includes('@')
          ? `${rawEmail.split('@')[0].slice(0, 1)}••••••@${rawEmail.split('@')[1]}`
          : '••••••');

    const cleanPassengers = bPassengers.map((p) => ({
      seat_number: p.seat_number || p.seatNumber,
      passenger_name: (isOwner || isPrivileged) ? (p.passenger_name || p.name) : ((p.passenger_name || p.name) ? (p.passenger_name || p.name).split(' ')[0] + ' •••' : 'Passenger'),
      passenger_age: p.passenger_age || p.age,
      passenger_gender: p.passenger_gender || p.gender,
      fare: p.fare,
      is_boarded: p.is_boarded,
    }));

    const totalFare = Number(bkg.total_fare || bkg.total_amount || 0);

    return res.json({
      success: true,
      ticket: {
        id: (isOwner || isPrivileged) ? bkg.id : undefined,
        pnr: cleanPnr,
        pnr_number: cleanPnr,
        booking_reference: cleanPnr,
        status: isCancelled ? 'cancelled' : (computedStatus === 'completed' ? 'completed' : 'confirmed'),
        booking_status: isCancelled ? 'cancelled' : (computedStatus === 'completed' ? 'completed' : 'confirmed'),
        computed_status: computedStatus,
        operator_name: operatorName,
        travel_name: operatorName,
        bus_name: bBus?.name || bBus?.bus_type || 'AC Sleeper 2+1',
        bus_number: busNumber,
        registration_number: busNumber,
        service_number: serviceNumber,
        trip_number: serviceNumber,
        source: sourceCity,
        destination: destinationCity,
        source_city: sourceCity,
        destination_city: destinationCity,
        journey_date: journeyDate,
        travel_date: journeyDate,
        departure_time: departureTime,
        arrival_time: arrivalTime,
        estimated_arrival_time: arrivalTime,
        boarding_stop_name: boardingStop,
        dropping_stop_name: droppingStop,
        seats: cleanPassengers.map((p) => p.seat_number),
        seat_numbers: cleanPassengers.map((p) => p.seat_number).join(', '),
        passengers_count: cleanPassengers.length,
        passengers: cleanPassengers,
        total_fare: totalFare,
        total_amount: totalFare,
        payment_status: isCancelled ? 'refunded' : (bkg.payment_status || 'paid'),
        contact_name: (isOwner || isPrivileged) ? bkg.contact_name : 'Valued Passenger',
        contact_mobile: maskedMobile,
        contact_email: maskedEmail,
        created_at: bkg.created_at,
        cancellation_reason: bkg.cancellation_reason || null,
        cancelled_at: bkg.cancelled_at || null,
        cancellation_fee: bkg.cancellation_fee || 0,
        refund_amount: bkg.refund_amount !== undefined ? bkg.refund_amount : (isCancelled ? Math.round(totalFare * 0.9) : 0),
        refund_status: bkg.refund_status || (isCancelled ? 'completed' : 'none'),
        refund_reference: bkg.refund_reference || (isCancelled ? `REF-${cleanPnr}` : null),
        is_owner: isOwner,
        download_url: `/api/bookings/pnr/${cleanPnr}/pdf`,
      },
    });
  } catch (err) {
    logger.error('Search booking by PNR error:', err);
    return res.status(500).json({ success: false, error: 'Failed to search booking by PNR' });
  }
}



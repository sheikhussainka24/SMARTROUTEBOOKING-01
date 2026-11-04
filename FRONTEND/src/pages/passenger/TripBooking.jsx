import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../../services/api.js';
import { validateSeatGenders, DEFAULT_SEAT_PAIRS } from '../../utils/genderAllocation.js';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import {
  Clock,
  ShieldCheck,
  MapPin,
  User,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Bus,
  Sparkles,
  Mail,
  Phone,
  BedDouble,
  Armchair,
  Check,
  Building,
  Info,
  Calendar,
  Lock,
  MessageSquare,
} from 'lucide-react';

export default function TripBooking() {
  const { tripId: paramTripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Retrieve incoming navigation state or hydrate from sessionStorage
  const [bookingState, setBookingState] = useState(() => {
    if (location.state && (location.state.busId || location.state.selectedSeats)) {
      try {
        sessionStorage.setItem('smartroute_booking_session', JSON.stringify(location.state));
      } catch (e) {
        // ignore
      }
      return location.state;
    }
    try {
      const saved = sessionStorage.getItem('smartroute_booking_session');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return location.state || {};
  });

  const tripId = bookingState.busId || paramTripId || 'trip_cbe_kkdi_01';

  // Live trip, stops, and backend inventory data
  const [trip, setTrip] = useState(bookingState.tripDetails || null);

  // Resilient fallback chain for selectedBus (Resolves ReferenceError on direct reload/checkout)
  const selectedBus = useMemo(() => {
    let parsedSessionBus = {};
    try {
      parsedSessionBus = JSON.parse(sessionStorage.getItem('smartroute_active_bus') || '{}');
    } catch (e) {
      parsedSessionBus = {};
    }

    const busCandidate =
      location.state?.selectedBus ||
      location.state?.bus ||
      location.state?.tripDetails ||
      bookingState?.selectedBus ||
      bookingState?.bus ||
      bookingState?.tripDetails ||
      trip?.bus ||
      trip ||
      parsedSessionBus;

    const baseBus = busCandidate && typeof busCandidate === 'object' ? { ...busCandidate } : {};

    // Ensure selectedBus is never undefined:
    if (!baseBus.id) {
      const fallbackBusId = new URLSearchParams(location.search).get('busId') || tripId;
      if (fallbackBusId) {
        baseBus.id = fallbackBusId;
      }
    }
    if (!baseBus.bus_number && !baseBus.busNumber) {
      baseBus.bus_number = trip?.bus_number || trip?.trip_number || bookingState?.tripNumber || 'SR-101';
    }
    if (!baseBus.originCity) {
      baseBus.originCity = bookingState?.fromCity || trip?.source || 'Coimbatore';
    }
    if (!baseBus.destinationCity) {
      baseBus.destinationCity = bookingState?.toCity || trip?.destination || 'Karaikudi';
    }

    return baseBus;
  }, [location.state, location.search, bookingState, trip, tripId]);

  const activeBus = selectedBus;
  const activeRoute = `${selectedBus.originCity || 'Coimbatore'} → ${selectedBus.destinationCity || 'Karaikudi'}`;
  const [stops, setStops] = useState([]);
  const [backendSeats, setBackendSeats] = useState([]);
  const [loading, setLoading] = useState(!bookingState.tripDetails && !trip);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Boarding & Dropping stop IDs
  const [boardingStopId, setBoardingStopId] = useState(bookingState.boardingStopId || '');
  const [droppingStopId, setDroppingStopId] = useState(bookingState.droppingStopId || '');

  // Normalized selected seats
  const selectedSeats = useMemo(() => {
    let raw =
      bookingState.selectedSeats ||
      bookingState.selectedSeatObjects ||
      bookingState.preSelectedSeatNumbers ||
      [];

    if (!Array.isArray(raw) || raw.length === 0) {
      try {
        const stored = sessionStorage.getItem('smartroute_selected_seats');
        if (stored) raw = JSON.parse(stored);
      } catch (e) {
        // ignore
      }
    }

    if (!Array.isArray(raw) || raw.length === 0) {
      return [
        {
          id: 'seat-U5',
          seat_number: 'U5',
          seat_type: 'sleeper',
          deck: 'upper',
          fare: Number(bookingState.farePerSeat || 1150),
        },
      ];
    }

    return raw.map((item, idx) => {
      if (typeof item === 'string') {
        const seatNum = item;
        const isUpper = seatNum.startsWith('U');
        const isSleeper =
          isUpper || seatNum.startsWith('SL') || seatNum.toLowerCase().includes('sleeper');
        const match = backendSeats.find((s) => s.seat_number === seatNum);

        return {
          id: match?.id || `seat-${seatNum}`,
          seat_number: seatNum,
          seat_type: match?.seat_type || (isSleeper ? 'sleeper' : 'seat'),
          deck: match?.deck || (isUpper ? 'upper' : 'lower'),
          fare: Number(match?.fare || bookingState.farePerSeat || (isSleeper ? 1150 : 850)),
        };
      }

      const seatNum = item.seat_number || item.seatNumber || `S${idx + 1}`;
      const match = backendSeats.find((s) => s.seat_number === seatNum || s.id === item.id);
      const isUpper = seatNum.startsWith('U');
      const isSleeper =
        item.seat_type === 'sleeper' ||
        isUpper ||
        seatNum.startsWith('SL') ||
        seatNum.toLowerCase().includes('sleeper');

      return {
        ...item,
        id: match?.id || item.id || `seat-${seatNum}`,
        seat_number: seatNum,
        seat_type: match?.seat_type || item.seat_type || (isSleeper ? 'sleeper' : 'seat'),
        deck: match?.deck || item.deck || (isUpper ? 'upper' : 'lower'),
        fare: Number(match?.fare || item.fare || bookingState.farePerSeat || 1150),
      };
    });
  }, [bookingState, backendSeats]);

  // Dynamic Passenger Details State (one per selected berth)
  const [passengerDetails, setPassengerDetails] = useState(() => {
    const initial = {};
    const raw =
      bookingState.selectedSeats ||
      bookingState.selectedSeatObjects ||
      bookingState.preSelectedSeatNumbers ||
      ['U5'];

    raw.forEach((s, idx) => {
      const key = typeof s === 'string' ? s : s.seat_number || s.id || `seat-${idx}`;
      initial[key] = {
        name: idx === 0 ? 'Arun Prakash' : '',
        age: idx === 0 ? '29' : '',
        gender: 'male',
      };
    });
    return initial;
  });

  // Keep passengerDetails synchronized when selectedSeats update
  useEffect(() => {
    setPassengerDetails((prev) => {
      const updated = { ...prev };
      selectedSeats.forEach((seat, idx) => {
        const key = seat.seat_number || seat.id;
        if (!updated[key]) {
          updated[key] = {
            name: idx === 0 ? prev[Object.keys(prev)[0]]?.name || 'Arun Prakash' : '',
            age: idx === 0 ? prev[Object.keys(prev)[0]]?.age || '29' : '',
            gender: 'male',
          };
        }
      });
      return updated;
    });
  }, [selectedSeats]);

  // Primary Contact & Dispatch
  const [contact, setContact] = useState({
    name: 'Arun Prakash',
    email: 'passenger@smartroute.in',
    mobile: '9000000006',
    whatsappOptIn: true,
  });

  // Business GST Invoice (Optional)
  const [useGst, setUseGst] = useState(false);
  const [gstDetails, setGstDetails] = useState({
    companyName: '',
    gstin: '',
  });

  // Fetch live trip details and stops for route verification
  useEffect(() => {
    let isMounted = true;
    async function loadTripAndStops() {
      if (!tripId) return;
      try {
        const queryParams = new URLSearchParams();
        if (boardingStopId) queryParams.set('boardingStopId', boardingStopId);
        if (droppingStopId) queryParams.set('droppingStopId', droppingStopId);
        const qStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

        const [tripRes, stopsRes, seatsRes] = await Promise.allSettled([
          api.get(`/trips/${tripId}`),
          api.get(`/trips/${tripId}/stops`),
          api.get(`/seats/trip/${tripId}${qStr}`),
        ]);

        if (!isMounted) return;

        if (tripRes.status === 'fulfilled' && tripRes.value?.success && tripRes.value?.trip) {
          setTrip((prev) => ({ ...tripRes.value.trip, ...prev }));
        }

        if (stopsRes.status === 'fulfilled' && stopsRes.value?.success && stopsRes.value?.stops) {
          const loadedStops = stopsRes.value.stops;
          setStops(loadedStops);

          // Resolve boarding stop ID if not already selected
          if (!boardingStopId) {
            const bp = bookingState.boardingPoint;
            const bpName = typeof bp === 'object' ? bp?.name || bp?.stop_name : bp;
            const foundBoarding =
              loadedStops.find(
                (s) =>
                  s.is_boarding_point &&
                  (s.id === bookingState.boardingStopId ||
                    (bpName &&
                      (s.name?.toLowerCase().includes(bpName.toLowerCase()) ||
                        s.stop_name?.toLowerCase().includes(bpName.toLowerCase()))))
              ) || loadedStops.find((s) => s.is_boarding_point);

            if (foundBoarding) setBoardingStopId(foundBoarding.id);
          }

          // Resolve dropping stop ID if not already selected
          if (!droppingStopId) {
            const dp = bookingState.droppingPoint;
            const dpName = typeof dp === 'object' ? dp?.name || dp?.stop_name : dp;
            const foundDropping =
              loadedStops.find(
                (s) =>
                  s.is_dropping_point &&
                  (s.id === bookingState.droppingStopId ||
                    (dpName &&
                      (s.name?.toLowerCase().includes(dpName.toLowerCase()) ||
                        s.stop_name?.toLowerCase().includes(dpName.toLowerCase()))))
              ) || loadedStops.filter((s) => s.is_dropping_point).slice(-1)[0];

            if (foundDropping) setDroppingStopId(foundDropping.id);
          }
        }

        if (seatsRes.status === 'fulfilled') {
          const res = seatsRes.value;
          if (res?.success && (res?.data?.seats || res?.seats)) {
            setBackendSeats(res.data?.seats || res.seats);
          }
        }
      } catch (err) {
        console.warn('Background sync for trip details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadTripAndStops();
    return () => {
      isMounted = false;
    };
  }, [tripId, boardingStopId, droppingStopId]);

  // Field change handler per passenger
  const handlePassengerChange = (seatKey, field, value) => {
    setPassengerDetails((prev) => ({
      ...prev,
      [seatKey]: {
        ...prev[seatKey],
        [field]: value,
      },
    }));
  };

  // Fare calculations
  const farePerSeat = useMemo(() => {
    return Number(
      bookingState.farePerSeat ||
        selectedSeats[0]?.fare ||
        trip?.base_sleeper_fare ||
        trip?.base_fare ||
        1150
    );
  }, [bookingState, selectedSeats, trip]);

  const subtotal = useMemo(() => {
    if (selectedSeats.length > 0) {
      return selectedSeats.reduce((sum, s) => sum + Number(s.fare || farePerSeat), 0);
    }
    return Number(bookingState.baseFareSubtotal || bookingState.subtotal || bookingState.totalAmount || farePerSeat);
  }, [selectedSeats, farePerSeat, bookingState]);

  const gstAmount = Math.round(subtotal * 0.05);
  const discountAmount = Number(bookingState.discount || 0);

  const totalPayable = useMemo(() => {
    if (bookingState.totalPayable && Number(bookingState.totalPayable) > 0) {
      return Number(bookingState.totalPayable);
    }
    if (bookingState.totalAmount && Number(bookingState.totalAmount) > 0) {
      return Number(bookingState.totalAmount);
    }
    return Math.max(0, subtotal + gstAmount - discountAmount);
  }, [bookingState, subtotal, gstAmount, discountAmount]);

  // Display metadata
  const operatorName =
    selectedBus?.travelName ||
    bookingState.operatorName ||
    trip?.travel_name ||
    trip?.travelName ||
    'SMART ROUTE Travels';
  const serviceNumber =
    selectedBus?.bus_number ||
    selectedBus?.busNumber ||
    bookingState.serviceNumber ||
    trip?.trip_number ||
    trip?.bus_number ||
    'SR-101';
  const travelDate =
    bookingState.travelDate ||
    trip?.travel_date ||
    trip?.journey_date ||
    new Date().toISOString().split('T')[0];
  const departureTime = selectedBus?.departure_time || trip?.departure_time || '21:30';
  const arrivalTime = selectedBus?.estimated_arrival_time || trip?.estimated_arrival_time || '03:45';
  const fromCity = selectedBus?.originCity || trip?.from_city || trip?.fromCity || 'Coimbatore';
  const toCity = selectedBus?.destinationCity || trip?.to_city || trip?.toCity || 'Karaikudi';

  // Boarding & Dropping formatted label
  const boardingDisplayName = useMemo(() => {
    if (boardingStopId && stops.length > 0) {
      const s = stops.find((item) => item.id === boardingStopId);
      if (s) return `${s.name || s.stop_name} (${s.city}) ${s.arrival_time ? `• ${s.arrival_time}` : ''}`;
    }
    if (bookingState.boardingPoint) {
      return typeof bookingState.boardingPoint === 'object'
        ? bookingState.boardingPoint.name || bookingState.boardingPoint.stop_name || 'Boarding Point'
        : bookingState.boardingPoint;
    }
    return trip?.boarding_stop_name || 'Gandhipuram Omni Bus Stand (09:30 PM)';
  }, [boardingStopId, stops, bookingState, trip]);

  const droppingDisplayName = useMemo(() => {
    if (droppingStopId && stops.length > 0) {
      const s = stops.find((item) => item.id === droppingStopId);
      if (s) return `${s.name || s.stop_name} (${s.city}) ${s.arrival_time ? `• ${s.arrival_time}` : ''}`;
    }
    if (bookingState.droppingPoint) {
      return typeof bookingState.droppingPoint === 'object'
        ? bookingState.droppingPoint.name || bookingState.droppingPoint.stop_name || 'Dropping Point'
        : bookingState.droppingPoint;
    }
    return trip?.dropping_stop_name || 'Karaikudi New Bus Stand (03:45 AM)';
  }, [droppingStopId, stops, bookingState, trip]);

  // Form Submission
  const handleProceedBooking = async (e) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      alert('Please select at least one berth to proceed.');
      return;
    }

    // Validate that all passengers have name and age
    for (let i = 0; i < selectedSeats.length; i++) {
      const seat = selectedSeats[i];
      const key = seat.seat_number || seat.id;
      const p = passengerDetails[key];
      if (!p?.name?.trim()) {
        alert(`Please enter the full name for Passenger ${i + 1} (${seat.seat_number}).`);
        return;
      }
      if (!p?.age || Number(p.age) <= 0) {
        alert(`Please enter a valid age for Passenger ${i + 1} (${seat.seat_number}).`);
        return;
      }
    }

    setSubmitting(true);
    setError(null);

    try {
      const passengerList = selectedSeats.map((seat, index) => {
        const key = seat.seat_number || seat.id;
        const p = passengerDetails[key] || {};
        return {
          seatId: seat.id || `seat-${seat.seat_number}`,
          seatNumber: seat.seat_number,
          name: p.name || (index === 0 ? contact.name : `Passenger ${index + 1}`),
          age: parseInt(p.age || '28', 10),
          gender: p.gender || 'male',
          fare: Number(seat.fare || farePerSeat),
        };
      });

      // Commercial Bus Gender Allocation Validation (Adjacent seat quota check)
      const genderValidation = validateSeatGenders(passengerList, DEFAULT_SEAT_PAIRS, backendSeats);
      if (!genderValidation.valid) {
        setError(genderValidation.message);
        setSubmitting(false);
        return;
      }

      const activeBus = selectedBus || (() => {
        try {
          return JSON.parse(sessionStorage.getItem('smartroute_active_bus') || '{}');
        } catch (e) {
          return {};
        }
      })();

      if (!activeBus?.id) {
        console.error("CRITICAL: Active bus ID is missing!");
      }

      const selectedDate = travelDate || bookingState?.travelDate || bookingState?.journeyDate || activeBus.journeyDate || new Date().toISOString().split('T')[0];
      const selectedBoarding = stops.find((s) => s.id === boardingStopId);
      const selectedDropping = stops.find((s) => s.id === droppingStopId);
      const selectedBoardingPoint = selectedBoarding?.name || bookingState?.boardingPoint || activeBus.boardingPoint || 'Boarding Point';
      const selectedDroppingPoint = selectedDropping?.name || bookingState?.droppingPoint || activeBus.droppingPoint || 'Dropping Point';

      const payload = {
        busId: activeBus.id,
        tripId: tripId || activeBus.tripId || activeBus.id,
        operatorName: activeBus.operator_name || activeBus.operatorName || activeBus.travel_name || activeBus.travelName,
        serviceNumber: activeBus.service_number || activeBus.serviceNumber || activeBus.trip_number || activeBus.bus_number,
        busNumber: activeBus.registration_number || activeBus.busNumber || activeBus.bus_number,
        departureTime: activeBus.departure_time || activeBus.departureTime,
        arrivalTime: activeBus.arrival_time || activeBus.arrivalTime || activeBus.estimated_arrival_time,
        originCity: activeBus.origin_city || activeBus.originCity || fromCity,
        destinationCity: activeBus.destination_city || activeBus.destinationCity || toCity,
        journeyDate: selectedDate,
        boardingPoint: selectedBoardingPoint,
        droppingPoint: selectedDroppingPoint,
        boardingStopId: boardingStopId || 'stop_cbe_01',
        droppingStopId: droppingStopId || 'stop_kkdi_03',
        seats: passengerList.map((p) => p.seatNumber || p.seatId),
        seatIds: passengerList.map((p) => p.seatId),
        passengers: passengerList,
        totalAmount: totalPayable,
        contactMobile: contact.mobile,
        contactEmail: contact.email,
        passengerContact: {
          name: passengerList[0]?.name || contact.name,
          email: contact.email,
          mobile: contact.mobile,
        },
        specialRequests: [
          contact.whatsappOptIn ? 'WhatsApp Dispatch Enabled' : null,
          useGst && gstDetails.gstin ? `GSTIN: ${gstDetails.gstin} (${gstDetails.companyName})` : null,
        ]
          .filter(Boolean)
          .join(' | '),
      };

      const res = await api.post('/bookings', payload);
      const booking = res.booking || res.data?.booking;

      if (res.success && booking) {
        // Clear active session storage after successful booking confirmation
        try {
          sessionStorage.removeItem('smartroute_booking_session');
          sessionStorage.removeItem('smartroute_active_bus');
          sessionStorage.removeItem('smartroute_selected_seats');
          sessionStorage.removeItem('smartroute_boarding_point');
          sessionStorage.removeItem('smartroute_dropping_point');
        } catch (e) {
          // ignore
        }
        const pnr = booking.pnr_number || booking.pnr || booking.bookingNumber;
        navigate(`/booking-success/${pnr}`, {
          state: {
            booking: {
              ...booking,
              travelDate,
              travel_date: travelDate,
              journey_date: travelDate,
              departure_date: travelDate,
            },
            selectedBus,
            bookingState: {
              ...bookingState,
              travelDate,
              journeyDate: travelDate,
              selectedBus,
            },
          },
        });
      } else {
        throw new Error(res.error || 'Failed to complete booking reservation.');
      }
    } catch (err) {
      setError(err.message || 'Error processing reservation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: 80,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <BrandLogo variant="icon" size="lg" showText={false} />
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--sr-text-secondary)' }}>
          Preparing Passenger Details & Reservation...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', padding: '16px 20px 48px' }}>
      {/* Checkout Progress Stepper */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#FFFFFF',
          border: '1.5px solid #F1EDFA',
          borderRadius: 14,
          padding: '12px 20px',
          marginBottom: 24,
          boxShadow: '0 2px 8px rgba(36, 21, 45, 0.03)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            ✓
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>
            1. Seat Selection
          </span>
        </div>

        <div style={{ height: 1, width: 32, background: '#E7A0BF' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: '#C13D78',
              color: '#FFFFFF',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            2
          </span>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#C13D78' }}>
            2. Passenger Details
          </span>
        </div>

        <div style={{ height: 1, width: 32, background: '#F1EDFA' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6 }}>
          <span
            style={{
              background: '#F1EDFA',
              color: '#6E5D73',
              width: 24,
              height: 24,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            3
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6E5D73' }}>
            3. Payment & Dispatch
          </span>
        </div>
      </div>

      <div className="passenger-checkout-grid">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: DYNAMIC PASSENGER DETAILS FORM                              */}
        {/* ========================================================================= */}
        <form
          id="passenger-checkout-form"
          onSubmit={handleProceedBooking}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* 1. Trip & Coach Summary Header Card */}
          <div
            className="sr-card"
            style={{
              padding: 22,
              background: '#FFFFFF',
              border: '1.5px solid #F1EDFA',
              borderRadius: 16,
              boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="badge badge-success" style={{ fontSize: 11, fontWeight: 800 }}>
                    OPERATOR VERIFIED
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--sr-text-secondary)', fontWeight: 600 }}>
                    Service #{serviceNumber}
                  </span>
                  <span
                    style={{
                      background: '#FFF1F6',
                      border: '1px solid #E7A0BF',
                      color: '#C13D78',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    Tata Capella 2+1 AC Sleeper
                  </span>
                </div>

                <h1
                  style={{
                    fontSize: 22,
                    color: '#24152D',
                    margin: '10px 0 4px',
                    fontWeight: 800,
                  }}
                >
                  {operatorName}
                </h1>

                <div style={{ fontSize: 13, color: '#6E5D73', fontWeight: 500 }}>
                  {fromCity} ➔ {toCity} &bull;{' '}
                  <span style={{ color: '#24152D', fontWeight: 700 }}>
                    {new Date(travelDate).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#6E5D73', fontWeight: 600 }}>Departure</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#24152D' }}>{departureTime}</div>
                <Link
                  to={`/book/${tripId}?date=${encodeURIComponent(travelDate)}&fromCity=${encodeURIComponent(fromCity)}&toCity=${encodeURIComponent(toCity)}`}
                  state={bookingState}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 12,
                    color: '#C13D78',
                    fontWeight: 700,
                    marginTop: 6,
                    textDecoration: 'none',
                  }}
                >
                  <ArrowLeft size={13} /> Change Seats
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Dynamic Passenger Cards per Selected Berth */}
          <div
            className="sr-card"
            style={{
              padding: 24,
              background: '#FFFFFF',
              border: '1.5px solid #F1EDFA',
              borderRadius: 16,
              boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  color: '#24152D',
                  fontWeight: 800,
                  margin: '0 0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <User size={18} color="#C13D78" /> Passenger Details
              </h2>
              <p style={{ fontSize: 13, color: '#6E5D73', margin: 0 }}>
                Please enter traveler details matching valid government photo ID for each reserved berth.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {selectedSeats.map((seat, index) => {
                const key = seat.seat_number || seat.id;
                const details = passengerDetails[key] || { name: '', age: '', gender: 'male' };
                const isSleeper = seat.seat_type === 'sleeper';
                const isUpper = seat.deck === 'upper' || seat.seat_number?.startsWith('U');

                return (
                  <div
                    key={key}
                    style={{
                      background: '#FFF9FB',
                      border: '1.5px solid #F1EDFA',
                      borderRadius: 14,
                      padding: 18,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    {/* Berth Identifier Badge Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                        borderBottom: '1px solid #F1EDFA',
                        paddingBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            background: '#C13D78',
                            color: '#FFFFFF',
                            padding: '4px 12px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                          }}
                        >
                          Berth {seat.seat_number}
                        </span>

                        <span
                          style={{
                            background: '#FFF1F6',
                            border: '1px solid #E7A0BF',
                            color: '#C13D78',
                            padding: '3px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {isSleeper ? <BedDouble size={12} /> : <Armchair size={12} />}
                          {isUpper ? 'Upper Deck Sleeper' : isSleeper ? 'Lower Deck Sleeper' : 'Pushback Seat'}
                        </span>
                      </div>

                      <div style={{ fontSize: 13, color: '#6E5D73', fontWeight: 600 }}>
                        Passenger {index + 1} of {selectedSeats.length} &bull;{' '}
                        <strong style={{ color: '#24152D' }}>₹{seat.fare || farePerSeat}</strong>
                      </div>
                    </div>

                    {/* Inputs: Full Name, Age, Gender */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(180px, 1.8fr) minmax(90px, 0.9fr) minmax(160px, 1.3fr)',
                        gap: 12,
                      }}
                      className="passenger-inputs-row"
                    >
                      {/* Full Name */}
                      <div>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#24152D',
                            display: 'block',
                            marginBottom: 6,
                          }}
                        >
                          Full Name *
                        </label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g. Arun Prakash"
                          value={details.name}
                          onChange={(e) => handlePassengerChange(key, 'name', e.target.value)}
                          required
                          style={{
                            height: 42,
                            fontSize: 13,
                            background: '#FFFFFF',
                            borderColor: '#E7A0BF',
                          }}
                        />
                      </div>

                      {/* Age */}
                      <div>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#24152D',
                            display: 'block',
                            marginBottom: 6,
                          }}
                        >
                          Age *
                        </label>
                        <input
                          type="number"
                          className="input-field"
                          placeholder="Years"
                          min="1"
                          max="120"
                          value={details.age}
                          onChange={(e) => handlePassengerChange(key, 'age', e.target.value)}
                          required
                          style={{
                            height: 42,
                            fontSize: 13,
                            background: '#FFFFFF',
                            borderColor: '#E7A0BF',
                          }}
                        />
                      </div>

                      {/* Gender Selector */}
                      <div>
                        <label
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#24152D',
                            display: 'block',
                            marginBottom: 6,
                          }}
                        >
                          Gender *
                        </label>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {['male', 'female'].map((g) => {
                            const isSelected = (details.gender || 'male') === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => handlePassengerChange(key, 'gender', g)}
                                style={{
                                  flex: 1,
                                  height: 42,
                                  borderRadius: 8,
                                  border: isSelected ? '1.5px solid #C13D78' : '1.5px solid #E7A0BF',
                                  background: isSelected ? '#C13D78' : '#FFFFFF',
                                  color: isSelected ? '#FFFFFF' : '#24152D',
                                  fontSize: 12,
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  textTransform: 'capitalize',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Boarding & Dropping Points Verification */}
          <div
            className="sr-card"
            style={{
              padding: 24,
              background: '#FFFFFF',
              border: '1.5px solid #F1EDFA',
              borderRadius: 16,
              boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  color: '#24152D',
                  fontWeight: 800,
                  margin: '0 0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <MapPin size={18} color="#C13D78" /> Boarding & Dropping Stops
              </h2>
              <p style={{ fontSize: 13, color: '#6E5D73', margin: 0 }}>
                Verify your exact pickup and drop-off points for live driver tracking.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(240px, 1fr) minmax(240px, 1fr)',
                gap: 16,
              }}
              className="boarding-dropping-grid"
            >
              {/* Pickup Point */}
              <div
                style={{
                  background: '#FFF9FB',
                  border: '1.5px solid #F1EDFA',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <MapPin size={14} color="#059669" /> Boarding Point (Pickup)
                </div>

                {stops.filter((s) => s.is_boarding_point).length > 0 ? (
                  <select
                    className="input-field"
                    value={boardingStopId}
                    onChange={(e) => setBoardingStopId(e.target.value)}
                    required
                    style={{ background: '#FFFFFF', height: 42, fontSize: 13 }}
                  >
                    {stops
                      .filter((s) => s.is_boarding_point)
                      .map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.stop_name || stop.name} ({stop.city}){' '}
                          {stop.arrival_time ? `• ${stop.arrival_time}` : ''}
                        </option>
                      ))}
                  </select>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#24152D' }}>
                    {boardingDisplayName}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#6E5D73' }}>
                  Please arrive at pickup 15 mins before scheduled departure.
                </div>
              </div>

              {/* Dropping Point */}
              <div
                style={{
                  background: '#FFF9FB',
                  border: '1.5px solid #F1EDFA',
                  borderRadius: 12,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#C13D78',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <MapPin size={14} color="#C13D78" /> Dropping Point (Dropoff)
                </div>

                {stops.filter((s) => s.is_dropping_point).length > 0 ? (
                  <select
                    className="input-field"
                    value={droppingStopId}
                    onChange={(e) => setDroppingStopId(e.target.value)}
                    required
                    style={{ background: '#FFFFFF', height: 42, fontSize: 13 }}
                  >
                    {stops
                      .filter((s) => s.is_dropping_point)
                      .map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.stop_name || stop.name} ({stop.city}){' '}
                          {stop.arrival_time ? `• ${stop.arrival_time}` : ''}
                        </option>
                      ))}
                  </select>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#24152D' }}>
                    {droppingDisplayName}
                  </div>
                )}
                <div style={{ fontSize: 11, color: '#6E5D73' }}>
                  Expected arrival: ~{arrivalTime} Direct Express corridor.
                </div>
              </div>
            </div>
          </div>

          {/* 4. Primary Contact & E-Ticket Dispatch */}
          <div
            className="sr-card"
            style={{
              padding: 24,
              background: '#FFFFFF',
              border: '1.5px solid #F1EDFA',
              borderRadius: 16,
              boxShadow: '0 4px 16px rgba(36, 21, 45, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 18,
                  color: '#24152D',
                  fontWeight: 800,
                  margin: '0 0 4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Mail size={18} color="#C13D78" /> Contact & E-Ticket Dispatch
              </h2>
              <p style={{ fontSize: 13, color: '#6E5D73', margin: 0 }}>
                Your confirmed booking ticket, PNR, and driver contact will be delivered instantly.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(200px, 1fr) minmax(200px, 1fr)',
                gap: 14,
              }}
              className="contact-inputs-grid"
            >
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#24152D',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="passenger@smartroute.in"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    required
                    style={{ height: 42, fontSize: 13, background: '#FFFFFF' }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#24152D',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  Mobile Number *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="9000000006"
                    value={contact.mobile}
                    onChange={(e) => setContact({ ...contact, mobile: e.target.value })}
                    required
                    style={{ height: 42, fontSize: 13, background: '#FFFFFF' }}
                  />
                </div>
              </div>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontSize: 13,
                color: '#24152D',
                fontWeight: 600,
                marginTop: 4,
              }}
            >
              <input
                type="checkbox"
                checked={contact.whatsappOptIn}
                onChange={(e) => setContact({ ...contact, whatsappOptIn: e.target.checked })}
                style={{ width: 16, height: 16, accentColor: '#C13D78' }}
              />
              Send instant booking confirmation and live GPS radar link to WhatsApp
            </label>
          </div>

          {/* 5. Business GST Details (Optional) */}
          <div
            className="sr-card"
            style={{
              padding: 18,
              background: '#FFFFFF',
              border: '1.5px solid #F1EDFA',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 700,
                color: '#24152D',
              }}
            >
              <input
                type="checkbox"
                checked={useGst}
                onChange={(e) => setUseGst(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: '#C13D78' }}
              />
              <Building size={16} color="#6E5D73" /> I have a GST number for business tax invoice
              (Optional)
            </label>

            {useGst && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginTop: 6,
                  paddingTop: 12,
                  borderTop: '1px solid #F1EDFA',
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6E5D73',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    Registered Company Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Acme Technologies Pvt Ltd"
                    value={gstDetails.companyName}
                    onChange={(e) => setGstDetails({ ...gstDetails, companyName: e.target.value })}
                    style={{ height: 40, fontSize: 13 }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#6E5D73',
                      display: 'block',
                      marginBottom: 4,
                    }}
                  >
                    15-Digit GSTIN
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="33AAAAA0000A1Z5"
                    value={gstDetails.gstin}
                    onChange={(e) => setGstDetails({ ...gstDetails, gstin: e.target.value })}
                    style={{ height: 40, fontSize: 13 }}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: BOOKING SUMMARY, STICKY FARE BREAKDOWN & CHECKOUT CTA      */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            className="sr-card"
            style={{
              padding: 24,
              background: '#FFFFFF',
              border: '1.5px solid #F1EDFA',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(36, 21, 45, 0.05)',
              position: 'sticky',
              top: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div style={{ borderBottom: '1px solid #F1EDFA', paddingBottom: 14 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#C13D78',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 4,
                }}
              >
                Booking Overview
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#24152D', margin: 0 }}>
                {operatorName}
              </h2>
              <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 3 }}>
                Service #{serviceNumber} &bull; TATA Capella AC Sleeper
              </div>
            </div>

            {/* Selected Berths Badges */}
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: '#6E5D73',
                  fontWeight: 600,
                  marginBottom: 8,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Selected Berths ({selectedSeats.length}):</span>
                <span style={{ color: '#C13D78', fontWeight: 800 }}>
                  ₹{farePerSeat} / berth
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedSeats.map((seat) => (
                  <span
                    key={seat.seat_number || seat.id}
                    style={{
                      background: '#FFF1F6',
                      border: '1.5px solid #E7A0BF',
                      color: '#C13D78',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 800,
                    }}
                  >
                    {seat.seat_number}
                  </span>
                ))}
              </div>
            </div>

            {/* Boarding & Dropping Compact Review */}
            <div
              style={{
                background: '#FFF9FB',
                border: '1px solid #F1EDFA',
                borderRadius: 10,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#10B981',
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: '#6E5D73' }}>
                  <strong style={{ color: '#24152D' }}>Boarding:</strong> {boardingDisplayName}
                </span>
              </div>
              <div style={{ fontSize: 12, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#C13D78',
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                <span style={{ color: '#6E5D73' }}>
                  <strong style={{ color: '#24152D' }}>Dropping:</strong> {droppingDisplayName}
                </span>
              </div>
            </div>

            {/* Fare Breakdown */}
            <div
              style={{
                background: '#FFF1F6',
                border: '1.5px solid #E7A0BF',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: '#6E5D73',
                }}
              >
                <span>
                  Base Fare ({selectedSeats.length} berth{selectedSeats.length > 1 ? 's' : ''})
                </span>
                <span style={{ color: '#24152D', fontWeight: 700 }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              {/* Itemized list of seats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '2px 0' }}>
                {selectedSeats.map((seat) => (
                  <div
                    key={seat.seat_number || seat.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: '#6E5D73',
                    }}
                  >
                    <span>
                      • Berth <strong>{seat.seat_number}</strong> ({seat.seat_type === 'sleeper' ? 'Sleeper' : 'Pushback'})
                    </span>
                    <span style={{ fontWeight: 600, color: '#24152D' }}>
                      ₹{seat.fare || farePerSeat}
                    </span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: '#6E5D73',
                }}
              >
                <span>Integrated GST (5%)</span>
                <span style={{ color: '#24152D', fontWeight: 700 }}>₹{gstAmount.toLocaleString('en-IN')}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: discountAmount > 0 ? '#059669' : '#6E5D73',
                }}
              >
                <span>Discount</span>
                <span style={{ fontWeight: 700 }}>
                  {discountAmount > 0 ? `-₹${discountAmount.toLocaleString('en-IN')}` : '₹0'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: '#059669',
                }}
              >
                <span>Online Booking Fee</span>
                <span style={{ fontWeight: 800 }}>FREE</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderTop: '1px solid #E7A0BF',
                  paddingTop: 12,
                  marginTop: 2,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#24152D' }}>
                    Total Payable
                  </div>
                  <div style={{ fontSize: 11, color: '#6E5D73' }}>Inclusive of all taxes</div>
                </div>
                <div
                  style={{
                    color: '#C13D78',
                    fontSize: 26,
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                  }}
                >
                  ₹{totalPayable}
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#DC2626',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Primary Submit CTA */}
            <button
              type="submit"
              form="passenger-checkout-form"
              className="btn btn-primary"
              style={{
                width: '100%',
                height: 50,
                fontSize: 16,
                fontWeight: 800,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(193, 61, 120, 0.28)',
              }}
              disabled={submitting || selectedSeats.length === 0}
            >
              {submitting ? (
                <>Confirming Reservation...</>
              ) : (
                <>
                  <Lock size={16} /> Confirm & Pay ₹{totalPayable}
                </>
              )}
            </button>

            {/* Security Trust Badges */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingTop: 8,
                borderTop: '1px solid #F1EDFA',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  color: '#6E5D73',
                  fontWeight: 600,
                }}
              >
                <ShieldCheck size={14} color="#10B981" /> 256-Bit SSL Encrypted Secure Payment
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  color: '#6E5D73',
                  fontWeight: 600,
                }}
              >
                <Clock size={14} color="#C13D78" /> Instant PNR Generation & Driver Radar Tracking
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 11,
                  color: '#6E5D73',
                  fontWeight: 600,
                }}
              >
                <CheckCircle2 size={14} color="#10B981" /> 100% Refundable per Cancellation Policy
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

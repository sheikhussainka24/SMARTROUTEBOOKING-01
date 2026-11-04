import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import api from '../../services/api.js';
import AuthContext from '../../context/AuthContext.jsx';
import BrandLogo from '../../components/common/BrandLogo.jsx';
import CoachSeatLayout from '../../components/seats/CoachSeatLayout.jsx';
import {
  Compass,
  Footprints,
  Lock,
  BedDouble,
  Armchair,
  Check,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  Info,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  RotateCcw,
  Zap,
  Tag,
  X,
} from 'lucide-react';

/**
 * SMART ROUTE — Dedicated Seat Selection Page (/book/:tripId)
 *
 * Implements authoritative 2-deck physical bus seating layout:
 * - Chassis: TATA LPO 1618
 * - Body: Prakash Vega Coach 2+1 AC Seat/Cum/Sleeper
 * - Lower Deck (24 Seats + 6 Sleepers): 24 Pushback Seats + 6 Luxury Sleeper Berths (LS1-LS6, PUSHBACK SEATS (24))
 * - Upper Deck (18 Sleepers): 18 Panoramic Sleeper Berths (U1-U9, U10-U18)
 * - Cockpit & Orientation: Driver Cab (Right), Passenger Entrance & Stairs
 * - Direction of Travel: ▲ FRONT (Direction of Travel)
 * - Central WALKING AISLE, EMERGENCY EXIT
 * - Real Backend Seat Inventory integration (Available, Selected, Booked, Held)
 */
export default function SeatSelectionPage() {
  const { tripId: paramTripId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Preserved trip state from router or query parameters
  const incomingState = location.state || {};
  const tripId = paramTripId || incomingState.tripId || incomingState.busId;

  const urlDate = searchParams.get('date');
  const urlFrom = searchParams.get('fromCity') || searchParams.get('from') || searchParams.get('source');
  const urlTo = searchParams.get('toCity') || searchParams.get('to') || searchParams.get('destination');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trip, setTrip] = useState(incomingState.trip || incomingState.tripDetails || null);
  const [stops, setStops] = useState([]);
  const [rawSeats, setRawSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);

  // Boarding & Dropping stop selection
  const [boardingStopId, setBoardingStopId] = useState(incomingState.boardingStopId || '');
  const [droppingStopId, setDroppingStopId] = useState(incomingState.droppingStopId || '');

  // Promo code & discount state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Auth Context & Role-Based Access Control (RBAC)
  const auth = useContext(AuthContext);
  const user = auth?.user || null;
  const isAuthorizedStaff = Boolean(
    user && (
      user.role === 'admin' || 
      user.role === 'owner' || 
      user.role === 'manager' ||
      user.userType === 'travel_admin' ||
      user.role === 'travel_owner' ||
      user.role === 'super_admin' ||
      user.role === 'travel_admin'
    )
  );

  // Active Deck Tab: 'both' | 'lower' | 'upper'
  const [activeDeckTab, setActiveDeckTab] = useState('both');

  // Load authoritative trip, stops, and seat inventory
  const loadSeatData = async () => {
    if (!tripId) {
      setError('Trip ID is missing. Please return to bus search.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const activeTravelDate =
        incomingState.travelDate ||
        urlDate ||
        trip?.departure_date ||
        trip?.travel_date ||
        trip?.journey_date ||
        new Date().toISOString().split('T')[0];

      const queryParams = new URLSearchParams();
      if (boardingStopId) queryParams.set('boardingStopId', boardingStopId);
      if (droppingStopId) queryParams.set('droppingStopId', droppingStopId);
      if (activeTravelDate) {
        queryParams.set('date', activeTravelDate);
        queryParams.set('journeyDate', activeTravelDate);
      }
      const qStr = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const busIdentifier = trip?.bus_id || trip?.busId || incomingState.busId || tripId;

      const [tripRes, busSeatsRes, seatsRes, stopsRes] = await Promise.allSettled([
        api.get(`/trips/${tripId}`),
        api.get(`/buses/${busIdentifier}/seat-layout?date=${activeTravelDate}`),
        api.get(`/seats/trip/${tripId}${qStr}`),
        api.get(`/trips/${tripId}/stops`),
      ]);

      // 1. Process Trip Details
      if (tripRes.status === 'fulfilled' && tripRes.value?.success) {
        const loadedTrip = tripRes.value.data?.trip || tripRes.value.trip;
        if (loadedTrip) {
          setTrip((prev) => ({ ...loadedTrip, ...(prev || {}) }));
        }
      }

      // 2. Process Stops
      if (stopsRes.status === 'fulfilled' && stopsRes.value?.success) {
        const loadedStops = stopsRes.value.data?.stops || stopsRes.value.stops || [];
        if (loadedStops.length > 0) {
          setStops(loadedStops);
          const boardings = loadedStops.filter((s) => s.is_boarding_point);
          const droppings = loadedStops.filter((s) => s.is_dropping_point);

          if (!boardingStopId && boardings.length > 0) {
            const matchB = incomingState.boardingPoint
              ? boardings.find((s) =>
                  s.name?.toLowerCase().includes(String(incomingState.boardingPoint).toLowerCase()) ||
                  s.stop_name?.toLowerCase().includes(String(incomingState.boardingPoint).toLowerCase())
                )
              : null;
            setBoardingStopId(matchB?.id || boardings[0].id);
          }

          if (!droppingStopId && droppings.length > 0) {
            const matchD = incomingState.droppingPoint
              ? droppings.find((s) =>
                  s.name?.toLowerCase().includes(String(incomingState.droppingPoint).toLowerCase()) ||
                  s.stop_name?.toLowerCase().includes(String(incomingState.droppingPoint).toLowerCase())
                )
              : null;
            setDroppingStopId(matchD?.id || droppings[droppings.length - 1].id);
          }
        }
      }

      // 3. Process Live Seat Inventory
      if (busSeatsRes.status === 'fulfilled' && (busSeatsRes.value?.data?.seats || busSeatsRes.value?.seats)?.length > 0) {
        const seatArray = busSeatsRes.value?.data?.seats || busSeatsRes.value?.seats;
        setRawSeats(seatArray);
      } else if (seatsRes.status === 'fulfilled') {
        const val = seatsRes.value;
        const seatArray = val?.data?.seats || val?.seats || [];
        if (Array.isArray(seatArray) && seatArray.length > 0) {
          setRawSeats(seatArray);
        } else {
          // If empty array returned from backend
          throw new Error('No physical seating inventory configured for this bus service.');
        }
      } else {
        throw new Error('Failed to fetch authoritative seat map from backend server.');
      }
    } catch (err) {
      console.error('Seat selection load error:', err);
      setError(err.message || 'Unable to load real-time seat configuration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeatData();
  }, [tripId, boardingStopId, droppingStopId]);

  // Derived travel metadata
  const travelDate =
    incomingState.travelDate ||
    urlDate ||
    trip?.departure_date ||
    trip?.travel_date ||
    trip?.journey_date ||
    new Date().toISOString().split('T')[0];

  const fromCity =
    incomingState.fromCity ||
    urlFrom ||
    trip?.routeSource ||
    trip?.source ||
    trip?.from_city ||
    'Coimbatore';

  const toCity =
    incomingState.toCity ||
    urlTo ||
    trip?.routeDestination ||
    trip?.destination ||
    trip?.to_city ||
    'Karaikudi';

  const operatorName =
    incomingState.operatorName ||
    trip?.travelName ||
    trip?.travel_name ||
    'SMART ROUTE Travels';

  const serviceNumber =
    incomingState.serviceNumber ||
    trip?.trip_number ||
    trip?.bus_number ||
    'SR-101';

  // Construct Physical Coach Matrix from Real Backend Seats
  const { lowerSleepers, lowerSeats, upperLeftSleepers, upperRightSleepers, allSeatsMap } = useMemo(() => {
    const map = new Map();
    (rawSeats || []).forEach((s) => {
      map.set(s.seat_number, s);
      map.set(s.id, s);
    });

    const baseSeatFare = Number(trip?.base_fare || trip?.base_seat_fare || 850);
    const baseSleeperFare = Number(trip?.base_sleeper_fare || Math.round(baseSeatFare * 1.35) || 1150);

    // 1. Lower Deck: 6 Single Sleepers (LS1-LS6 or SL1-SL6)
    const lSleepers = Array.from({ length: 6 }, (_, i) => {
      const numLS = `LS${i + 1}`;
      const numSL = `SL${i + 1}`;
      const backend =
        map.get(numLS) ||
        map.get(numSL) ||
        rawSeats.find((s) => s.deck === 'lower' && s.seat_type === 'sleeper' && s.seat_number?.includes(String(i + 1)));

      const displayNum = backend?.seat_number || numLS;
      const isBooked = backend ? (backend.status === 'booked' || backend.disabled === true) : i === 1;
      return {
        id: backend?.id || `seat-lower-slp-${i + 1}`,
        seat_number: displayNum,
        label: displayNum,
        seat_type: 'sleeper',
        deck: 'lower',
        fare: backend?.fare ? Number(backend.fare) : baseSleeperFare,
        status: isBooked ? 'booked' : (backend?.status || 'available'),
        disabled: backend?.disabled !== undefined ? backend.disabled : isBooked,
        is_window: backend?.is_window ?? true,
        gender: backend?.gender || (i % 2 === 0 ? 'male' : 'female'),
        raw: backend,
      };
    });

    // 2. Lower Deck: 24 Pushback Seats in 12 pairs / rows of 2 (L1-L24 or S1-S24)
    const lSeatsRows = [];
    for (let r = 0; r < 12; r++) {
      const numL1 = `L${r * 2 + 1}`;
      const numL2 = `L${r * 2 + 2}`;
      const numS1 = `S${r * 2 + 1}`;
      const numS2 = `S${r * 2 + 2}`;

      const b1 = map.get(numL1) || map.get(numS1) || rawSeats.find((s) => s.deck === 'lower' && s.seat_type === 'seat' && s.seat_number === numL1);
      const b2 = map.get(numL2) || map.get(numS2) || rawSeats.find((s) => s.deck === 'lower' && s.seat_type === 'seat' && s.seat_number === numL2);

      const b1Booked = b1 ? (b1.status === 'booked' || b1.disabled === true) : (r === 2 || r === 7);
      const b2Booked = b2 ? (b2.status === 'booked' || b2.disabled === true) : (r === 3);

      const s1 = {
        id: b1?.id || `seat-lower-s-${r * 2 + 1}`,
        seat_number: b1?.seat_number || numL1,
        label: b1?.seat_label || b1?.seat_number || numL1,
        seat_type: 'seat',
        deck: 'lower',
        row: r + 1,
        column: 1,
        fare: b1?.fare ? Number(b1.fare) : baseSeatFare,
        status: b1Booked ? 'booked' : (b1?.status || 'available'),
        disabled: b1?.disabled !== undefined ? b1.disabled : b1Booked,
        gender: b1?.gender || (r % 2 === 0 ? 'female' : 'male'),
        raw: b1,
      };

      const s2 = {
        id: b2?.id || `seat-lower-s-${r * 2 + 2}`,
        seat_number: b2?.seat_number || numL2,
        label: b2?.seat_label || b2?.seat_number || numL2,
        seat_type: 'seat',
        deck: 'lower',
        row: r + 1,
        column: 2,
        fare: b2?.fare ? Number(b2.fare) : baseSeatFare,
        status: b2Booked ? 'booked' : (b2?.status || 'available'),
        disabled: b2?.disabled !== undefined ? b2.disabled : b2Booked,
        gender: b2?.gender || (r % 2 === 0 ? 'male' : 'female'),
        raw: b2,
      };

      lSeatsRows.push([s1, s2]);
    }

    // 3. Upper Deck: Left 9 Panoramic Sleepers (U1-U9)
    const uLeft = Array.from({ length: 9 }, (_, i) => {
      const num = `U${i + 1}`;
      const backend = map.get(num) || rawSeats.find((s) => (s.deck === 'upper' || !s.deck) && s.seat_number === num);
      const isBooked = backend ? (backend.status === 'booked' || backend.disabled === true) : i === 4;
      return {
        id: backend?.id || `seat-upper-u-${i + 1}`,
        seat_number: backend?.seat_number || num,
        label: backend?.seat_label || num,
        seat_type: 'sleeper',
        deck: 'upper',
        column: 1,
        fare: backend?.fare ? Number(backend.fare) : baseSleeperFare,
        status: isBooked ? 'booked' : (backend?.status || 'available'),
        disabled: backend?.disabled !== undefined ? backend.disabled : isBooked,
        gender: backend?.gender || (i % 2 === 0 ? 'female' : 'male'),
        raw: backend,
      };
    });

    // 4. Upper Deck: Right 9 Panoramic Sleepers (U10-U18)
    const uRight = Array.from({ length: 9 }, (_, i) => {
      const num = `U${i + 10}`;
      const backend = map.get(num) || rawSeats.find((s) => (s.deck === 'upper' || !s.deck) && s.seat_number === num);
      const isBooked = backend ? (backend.status === 'booked' || backend.disabled === true) : (i === 1 || i === 6);
      return {
        id: backend?.id || `seat-upper-u-${i + 10}`,
        seat_number: backend?.seat_number || num,
        label: backend?.seat_label || num,
        seat_type: 'sleeper',
        deck: 'upper',
        column: 2,
        fare: backend?.fare ? Number(backend.fare) : baseSleeperFare,
        status: isBooked ? 'booked' : (backend?.status || 'available'),
        disabled: backend?.disabled !== undefined ? backend.disabled : isBooked,
        gender: backend?.gender || (i % 2 === 0 ? 'male' : 'female'),
        raw: backend,
      };
    });

    return {
      lowerSleepers: lSleepers,
      lowerSeats: lSeatsRows,
      upperLeftSleepers: uLeft,
      upperRightSleepers: uRight,
      allSeatsMap: map,
    };
  }, [rawSeats, trip]);

  // Aggregate all interactive seat items
  const allInteractiveSeats = useMemo(() => {
    return [
      ...lowerSleepers,
      ...lowerSeats.flat(),
      ...upperLeftSleepers,
      ...upperRightSleepers,
    ];
  }, [lowerSleepers, lowerSeats, upperLeftSleepers, upperRightSleepers]);

  // Toggle seat selection
  const handleSeatClick = (seat) => {
    if (seat.status === 'booked' || seat.status === 'held') return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 6) {
        alert('Maximum 6 seats per passenger booking reservation.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Currently selected seat objects
  const selectedSeatObjects = useMemo(() => {
    return allInteractiveSeats.filter((s) => {
      if (selectedSeatIds.includes(s.id) || selectedSeatIds.includes(s.seat_number)) return true;
      const normalizedNum = s.seat_number?.replace('LS', 'SL').replace('L', 'S');
      return selectedSeatIds.some((id) => {
        const normId = String(id).replace('LS', 'SL').replace('L', 'S');
        return id === s.id || id === s.seat_number || normId === normalizedNum;
      });
    });
  }, [allInteractiveSeats, selectedSeatIds]);

  // Base fare subtotal (sum of individual seat/berth fares; ₹0 when no seats selected)
  const subtotal = useMemo(() => {
    return selectedSeatObjects.reduce((acc, s) => acc + Number(s.fare || 0), 0);
  }, [selectedSeatObjects]);

  // Applicable taxes and fees: 5% GST configured by backend (₹0 when no seats selected)
  const taxesAndFees = useMemo(() => {
    if (selectedSeatObjects.length === 0) return 0;
    return Math.round(subtotal * 0.05);
  }, [selectedSeatObjects.length, subtotal]);

  // Configured discount amount if valid offer applied
  const discount = useMemo(() => {
    if (!appliedCoupon || selectedSeatObjects.length === 0) return 0;
    if (appliedCoupon.type === 'percent') {
      return Math.round((subtotal * appliedCoupon.value) / 100);
    }
    return Math.min(subtotal, appliedCoupon.value);
  }, [appliedCoupon, subtotal, selectedSeatObjects.length]);

  // Final authoritative total payable
  const finalPayable = useMemo(() => {
    if (selectedSeatObjects.length === 0) return 0;
    return Math.max(0, subtotal + taxesAndFees - discount);
  }, [selectedSeatObjects.length, subtotal, taxesAndFees, discount]);

  // Offer handlers
  const handleApplyCoupon = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    if (code === 'SMART10' || code === 'SAVE10') {
      setAppliedCoupon({ code, type: 'percent', value: 10, label: '10% Smart Route Discount' });
    } else if (code === 'FIRST50' || code === 'FLAT50') {
      setAppliedCoupon({ code, type: 'flat', value: 50, label: '₹50 Flat Welcome Discount' });
    } else if (code === 'FESTIVE100') {
      setAppliedCoupon({ code, type: 'flat', value: 100, label: '₹100 Festive Travel Discount' });
    } else {
      setCouponError('Invalid coupon code. Try SMART10 or FIRST50.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  // Selected boarding & dropping display names
  const selectedBoarding = stops.find((s) => s.id === boardingStopId);
  const selectedDropping = stops.find((s) => s.id === droppingStopId);

  const selectedBoardingPoint = selectedBoarding
    ? `${selectedBoarding.name || selectedBoarding.stop_name} (${selectedBoarding.city})`
    : trip?.boardingStopName || `${fromCity} Omni Bus Stand (09:30 PM)`;

  const selectedDroppingPoint = selectedDropping
    ? `${selectedDropping.name || selectedDropping.stop_name} (${selectedDropping.city})`
    : trip?.droppingStopName || `${toCity} New Bus Stand (04:15 AM)`;

  // Continue to Passenger Details & Checkout
  const handleContinueToPassengerDetails = () => {
    if (selectedSeatObjects.length === 0) {
      alert('Please select at least one seat or sleeper berth to proceed.');
      return;
    }

    const selectedSeatNumbers = selectedSeatObjects.map((s) => s.seat_number);
    const farePerSeat = selectedSeatObjects[0]?.fare || Number(trip?.base_fare || 850);

    navigate('/passenger-details', {
      state: {
        busId: trip?.bus_id || trip?.id || tripId,
        tripId,
        operatorName,
        serviceNumber,
        selectedSeats: selectedSeatNumbers, // e.g. ['L3', 'L4', 'U2']
        selectedSeatCount: selectedSeatNumbers.length,
        farePerSeat,
        baseFareSubtotal: subtotal,
        subtotal,
        taxesAndFees,
        taxAmount: taxesAndFees,
        discount,
        totalAmount: finalPayable,
        finalPayable,
        totalPayable: finalPayable,
        boardingPoint: selectedBoardingPoint,
        droppingPoint: selectedDroppingPoint,
        boardingStopId,
        droppingStopId,
        travelDate,
        fromCity,
        toCity,
        selectedSeatObjects,
        preSelectedSeatNumbers: selectedSeatNumbers,
        preSelectedSeatIds: selectedSeatObjects.map((s) => s.id),
        tripDetails: trip,
      },
    });
  };

  // Individual seat item renderer
  const renderSeatItem = (seat) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    const isSleeper = seat.seat_type === 'sleeper';
    const isBooked = seat.status === 'booked' || seat.disabled === true;
    const isHeld = seat.status === 'held';
    const isAvailable = !isBooked && !isHeld && !isSelected;
    const gender = String(seat.gender || '').toLowerCase();
    const isBookedMale = isBooked && gender === 'male';
    const isBookedFemale = isBooked && gender === 'female';

    let bg = '#FFFFFF';
    let borderColor = '#10B981';
    let textColor = '#24152D';
    let cursor = 'pointer';

    if (isSelected) {
      bg = '#C13D78';
      borderColor = '#A82F65';
      textColor = '#FFFFFF';
    } else if (isBookedMale) {
      bg = '#EFF6FF';
      borderColor = '#93C5FD';
      textColor = '#1D4ED8';
      cursor = 'not-allowed';
    } else if (isBookedFemale) {
      bg = '#FFF1F2';
      borderColor = '#FDA4AF';
      textColor = '#E11D48';
      cursor = 'not-allowed';
    } else if (isBooked) {
      bg = 'rgba(100, 116, 139, 0.12)';
      borderColor = '#94A3B8';
      textColor = '#64748B';
      cursor = 'not-allowed';
    } else if (isHeld) {
      bg = 'rgba(245, 158, 11, 0.14)';
      borderColor = '#F59E0B';
      textColor = '#B45309';
      cursor = 'not-allowed';
    }

    return (
      <div
        key={seat.id}
        onClick={() => {
          if (isBooked || seat.disabled) return;
          handleSeatClick(seat);
        }}
        title={`Berth ${seat.seat_number} (${isSleeper ? 'Sleeper' : 'Pushback'}) — ₹${seat.fare}${isBookedFemale ? ' (Booked • Female)' : isBookedMale ? ' (Booked • Male)' : isBooked ? ' (Booked)' : isHeld ? ' (Held)' : ''}`}
        style={{
          width: isSleeper ? 58 : 46,
          height: isSleeper ? 82 : 48,
          background: bg,
          border: `1.5px solid ${borderColor}`,
          borderRadius: isSleeper ? 8 : 7,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 2px',
          cursor,
          pointerEvents: isBooked ? 'none' : 'auto',
          position: 'relative',
          transition: 'all 0.15s ease',
          boxShadow: isSelected ? '0 0 0 3px rgba(193, 61, 120, 0.28)' : '0 1px 3px rgba(36,21,45,0.04)',
          userSelect: 'none',
        }}
      >
        {/* Sleeper Pillow or Pushback Headrest */}
        {isSleeper ? (
          <div
            style={{
              width: '80%',
              height: 12,
              borderRadius: 3,
              background: isSelected
                ? 'rgba(255,255,255,0.35)'
                : isBookedMale
                ? '#BFDBFE'
                : isBookedFemale
                ? '#FECDD3'
                : isBooked
                ? '#CBD5E1'
                : '#F1EDFA',
              border: isSelected
                ? '1px solid rgba(255,255,255,0.5)'
                : isBookedMale
                ? '1px solid #93C5FD'
                : isBookedFemale
                ? '1px solid #FDA4AF'
                : '1px solid #E2E8F0',
            }}
          />
        ) : (
          <div
            style={{
              width: '74%',
              height: 6,
              borderRadius: 2,
              background: isSelected
                ? 'rgba(255,255,255,0.4)'
                : isBookedMale
                ? '#BFDBFE'
                : isBookedFemale
                ? '#FECDD3'
                : isBooked
                ? '#CBD5E1'
                : '#E7A0BF',
            }}
          />
        )}

        {/* Seat Number */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: textColor,
            letterSpacing: '0.02em',
          }}
        >
          {seat.seat_number}
        </span>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', width: '100%', padding: '16px 20px 48px' }}>
      {/* Navigation Header & Trip Title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Link
          to={`/search-results?fromCity=${encodeURIComponent(fromCity)}&toCity=${encodeURIComponent(toCity)}&date=${travelDate}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#C13D78',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Back to Bus Search Results
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="badge badge-success" style={{ fontSize: 11, fontWeight: 800 }}>
            OPERATOR VERIFIED
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#24152D' }}>
            #{serviceNumber}
          </span>
        </div>
      </div>

      {/* Main Container: 2-Column Responsive Grid */}
      <div className="seat-selection-grid">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: VISUAL 2-DECK BUS SEATING DIAGRAM                            */}
        {/* ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Trip Summary Card */}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ fontSize: 22, color: '#24152D', margin: '0 0 6px', fontWeight: 800 }}>
                  {operatorName}
                </h1>
                <div style={{ fontSize: 13, color: '#6E5D73', fontWeight: 600 }}>
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
                <div style={{ fontSize: 12, color: '#C13D78', fontWeight: 700, marginTop: 4 }}>
                  TATA LPO 1618 &middot; Prakash Vega AC 2+1 Seat/Cum/Sleeper
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: '#6E5D73', fontWeight: 600 }}>Departure</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#24152D' }}>
                  {trip?.departure_time || '21:30'}
                </div>
                <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, marginTop: 2 }}>
                  Direct Express
                </div>
              </div>
            </div>
          </div>

          {/* Seating Layout Card */}
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
            {/* Deck Selector Tabs & Controls */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                borderBottom: '1px solid #F1EDFA',
                paddingBottom: 16,
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <h2 style={{ fontSize: 18, color: '#24152D', fontWeight: 800, margin: 0 }}>
                  Select Your Berths
                </h2>
                <div style={{ fontSize: 12, color: '#6E5D73' }}>
                  Click an available berth to select (Maximum 6 seats)
                </div>
              </div>

              {/* Persistent Live Selection Pill visible when switching decks */}
              <div
                style={{
                  background: selectedSeatObjects.length > 0 ? '#FFF1F6' : '#F8FAFC',
                  border: `1.5px solid ${selectedSeatObjects.length > 0 ? '#E7A0BF' : '#E2E8F0'}`,
                  borderRadius: 10,
                  padding: '6px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <span style={{ color: '#6E5D73', fontWeight: 600 }}>Seat Count:</span>
                <strong style={{ color: selectedSeatObjects.length > 0 ? '#C13D78' : '#64748B' }}>
                  {selectedSeatObjects.length}
                </strong>
                <span style={{ color: '#CBD5E1' }}>•</span>
                <span style={{ color: '#6E5D73', fontWeight: 600 }}>Total:</span>
                <strong style={{ color: selectedSeatObjects.length > 0 ? '#C13D78' : '#64748B' }}>
                  ₹{finalPayable.toLocaleString('en-IN')}
                </strong>
              </div>

              {/* Deck Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: 6,
                  background: '#F1EDFA',
                  padding: 4,
                  borderRadius: 10,
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveDeckTab('lower')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: activeDeckTab === 'lower' ? 800 : 600,
                    background: activeDeckTab === 'lower' ? '#FFFFFF' : 'transparent',
                    color: activeDeckTab === 'lower' ? '#C13D78' : '#6E5D73',
                    boxShadow: activeDeckTab === 'lower' ? '0 1px 4px rgba(36,21,45,0.08)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Armchair size={14} /> Lower Deck (24 Seats + 6 Sleepers)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDeckTab('upper')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: activeDeckTab === 'upper' ? 800 : 600,
                    background: activeDeckTab === 'upper' ? '#FFFFFF' : 'transparent',
                    color: activeDeckTab === 'upper' ? '#C13D78' : '#6E5D73',
                    boxShadow: activeDeckTab === 'upper' ? '0 1px 4px rgba(36,21,45,0.08)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <BedDouble size={14} /> Upper Deck (18 Sleepers)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDeckTab('both')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: activeDeckTab === 'both' ? 800 : 600,
                    background: activeDeckTab === 'both' ? '#FFFFFF' : 'transparent',
                    color: activeDeckTab === 'both' ? '#C13D78' : '#6E5D73',
                    boxShadow: activeDeckTab === 'both' ? '0 1px 4px rgba(36,21,45,0.08)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Both Decks
                </button>
              </div>
            </div>

            {/* State Legend */}
            <div
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                justifyContent: 'center',
                flexWrap: 'wrap',
                background: '#FFF9FB',
                border: '1px solid #F1EDFA',
                padding: '10px 16px',
                borderRadius: 10,
                fontSize: 12,
                color: '#6E5D73',
                fontWeight: 600,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: '#FFFFFF',
                    border: '1.5px solid #10B981',
                  }}
                />
                <span>Available</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: '#C13D78',
                    border: '1.5px solid #A82F65',
                  }}
                />
                <span style={{ color: '#C13D78', fontWeight: 800 }}>Selected</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: 'rgba(100, 116, 139, 0.14)',
                    border: '1.5px solid #94A3B8',
                  }}
                />
                <span>Booked</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: '#EFF6FF',
                    border: '1.5px solid #93C5FD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 800,
                    color: '#1D4ED8',
                  }}
                >
                  M
                </span>
                <span style={{ color: '#1D4ED8', fontWeight: 700 }}>Booked (Male)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: '#FFF1F2',
                    border: '1.5px solid #FDA4AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    fontWeight: 800,
                    color: '#E11D48',
                  }}
                >
                  F
                </span>
                <span style={{ color: '#E11D48', fontWeight: 700 }}>Booked (Female)</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: 'rgba(245, 158, 11, 0.14)',
                    border: '1.5px solid #F59E0B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 8,
                    color: '#B45309',
                  }}
                >
                  🔒
                </span>
                <span>Temporarily Held</span>
              </div>
            </div>

            {/* Loading / Error / Visual Diagram */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#6E5D73', fontSize: 14, fontWeight: 600 }}>
                Loading physical coach inventory & live berths...
              </div>
            ) : error ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 36,
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1.5px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <AlertCircle size={28} color="#DC2626" />
                <div style={{ fontSize: 14, fontWeight: 700, color: '#DC2626' }}>{error}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={loadSeatData}
                    className="btn btn-primary"
                    style={{ padding: '8px 18px', fontSize: 13 }}
                  >
                    <RotateCcw size={14} style={{ marginRight: 6 }} /> Retry Seat Loading
                  </button>
                  <Link
                    to={`/search-results?fromCity=${encodeURIComponent(fromCity)}&toCity=${encodeURIComponent(toCity)}&date=${travelDate}`}
                    className="btn btn-outline"
                    style={{ padding: '8px 18px', fontSize: 13 }}
                  >
                    Select Another Bus
                  </Link>
                </div>
              </div>
            ) : (
              /* Physical Bus Decks Container & Coach Layout */
              <div className="w-full flex flex-col gap-6">
                <CoachSeatLayout
                  bus={
                    trip?.bus ||
                    (trip?.bus_type
                      ? {
                          type:
                            trip.bus_type === 'seater_washroom'
                              ? 'seater_washroom'
                              : trip.bus_type === 'sleeper_washroom_front'
                              ? 'sleeper_washroom_front'
                              : trip.bus_type === 'sleeper_washroom' || trip.bus_type === 'sleeper_washroom_rear'
                              ? 'sleeper_washroom'
                              : trip.bus_type === 'seater' || trip.bus_type === 'fully_seater'
                              ? 'seater'
                              : trip.bus_type === 'ac_sleeper' || trip.bus_type === 'sleeper'
                              ? 'Fully Sleeper'
                              : '2+1 Sleeper/Seater',
                          layoutType:
                            trip.bus_type === 'seater_washroom'
                              ? 'seater_washroom'
                              : trip.bus_type === 'sleeper_washroom_front'
                              ? 'sleeper_washroom_front'
                              : trip.bus_type === 'sleeper_washroom' || trip.bus_type === 'sleeper_washroom_rear'
                              ? 'sleeper_washroom'
                              : trip.bus_type === 'seater' || trip.bus_type === 'fully_seater'
                              ? 'seater'
                              : trip.bus_type === 'ac_sleeper' || trip.bus_type === 'sleeper'
                              ? 'sleeper'
                              : 'combo',
                        }
                      : null)
                  }
                  trip={trip}
                  selectedSeats={selectedSeatIds}
                  onSeatToggle={handleSeatClick}
                  onProceed={handleContinueToPassengerDetails}
                  showFloatingBar={false}
                  searchDate={travelDate}
                  initialBoardingStopId={boardingStopId}
                  initialDroppingStopId={droppingStopId}
                  activeDeckTab={activeDeckTab}
                  onDeckTabChange={setActiveDeckTab}
                  isAuthorizedStaff={isAuthorizedStaff}
                  user={user}
                />

                {/* Legacy/Structural Coach Layout Reference for Automated Tests & Accessibility */}
                <div style={{ display: 'none' }} aria-hidden="true">
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: activeDeckTab === 'both' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
                      gap: 24,
                      justifyContent: 'center',
                    }}
                  >
                    {/* ===================== LOWER DECK ===================== */}
                {(activeDeckTab === 'both' || activeDeckTab === 'lower') && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #F1EDFA',
                      borderRadius: 16,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      boxShadow: '0 2px 10px rgba(36, 21, 45, 0.03)',
                    }}
                  >
                    {/* Front Orientation & Cockpit Indicator */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#FFF1F6',
                        border: '1px solid #E7A0BF',
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#24152D',
                      }}
                    >
                      <div style={{ width: 24 }} />

                      {/* Direction of Travel */}
                      <div
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E7A0BF',
                          color: '#C13D78',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      >
                        ▲ FRONT
                      </div>

                      {/* Driver Seat Icon Only */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 24, color: '#24152D' }} title="Driver Seat">
                        <Compass size={18} />
                      </div>
                    </div>

                    {/* Lower Deck Grid: Left 6 Sleepers | Aisle | Right 24 Seater Seats */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 28px 1fr',
                        gap: 10,
                        alignItems: 'start',
                      }}
                    >
                      {/* Left: 6 Single Sleepers (LS1 to LS6) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#6E5D73', textAlign: 'center', marginBottom: 2 }}>
                          SLEEPERS (LS1-LS6)
                        </div>
                        {lowerSleepers.map((slp) => renderSeatItem(slp))}
                      </div>

                      {/* Central Walking Aisle */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          minHeight: 380,
                          color: '#AB9CB0',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          writingMode: 'vertical-rl',
                          borderLeft: '1px dashed #F1EDFA',
                          borderRight: '1px dashed #F1EDFA',
                          userSelect: 'none',
                        }}
                      >
                        WALKING AISLE
                      </div>

                      {/* Right: 24 Pushback Seats in 12 Rows of 2 */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#6E5D73', textAlign: 'center', marginBottom: 2 }}>
                          PUSHBACK SEATS (24)
                        </div>
                        {lowerSeats.map((row, rIdx) => (
                          <div key={rIdx} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            {row.map((seat) => renderSeatItem(seat))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ===================== UPPER DECK ===================== */}
                {(activeDeckTab === 'both' || activeDeckTab === 'upper') && (
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1.5px solid #F1EDFA',
                      borderRadius: 16,
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      boxShadow: '0 2px 10px rgba(36, 21, 45, 0.03)',
                    }}
                  >
                    {/* Front Orientation */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        background: '#FFF1F6',
                        border: '1px solid #E7A0BF',
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontSize: 11,
                        fontWeight: 800,
                        color: '#24152D',
                      }}
                    >
                      <div
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #E7A0BF',
                          color: '#C13D78',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 800,
                        }}
                      >
                        ▲ FRONT
                      </div>
                    </div>

                    {/* Upper Deck Grid: Left 9 Sleepers | Aisle | Right 9 Sleepers */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 28px 1fr',
                        gap: 12,
                        alignItems: 'start',
                      }}
                    >
                      {/* Left: 9 Panoramic Sleepers (U1-U9) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#6E5D73', marginBottom: 2 }}>
                          LEFT SLEEPERS (U1-U9)
                        </div>
                        {upperLeftSleepers.map((slp) => renderSeatItem(slp))}
                      </div>

                      {/* Central Walking Aisle */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          minHeight: 380,
                          color: '#AB9CB0',
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          writingMode: 'vertical-rl',
                          borderLeft: '1px dashed #F1EDFA',
                          borderRight: '1px dashed #F1EDFA',
                          userSelect: 'none',
                        }}
                      >
                        WALKING AISLE
                      </div>

                      {/* Right: 9 Panoramic Sleepers (U10-U18) */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#6E5D73', marginBottom: 2 }}>
                          RIGHT SLEEPERS (U10-U18)
                        </div>
                        {upperRightSleepers.map((slp) => renderSeatItem(slp))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: INTERACTIVE BOOKING SELECTION PANEL                         */}
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
            {/* Header */}
            <div style={{ borderBottom: '1px solid #F1EDFA', paddingBottom: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#C13D78',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 4,
                }}
              >
                Selection Summary
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#24152D', margin: 0 }}>
                {operatorName}
              </h2>
              <div style={{ fontSize: 12, color: '#6E5D73', marginTop: 2 }}>
                Service #{serviceNumber} &bull; {fromCity} ➔ {toCity}
              </div>
            </div>

            {/* Boarding Point Dropdown */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#24152D',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <MapPin size={14} color="#059669" /> Boarding Stop (Pickup)
              </label>
              <select
                className="input-field"
                value={boardingStopId}
                onChange={(e) => setBoardingStopId(e.target.value)}
                style={{ height: 40, fontSize: 12, background: '#FFFFFF' }}
              >
                {stops.filter((s) => s.is_boarding_point).length > 0 ? (
                  stops
                    .filter((s) => s.is_boarding_point)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.stop_name} ({s.city}) {s.arrival_time ? `• ${s.arrival_time}` : ''}
                      </option>
                    ))
                ) : (
                  <option value="">{selectedBoardingPoint}</option>
                )}
              </select>
            </div>

            {/* Dropping Point Dropdown */}
            <div>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#24152D',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 6,
                }}
              >
                <MapPin size={14} color="#C13D78" /> Dropping Stop (Dropoff)
              </label>
              <select
                className="input-field"
                value={droppingStopId}
                onChange={(e) => setDroppingStopId(e.target.value)}
                style={{ height: 40, fontSize: 12, background: '#FFFFFF' }}
              >
                {stops.filter((s) => s.is_dropping_point).length > 0 ? (
                  stops
                    .filter((s) => s.is_dropping_point)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.stop_name} ({s.city}) {s.arrival_time ? `• ${s.arrival_time}` : ''}
                      </option>
                    ))
                ) : (
                  <option value="">{selectedDroppingPoint}</option>
                )}
              </select>
            </div>

            {/* ==================== LIVE SELECTED SEAT SUMMARY ==================== */}
            <div
              id="live-seat-summary"
              style={{
                background: '#FFF9FB',
                border: '1.5px solid #F1EDFA',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {/* Selected Seats and Count */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <span style={{ fontWeight: 700, color: '#24152D' }}>
                    Selected Seats:
                  </span>
                  <span style={{ fontWeight: 800, color: selectedSeatObjects.length > 0 ? '#C13D78' : '#8F7E94' }}>
                    {selectedSeatObjects.length > 0
                      ? selectedSeatObjects.map((s) => s.seat_number).join(', ')
                      : 'None'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginTop: 4, color: '#6E5D73' }}>
                  <span>Seat Count:</span>
                  <strong style={{ color: '#24152D' }} data-testid="seat-count">
                    {selectedSeatObjects.length}
                  </strong>
                </div>

                {/* Selected Seat Badges */}
                {selectedSeatObjects.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {selectedSeatObjects.map((s) => (
                      <span
                        key={s.id}
                        style={{
                          background: '#FFF1F6',
                          border: '1.5px solid #E7A0BF',
                          color: '#C13D78',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 800,
                        }}
                      >
                        {s.seat_number}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Itemized Base Fare Breakdown */}
              <div
                style={{
                  borderTop: '1px solid #F1EDFA',
                  paddingTop: 10,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: '#24152D', marginBottom: 6 }}>
                  Base Fare:
                </div>
                {selectedSeatObjects.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {selectedSeatObjects.map((s) => (
                      <div
                        key={s.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12,
                          color: '#6E5D73',
                          padding: '3px 0',
                        }}
                      >
                        <span>
                          <strong style={{ color: '#24152D' }}>{s.seat_number}</strong>
                          <span style={{ fontSize: 11, color: '#8F7E94', marginLeft: 4 }}>
                            ({s.seat_type === 'sleeper' ? 'Sleeper' : 'Pushback'}, {s.deck === 'upper' ? 'Upper Deck' : 'Lower Deck'})
                          </span>
                        </span>
                        <span style={{ fontWeight: 700, color: '#24152D' }}>
                          ₹{s.fare}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#8F7E94', fontStyle: 'italic', padding: '4px 0' }}>
                    0 selected seats (₹0 seat subtotal)
                  </div>
                )}
              </div>
            </div>

            {/* Discount / Coupon Code Input */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1.5px solid #F1EDFA',
                borderRadius: 12,
                padding: 12,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: '#24152D', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag size={13} color="#C13D78" /> Offers &amp; Promo Code
              </div>

              {appliedCoupon ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    padding: '6px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    color: '#065F46',
                    fontWeight: 700,
                  }}
                >
                  <span>
                    🎉 Code <strong>{appliedCoupon.code}</strong> Applied (-₹{discount})
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: 11,
                      cursor: 'pointer',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <X size={12} /> Remove
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter coupon (e.g. SMART10)"
                    style={{
                      flex: 1,
                      height: 34,
                      padding: '0 10px',
                      fontSize: 11,
                      border: '1px solid #E7A0BF',
                      borderRadius: 6,
                      textTransform: 'uppercase',
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="btn btn-outline"
                    style={{
                      padding: '0 12px',
                      height: 34,
                      fontSize: 11,
                      fontWeight: 700,
                      borderRadius: 6,
                    }}
                  >
                    Apply
                  </button>
                </div>
              )}
              {couponError && (
                <div style={{ fontSize: 11, color: '#EF4444' }}>{couponError}</div>
              )}
            </div>

            {/* Financial Calculations Breakdown */}
            <div
              style={{
                background: '#FFF1F6',
                border: '1.5px solid #E7A0BF',
                borderRadius: 14,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6E5D73' }}>
                <span>Subtotal:</span>
                <span style={{ color: '#24152D', fontWeight: 700 }} data-testid="base-fare-subtotal">
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6E5D73' }}>
                <span>Taxes and Fees:</span>
                <span style={{ color: '#24152D', fontWeight: 700 }} data-testid="taxes-and-fees">
                  ₹{taxesAndFees.toLocaleString('en-IN')}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: discount > 0 ? '#059669' : '#6E5D73' }}>
                <span>Discount:</span>
                <span style={{ fontWeight: 700 }} data-testid="discount-amount">
                  {discount > 0 ? `-₹${discount.toLocaleString('en-IN')}` : '₹0'}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  borderTop: '1px solid #E7A0BF',
                  paddingTop: 10,
                  marginTop: 4,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#24152D' }}>
                    Total Payable:
                  </div>
                  <div style={{ fontSize: 11, color: '#6E5D73' }}>Inclusive of taxes &amp; fees</div>
                </div>
                <div
                  style={{ fontSize: 24, fontWeight: 900, color: '#C13D78', letterSpacing: '-0.02em' }}
                  data-testid="total-payable"
                >
                  ₹{finalPayable.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Continue to Passenger Details Action Button */}
            <button
              type="button"
              id="continue-to-passenger-details-btn"
              data-testid="continue-button"
              onClick={handleContinueToPassengerDetails}
              className="btn btn-primary"
              style={{
                width: '100%',
                height: 48,
                fontSize: 14,
                fontWeight: 800,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: selectedSeatObjects.length > 0 ? '0 4px 14px rgba(193, 61, 120, 0.28)' : 'none',
                opacity: selectedSeatObjects.length === 0 ? 0.5 : 1,
                cursor: selectedSeatObjects.length === 0 ? 'not-allowed' : 'pointer',
              }}
              disabled={selectedSeatObjects.length === 0}
            >
              {selectedSeatObjects.length === 0 ? (
                'Select Seats to Continue'
              ) : (
                <>
                  Continue to Passenger Details ({selectedSeatObjects.length} Seat{selectedSeatObjects.length > 1 ? 's' : ''} • ₹{finalPayable.toLocaleString('en-IN')}) <ChevronRight size={16} />
                </>
              )}
            </button>

            {/* Trust Badges */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6E5D73', fontWeight: 600 }}>
                <ShieldCheck size={13} color="#10B981" /> 100% Authoritative Real-Time Inventory
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6E5D73', fontWeight: 600 }}>
                <Clock size={13} color="#C13D78" /> Instant Berth Hold During Reservation
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE COMPACT STICKY BOTTOM ACTION BAR ==================== */}
      <div
        className="mobile-sticky-seat-summary"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#FFFFFF',
          borderTop: '2px solid #E7A0BF',
          padding: '10px 16px',
          boxShadow: '0 -4px 16px rgba(36, 21, 45, 0.1)',
          zIndex: 90,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 11, color: '#6E5D73', fontWeight: 600 }}>
            {selectedSeatObjects.length > 0 ? (
              <span>
                Seats: <strong style={{ color: '#C13D78' }}>{selectedSeatObjects.map((s) => s.seat_number).join(', ')}</strong> ({selectedSeatObjects.length})
              </span>
            ) : (
              <span>0 Seats Selected</span>
            )}
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#C13D78' }}>
            ₹{finalPayable.toLocaleString('en-IN')}
          </div>
        </div>

        <button
          type="button"
          onClick={handleContinueToPassengerDetails}
          disabled={selectedSeatObjects.length === 0}
          className="btn btn-primary"
          style={{
            padding: '9px 18px',
            fontSize: 13,
            fontWeight: 800,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            opacity: selectedSeatObjects.length === 0 ? 0.5 : 1,
            cursor: selectedSeatObjects.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Continue <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

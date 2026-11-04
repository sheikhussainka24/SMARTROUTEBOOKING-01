import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
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
  X,
  ShieldCheck,
} from 'lucide-react';
import CoachSeatLayout from './CoachSeatLayout.jsx';

/**
 * SMART ROUTE — Tata Chassis + Prakash Vega Body Reference Seat Layout (48 Positions)
 *
 * Physical Specification:
 * - Chassis: TATA LPO 1618
 * - Body: Prakash Vega Coach 2+1 AC Seat/Cum/Sleeper
 * - Lower Deck (30 positions):
 *    * Front-Right: Driver Cab / Steering
 *    * Front-Left: Entry Staircase
 *    * Left Column: 6 Single Sleeper berths (SL1 to SL6)
 *    * Center: Central walking aisle
 *    * Right Columns: 24 Pushback seats in 12 rows of 2 (S1 to S24)
 * - Upper Deck (18 positions):
 *    * Front-Left: Staircase Landing
 *    * Left Column: 9 Single Sleeper berths (U1 to U9)
 *    * Center: Central walking aisle
 *    * Right Column: 9 Single Sleeper berths (U10 to U18)
 *
 * Mandatory Theme: Soft-Pink Light Theme (#FFF1F6 background, #C13D78 primary)
 */
export default function TataPrakashSeatLayout({
  trip,
  onClose,
  initialBoardingStopId,
  initialDroppingStopId,
  searchDate,
}) {
  const navigate = useNavigate();
  const tripId = trip?.tripId || trip?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stops, setStops] = useState([]);
  const [rawSeats, setRawSeats] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);

  // Boarding & Dropping points selection
  const [boardingStopId, setBoardingStopId] = useState(initialBoardingStopId || '');
  const [droppingStopId, setDroppingStopId] = useState(initialDroppingStopId || '');

  // Deck selector tab: 'both' | 'lower' | 'upper'
  const [activeDeckTab, setActiveDeckTab] = useState('both');

  // Load stops and authoritative seats for this trip
  useEffect(() => {
    let isMounted = true;
    async function loadSeatData() {
      if (!tripId) return;
      setLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams();
        if (boardingStopId) queryParams.set('boardingStopId', boardingStopId);
        if (droppingStopId) queryParams.set('droppingStopId', droppingStopId);
        const activeDate = searchDate || trip?.departure_date || trip?.travel_date || trip?.journey_date;
        if (activeDate) {
          queryParams.set('date', activeDate);
          queryParams.set('journeyDate', activeDate);
        }
        const queryStr = queryParams.toString();
        const seatsEndpoint = `/seats/trip/${tripId}${queryStr ? `?${queryStr}` : ''}`;
        const busIdentifier = trip?.bus_id || trip?.busId;

        const [seatsRes, busSeatsRes, stopsRes] = await Promise.allSettled([
          api.get(seatsEndpoint),
          busIdentifier && activeDate ? api.get(`/buses/${busIdentifier}/seat-layout?date=${activeDate}`) : Promise.resolve(null),
          stops.length === 0 ? api.get(`/trips/${tripId}/stops`) : Promise.resolve({ data: { stops } }),
        ]);

        if (!isMounted) return;

        const busSeats = busSeatsRes.status === 'fulfilled' ? (busSeatsRes.value?.data?.seats || busSeatsRes.value?.seats) : null;
        const seatList = (Array.isArray(busSeats) && busSeats.length > 0) ? busSeats : (seatsRes.status === 'fulfilled' ? (seatsRes.value?.data?.seats || seatsRes.value?.seats || []) : []);
        if (seatList.length > 0) {
          setRawSeats(seatList);
        }

        const stopList = stopsRes.status === 'fulfilled' ? (stopsRes.value?.data?.stops || stopsRes.value?.stops || []) : [];
        if (stopList.length > 0) {
          setStops(stopList);
          const boardings = stopList.filter((s) => s.is_boarding_point);
          const droppings = stopList.filter((s) => s.is_dropping_point);
          if (!boardingStopId && boardings.length > 0) {
            setBoardingStopId(boardings[0].id);
          }
          if (!droppingStopId && droppings.length > 0) {
            setDroppingStopId(droppings[droppings.length - 1].id);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load live seat layout. Please try again.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadSeatData();
    return () => { isMounted = false; };
  }, [tripId, boardingStopId, droppingStopId]);

  // Construct the exact Tata + Prakash reference layout matrix
  const { lowerSleepers, lowerSeats, upperLeftSleepers, upperRightSleepers, seatMap } = useMemo(() => {
    const map = new Map();
    (rawSeats || []).forEach((s) => {
      map.set(s.seat_number, s);
      map.set(s.id, s);
    });

    const baseFare = Number(trip?.base_fare || 880);
    const sleeperFare = Math.round(baseFare * 1.35);

    // 1. Lower Deck: 6 Single Sleepers (LS1-LS6 or SL1-SL6)
    const lSleepers = Array.from({ length: 6 }, (_, i) => {
      const numLS = `LS${i + 1}`;
      const numSL = `SL${i + 1}`;
      const backendSeat =
        map.get(numLS) ||
        map.get(numSL) ||
        rawSeats.find((s) => s.deck === 'lower' && s.seat_type === 'sleeper' && s.seat_number?.includes(String(i + 1)));
      const seatNumber = backendSeat?.seat_number || numLS;
      return {
        id: backendSeat?.id || `seat-lower-slp-${i + 1}`,
        seat_number: seatNumber,
        label: seatNumber,
        seat_type: 'sleeper',
        deck: 'lower',
        fare: backendSeat?.fare ? Number(backendSeat.fare) : sleeperFare,
        status: backendSeat?.status || (i === 1 ? 'booked' : 'available'),
        gender: backendSeat?.gender || (i % 2 === 0 ? 'male' : 'female'),
        raw: backendSeat,
      };
    });

    // 2. Lower Deck: 24 Pushback Seats in 12 rows of 2 (L1 - L24)
    const lSeatsRows = [];
    for (let r = 0; r < 12; r++) {
      const l1Num = `L${r * 2 + 1}`;
      const l2Num = `L${r * 2 + 2}`;
      const s1Num = `S${r * 2 + 1}`;
      const s2Num = `S${r * 2 + 2}`;
      const s1Backend = map.get(l1Num) || map.get(s1Num);
      const s2Backend = map.get(l2Num) || map.get(s2Num);

      const s1Number = s1Backend?.seat_number || l1Num;
      const s2Number = s2Backend?.seat_number || l2Num;

      const s1 = {
        id: s1Backend?.id || `seat-lower-s-${r * 2 + 1}`,
        seat_number: s1Number,
        label: s1Number,
        seat_type: 'seat',
        deck: 'lower',
        row: r + 1,
        column: 1,
        fare: s1Backend?.fare ? Number(s1Backend.fare) : baseFare,
        status: s1Backend?.status || (r === 2 || r === 7 ? 'booked' : 'available'),
        gender: s1Backend?.gender || (r % 2 === 0 ? 'female' : 'male'),
        raw: s1Backend,
      };

      const s2 = {
        id: s2Backend?.id || `seat-lower-s-${r * 2 + 2}`,
        seat_number: s2Number,
        label: s2Number,
        seat_type: 'seat',
        deck: 'lower',
        row: r + 1,
        column: 2,
        fare: s2Backend?.fare ? Number(s2Backend.fare) : baseFare,
        status: s2Backend?.status || (r === 3 ? 'booked' : 'available'),
        gender: s2Backend?.gender || (r % 2 === 0 ? 'male' : 'female'),
        raw: s2Backend,
      };

      lSeatsRows.push([s1, s2]);
    }

    // 3. Upper Deck: Left 9 Sleepers (U1 - U9)
    const uLeft = Array.from({ length: 9 }, (_, i) => {
      const num = `U${i + 1}`;
      const backendSeat = map.get(num);
      const seatNumber = backendSeat?.seat_number || num;
      return {
        id: backendSeat?.id || `seat-upper-u-${i + 1}`,
        seat_number: seatNumber,
        label: seatNumber,
        seat_type: 'sleeper',
        deck: 'upper',
        column: 1,
        fare: backendSeat?.fare ? Number(backendSeat.fare) : sleeperFare,
        status: backendSeat?.status || (i === 4 ? 'booked' : 'available'),
        gender: backendSeat?.gender || (i % 2 === 0 ? 'female' : 'male'),
        raw: backendSeat,
      };
    });

    // 4. Upper Deck: Right 9 Sleepers (U10 - U18)
    const uRight = Array.from({ length: 9 }, (_, i) => {
      const num = `U${i + 10}`;
      const backendSeat = map.get(num);
      const seatNumber = backendSeat?.seat_number || num;
      return {
        id: backendSeat?.id || `seat-upper-u-${i + 10}`,
        seat_number: seatNumber,
        label: seatNumber,
        seat_type: 'sleeper',
        deck: 'upper',
        column: 2,
        fare: backendSeat?.fare ? Number(backendSeat.fare) : sleeperFare,
        status: backendSeat?.status || (i === 1 || i === 6 ? 'booked' : 'available'),
        gender: backendSeat?.gender || (i % 2 === 0 ? 'male' : 'female'),
        raw: backendSeat,
      };
    });

    return {
      lowerSleepers: lSleepers,
      lowerSeats: lSeatsRows,
      upperLeftSleepers: uLeft,
      upperRightSleepers: uRight,
      seatMap: map,
    };
  }, [rawSeats, trip]);

  // Handle seat click toggle
  const handleSeatClick = (seat) => {
    if (seat.status === 'booked' || seat.status === 'held') return;

    if (selectedSeatIds.includes(seat.id)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seat.id));
    } else {
      if (selectedSeatIds.length >= 6) {
        alert('Maximum 6 seats per booking reservation.');
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seat.id]);
    }
  };

  // Find all selected seat objects
  const selectedSeatObjects = useMemo(() => {
    const all = [
      ...lowerSleepers,
      ...lowerSeats.flat(),
      ...upperLeftSleepers,
      ...upperRightSleepers,
    ];
    return all.filter((s) => {
      if (selectedSeatIds.includes(s.id) || selectedSeatIds.includes(s.seat_number)) return true;
      const normalizedNum = s.seat_number?.replace('LS', 'SL').replace('L', 'S');
      return selectedSeatIds.some((id) => {
        const normId = String(id).replace('LS', 'SL').replace('L', 'S');
        return id === s.id || id === s.seat_number || normId === normalizedNum;
      });
    });
  }, [selectedSeatIds, lowerSleepers, lowerSeats, upperLeftSleepers, upperRightSleepers]);

  // Total calculated fare
  const totalFare = useMemo(() => {
    return selectedSeatObjects.reduce((acc, s) => acc + Number(s.fare || 0), 0);
  }, [selectedSeatObjects]);

  // Proceed to passenger details
  const handleProceed = () => {
    if (selectedSeatObjects.length === 0) {
      alert('Please select at least one seat to proceed.');
      return;
    }

    const selectedBus = trip || {};
    const selectedSeatList = selectedSeatObjects.map((s) => s.seat_number);

    // Resolve boarding & dropping stops
    const selectedBoarding = stops.find((s) => s.id === boardingStopId);
    const selectedDropping = stops.find((s) => s.id === droppingStopId);

    const selectedBoardingPoint = selectedBoarding
      ? (selectedBoarding.name || selectedBoarding.stop_name || `${selectedBoarding.city}`)
      : (selectedBus.boardingStopName || selectedBus.from_city || 'Coimbatore Omni Bus Stand');

    const selectedDroppingPoint = selectedDropping
      ? (selectedDropping.name || selectedDropping.stop_name || `${selectedDropping.city}`)
      : (selectedBus.droppingStopName || selectedBus.to_city || 'Karaikudi New Bus Stand');

    const farePerSeat = selectedSeatObjects.length > 0 && selectedSeatObjects[0].fare
      ? Number(selectedSeatObjects[0].fare)
      : Number(selectedBus.fare || selectedBus.base_fare || selectedBus.base_seat_fare || 1150);

    const totalCalculatedFare = totalFare > 0
      ? totalFare
      : selectedSeatObjects.length * farePerSeat;

    const activeBusData = {
      id: selectedBus.id || tripId,
      busId: selectedBus.id || tripId,
      tripId,
      bus_number: selectedBus.registration_number || selectedBus.bus_number || selectedBus.busNumber || selectedBus.serviceNumber,
      busNumber: selectedBus.registration_number || selectedBus.bus_number || selectedBus.busNumber || selectedBus.serviceNumber,
      registration_number: selectedBus.registration_number || selectedBus.bus_number,
      registrationNumber: selectedBus.registration_number || selectedBus.bus_number,
      service_number: selectedBus.serviceNumber || selectedBus.service_number || selectedBus.trip_number || selectedBus.bus_number,
      serviceNumber: selectedBus.serviceNumber || selectedBus.service_number || selectedBus.trip_number || selectedBus.bus_number,
      trip_number: selectedBus.serviceNumber || selectedBus.service_number || selectedBus.trip_number || selectedBus.bus_number,
      operator_name: selectedBus.operatorName || selectedBus.travelName || selectedBus.travel_name || selectedBus.operator_name,
      operatorName: selectedBus.operatorName || selectedBus.travelName || selectedBus.travel_name || selectedBus.operator_name,
      travel_name: selectedBus.operatorName || selectedBus.travelName || selectedBus.travel_name || selectedBus.operator_name,
      travelName: selectedBus.operatorName || selectedBus.travelName || selectedBus.travel_name || selectedBus.operator_name,
      bus_type: selectedBus.bus_type || 'AC Sleeper 2+1',
      originCity: selectedBus.from_city || selectedBus.fromCity || selectedBus.source || 'Coimbatore',
      destinationCity: selectedBus.to_city || selectedBus.toCity || selectedBus.destination || 'Karaikudi',
      origin_city: selectedBus.from_city || selectedBus.fromCity || selectedBus.source || 'Coimbatore',
      destination_city: selectedBus.to_city || selectedBus.toCity || selectedBus.destination || 'Karaikudi',
      source: selectedBus.from_city || selectedBus.fromCity || selectedBus.source || 'Coimbatore',
      destination: selectedBus.to_city || selectedBus.toCity || selectedBus.destination || 'Karaikudi',
      departure_time: selectedBus.departure_time || selectedBus.departureTime,
      departureTime: selectedBus.departure_time || selectedBus.departureTime,
      arrival_time: selectedBus.estimated_arrival_time || selectedBus.arrival_time,
      estimated_arrival_time: selectedBus.estimated_arrival_time || selectedBus.arrival_time,
      arrivalTime: selectedBus.estimated_arrival_time || selectedBus.arrival_time,
      base_fare: selectedBus.fare || selectedBus.base_fare,
      fare: selectedBus.fare || selectedBus.base_fare,
      boardingPoint: selectedBoardingPoint,
      droppingPoint: selectedDroppingPoint,
    };
    try {
      sessionStorage.setItem('smartroute_active_bus', JSON.stringify(activeBusData));
      sessionStorage.setItem('smartroute_selected_seats', JSON.stringify(selectedSeatList));
      sessionStorage.setItem('smartroute_boarding_point', selectedBoardingPoint);
      sessionStorage.setItem('smartroute_dropping_point', selectedDroppingPoint);
    } catch (e) {
      // storage unavailable
    }

    navigate('/passenger-details', {
      state: {
        busId: selectedBus.id || tripId,
        operatorName: selectedBus.operatorName || selectedBus.travelName || selectedBus.travel_name,
        serviceNumber: selectedBus.serviceNumber || selectedBus.service_number || selectedBus.trip_number || selectedBus.bus_number,
        selectedSeats: selectedSeatList, // e.g., ['U5']
        farePerSeat: farePerSeat,
        totalAmount: totalCalculatedFare, // e.g., 1150
        boardingPoint: selectedBoardingPoint,
        droppingPoint: selectedDroppingPoint,
        travelDate: searchDate || selectedBus.travel_date || selectedBus.journey_date || new Date().toISOString().split('T')[0],

        // Rich metadata for persistence & fallback
        selectedBus: activeBusData,
        boardingStopId: boardingStopId || selectedBoarding?.id,
        droppingStopId: droppingStopId || selectedDropping?.id,
        selectedSeatObjects: selectedSeatObjects,
        preSelectedSeatNumbers: selectedSeatList,
        preSelectedSeatIds: selectedSeatObjects.map((s) => s.id),
        tripDetails: selectedBus,
      },
    });
  };

  // Render individual seat item with exact soft-pink theme & state styling
  const renderSeatItem = (seat) => {
    const isSelected = selectedSeatIds.includes(seat.id);
    const isSleeper = seat.seat_type === 'sleeper';
    const isBooked = seat.status === 'booked' || seat.disabled === true;
    const gender = String(seat.gender || '').toLowerCase();
    const isBookedMale = isBooked && gender === 'male';
    const isBookedFemale = isBooked && gender === 'female';
    const isHeld = seat.status === 'held';
    const isAvailable = !isBooked && !isHeld && !isSelected;

    let bg = '#FFFFFF';
    let borderColor = '#10B981';
    let textColor = '#24152D';
    let cursor = 'pointer';

    if (isSelected) {
      bg = '#C13D78';
      borderColor = '#A82F65';
      textColor = '#FFFFFF';
    } else if (isBookedMale) {
      bg = 'rgba(59, 130, 246, 0.14)';
      borderColor = '#3B82F6';
      textColor = '#1E40AF';
      cursor = 'not-allowed';
    } else if (isBookedFemale) {
      bg = 'rgba(236, 72, 153, 0.14)';
      borderColor = '#EC4899';
      textColor = '#9D174D';
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
      <button
        key={seat.id}
        type="button"
        onClick={() => handleSeatClick(seat)}
        disabled={isBooked || isHeld || seat.disabled}
        style={{
          width: isSleeper ? (activeDeckTab === 'both' ? 76 : 88) : 38,
          height: isSleeper ? 38 : 38,
          background: bg,
          border: `1.5px solid ${borderColor}`,
          borderRadius: 7,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          cursor,
          position: 'relative',
          padding: 2,
          transition: 'all 0.15s ease',
          boxShadow: isSelected ? '0 4px 12px rgba(193, 61, 120, 0.35)' : 'none',
          transform: isSelected ? 'scale(1.05)' : 'none',
        }}
        title={`Seat ${seat.seat_number} • ${isSleeper ? 'Luxury Sleeper' : 'Pushback Seat'} • ₹${seat.fare} (${seat.status})`}
      >
        {/* Sleeper pillow or seat headrest marker */}
        {isSleeper ? (
          <div
            style={{
              position: 'absolute',
              left: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 5,
              height: 18,
              borderRadius: 2,
              background: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(36, 21, 45, 0.16)',
            }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 18,
              height: 3,
              borderRadius: 2,
              background: isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(36, 21, 45, 0.18)',
            }}
          />
        )}

        <span style={{ fontSize: 11, fontWeight: 800, color: textColor, lineHeight: 1 }}>
          {seat.seat_number}
        </span>
      </button>
    );
  };

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 16,
        border: '1.5px solid #F1EDFA',
        padding: '24px 20px',
        boxShadow: '0 8px 30px rgba(36, 21, 45, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        position: 'relative',
        animation: 'srFadeIn 0.25s ease-out',
      }}
    >
      {/* Top Bar: Coach Model Title & Close Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1EDFA', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              background: 'rgba(193, 61, 120, 0.08)',
              padding: '6px 12px',
              borderRadius: 8,
              color: '#C13D78',
              fontWeight: 800,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Sparkles size={15} /> Seater-Cum-Sleeper
          </div>
          <span style={{ fontSize: 13, color: '#6E5D73', fontWeight: 700 }}>
            S24 + B24 + D1 = 49
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            style={{ padding: '5px 12px', fontSize: 12, height: 32 }}
          >
            <X size={14} style={{ marginRight: 4 }} /> Close
          </button>
        )}
      </div>

      {/* Visual Legend Header */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexWrap: 'wrap',
          background: '#FFF1F6',
          padding: '10px 16px',
          borderRadius: 10,
          border: '1px solid #F1EDFA',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: '#FFFFFF', border: '1.5px solid #10B981' }} />
          <span style={{ color: '#24152D' }}>Available</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: '#C13D78', border: '1.5px solid #A82F65' }} />
          <span style={{ color: '#C13D78', fontWeight: 700 }}>Selected</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(59, 130, 246, 0.16)', border: '1.5px solid #3B82F6' }} />
          <span style={{ color: '#1E40AF' }}>Booked (Male)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(236, 72, 153, 0.16)', border: '1.5px solid #EC4899' }} />
          <span style={{ color: '#9D174D' }}>Booked (Female)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 16, height: 16, borderRadius: 4, background: 'rgba(245, 158, 11, 0.16)', border: '1.5px solid #F59E0B' }} />
          <span style={{ color: '#B45309' }}>Temporarily Held</span>
        </div>
      </div>

      {/* Deck Selector Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{ display: 'inline-flex', background: '#F1EDFA', padding: 4, borderRadius: 10, gap: 4 }}>
          <button
            type="button"
            onClick={() => setActiveDeckTab('both')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: activeDeckTab === 'both' ? 700 : 500,
              background: activeDeckTab === 'both' ? '#FFFFFF' : 'transparent',
              color: activeDeckTab === 'both' ? '#C13D78' : '#6E5D73',
              boxShadow: activeDeckTab === 'both' ? '0 1px 3px rgba(36,21,45,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Both Decks View
          </button>
          <button
            type="button"
            onClick={() => setActiveDeckTab('lower')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: activeDeckTab === 'lower' ? 700 : 500,
              background: activeDeckTab === 'lower' ? '#FFFFFF' : 'transparent',
              color: activeDeckTab === 'lower' ? '#C13D78' : '#6E5D73',
              boxShadow: activeDeckTab === 'lower' ? '0 1px 3px rgba(36,21,45,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Lower Deck (30 Positions)
          </button>
          <button
            type="button"
            onClick={() => setActiveDeckTab('upper')}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 12,
              fontWeight: activeDeckTab === 'upper' ? 700 : 500,
              background: activeDeckTab === 'upper' ? '#FFFFFF' : 'transparent',
              color: activeDeckTab === 'upper' ? '#C13D78' : '#6E5D73',
              boxShadow: activeDeckTab === 'upper' ? '0 1px 3px rgba(36,21,45,0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Upper Deck (18 Sleepers)
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6E5D73', fontSize: 13, fontWeight: 600 }}>
          Loading dynamic physical seat matrix...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 24, color: '#DC2626', fontSize: 13 }}>
          {error}
        </div>
      ) : (
        /* Authentic 2+1 Vertical Sleeper & Seater Coach Layout */
        <div className="w-full flex flex-col gap-6">
          <CoachSeatLayout
            bus={trip?.bus || (trip?.bus_type ? { type: trip.bus_type === 'ac_sleeper' ? 'Fully Sleeper' : '2+1 Sleeper/Seater' } : null)}
            trip={trip}
            selectedSeats={selectedSeatIds}
            onSeatToggle={handleSeatClick}
            onProceed={handleProceed}
            initialBoardingStopId={boardingStopId}
            initialDroppingStopId={droppingStopId}
            searchDate={searchDate}
            showFloatingBar={false}
            activeDeckTab={activeDeckTab}
            onDeckTabChange={setActiveDeckTab}
            isAuthorizedStaff={false}
          />

          {/* Reference Structural Diagram */}
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
                borderRadius: 14,
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: '0 2px 8px rgba(36, 21, 45, 0.04)',
              }}
            >
              {/* Cockpit Indicator: Front Orientation & Driver Seat Icon */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#FFF1F6',
                  border: '1px solid #E7A0BF',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#24152D',
                }}
              >
                <div style={{ width: 24 }} />
                <span style={{ color: '#6E5D73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Lower Deck (30)
                </span>
                {/* Front Right Driver - Icon Only */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 24, color: '#24152D' }} title="Driver Seat">
                  <span>🛞</span>
                </div>
              </div>

              {/* Lower Deck Grid: Left 6 Sleepers | Central Aisle | Right 24 Seater Seats */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 28px 1fr',
                  gap: 8,
                  alignItems: 'start',
                }}
              >
                {/* Left Column: 6 Single Sleepers (SL1 to SL6) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6E5D73', textAlign: 'center', marginBottom: 2 }}>
                    SINGLE SLEEPERS
                  </div>
                  {lowerSleepers.map((slp) => renderSeatItem(slp))}
                </div>

                {/* Central Walking Aisle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    height: '100%',
                    borderLeft: '1px dashed #E7A0BF',
                    borderRight: '1px dashed #E7A0BF',
                    color: '#AB9CB0',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    padding: '8px 0',
                    minHeight: 280,
                  }}
                >
                  <span>A</span>
                  <span>I</span>
                  <span>S</span>
                  <span>L</span>
                  <span>E</span>
                </div>

                {/* Right Columns: 24 Pushback Seats (2x12 arrangement) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6E5D73', textAlign: 'center', marginBottom: 2 }}>
                    2X12 PUSHBACK SEATS
                  </div>
                  {lowerSeats.map((pair, rowIdx) => (
                    <div key={rowIdx} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      {renderSeatItem(pair[0])}
                      {renderSeatItem(pair[1])}
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
                borderRadius: 14,
                padding: '18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                boxShadow: '0 2px 8px rgba(36, 21, 45, 0.04)',
              }}
            >
              {/* Upper Deck Front Orientation */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: '#FFF1F6',
                  border: '1px solid #E7A0BF',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#24152D',
                }}
              >
                <span style={{ color: '#6E5D73', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Upper Deck (18)
                </span>
              </div>

              {/* Upper Deck Grid: Left 9 Sleepers | Central Aisle | Right 9 Sleepers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 28px 1fr',
                  gap: 10,
                  alignItems: 'start',
                }}
              >
                {/* Left Column: 9 Single Sleepers (U1 to U9) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6E5D73', marginBottom: 2 }}>
                    LEFT BERTHS (U1-U9)
                  </div>
                  {upperLeftSleepers.map((slp) => renderSeatItem(slp))}
                </div>

                {/* Central Walking Aisle */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    height: '100%',
                    borderLeft: '1px dashed #E7A0BF',
                    borderRight: '1px dashed #E7A0BF',
                    color: '#AB9CB0',
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    padding: '8px 0',
                    minHeight: 280,
                  }}
                >
                  <span>A</span>
                  <span>I</span>
                  <span>S</span>
                  <span>L</span>
                  <span>E</span>
                </div>

                {/* Right Column: 9 Single Sleepers (U10 to U18) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#6E5D73', marginBottom: 2 }}>
                    RIGHT BERTHS (U10-U18)
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

      {/* ===================== DYNAMIC BOTTOM SELECTION SUMMARY FOOTER ===================== */}
      {selectedSeatObjects.length > 0 && (
        <div
          style={{
            background: '#FFF1F6',
            border: '1.5px solid #E7A0BF',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 4px 20px rgba(193, 61, 120, 0.12)',
            animation: 'srFadeIn 0.2s ease',
          }}
        >
          {/* Selected Seat Badges & Price */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#24152D' }}>
                Selected ({selectedSeatObjects.length}):
              </span>
              {selectedSeatObjects.map((s) => (
                <span
                  key={s.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: '#C13D78',
                    color: '#FFFFFF',
                    padding: '3px 8px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {s.seat_number}
                  <button
                    type="button"
                    onClick={() => handleSeatClick(s)}
                    style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>

            <div style={{ fontSize: 12, color: '#6E5D73' }}>
              Total Calculated Fare:{' '}
              <strong style={{ fontSize: 18, color: '#C13D78', fontWeight: 800 }}>
                ₹{totalFare}
              </strong>{' '}
              <span style={{ fontSize: 11, color: '#8F7E94' }}>(inclusive of GST)</span>
            </div>
          </div>

          {/* Boarding & Dropping Selectors */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {stops.length > 0 && (
              <>
                <div style={{ minWidth: 160 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6E5D73', marginBottom: 3 }}>
                    Boarding Point:
                  </label>
                  <select
                    className="input-field"
                    value={boardingStopId}
                    onChange={(e) => setBoardingStopId(e.target.value)}
                    style={{ padding: '6px 28px 6px 10px', fontSize: 12, height: 36, background: '#FFFFFF' }}
                  >
                    {stops
                      .filter((s) => s.is_boarding_point)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city})
                        </option>
                      ))}
                  </select>
                </div>

                <div style={{ minWidth: 160 }}>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6E5D73', marginBottom: 3 }}>
                    Dropping Point:
                  </label>
                  <select
                    className="input-field"
                    value={droppingStopId}
                    onChange={(e) => setDroppingStopId(e.target.value)}
                    style={{ padding: '6px 28px 6px 10px', fontSize: 12, height: 36, background: '#FFFFFF' }}
                  >
                    {stops
                      .filter((s) => s.is_dropping_point)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.city})
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}

            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleProceed}
              className="btn btn-primary"
              style={{
                padding: '10px 22px',
                fontSize: 13,
                fontWeight: 800,
                borderRadius: 10,
                marginTop: stops.length > 0 ? 16 : 0,
              }}
            >
              Proceed to Passenger Details <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

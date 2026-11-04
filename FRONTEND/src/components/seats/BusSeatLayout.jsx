import React, { useState, useMemo } from 'react';
import { Compass, Footprints, ShieldCheck, Lock, BedDouble, Armchair, AlertCircle } from 'lucide-react';

/**
 * SMART ROUTE — Real Indian Commercial Coach Layout Component (BusSeatLayout)
 *
 * Physical Specification:
 * - Chassis: TATA LPO 1618
 * - Body Builder: Prakash Vega Coach
 * - Configuration: 2+1 AC Seat/Cum/Sleeper
 * - Cockpit: Driver (Right) side, Stairs / Entrance (Left)
 * - Orientation: ▲ FRONT OF COACH, central WALKING AISLE
 * - Lower Deck (24 Seats + 6 Sleepers): 24 Pushback Seats + 6 Luxury Sleepers (30 positions)
 * - Upper Deck (18 Sleepers): 18 Panoramic Sleepers (18 positions)
 *
 * Real Seat States:
 * - Available (Clickable, green border, transparent fare)
 * - Selected (Active booking selection with brand pink glow)
 * - Booked (Occupied by confirmed passenger, disabled)
 * - Temporarily Held (Locked in real-time by another customer session, disabled)
 */
export default function BusSeatLayout({
  seats = [],
  selectedSeatIds = [],
  onSeatToggle,
  baseSeatFare = 850,
  baseSleeperFare = 1350,
}) {
  const [activeDeck, setActiveDeck] = useState('lower');

  // Intelligent extraction of deck seats with full fallback support
  const { lowerSleepers, lowerSeats, upperSleepers, hasValidSeats } = useMemo(() => {
    if (!Array.isArray(seats) || seats.length === 0) {
      return { lowerSleepers: [], lowerSeats: [], upperSleepers: [], hasValidSeats: false };
    }

    const map = new Map();
    seats.forEach((s) => {
      map.set(s.seat_number, s);
      map.set(s.id, s);
    });

    // 1. Lower Sleepers (LS1-LS6 or SL1-SL6)
    const lSleepers = [];
    for (let i = 1; i <= 6; i++) {
      const numLS = `LS${i}`;
      const numSL = `SL${i}`;
      const s =
        map.get(numLS) ||
        map.get(numSL) ||
        seats.find((item) => (item.deck || '').toLowerCase() === 'lower' && item.seat_type === 'sleeper' && item.seat_number?.includes(String(i)));

      if (s) {
        lSleepers.push(s);
      } else {
        lSleepers.push({
          id: `slp-ls-${i}`,
          seat_number: numLS,
          seat_type: 'sleeper',
          deck: 'lower',
          fare: baseSleeperFare,
          status: 'available',
        });
      }
    }

    // 2. Lower Pushback Seats (L1-L24 or S1-S24)
    const lSeats = [];
    for (let r = 0; r < 12; r++) {
      const numL1 = `L${r * 2 + 1}`;
      const numL2 = `L${r * 2 + 2}`;
      const numS1 = `S${r * 2 + 1}`;
      const numS2 = `S${r * 2 + 2}`;

      const s1 =
        map.get(numL1) ||
        map.get(numS1) ||
        seats.find((item) => (item.deck || '').toLowerCase() === 'lower' && item.seat_type === 'seat' && item.seat_number === numL1);

      const s2 =
        map.get(numL2) ||
        map.get(numS2) ||
        seats.find((item) => (item.deck || '').toLowerCase() === 'lower' && item.seat_type === 'seat' && item.seat_number === numL2);

      const rowPair = [
        s1 || {
          id: `seat-l-${r * 2 + 1}`,
          seat_number: numL1,
          seat_type: 'seat',
          deck: 'lower',
          fare: baseSeatFare,
          status: 'available',
        },
        s2 || {
          id: `seat-l-${r * 2 + 2}`,
          seat_number: numL2,
          seat_type: 'seat',
          deck: 'lower',
          fare: baseSeatFare,
          status: 'available',
        },
      ];
      lSeats.push(rowPair);
    }

    // 3. Upper Sleepers (U1-U18)
    const uSleepers = [];
    for (let i = 1; i <= 18; i++) {
      const numU = `U${i}`;
      const s =
        map.get(numU) ||
        seats.find((item) => (item.deck || '').toLowerCase() === 'upper' && item.seat_number === numU);

      if (s) {
        uSleepers.push(s);
      } else {
        uSleepers.push({
          id: `slp-u-${i}`,
          seat_number: numU,
          seat_type: 'sleeper',
          deck: 'upper',
          fare: baseSleeperFare,
          status: 'available',
        });
      }
    }

    return {
      lowerSleepers: lSleepers,
      lowerSeats: lSeats,
      upperSleepers: uSleepers,
      hasValidSeats: true,
    };
  }, [seats, baseSeatFare, baseSleeperFare]);

  const getSeatStatus = (seat) => {
    if (selectedSeatIds.includes(seat.id) || selectedSeatIds.includes(seat.seat_number)) {
      return 'selected';
    }
    if (seat.status === 'booked' || seat.disabled) return 'booked';
    if (seat.status === 'held') return 'held';
    return 'available';
  };

  const handleSeatClick = (seat) => {
    const status = getSeatStatus(seat);
    if (seat.disabled) return;
    if (status === 'available' || status === 'selected') {
      if (typeof onSeatToggle === 'function') {
        onSeatToggle(seat);
      }
    }
  };

  const renderSeatItem = (seat) => {
    const status = getSeatStatus(seat);
    const isSelected = status === 'selected';
    const isBooked = status === 'booked';
    const isHeld = status === 'held';
    const isSleeper = seat.seat_type === 'sleeper';
    const fare = seat.fare || (isSleeper ? baseSleeperFare : baseSeatFare);
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
        key={seat.id || seat.seat_number}
        onClick={() => {
          if (isBooked || seat.disabled) return;
          handleSeatClick(seat);
        }}
        title={`Seat ${seat.seat_number} (${isSleeper ? 'Sleeper' : 'Pushback'}) — ₹${fare}${isBookedFemale ? ' (Booked • Female)' : isBookedMale ? ' (Booked • Male)' : isBooked ? ' (Booked)' : isHeld ? ' (Held)' : ''}`}
        style={{
          width: isSleeper ? 56 : 46,
          height: isSleeper ? 78 : 46,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center', width: '100%' }}>
      {/* Deck Selector Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          background: '#F1EDFA',
          padding: 6,
          borderRadius: 12,
          border: '1px solid #E7A0BF',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveDeck('lower')}
          className={`btn ${activeDeck === 'lower' ? 'btn-primary' : 'btn-outline'}`}
          style={{
            padding: '8px 18px',
            fontSize: 13,
            gap: 8,
            fontWeight: activeDeck === 'lower' ? 800 : 600,
            background: activeDeck === 'lower' ? '#C13D78' : '#FFFFFF',
            color: activeDeck === 'lower' ? '#FFFFFF' : '#24152D',
          }}
        >
          <Armchair size={15} /> Lower Deck (24 Seats + 6 Sleepers)
        </button>
        <button
          type="button"
          onClick={() => setActiveDeck('upper')}
          className={`btn ${activeDeck === 'upper' ? 'btn-primary' : 'btn-outline'}`}
          style={{
            padding: '8px 18px',
            fontSize: 13,
            gap: 8,
            fontWeight: activeDeck === 'upper' ? 800 : 600,
            background: activeDeck === 'upper' ? '#C13D78' : '#FFFFFF',
            color: activeDeck === 'upper' ? '#FFFFFF' : '#24152D',
          }}
        >
          <BedDouble size={15} /> Upper Deck (18 Sleepers)
        </button>
      </div>

      {/* Seating State Legend */}
      <div
        style={{
          display: 'flex',
          gap: 18,
          fontSize: 12,
          color: '#6E5D73',
          flexWrap: 'wrap',
          justifyContent: 'center',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#FFFFFF', border: '1.5px solid #10B981' }} />
          <span>Available</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#C13D78', border: '1.5px solid #A82F65' }} />
          <span style={{ color: '#C13D78', fontWeight: 800 }}>Selected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(100, 116, 139, 0.14)', border: '1.5px solid #94A3B8' }} />
          <span>Booked</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#EFF6FF', border: '1.5px solid #93C5FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#1D4ED8' }}>M</span>
          <span style={{ color: '#1D4ED8', fontWeight: 700 }}>Booked (Male)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: '#FFF1F2', border: '1.5px solid #FDA4AF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#E11D48' }}>F</span>
          <span style={{ color: '#E11D48', fontWeight: 700 }}>Booked (Female)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 14, height: 14, borderRadius: 3, background: 'rgba(245, 158, 11, 0.14)', border: '1.5px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8 }}>🔒</span>
          <span>Temporarily Held</span>
        </div>
      </div>

      {/* Error or Empty State Handling */}
      {!hasValidSeats && seats.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 32,
            background: '#FFF1F6',
            borderRadius: 12,
            border: '1.5px dashed #E7A0BF',
            color: '#6E5D73',
            maxWidth: 480,
          }}
        >
          <AlertCircle size={24} color="#C13D78" style={{ marginBottom: 6 }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: '#24152D' }}>
            Seating configuration is currently loading...
          </div>
          <div style={{ fontSize: 12, marginTop: 4 }}>
            Please wait or re-select this bus service if the layout does not appear momentarily.
          </div>
        </div>
      ) : (
        /* Real Bus Coach Silhouette */
        <div
          style={{
            background: '#FFFFFF',
            border: '2px solid #E7A0BF',
            borderRadius: 18,
            padding: '20px 18px',
            width: '100%',
            maxWidth: 480,
            boxShadow: '0 4px 18px rgba(36, 21, 45, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          {/* Cockpit: Front Direction Indicator & Driver Seat Icon */}
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

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: 24, color: '#24152D' }} title="Driver Seat">
              <Compass size={18} />
            </div>
          </div>

          {/* Physical Grid of Seats & Sleepers */}
          {activeDeck === 'lower' ? (
            /* LOWER DECK: 6 Sleepers on Left | Central Aisle | 24 Seats on Right */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 24px 1fr',
                gap: 8,
                alignItems: 'start',
              }}
            >
              {/* Left Column: 6 Sleepers */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#6E5D73', marginBottom: 2 }}>
                  SLEEPERS (6)
                </div>
                {lowerSleepers.map((slp) => renderSeatItem(slp))}
              </div>

              {/* Central Walking Aisle */}
              <div
                style={{
                  display: 'flex',
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

              {/* Right Columns: 24 Pushback Seats (12 Rows of 2) */}
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
          ) : (
            /* UPPER DECK: 18 Sleepers in 2+1 Layout (9 Left | Aisle | 9 Right) */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 24px 1fr',
                gap: 10,
                alignItems: 'start',
              }}
            >
              {/* Left Side: 9 Sleepers (U1-U9) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#6E5D73', marginBottom: 2 }}>
                  LEFT BERTHS (U1-U9)
                </div>
                {upperSleepers.slice(0, 9).map((slp) => renderSeatItem(slp))}
              </div>

              {/* Central Walking Aisle */}
              <div
                style={{
                  display: 'flex',
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

              {/* Right Side: 9 Sleepers (U10-U18) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#6E5D73', marginBottom: 2 }}>
                  RIGHT BERTHS (U10-U18)
                </div>
                {upperSleepers.slice(9, 18).map((slp) => renderSeatItem(slp))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}

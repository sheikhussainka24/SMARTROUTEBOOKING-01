/**
 * SMART ROUTE — Commercial Bus Gender Allocation Rules
 * 
 * Enforces:
 * 1. Adjacent Seat Quota: Separate bookings cannot pair opposite genders (e.g. stranger male next to female).
 * 2. Mixed-Gender Family Bookings: Genders within the same ticket/booking (Husband & Wife, Parent & Child)
 *    are ALWAYS permitted to sit together on the same PNR.
 */

export const DEFAULT_SEAT_PAIRS = [
  // Upper Deck Double Sleepers (Tata Capella & Volvo 9600)
  ['U7', 'U8'],
  ['U9', 'U10'],
  ['U11', 'U12'],
  ['U13', 'U14'],
  ['U15', 'U16'],
  ['U17', 'U18'],

  // Lower Deck Double Sleepers (Volvo 9600)
  ['L7', 'L8'],
  ['L9', 'L10'],
  ['L11', 'L12'],
  ['L13', 'L14'],
  ['L15', 'L16'],
  ['L17', 'L18'],

  // Lower Deck 2+2 Pushback Pairs (Tata Capella)
  ['S1', 'S2'],
  ['S3', 'S4'],
  ['S5', 'S6'],
  ['S7', 'S8'],
  ['S9', 'S10'],
  ['S11', 'S12'],
  ['S13', 'S14'],
  ['S15', 'S16'],
  ['S17', 'S18'],
  ['S19', 'S20'],
  ['S21', 'S22'],
  ['S23', 'S24'],

  // Single Deck 2+2 Pushback Pairs (Ashok Leyland / BharatBenz)
  ['S25', 'S26'],
  ['S27', 'S28'],
  ['S29', 'S30'],
  ['S31', 'S32'],
  ['S33', 'S34'],
  ['S35', 'S36'],
  ['S37', 'S38'],
  ['S39', 'S40'],
];

export function getAdjacentSeat(seatNumber, seatPairs = DEFAULT_SEAT_PAIRS) {
  if (!seatNumber) return null;
  const num = String(seatNumber).trim();
  for (const pair of seatPairs) {
    if (pair[0] === num) return pair[1];
    if (pair[1] === num) return pair[0];
  }
  return null;
}

export const validateSeatGenders = (passengers, seatPairs = DEFAULT_SEAT_PAIRS, existingBookings = [], currentBookingId = null) => {
  if (!passengers || !Array.isArray(passengers)) return { valid: true };

  // 1. Check against separate, existing bookings:
  for (const passenger of passengers) {
    const pairSeatId = getAdjacentSeat(passenger.seatNumber, seatPairs);
    if (!pairSeatId) continue;

    const existingNeighbor = existingBookings.find(
      (b) => b.seatNumber === pairSeatId || b.seat_number === pairSeatId
    );

    if (existingNeighbor && existingNeighbor.bookingId !== currentBookingId && existingNeighbor.booking_id !== currentBookingId) {
      const neighborGender = (existingNeighbor.gender || existingNeighbor.passenger_gender || '').toLowerCase();
      const passengerGender = (passenger.gender || '').toLowerCase();

      if (neighborGender === 'female' && passengerGender === 'male') {
        return {
          valid: false,
          message: `Berth ${passenger.seatNumber} is adjacent to a female passenger from another booking and can only be reserved by a female traveler.`
        };
      }
      if (neighborGender === 'male' && passengerGender === 'female') {
        return {
          valid: false,
          message: `Berth ${passenger.seatNumber} is adjacent to a male passenger from another booking.`
        };
      }
    }
  }

  // 2. Intra-ticket check (Same PNR):
  // Genders within the same booking are ALWAYS allowed to sit together (Husband & Wife, Parent & Child).
  return { valid: true };
};

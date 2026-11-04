describe('Seat Inventory & Segment Concurrency Tests', () => {
  // Overlapping route segment mathematical property:
  // NOT (existing_to <= requested_from OR existing_from >= requested_to)
  function checkOverlap(reqFrom, reqTo, existFrom, existTo) {
    return !(existTo <= reqFrom || existFrom >= reqTo);
  }

  test('Identifies overlapping seat segments correctly', () => {
    // Stop sequence: 1: Bangalore, 2: Hosur, 3: Dharmapuri, 4: Salem, 5: Madurai

    // Booking A: Bangalore(1) -> Salem(4)
    // Booking B: Hosur(2) -> Dharmapuri(3)
    // Overlaps: TRUE
    expect(checkOverlap(2, 3, 1, 4)).toBe(true);

    // Booking C: Bangalore(1) -> Hosur(2)
    // Booking D: Hosur(2) -> Salem(4)
    // Adjacent stops do not conflict: Hosur dropping vs Hosur boarding
    expect(checkOverlap(2, 4, 1, 2)).toBe(false);

    // Booking E: Salem(4) -> Madurai(5)
    // Existing Booking: Bangalore(1) -> Salem(4)
    // Do not conflict:
    expect(checkOverlap(4, 5, 1, 4)).toBe(false);

    // Partial overlap: Dharmapuri(3) -> Madurai(5)
    // Existing Booking: Bangalore(1) -> Salem(4)
    // Overlaps between 3 and 4: TRUE
    expect(checkOverlap(3, 5, 1, 4)).toBe(true);
  });
});

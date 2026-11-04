/**
 * SMART ROUTE — Database Stored Procedures and Triggers
 */

export const DATABASE_FUNCTIONS = {
  // Update timestamp trigger function
  TOUCH_UPDATED_AT: `
    CREATE OR REPLACE FUNCTION touch_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `,

  // Auto clean expired seat locks
  CLEAN_EXPIRED_SEAT_LOCKS: `
    CREATE OR REPLACE FUNCTION release_expired_seat_locks()
    RETURNS INT AS $$
    DECLARE
      released_count INT;
    BEGIN
      DELETE FROM seat_locks
      WHERE locked_until < NOW()
        AND status = 'locked';
      GET DIAGNOSTICS released_count = ROW_COUNT;
      RETURN released_count;
    END;
    $$ LANGUAGE plpgsql;
  `,

  // Check overlap for trip segments
  SEGMENTS_OVERLAP: `
    CREATE OR REPLACE FUNCTION check_segment_overlap(
      p_from_order INT,
      p_to_order INT,
      existing_from INT,
      existing_to INT
    ) RETURNS BOOLEAN AS $$
    BEGIN
      -- Two segments do NOT overlap if one ends before the other starts
      RETURN NOT (existing_to <= p_from_order OR existing_from >= p_to_order);
    END;
    $$ LANGUAGE plpgsql IMMUTABLE;
  `
};

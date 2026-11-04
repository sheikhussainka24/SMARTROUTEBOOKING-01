/**
 * SMART ROUTE — GPS Telemetry Filtering and Sanitization
 */

/**
 * Validate that coordinates are valid Indian terrestrial coordinates
 */
export function isValidCoordinate(latitude, longitude) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return false;
  if (isNaN(latitude) || isNaN(longitude)) return false;
  // Broad bounding box around India and surrounding roads (approx 6°N - 38°N, 68°E - 98°E)
  return latitude >= 6.0 && latitude <= 38.0 && longitude >= 68.0 && longitude <= 98.0;
}

/**
 * Calculate Great-Circle distance between two coordinates in kilometers (Haversine formula)
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Filter out impossible speed spikes (e.g. GPS jumps > 140 km/h)
 */
export function filterGpsJump(prevPoint, newPoint, maxSpeedKmh = 140) {
  if (!prevPoint) return newPoint;
  const timeDiffHours = (new Date(newPoint.time) - new Date(prevPoint.time)) / (1000 * 3600);
  if (timeDiffHours <= 0) return prevPoint;

  const distanceKm = haversineDistance(
    prevPoint.lat,
    prevPoint.lng,
    newPoint.lat,
    newPoint.lng
  );

  const impliedSpeed = distanceKm / timeDiffHours;
  if (impliedSpeed > maxSpeedKmh) {
    // Jump detected, reject coordinate or smooth it
    return prevPoint;
  }

  return newPoint;
}

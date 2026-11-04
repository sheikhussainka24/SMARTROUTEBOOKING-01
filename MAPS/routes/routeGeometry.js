/**
 * SMART ROUTE — Route Geometry & Progress Calculation
 */

import { haversineDistance } from '../../REALTIME/gps/gpsFilter.js';

/**
 * Determine closest upcoming stop given bus's current GPS location
 */
export function findNextStop(currentLat, currentLng, stops = []) {
  if (!stops || stops.length === 0) return null;

  let minDistance = Infinity;
  let closestStopIndex = 0;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    const dist = haversineDistance(
      currentLat,
      currentLng,
      parseFloat(stop.latitude),
      parseFloat(stop.longitude)
    );
    if (dist < minDistance) {
      minDistance = dist;
      closestStopIndex = i;
    }
  }

  // Next stop is either the closest one or the one immediately after if within 200m
  const isAtStop = minDistance <= 0.2; // 200 meters threshold
  const nextStop = isAtStop && closestStopIndex + 1 < stops.length
    ? stops[closestStopIndex + 1]
    : stops[closestStopIndex];

  return {
    nextStop,
    distanceKm: parseFloat(minDistance.toFixed(2)),
    isAtStop,
  };
}

import logger from '../config/logger.js';
import db, { isDbConnected } from '../config/database.js';
import { updateGpsLocation } from '../services/dataStore.js';

/**
 * Handle real-time GPS telemetry and passenger live tracking
 */
export function setupTrackingHandlers(io, socket) {
  // Driver emits live GPS location
  socket.on('driver_gps_update', async (data) => {
    try {
      const { tripId, busId, driverId, latitude, longitude, speed, heading, next_stop_name, eta, current_stop_id } = data;

      if (!tripId || latitude === undefined || longitude === undefined) {
        return socket.emit('error', { message: 'Invalid GPS payload' });
      }

      // 1. Update in-memory telemetry store
      updateGpsLocation({
        tripId,
        busId,
        driverId,
        latitude,
        longitude,
        speed,
        heading,
        current_stop_id,
        next_stop_name,
        eta,
      });

      // 2. Persist to gps_telemetry database table if database is connected
      if (isDbConnected()) {
        try {
          await db('gps_telemetry').insert({
            trip_id: tripId,
            bus_id: busId || null,
            driver_id: driverId || null,
            latitude,
            longitude,
            speed: speed || 0,
            heading: heading || 0,
            recorded_at: new Date(),
          });
        } catch (dbErr) {
          logger.warn(`Failed to persist GPS telemetry to DB: ${dbErr.message}`);
        }
      }

      // 3. Broadcast live coordinates to all passengers watching this trip
      io.to(`trip_${tripId}`).emit('bus_location_updated', {
        tripId,
        busId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: parseFloat(speed || 0),
        heading: parseFloat(heading || 0),
        current_stop_id: current_stop_id || null,
        next_stop_name: next_stop_name || '',
        eta: eta || '',
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Broadcasted GPS update for trip ${tripId}: [${latitude}, ${longitude}]`);
    } catch (error) {
      logger.error('Error handling driver_gps_update:', error);
      socket.emit('error', { message: 'Failed to record GPS telemetry' });
    }
  });
}

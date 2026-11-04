import logger from '../config/logger.js';

/**
 * Handle real-time seat lock and release broadcasting across active booking sessions
 */
export function setupSeatLockHandlers(io, socket) {
  // Broadcast seat held event to other users browsing the same trip layout
  socket.on('seat_locked_notify', (data) => {
    const { tripId, seatIds, lockedUntil } = data;
    if (tripId && seatIds) {
      socket.to(`trip_${tripId}`).emit('seats_held_update', {
        seatIds,
        lockedUntil,
      });
      logger.debug(`Broadcasted seat lock update for trip ${tripId}`);
    }
  });

  // Broadcast seat released event
  socket.on('seat_released_notify', (data) => {
    const { tripId, seatIds } = data;
    if (tripId && seatIds) {
      socket.to(`trip_${tripId}`).emit('seats_released_update', {
        seatIds,
      });
      logger.debug(`Broadcasted seat release update for trip ${tripId}`);
    }
  });
}

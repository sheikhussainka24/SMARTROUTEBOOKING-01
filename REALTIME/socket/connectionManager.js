/**
 * SMART ROUTE — Connection Manager
 * Tracks active socket connections by trip and user role.
 */

class ConnectionManager {
  constructor() {
    this.activeSockets = new Map(); // socketId -> metadata
    this.tripWatchers = new Map();  // tripId -> Set of socketIds
  }

  register(socketId, metadata = {}) {
    this.activeSockets.set(socketId, {
      ...metadata,
      connectedAt: new Date(),
    });
  }

  unregister(socketId) {
    this.activeSockets.delete(socketId);
    for (const [tripId, sockets] of this.tripWatchers.entries()) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.tripWatchers.delete(tripId);
      }
    }
  }

  joinTrip(tripId, socketId) {
    if (!this.tripWatchers.has(tripId)) {
      this.tripWatchers.set(tripId, new Set());
    }
    this.tripWatchers.get(tripId).add(socketId);
  }

  getTripWatcherCount(tripId) {
    return this.tripWatchers.get(tripId)?.size || 0;
  }
}

export default new ConnectionManager();

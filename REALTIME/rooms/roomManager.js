/**
 * SMART ROUTE — Socket Room Manager
 */

export const RoomManager = {
  tripRoom(tripId) {
    return `trip_${tripId}`;
  },

  busRoom(busId) {
    return `bus_${busId}`;
  },

  travelRoom(travelId) {
    return `travel_${travelId}`;
  },

  userRoom(userId) {
    return `user_${userId}`;
  },
};

export default RoomManager;

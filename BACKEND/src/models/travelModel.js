import db from '../config/database.js';

export const TravelModel = {
  findById(id) {
    return db('travels').where({ id }).first();
  },

  findByOwnerId(ownerId) {
    return db('travels').where({ owner_id: ownerId }).first();
  },

  create(travelData) {
    return db('travels').insert(travelData).returning('*');
  },

  update(id, updates) {
    return db('travels')
      .where({ id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
  },
};

export const BusModel = {
  findByTravelId(travelId) {
    return db('buses').where({ travel_id: travelId });
  },

  findById(id) {
    return db('buses').where({ id }).first();
  },

  create(busData) {
    return db('buses').insert(busData).returning('*');
  },
};

export const TripModel = {
  findById(id) {
    return db('trips').where({ id }).first();
  },

  findByTravelId(travelId) {
    return db('trips').where({ travel_id: travelId }).orderBy('departure_time', 'asc');
  },

  create(tripData) {
    return db('trips').insert(tripData).returning('*');
  },
};

export const BookingModel = {
  findById(id) {
    return db('bookings').where({ id }).first();
  },

  findByPnr(pnr) {
    return db('bookings').where({ pnr_number: pnr }).first();
  },

  findByUserId(userId) {
    return db('bookings').where({ user_id: userId }).orderBy('created_at', 'desc');
  },
};

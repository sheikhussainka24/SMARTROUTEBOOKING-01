import db from '../config/database.js';

export const UserModel = {
  findById(id) {
    return db('users').where({ id }).first();
  },

  findByEmailOrMobile(identifier) {
    return db('users')
      .where('email', identifier)
      .orWhere('mobile', identifier)
      .first();
  },

  create(userData) {
    return db('users').insert(userData).returning('*');
  },

  update(id, updates) {
    return db('users')
      .where({ id })
      .update({ ...updates, updated_at: new Date() })
      .returning('*');
  },
};

export default UserModel;

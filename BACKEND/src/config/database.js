import knex from 'knex';
import config from './index.js';
import logger from './logger.js';

const dbConfig = {
  client: 'pg',
  connection: config.db.url || {
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  pool: {
    min: 0,
    max: parseInt(process.env.DB_POOL_MAX || '10', 10),
    acquireTimeoutMillis: 3000,
    createTimeoutMillis: 3000,
    idleTimeoutMillis: 30000,
  },
  migrations: {
    directory: '../database/migrations',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: '../database/seeds',
  },
};

const db = knex(dbConfig);

let isConnected = false;
let lastConnectionError = null;

// Test connection safely without hanging or unbounded retries
export async function testConnection() {
  try {
    await db.raw('SELECT 1');
    logger.info('✅ PostgreSQL database connected successfully');
    isConnected = true;
    lastConnectionError = null;
    return true;
  } catch (error) {
    lastConnectionError = {
      code: error.code || 'UNKNOWN_DB_ERROR',
      message: error.message || 'Database unreachable',
    };
    logger.warn(`⚠️ PostgreSQL daemon not currently reachable at ${config.db.host || 'localhost'}:${config.db.port || 5432} (${error.code || error.message}). Local fallback data store is active.`);
    logger.warn('ℹ️ Notice: For production durability, start PostgreSQL service and run knex migrate:latest.');
    isConnected = false;
    return false;
  }
}

export function isDbConnected() {
  return isConnected;
}

export function getDbDiagnosticInfo() {
  return {
    connected: isConnected,
    host: config.db.host || 'localhost',
    port: config.db.port || 5432,
    database: config.db.name || 'smartroute',
    storageMode: isConnected ? 'postgresql_durable' : 'local_fallback',
    error: isConnected ? null : (lastConnectionError?.code || 'ECONNREFUSED'),
  };
}

export async function closeDbConnection() {
  try {
    await db.destroy();
    logger.info('PostgreSQL connection pool closed.');
  } catch (err) {
    logger.warn('Error closing PostgreSQL pool:', err.message);
  }
}

export function isDurableStorageRequired() {
  return config.env === 'production' || process.env.REQUIRE_DURABLE_STORAGE === 'true';
}

export default db;

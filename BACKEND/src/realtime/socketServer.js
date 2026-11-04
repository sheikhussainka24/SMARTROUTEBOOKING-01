import { Server } from 'socket.io';
import logger from '../config/logger.js';
import config from '../config/index.js';
import { setupTrackingHandlers } from './trackingHandler.js';
import { setupSeatLockHandlers } from './seatLockHandler.js';

let ioInstance = null;

/**
 * Initialize Socket.IO attached to HTTP server
 */
export function initSocketServer(httpServer) {
  const allowedOrigins = [
    config.clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    'http://localhost:5174',
  ].filter(Boolean);

  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive in dev to avoid blocking local testing
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
    transports: ['polling', 'websocket'],
    allowUpgrades: true,
    allowEIO3: true,
    pingInterval: 25000,
    pingTimeout: 20000,
    connectTimeout: 45000,
  });

  // Track low-level engine connection events and errors
  ioInstance.engine.on('connection_error', (err) => {
    logger.debug(`Socket.IO Engine error (${err.code}): ${err.message} from ${err.req?.url}`);
  });

  ioInstance.on('connection', (socket) => {
    logger.info(`🔌 Socket connected: ${socket.id} (transport: ${socket.conn.transport.name})`);

    // Listen for transport upgrade (e.g. polling -> websocket)
    socket.conn.on('upgrade', (transport) => {
      logger.info(`⚡ Socket ${socket.id} upgraded transport to: ${transport.name}`);
    });

    // Join trip room (for live bus tracking or live seat layout)
    socket.on('join_trip', (tripId) => {
      const room = `trip_${tripId}`;
      socket.join(room);
      logger.info(`Socket ${socket.id} joined room: ${room}`);
      socket.emit('joined_room', { room, status: 'success', tripId });
    });

    // Leave trip room
    socket.on('leave_trip', (tripId) => {
      const room = `trip_${tripId}`;
      socket.leave(room);
      logger.info(`Socket ${socket.id} left room: ${room}`);
      socket.emit('left_room', { room, status: 'success', tripId });
    });

    // Connection health / diagnostic ping check
    socket.on('ping_check', (data, ack) => {
      const response = {
        status: 'ok',
        transport: socket.conn.transport.name,
        socketId: socket.id,
        serverTime: new Date().toISOString(),
        echo: data || null,
      };
      if (typeof ack === 'function') {
        ack(response);
      } else {
        socket.emit('pong_check', response);
      }
    });

    // Setup modular event handlers
    setupTrackingHandlers(ioInstance, socket);
    setupSeatLockHandlers(ioInstance, socket);

    socket.on('disconnect', (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  return ioInstance;
}

/**
 * Get Socket.IO singleton instance
 */
export function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.IO has not been initialized yet');
  }
  return ioInstance;
}

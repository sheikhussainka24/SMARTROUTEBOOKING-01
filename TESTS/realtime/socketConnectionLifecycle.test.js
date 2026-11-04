import http from 'http';
import express from '../../BACKEND/node_modules/express/index.js';
import { io as Client } from '../../BACKEND/node_modules/socket.io-client/build/esm/index.js';
import { initSocketServer, getIO } from '../../BACKEND/src/realtime/socketServer.js';

describe('Socket.IO Connection Lifecycle & Real-Time Event Delivery', () => {
  let server;
  let httpServer;
  let port;
  let clientSocket;
  let passengerSocket;

  beforeAll((done) => {
    const app = express();
    httpServer = http.createServer(app);
    initSocketServer(httpServer);

    httpServer.listen(0, () => {
      port = httpServer.address().port;
      done();
    });
  });

  afterAll((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    if (passengerSocket && passengerSocket.connected) {
      passengerSocket.disconnect();
    }
    httpServer.close(done);
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.removeAllListeners();
      clientSocket.disconnect();
      clientSocket = null;
    }
    if (passengerSocket) {
      passengerSocket.removeAllListeners();
      passengerSocket.disconnect();
      passengerSocket = null;
    }
  });

  test('1. Backend startup: Socket.IO attaches correctly to HTTP server', () => {
    const ioInstance = getIO();
    expect(ioInstance).toBeDefined();
    expect(httpServer.listening).toBe(true);
    expect(port).toBeGreaterThan(0);
  });

  test('2. Polling connection: Socket.IO connects successfully using polling transport', (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['polling'],
      autoConnect: true,
      reconnection: false,
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      expect(clientSocket.id).toBeDefined();
      expect(clientSocket.io.engine.transport.name).toBe('polling');
      done();
    });

    clientSocket.on('connect_error', (err) => {
      done(err);
    });
  });

  test('3. WebSocket transport: Socket.IO connects directly via WebSocket', (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: false,
    });

    clientSocket.on('connect', () => {
      expect(clientSocket.connected).toBe(true);
      expect(clientSocket.io.engine.transport.name).toBe('websocket');
      done();
    });

    clientSocket.on('connect_error', (err) => {
      done(err);
    });
  });

  test('4. Diagnostic ping/health check: Server responds with status and transport info', (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['polling', 'websocket'],
    });

    clientSocket.on('connect', () => {
      clientSocket.emit('ping_check', { testId: 'sr-diag-101' }, (response) => {
        expect(response).toBeDefined();
        expect(response.status).toBe('ok');
        expect(response.echo).toEqual({ testId: 'sr-diag-101' });
        expect(response.socketId).toBe(clientSocket.id);
        done();
      });
    });
  });

  test('5. Room management: Client joins and leaves trip room', (done) => {
    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    const testTripId = 'trip-tn-501';

    clientSocket.on('connect', () => {
      clientSocket.emit('join_trip', testTripId);
    });

    clientSocket.on('joined_room', (data) => {
      expect(data.status).toBe('success');
      expect(data.room).toBe(`trip_${testTripId}`);

      clientSocket.emit('leave_trip', testTripId);
    });

    clientSocket.on('left_room', (data) => {
      expect(data.status).toBe('success');
      expect(data.room).toBe(`trip_${testTripId}`);
      done();
    });
  });

  test('6. Real-time telemetry broadcast: Driver emits GPS update, passenger receives live location', (done) => {
    const testTripId = 'trip-exp-808';

    // 1. Passenger connects and joins trip room
    passengerSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
    });

    passengerSocket.on('connect', () => {
      passengerSocket.emit('join_trip', testTripId);
    });

    passengerSocket.on('joined_room', () => {
      // 2. Driver connects and broadcasts GPS telemetry
      clientSocket = Client(`http://localhost:${port}`, {
        transports: ['websocket'],
      });

      clientSocket.on('connect', () => {
        clientSocket.emit('driver_gps_update', {
          tripId: testTripId,
          busId: 'bus-tn-38-9999',
          driverId: 'drv-selvam',
          latitude: 11.0168,
          longitude: 76.9558,
          speed: 68,
          heading: 180,
          next_stop_name: 'Avinashi Bypass',
          eta: '18 mins',
        });
      });
    });

    // 3. Passenger receives live update broadcast
    passengerSocket.on('bus_location_updated', (telemetry) => {
      expect(telemetry.tripId).toBe(testTripId);
      expect(telemetry.latitude).toBe(11.0168);
      expect(telemetry.longitude).toBe(76.9558);
      expect(telemetry.speed).toBe(68);
      expect(telemetry.next_stop_name).toBe('Avinashi Bypass');
      expect(telemetry.eta).toBe('18 mins');
      expect(telemetry.timestamp).toBeDefined();
      done();
    });
  });

  test('7. Reconnection resilience: Client automatically reconnects after disconnection', (done) => {
    let connectCount = 0;

    clientSocket = Client(`http://localhost:${port}`, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 50,
    });

    clientSocket.on('connect', () => {
      connectCount++;
      if (connectCount === 1) {
        // Disconnect engine on server side to simulate network drop / server restart
        const io = getIO();
        const serverSocket = io.sockets.sockets.get(clientSocket.id);
        if (serverSocket && serverSocket.conn) {
          serverSocket.conn.close();
        }
      } else if (connectCount === 2) {
        expect(connectCount).toBe(2);
        expect(clientSocket.connected).toBe(true);
        clientSocket.disconnect();
        done();
      }
    });
  });
});

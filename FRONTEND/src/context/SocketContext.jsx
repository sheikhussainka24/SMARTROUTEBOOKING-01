import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import CONFIG from '../config/index.js';
import { Radio, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const SocketContext = createContext(null);

// Singleton reference to prevent duplicate socket connections across StrictMode renders
let globalSocket = null;
let lastDiagnosticLogTime = 0;

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('connecting'); // 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error'
  const [transport, setTransport] = useState(null);
  const [lastError, setLastError] = useState(null);
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    // If a global socket already exists and is open/connecting, reuse it
    let s = globalSocket;

    if (!s) {
      const socketUrl = CONFIG.SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

      s = io(socketUrl, {
        path: '/socket.io',
        transports: ['polling', 'websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.3,
        timeout: 10000,
      });

      globalSocket = s;
    }

    // Set socket instance in state
    setSocket(s);

    const onConnect = () => {
      setConnected(true);
      setStatus('connected');
      setLastError(null);
      setReconnectCount(0);
      const activeTransport = s.io?.engine?.transport?.name || 'connected';
      setTransport(activeTransport);
      console.info(`[Socket.IO] Connected successfully (ID: ${s.id}, Transport: ${activeTransport})`);
    };

    const onDisconnect = (reason) => {
      setConnected(false);
      setStatus(reason === 'io client disconnect' ? 'disconnected' : 'reconnecting');
      if (reason !== 'io client disconnect') {
        const now = Date.now();
        if (now - lastDiagnosticLogTime > 5000) {
          console.warn(`[Socket.IO] Disconnected (${reason}). Attempting automatic reconnection...`);
          lastDiagnosticLogTime = now;
        }
      }
    };

    const onConnectError = (err) => {
      setConnected(false);
      setStatus('reconnecting');
      setLastError(err.message);

      const now = Date.now();
      if (now - lastDiagnosticLogTime > 6000) {
        console.warn(`[Socket.IO] Connection error: ${err.message}. Retrying with exponential backoff...`);
        lastDiagnosticLogTime = now;
      }
    };

    const onReconnectAttempt = (attempt) => {
      setStatus('reconnecting');
      setReconnectCount(attempt);
    };

    const onReconnect = (attempt) => {
      setConnected(true);
      setStatus('connected');
      setLastError(null);
      setReconnectCount(0);
      const activeTransport = s.io?.engine?.transport?.name || 'websocket';
      setTransport(activeTransport);
      console.info(`[Socket.IO] Reconnected successfully after ${attempt} attempts (Transport: ${activeTransport})`);
    };

    const onReconnectFailed = () => {
      setStatus('error');
      setLastError('Failed to reconnect after maximum attempts');
      console.error('[Socket.IO] Reconnection failed. Backend server may be offline.');
    };

    // Engine level transport upgrades (polling -> websocket)
    const onUpgrade = (rawTransport) => {
      const newTransport = rawTransport?.name || 'websocket';
      setTransport(newTransport);
      console.info(`[Socket.IO] Transport upgraded to: ${newTransport}`);
    };

    // Register listeners
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);
    s.io.on('reconnect_attempt', onReconnectAttempt);
    s.io.on('reconnect', onReconnect);
    s.io.on('reconnect_failed', onReconnectFailed);

    if (s.io?.engine) {
      s.io.engine.on('upgrade', onUpgrade);
      if (s.connected) {
        onConnect();
      }
    } else {
      s.once('connect', () => {
        s.io?.engine?.on('upgrade', onUpgrade);
      });
    }

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      s.io.off('reconnect_attempt', onReconnectAttempt);
      s.io.off('reconnect', onReconnect);
      s.io.off('reconnect_failed', onReconnectFailed);
      if (s.io?.engine) {
        s.io.engine.off('upgrade', onUpgrade);
      }
    };
  }, []);

  const manualReconnect = useCallback(() => {
    if (globalSocket) {
      setStatus('connecting');
      globalSocket.connect();
    }
  }, []);

  const value = {
    socket,
    connected,
    status,
    transport,
    lastError,
    reconnectCount,
    reconnect: manualReconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * Hook to access the real-time Socket.IO connection
 */
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    return {
      socket: null,
      connected: false,
      status: 'disconnected',
      transport: null,
      lastError: null,
      reconnectCount: 0,
      reconnect: () => {},
    };
  }
  return context;
}

/**
 * Reusable UI Status Badge showing real-time Socket.IO health
 */
export function SocketStatusBadge({ compact = false }) {
  const { connected, status, transport, reconnect } = useSocket();

  let dotColor = '#10B981'; // Green
  let label = 'Live Telemetry';
  let badgeBg = 'rgba(16, 185, 129, 0.1)';
  let borderColor = 'rgba(16, 185, 129, 0.3)';

  if (status === 'connecting' || status === 'reconnecting') {
    dotColor = '#F59E0B'; // Amber
    label = 'Reconnecting...';
    badgeBg = 'rgba(245, 158, 11, 0.1)';
    borderColor = 'rgba(245, 158, 11, 0.3)';
  } else if (status === 'disconnected' || status === 'error' || !connected) {
    dotColor = '#EF4444'; // Red
    label = 'Offline';
    badgeBg = 'rgba(239, 68, 68, 0.1)';
    borderColor = 'rgba(239, 68, 68, 0.3)';
  }

  if (compact) {
    return (
      <span
        title={`Socket.IO: ${label}${transport ? ` (${transport})` : ''}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 8px',
          borderRadius: 9999,
          background: badgeBg,
          border: `1px solid ${borderColor}`,
          fontSize: 11,
          fontWeight: 600,
          color: dotColor,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: dotColor,
            boxShadow: connected ? `0 0 6px ${dotColor}` : 'none',
          }}
        />
        <span>{connected ? (transport === 'websocket' ? 'Live WS' : 'Live') : label}</span>
      </span>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 10px',
        borderRadius: 12,
        background: badgeBg,
        border: `1px solid ${borderColor}`,
        fontSize: 11,
        fontWeight: 600,
        color: dotColor,
        cursor: !connected ? 'pointer' : 'default',
      }}
      onClick={!connected ? reconnect : undefined}
      title={!connected ? 'Click to retry connection' : `Connected via ${transport || 'Socket.IO'}`}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: dotColor,
          boxShadow: connected ? `0 0 8px ${dotColor}` : 'none',
        }}
      />
      <Radio size={12} color={dotColor} />
      <span>{label}</span>
      {connected && transport && (
        <span style={{ fontSize: 9, opacity: 0.8, textTransform: 'uppercase' }}>({transport})</span>
      )}
      {!connected && <RefreshCw size={10} color={dotColor} style={{ marginLeft: 2 }} />}
    </div>
  );
}

export default SocketContext;

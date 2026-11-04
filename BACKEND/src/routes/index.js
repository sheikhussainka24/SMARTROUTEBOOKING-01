import { Router } from 'express';
import authRoutes from './authRoutes.js';
import tripRoutes from './tripRoutes.js';
import seatRoutes from './seatRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import driverRoutes from './driverRoutes.js';
import ownerRoutes from './ownerRoutes.js';
import adminRoutes from './adminRoutes.js';
import placeRoutes from './placeRoutes.js';
import routeRoutes from './routeRoutes.js';
import operatorRoutes from './operatorRoutes.js';
import devRoutes from './devRoutes.js';
import busRoutes from './busRoutes.js';
import voiceRoutes from './voiceRoutes.js';
import accountingRoutes from './accountingRoutes.js';

import config from '../config/index.js';
import { getDbDiagnosticInfo } from '../config/database.js';
import { getHubConfig } from '../config/hubConfig.js';

const router = Router();

// Mount API route groups
router.use('/auth', authRoutes);
router.use('/trips', tripRoutes);
router.use('/buses', busRoutes);
router.use('/routes', routeRoutes);
router.use('/seats', seatRoutes);
router.use('/bookings', bookingRoutes);
router.use('/driver', driverRoutes);
router.use('/owner', ownerRoutes);
router.use('/admin', adminRoutes);
router.use('/places', placeRoutes);
router.use('/operator', operatorRoutes);
router.use('/dev', devRoutes);
router.use('/voice', voiceRoutes);
router.use('/ai/voice', voiceRoutes);
router.use('/accounting', accountingRoutes);

// Map configuration endpoint (provides client SDK configuration)
router.get('/config/maps', (req, res) => {
  const provider = config.map.provider || 'leaflet';
  const isGoogle = provider === 'google';
  const hasGoogleKey = Boolean(
    config.map.googleMapsKey &&
    config.map.googleMapsKey !== 'your_google_maps_api_key_here'
  );

  res.json({
    success: true,
    provider,
    apiKey: isGoogle && hasGoogleKey ? config.map.googleMapsKey : undefined,
    configured: isGoogle ? hasGoogleKey : true,
  });
});

// Central Bus Hub configuration endpoint (single source of truth for all components)
router.get('/config/hub', (req, res) => {
  res.json({
    success: true,
    data: getHubConfig(),
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  const dbInfo = getDbDiagnosticInfo();
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'smartroute-backend',
    version: '1.0.0',
    server: {
      status: 'ready',
      port: config.port,
      environment: config.env,
      uptimeSeconds: Math.floor(process.uptime()),
    },
    database: {
      status: dbInfo.connected ? 'connected' : 'unreachable',
      storageMode: dbInfo.storageMode,
      host: dbInfo.host,
      port: dbInfo.port,
      database: dbInfo.database,
      error: dbInfo.error,
    },
  });
});

export default router;

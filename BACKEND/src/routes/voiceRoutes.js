import { Router } from 'express';
import {
  handleInboundCall,
  handleInboundSpeech,
  handleCallStatus,
  handleOptOut,
  getReminders,
  triggerSchedulerTick,
  createInAppVoiceSession,
  handleInAppVoiceChat,
} from '../controllers/voiceController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

// Telephony Inbound & Status Webhooks
router.post('/inbound', handleInboundCall);
router.get('/inbound', handleInboundCall); // Some telephony test pings use GET
router.post('/inbound/message', handleInboundSpeech);
router.post('/status', handleCallStatus);

// Outbound Reminders & Compliance
router.post('/opt-out', handleOptOut);
router.get('/reminders', getReminders);
router.post('/trigger-tick', triggerSchedulerTick);

// In-App Voice & Realtime Sessions
router.post('/session', optionalAuth, createInAppVoiceSession);
router.post('/chat', optionalAuth, handleInAppVoiceChat);

export default router;

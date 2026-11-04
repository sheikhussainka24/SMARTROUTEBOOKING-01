import logger from '../config/logger.js';
import voiceCallService from '../../../AI/voice/voiceCallService.js';
import voiceScheduler from '../services/voiceScheduler.js';
import voiceConversationEngine from '../ai/voiceConversationEngine.js';
import { normalizePhone } from '../services/voiceAssistantService.js';

/**
 * SMART ROUTE — Voice & AI Telephony Controller
 */

/**
 * Inbound Telephone Webhook: Answer incoming passenger call
 * POST /api/voice/inbound
 */
export async function handleInboundCall(req, res) {
  try {
    const fromPhone = req.body.From || req.query.From || '';
    const toPhone = req.body.To || req.query.To || '';
    const callSid = req.body.CallSid || `CALL-${Date.now()}`;

    logger.info(`📞 Inbound voice call received from ${fromPhone} to ${toPhone} (CallSid: ${callSid})`);

    // Greet caller in Tanglish by default
    const greeting = 'Vanakkam! Smart Route Booking AI assistant pesuren. Sollunga, unga journey pathi eppadi help pannanum?';
    const twiml = voiceCallService.generateInboundTwiML({
      greetingText: greeting,
      actionUrl: '/api/voice/inbound/message',
    });

    res.type('text/xml');
    return res.status(200).send(twiml);
  } catch (err) {
    logger.error('Error handling inbound call webhook:', err.message);
    const fallbackTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">Vanakkam! Smart Route Booking assistant is temporarily experiencing network latency. Please call back shortly.</Say>
  <Hangup/>
</Response>`;
    res.type('text/xml');
    return res.status(500).send(fallbackTwiml);
  }
}

/**
 * Inbound Message: Handle spoken turns during the call
 * POST /api/voice/inbound/message
 */
export async function handleInboundSpeech(req, res) {
  try {
    const speechResult = req.body.SpeechResult || req.body.speechText || req.body.text || '';
    const fromPhone = req.body.From || '';
    const callSid = req.body.CallSid || 'test-call-session';

    logger.info(`🗣️ Caller (${fromPhone}) said: "${speechResult}"`);

    // Process turn with voice engine
    const turnResult = await voiceConversationEngine.processConversationTurn({
      sessionId: `tel-${callSid}`,
      speechText: speechResult,
      context: {
        mobile: fromPhone,
      },
    });

    // If request asks for JSON response (for API tests / clients)
    if (req.headers['accept']?.includes('application/json') || req.is('application/json')) {
      return res.json({
        success: true,
        ...turnResult,
      });
    }

    const twiml = voiceCallService.generateTurnTwiML({
      replyText: turnResult.textResponse,
      actionUrl: '/api/voice/inbound/message',
      shouldHangUp: turnResult.shouldHangUp,
    });

    res.type('text/xml');
    return res.status(200).send(twiml);
  } catch (err) {
    logger.error('Error processing voice conversation turn:', err.message);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Aditi">Manninga, adhai seriya ketka mudiyala. Unga PNR number-ai thirumba solla mudiyuma?</Say>
  <Gather input="speech" action="/api/voice/inbound/message" method="POST" speechTimeout="auto" bargeIn="true"/>
</Response>`;
    res.type('text/xml');
    return res.status(200).send(errorTwiml);
  }
}

/**
 * Webhook status reconciliation
 * POST /api/voice/status
 */
export async function handleCallStatus(req, res) {
  try {
    const { CallSid, CallStatus, CallDuration, ErrorMessage } = req.body;
    logger.info(`📲 Call status callback: CallSid=${CallSid}, Status=${CallStatus}, Duration=${CallDuration}`);

    voiceScheduler.updateCallStatus({
      callSid: CallSid,
      callStatus: CallStatus,
      duration: CallDuration ? parseInt(CallDuration, 10) : 0,
      error: ErrorMessage || null,
    });

    return res.json({ success: true, reconciled: true });
  } catch (err) {
    logger.error('Error in status callback:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Passenger opt-out endpoint
 * POST /api/voice/opt-out
 */
export async function handleOptOut(req, res) {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ success: false, error: 'Mobile number is required' });
    }

    voiceScheduler.optOutPassenger(mobile);
    return res.json({
      success: true,
      message: `Mobile number ${mobile} has successfully opted out of automated voice reminders.`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Get scheduled and historical reminders
 * GET /api/voice/reminders
 */
export async function getReminders(req, res) {
  try {
    const reminders = voiceScheduler.getAllReminders();
    const logs = voiceScheduler.getCallLogs();
    return res.json({
      success: true,
      total: reminders.length,
      data: reminders,
      recentLogs: logs.slice(-50),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * Trigger immediate scheduler evaluation (for testing / manual dispatch)
 * POST /api/voice/trigger-tick
 */
export async function triggerSchedulerTick(req, res) {
  try {
    await voiceScheduler.runSchedulerTick();
    return res.json({
      success: true,
      message: 'Voice reminder scheduler tick executed successfully.',
      totalReminders: voiceScheduler.getAllReminders().length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * In-App Voice Session: Generate ephemeral session credentials
 * POST /api/ai/voice/session
 */
export async function createInAppVoiceSession(req, res) {
  try {
    const user = req.user || null;
    const { pnr } = req.body;

    const sessionInfo = await voiceConversationEngine.createRealtimeSession({ user, pnr });
    return res.json({
      success: true,
      ...sessionInfo,
    });
  } catch (err) {
    logger.error('Error creating voice session:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * In-App Voice / Text Conversational Chat
 * POST /api/ai/voice/chat
 */
export async function handleInAppVoiceChat(req, res) {
  try {
    const { sessionId, message, pnr, language, mobile } = req.body;
    const user = req.user || null;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message content is required.' });
    }

    const result = await voiceConversationEngine.processConversationTurn({
      sessionId,
      speechText: message,
      context: {
        user,
        pnr,
        language,
        mobile: mobile || user?.mobile,
      },
    });

    return res.json(result);
  } catch (err) {
    logger.error('Error in in-app voice chat:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
}

export default {
  handleInboundCall,
  handleInboundSpeech,
  handleCallStatus,
  handleOptOut,
  getReminders,
  triggerSchedulerTick,
  createInAppVoiceSession,
  handleInAppVoiceChat,
};

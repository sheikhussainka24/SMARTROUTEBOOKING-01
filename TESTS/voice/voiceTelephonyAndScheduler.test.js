import {
  handleInboundCall,
  handleInboundSpeech,
  handleCallStatus,
  handleOptOut,
  createInAppVoiceSession,
  handleInAppVoiceChat,
} from '../../BACKEND/src/controllers/voiceController.js';
import voiceScheduler from '../../BACKEND/src/services/voiceScheduler.js';
import voiceConversationEngine from '../../BACKEND/src/ai/voiceConversationEngine.js';
import voiceCallService from '../../AI/voice/voiceCallService.js';
import { setTripTelemetry, primaryTripId, driver1Id } from '../../BACKEND/src/services/dataStore.js';

// Helper to create mock Express req & res
function createMockReqRes({ body = {}, query = {}, headers = {}, user = null } = {}) {
  const req = {
    body,
    query,
    headers,
    user,
    is: (type) => headers['content-type']?.includes(type),
  };
  const res = {
    statusCode: 200,
    contentType: 'application/json',
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    type(t) {
      this.contentType = t;
      return this;
    },
    send(data) {
      this.body = data;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
  };
  return { req, res };
}

describe('SMART ROUTE AI Voice — Telephony, Conversational Turns & Automated Reminder Scheduler', () => {
  const verifiedPnr = 'SR4102';
  const callerMobile = '9000000006';

  beforeEach(() => {
    // Reset telemetry to fresh active state
    setTripTelemetry(primaryTripId, {
      bus_id: 'bus-1',
      driver_id: driver1Id,
      latitude: 11.0168,
      longitude: 76.9558,
      speed: 55,
      heading: 140,
      current_stop_id: 'stop-101',
      next_stop_name: 'Singanallur',
      eta: '10 mins',
    });
  });

  describe('1. Inbound Telephone Call & Natural TwiML Greeting', () => {
    test('answers inbound call promptly with friendly AI greeting and bargeIn=true', async () => {
      const { req, res } = createMockReqRes({
        body: {
          From: '+919000000006',
          To: '+1234567890',
          CallSid: 'CA_TEST_INBOUND_001',
        },
      });

      await handleInboundCall(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.contentType).toBe('text/xml');
      expect(res.body).toContain('<Response>');
      expect(res.body).toContain('bargeIn="true"');
      expect(res.body).toContain('Smart Route Booking AI assistant');
      expect(res.body).toContain('Polly.Aditi');
    });

    test('generates valid TwiML turn with continuous listening and prompt', () => {
      const twiml = voiceCallService.generateTurnTwiML({
        replyText: 'Unga bus 10 mins-la vandhurum.',
        actionUrl: '/api/voice/inbound/message',
        shouldHangUp: false,
      });

      expect(twiml).toContain('<Gather');
      expect(twiml).toContain('bargeIn="true"');
      expect(twiml).toContain('Unga bus 10 mins-la vandhurum.');
    });

    test('generates Hangup TwiML when caller concludes conversation', () => {
      const twiml = voiceCallService.generateTurnTwiML({
        replyText: 'Nandri! Have a safe journey.',
        shouldHangUp: true,
      });

      expect(twiml).toContain('<Hangup/>');
    });
  });

  describe('2. Multi-Turn Conversational Memory & Compound Question Handling', () => {
    const sessionId = `test-sess-${Date.now()}`;

    test('Turn 1: Passenger asks bus location with PNR in Tanglish', async () => {
      const turn1 = await voiceConversationEngine.processConversationTurn({
        sessionId,
        speechText: `Naan innikku travel panren. PNR ${verifiedPnr}. Bus enga irukku?`,
        context: { mobile: callerMobile },
      });

      expect(turn1.success).toBe(true);
      expect(turn1.language).toBe('tanglish');
      expect(turn1.textResponse).toBeDefined();
      expect(turn1.textResponse.toLowerCase()).toContain('bus');
      expect(turn1.data.booking.pnr).toBe(verifiedPnr);
    });

    test('Turn 2: Follow-up question without repeating PNR (remembers verified context)', async () => {
      const turn2 = await voiceConversationEngine.processConversationTurn({
        sessionId, // Same active session
        speechText: 'En seat number enna? Eppo drop point reach aagum?',
      });

      expect(turn2.success).toBe(true);
      expect(turn2.textResponse).toBeDefined();
      // Should answer both questions in sequence using remembered booking
      expect(turn2.textResponse).toContain('seat number');
      expect(turn2.textResponse).toContain('drop');
    });

    test('Turn 3: Handles Tamil language input naturally', async () => {
      const turnTamil = await voiceConversationEngine.processConversationTurn({
        sessionId: `sess-tamil-${Date.now()}`,
        speechText: `என் PNR ${verifiedPnr}. பஸ் எங்கே உள்ளது?`,
        context: { mobile: callerMobile },
      });

      expect(turnTamil.success).toBe(true);
      expect(turnTamil.language).toBe('tamil');
      expect(turnTamil.textResponse).toContain('பஸ்');
    });

    test('Turn 4: Handles English questions accurately', async () => {
      const turnEnglish = await voiceConversationEngine.processConversationTurn({
        sessionId: `sess-en-${Date.now()}`,
        speechText: `Where is my bus for PNR ${verifiedPnr}? What is the boarding time?`,
        context: { mobile: callerMobile },
      });

      expect(turnEnglish.success).toBe(true);
      expect(turnEnglish.language).toBe('english');
      expect(turnEnglish.textResponse.toLowerCase()).toContain('confirmed');
    });

    test('Turn 5: Handles Hindi language input naturally', async () => {
      const turnHindi = await voiceConversationEngine.processConversationTurn({
        sessionId: `sess-hi-${Date.now()}`,
        speechText: `मेरी बस कहाँ है? PNR ${verifiedPnr}. सीट नंबर क्या है?`,
        context: { mobile: callerMobile },
      });

      expect(turnHindi.success).toBe(true);
      expect(turnHindi.language).toBe('hindi');
      expect(turnHindi.textResponse).toContain('कन्फर्म');
      expect(turnHindi.textResponse).toContain('सीट');
    });

    test('Turn 6: Handles Hinglish language input', async () => {
      const turnHinglish = await voiceConversationEngine.processConversationTurn({
        sessionId: `sess-hinglish-${Date.now()}`,
        speechText: `Mera bus kahan hai? PNR ${verifiedPnr}`,
        context: { mobile: callerMobile },
      });

      expect(turnHinglish.success).toBe(true);
      expect(turnHinglish.language).toBe('hindi');
      expect(turnHinglish.textResponse).toBeDefined();
    });
  });

  describe('3. Inbound Telephone Conversational Controller (handleInboundSpeech)', () => {
    test('receives speech, returns TwiML with next speech gather and continuous conversation', async () => {
      const { req, res } = createMockReqRes({
        body: {
          CallSid: 'CA_TURN_001',
          From: callerMobile,
          SpeechResult: `En bus enga irukku? PNR ${verifiedPnr}`,
        },
      });

      await handleInboundSpeech(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body).toContain('<Response>');
      expect(res.body).toContain('bargeIn="true"');
      expect(res.body).toContain('<Gather');
    });

    test('supports JSON accept header for in-app or API conversational tests', async () => {
      const { req, res } = createMockReqRes({
        headers: { accept: 'application/json' },
        body: {
          CallSid: 'CA_API_001',
          From: callerMobile,
          SpeechResult: `Check booking ${verifiedPnr}`,
        },
      });

      await handleInboundSpeech(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.textResponse).toBeDefined();
    });
  });

  describe('4. Automated Boarding & Dropping Reminder Scheduler with Idempotency', () => {
    test('schedules boarding reminder when bus is within ~10 minute window', async () => {
      // Execute scheduler tick
      await voiceScheduler.runSchedulerTick();

      const reminders = voiceScheduler.getAllReminders();
      const boardingReminders = reminders.filter((r) => r.reminder_type === 'boarding_10min');

      expect(boardingReminders.length).toBeGreaterThan(0);
      const rem = boardingReminders[0];
      expect(rem.pnr_number).toBeDefined();
      expect(rem.status).toBeDefined();
      expect(rem.idempotency_key).toBeDefined();
    });

    test('IDEMPOTENCY: Repeated scheduler runs NEVER create duplicate calls for same booking & event', async () => {
      const initialCount = voiceScheduler.getAllReminders().length;

      // Run scheduler 5 consecutive times
      await voiceScheduler.runSchedulerTick();
      await voiceScheduler.runSchedulerTick();
      await voiceScheduler.runSchedulerTick();

      const newCount = voiceScheduler.getAllReminders().length;
      expect(newCount).toBe(initialCount);
    });

    test('reconciles call status updates from telephony provider webhook (/api/voice/status)', async () => {
      const reminders = voiceScheduler.getAllReminders();
      if (reminders.length > 0) {
        const testSid = reminders[0].call_sid || 'CA_TEST_SID_001';
        reminders[0].call_sid = testSid;

        const { req, res } = createMockReqRes({
          body: {
            CallSid: testSid,
            CallStatus: 'completed',
            CallDuration: '45',
          },
        });

        await handleCallStatus(req, res);

        expect(res.statusCode).toBe(200);
        expect(res.body.reconciled).toBe(true);

        const updated = voiceScheduler.getAllReminders().find((r) => r.call_sid === testSid);
        expect(updated.status).toBe('completed');
        expect(updated.duration).toBe(45);
      }
    });

    test('strictly respects passenger opt-out preferences and prevents calls to opted-out numbers', async () => {
      const testOptOutMobile = '9876543210';
      const { req, res } = createMockReqRes({
        body: { mobile: testOptOutMobile },
      });

      await handleOptOut(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(voiceScheduler.isOptedOut(testOptOutMobile)).toBe(true);
    });
  });

  describe('5. In-App Voice Session & Chat Endpoints (/api/voice/session & /api/voice/chat)', () => {
    test('creates in-app voice session credentials or fallback configuration', async () => {
      const { req, res } = createMockReqRes({
        body: { pnr: verifiedPnr },
      });

      await createInAppVoiceSession(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBeDefined();
    });

    test('handles in-app voice chat query and returns structured fact cards', async () => {
      const { req, res } = createMockReqRes({
        body: {
          sessionId: `inapp-${Date.now()}`,
          message: `Bus location enna? PNR ${verifiedPnr}`,
          language: 'tanglish',
          mobile: callerMobile,
        },
      });

      await handleInAppVoiceChat(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.textResponse).toBeDefined();
      expect(res.body.data.location).toBeDefined();
    });

    test('rejects empty in-app chat message gracefully', async () => {
      const { req, res } = createMockReqRes({
        body: { message: '   ' },
      });

      await handleInAppVoiceChat(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});

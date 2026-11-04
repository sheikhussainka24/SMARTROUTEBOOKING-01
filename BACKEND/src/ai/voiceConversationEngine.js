import config from '../config/index.js';
import logger from '../config/logger.js';
import geminiClient from './geminiClient.js';
import {
  getBookingStatus,
  getPassengerTripDetails,
  getBusLocationAndETA,
  getBoardingAndDroppingDetails,
  getNextRouteStop,
  getDriverBoardingManifest,
  findBooking,
  normalizePhone,
} from '../services/voiceAssistantService.js';

/**
 * SMART ROUTE — Natural Conversational AI Voice Engine
 * 
 * Supports:
 * - Tamil, English, and Tanglish
 * - Multi-turn conversational context & PNR memory
 * - Multi-question compound parsing
 * - Verified data tool execution
 * - Interruption / barge-in coordination
 * - Ephemeral session generation for WebRTC / Realtime voice
 */

// In-memory conversation session registry (with TTL expiration)
const activeVoiceSessions = new Map();
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

/**
 * Retrieves or creates a conversational session
 */
export function getOrCreateSession(sessionId, initialContext = {}) {
  const id = sessionId || `v-sess-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = Date.now();

  let session = activeVoiceSessions.get(id);
  if (!session) {
    session = {
      id,
      createdAt: now,
      lastActiveAt: now,
      language: initialContext.language || 'tanglish', // 'tamil' | 'english' | 'tanglish'
      verifiedPnr: initialContext.pnr || null,
      callerMobile: initialContext.mobile || null,
      user: initialContext.user || null,
      verifiedPassengerName: null,
      history: [],
      metadata: { ...initialContext },
    };
    activeVoiceSessions.set(id, session);
  } else {
    session.lastActiveAt = now;
    if (initialContext.mobile) session.callerMobile = initialContext.mobile;
    if (initialContext.user) session.user = initialContext.user;
    if (initialContext.pnr) session.verifiedPnr = initialContext.pnr;
  }

  // Periodic cleanup of expired sessions
  if (activeVoiceSessions.size > 200) {
    for (const [sId, s] of activeVoiceSessions.entries()) {
      if (now - s.lastActiveAt > SESSION_TTL_MS) {
        activeVoiceSessions.delete(sId);
      }
    }
  }

  return session;
}

/**
 * Generates initial greeting in the chosen language
 */
export function getInitialGreeting(language = 'tanglish') {
  if (language === 'tamil') {
    return 'வணக்கம்! ஸ்மார்ட் ரூட் புக்கிங் AI அசிஸ்டன்ட் பேசுகிறேன். சொல்லுங்கள், உங்களுக்கு எவ்வாறு உதவலாம்?';
  }
  if (language === 'hindi') {
    return 'नमस्ते! स्मार्ट रूट बुकिंग AI असिस्टेंट बोल रहा हूँ। बताइये, आपकी यात्रा के बारे में क्या सहायता कर सकता हूँ?';
  }
  if (language === 'english') {
    return 'Hello! This is Smart Route Booking AI assistant. How can I assist you with your journey today?';
  }
  // Default: Tanglish
  return 'Vanakkam! Smart Route Booking AI assistant pesuren. Sollunga, eppadi help pannanum?';
}

/**
 * Detects if the caller is speaking Tamil, Hindi, Tanglish, or English
 */
export function detectLanguage(text = '') {
  const lower = text.toLowerCase();
  
  // Tamil unicode characters
  if (/[\u0B80-\u0BFF]/.test(text)) {
    return 'tamil';
  }

  // Devanagari unicode characters (Hindi)
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hindi';
  }

  // Hindi / Hinglish keywords
  const hindiKeywords = [
    'namaste', 'kahan', 'kaha', 'kab', 'aayegi', 'aayega', 'kidhar', 'hai', 'meri', 'mera',
    'kitna', 'kitne', 'samay', 'rukegi', 'rukega', 'bataiye', 'batao', 'madad', 'chahiye',
    'shukriya', 'dhanyawad', 'gaadi', 'paunch', 'pahunch', 'shuru', 'bata', 'hoga',
  ];

  const hasHindi = hindiKeywords.some((w) => lower.includes(w));
  if (hasHindi) {
    return 'hindi';
  }

  // Common Tanglish keywords
  const tanglishKeywords = [
    'vanakkam', 'enga', 'eppo', 'enna', 'varum', 'irukku', 'poren', 'solla',
    'sollunga', 'mudiyuma', 'nerathula', 'wait', 'pannunga', 'pannanum', 'andha',
    'innikku', 'nalaikku', 'edhu', 'kelambum', 'seri', 'illai', 'nandri',
  ];

  const hasTanglish = tanglishKeywords.some((w) => lower.includes(w));
  if (hasTanglish) {
    return 'tanglish';
  }

  return 'english';
}

/**
 * Extracts PNR reference from natural speech or text (e.g. "SR12345", "SR4102", "pnr SR 4102")
 */
export function extractPnrFromText(text = '') {
  if (!text) return null;
  // Match patterns like SR4102, SR-4102, VV8820, bkg-sr-4102
  const match = text.match(/\b(SR[-\s]?\d{4,6}|VV[-\s]?\d{4,6}|TK[-\s]?\d{4,6}|bkg-[a-z0-9-]+)\b/i);
  if (match) {
    return match[1].replace(/\s+/g, '').toUpperCase();
  }
  // Generic pattern: 6-character alphanumeric or 4-6 digits after "pnr"
  const pnrKeywordMatch = text.match(/pnr\s*(?:number|is|:)?\s*([a-z0-9-]{4,12})/i);
  if (pnrKeywordMatch) {
    return pnrKeywordMatch[1].toUpperCase();
  }
  return null;
}

/**
 * Extracts 10-digit mobile number from input
 */
export function extractMobileFromText(text = '') {
  if (!text) return null;
  const match = text.match(/\b(?:(?:\+91|91)?[6-9]\d{9})\b/);
  if (match) {
    return normalizePhone(match[0]);
  }
  const last4 = text.match(/\b\d{4}\b/);
  if (last4) {
    return last4[0];
  }
  return null;
}

/**
 * Analyzes questions and executes necessary tools
 */
export async function processConversationTurn({ sessionId, speechText, context = {} }) {
  const session = getOrCreateSession(sessionId, context);
  const text = (speechText || '').trim();
  const detectedLang = detectLanguage(text);

  // If language detected, update session language
  if (detectedLang) {
    session.language = detectedLang;
  }

  // 1. Check if user provided a PNR or mobile number in this turn
  const discoveredPnr = extractPnrFromText(text);
  if (discoveredPnr) {
    session.verifiedPnr = discoveredPnr;
  }

  const discoveredMobile = extractMobileFromText(text);
  if (discoveredMobile) {
    session.callerMobile = discoveredMobile;
  }

  const currentPnr = session.verifiedPnr;
  const currentMobile = session.callerMobile;
  const currentUser = session.user;

  // 2. Classify user intent & multiple questions
  const lower = text.toLowerCase();
  const isAskingLocation = /enga|where|location|tracking|track|bus enga|live|kahan|kaha|kidhar|कहाँ|कहा|किधर|कहाँ है/i.test(lower);
  const isAskingEta = /eppo|when|eta|time|reach|varum|innum evvalavu|kab|kitne baje|kitna time|pahunch|pahuchegi|कब|कितने बजे|समय|पहुंचेगी/i.test(lower);
  const isAskingBoarding = /boarding|wait|stop|landmark|bay|platform|enga nikkum|kahan se|kahan rukegi|kaha rukegi|बोर्डिंग|स्टॉप/i.test(lower);
  const isAskingDropping = /drop|destination|irangum|kahan utarna|kaha utaregi|drop point|ड्रॉप|गंतव्य/i.test(lower);
  const isAskingSeat = /seat|berth|sleeper|number|seat number|konsi seat|kaun si seat|सीट|स्थान|नंबर/i.test(lower);
  const isAskingStatus = /status|confirmed|ticket|booking|pnr|स्थिति|कन्फर्म/i.test(lower);
  const isAskingManifest = /manifest|passenger list|chart/i.test(lower);

  const toolExecutions = [];

  // Need PNR check: If user asks booking/tracking details but hasn't provided PNR yet
  if ((isAskingLocation || isAskingEta || isAskingBoarding || isAskingSeat || isAskingStatus) && !currentPnr) {
    const askPnrMessage = session.language === 'tamil'
      ? 'கண்டிப்பாக! உங்கள் முன்பதிவு விவரங்களை சரிபார்க்க உங்கள் PNR எண்ணை கூற முடியுமா?'
      : (session.language === 'hindi'
        ? 'ज़रूर! आपकी बुकिंग विवरण की जांच के लिए क्या आप अपना PNR नंबर बता सकते हैं?'
        : (session.language === 'english'
          ? 'Certainly! Could you please share your PNR number to check your trip details?'
          : 'Sure! Unga booking details check panna, unga PNR number solla mudiyuma?'));
    
    session.history.push({ role: 'user', content: text });
    session.history.push({ role: 'assistant', content: askPnrMessage });

    return {
      success: true,
      sessionId: session.id,
      language: session.language,
      textResponse: askPnrMessage,
      toolExecutions: [],
      data: null,
      shouldHangUp: false,
    };
  }

  // 3. Execute tools based on queries
  let bookingData = null;
  let tripDetails = null;
  let locationData = null;
  let boardingData = null;
  let manifestData = null;

  if (currentPnr) {
    // Run booking status verification
    const bkgRes = await getBookingStatus({ pnr: currentPnr, mobile: currentMobile, user: currentUser });
    toolExecutions.push({ tool: 'getBookingStatus', result: bkgRes });

    if (bkgRes.success) {
      bookingData = bkgRes.data;
    } else if (bkgRes.requiresVerification) {
      const verifyMsg = session.language === 'tamil'
        ? 'பாதுகாப்பு காரணங்களுக்காக, இந்த முன்பதிவில் பதிவு செய்யப்பட்ட மொபைல் எண்ணை கூறவும்.'
        : (session.language === 'english'
          ? 'For security verification, please provide your registered 10-digit mobile number.'
          : 'Security reason-kaga, unga booking-la register panna mobile number-ai sollunga.');
      return {
        success: true,
        sessionId: session.id,
        language: session.language,
        textResponse: verifyMsg,
        requiresVerification: true,
      };
    }
  }

  if (isAskingSeat && currentPnr) {
    const seatRes = await getPassengerTripDetails({ pnr: currentPnr, mobile: currentMobile, user: currentUser });
    toolExecutions.push({ tool: 'getPassengerTripDetails', result: seatRes });
    if (seatRes.success) tripDetails = seatRes.data;
  }

  if ((isAskingLocation || isAskingEta) && currentPnr) {
    const locRes = await getBusLocationAndETA({ pnr: currentPnr, mobile: currentMobile, user: currentUser });
    toolExecutions.push({ tool: 'getBusLocationAndETA', result: locRes });
    locationData = locRes;
  }

  if ((isAskingBoarding || isAskingDropping) && currentPnr) {
    const boardRes = await getBoardingAndDroppingDetails({ pnr: currentPnr, mobile: currentMobile, user: currentUser });
    toolExecutions.push({ tool: 'getBoardingAndDroppingDetails', result: boardRes });
    if (boardRes.success) boardingData = boardRes.data;
  }

  if (isAskingManifest) {
    const manRes = await getDriverBoardingManifest({ user: currentUser });
    toolExecutions.push({ tool: 'getDriverBoardingManifest', result: manRes });
    manifestData = manRes;
  }

  // 4. Generate Natural Conversational Response
  let responseText = '';

  // If Gemini or OpenAI is configured, we can ask for a natural conversational synthesis
  const hasAIApi = (config.ai.geminiKey && config.ai.geminiKey !== 'your_gemini_api_key_here') ||
                   (config.ai.openaiKey && config.ai.openaiKey !== 'your_openai_api_key_here');

  if (hasAIApi && config.env !== 'test') {
    const systemPrompt = `
You are the natural AI voice assistant for SMART ROUTE BOOKING.
Language to respond in: ${session.language} (English, Tamil, or Tanglish).
Persona:
- Friendly, respectful, human-like voice conversationalist.
- Speak naturally, concise, no technical jargon.
- Answer all parts of the caller's query sequentially.
- Never invent coordinates or ETA if GPS is not live.

Verified Data:
${JSON.stringify({
  pnr: currentPnr,
  booking: bookingData,
  tripDetails,
  location: locationData,
  boarding: boardingData,
  manifest: manifestData,
})}

Caller said: "${text}"
`;
    try {
      const aiRes = await geminiClient.generateContent(text, systemPrompt);
      if (aiRes.success && aiRes.text) {
        responseText = aiRes.text.trim();
      }
    } catch (e) {
      logger.warn(`AI generation fallback to deterministic response: ${e.message}`);
    }
  }

  // Fallback: Deterministic natural conversational generation adhering to verified data
  if (!responseText) {
    responseText = buildNaturalResponse({
      language: session.language,
      text,
      bookingData,
      tripDetails,
      locationData,
      boardingData,
      manifestData,
      isAskingLocation,
      isAskingEta,
      isAskingBoarding,
      isAskingDropping,
      isAskingSeat,
      isAskingStatus,
      isAskingManifest,
    });
  }

  session.history.push({ role: 'user', content: text });
  session.history.push({ role: 'assistant', content: responseText });

  const shouldHangUp = /bye|goodbye|nandri|thank you|thanks|kelamburen|mudinjadhu/i.test(lower);

  return {
    success: true,
    sessionId: session.id,
    language: session.language,
    textResponse: responseText,
    toolExecutions,
    data: {
      booking: bookingData,
      location: locationData,
      trip: tripDetails,
      boarding: boardingData,
    },
    shouldHangUp,
  };
}

/**
 * Constructs natural Tamil, Tanglish, or English responses using verified facts
 */
function buildNaturalResponse({
  language,
  text,
  bookingData,
  tripDetails,
  locationData,
  boardingData,
  manifestData,
  isAskingLocation,
  isAskingEta,
  isAskingBoarding,
  isAskingDropping,
  isAskingSeat,
  isAskingStatus,
  isAskingManifest,
}) {
  const parts = [];

  // 1. Booking Status
  if (bookingData && (isAskingStatus || (!isAskingLocation && !isAskingBoarding && !isAskingSeat))) {
    if (language === 'tamil') {
      parts.push(`உங்கள் PNR ${bookingData.pnr} உறுதி செய்யப்பட்டுள்ளது. ${bookingData.source} லிருந்து ${bookingData.destination} செல்லும் பஸ் எண் ${bookingData.busNumber}.`);
    } else if (language === 'hindi') {
      parts.push(`आपकी PNR ${bookingData.pnr} कन्फर्म है। ${bookingData.source} से ${bookingData.destination} जाने वाली बस संख्या ${bookingData.busNumber} है।`);
    } else if (language === 'english') {
      parts.push(`Your booking for PNR ${bookingData.pnr} is confirmed from ${bookingData.source} to ${bookingData.destination} on bus ${bookingData.busNumber}.`);
    } else {
      parts.push(`Unga PNR ${bookingData.pnr} confirmed-a irukku. ${bookingData.source}-lendhu ${bookingData.destination} pora bus number ${bookingData.busNumber}.`);
    }
  }

  // 2. Bus Location & ETA (Honest GPS handling)
  if (isAskingLocation || isAskingEta) {
    if (locationData?.hasLiveTracking) {
      const eta = locationData.data.eta;
      const nextStop = locationData.data.nextStop;
      if (language === 'tamil') {
        parts.push(`பஸ் தற்போது நேரலை தடத்தில் இயங்குகிறது. அடுத்த நிறுத்தம் ${nextStop}, ஏறத்தாழ ${eta} நேரத்தில் வரும்.`);
      } else if (language === 'hindi') {
        parts.push(`बस अभी लाइव रूट पर चल रही है। अगला स्टॉप ${nextStop} है, लगभग ${eta} में पहुँच जाएगी।`);
      } else if (language === 'english') {
        parts.push(`The bus is actively en route. The next stop is ${nextStop}, estimated to arrive in approximately ${eta}.`);
      } else {
        parts.push(`Bus live-a route-la vandhuttu irukku. Adutha stop ${nextStop}, innum sumaar ${eta}-la vandhurum.`);
      }
    } else {
      // Standby or Stale GPS
      const reason = locationData?.message || 'Live GPS tracking starts 30-45 minutes before departure.';
      if (language === 'tamil') {
        parts.push(`தற்போது நேரலை GPS தயார் நிலையில் உள்ளது. புறப்படுவதற்கு 30 நிமிடங்களுக்கு முன் நேரலை கண்காணிப்பு தொடங்கும்.`);
      } else if (language === 'hindi') {
        parts.push(`लाइव GPS ट्रैकिंग अभी स्टैंडबाय पर है। प्रस्थान से 30 से 45 मिनट पहले ट्रैकिंग शुरू होगी।`);
      } else if (language === 'english') {
        parts.push(`Live GPS telemetry is currently on standby. Tracking begins 30-45 minutes prior to departure.`);
      } else {
        parts.push(`Bus tracking ippo standby-la irukku. Departure-ku 30 mins munnadi driver tracking start pannuvanga.`);
      }
    }
  }

  // 3. Boarding / Dropping Point
  if (isAskingBoarding && boardingData) {
    const bp = boardingData.boardingPoint;
    if (language === 'tamil') {
      parts.push(`உங்கள் ஏறும் இடம் ${bp.name}, திட்டமிடப்பட்ட நேரம் ${bp.scheduledTime}, மேடை ${bp.platform}.`);
    } else if (language === 'hindi') {
      parts.push(`आपका बोर्डिंग पॉइंट ${bp.name} है, निर्धारित समय ${bp.scheduledTime}, ${bp.platform}।`);
    } else if (language === 'english') {
      parts.push(`Your boarding point is ${bp.name} at ${bp.scheduledTime}, ${bp.platform}.`);
    } else {
      parts.push(`Unga boarding point ${bp.name}, scheduled time ${bp.scheduledTime}, ${bp.platform}.`);
    }
  }

  if (isAskingDropping && boardingData) {
    const dp = boardingData.droppingPoint;
    if (language === 'tamil') {
      parts.push(`உங்கள் இறங்கும் இடம் ${dp.name}, எதிர்பார்க்கப்படும் நேரம் ${dp.scheduledTime}.`);
    } else if (language === 'hindi') {
      parts.push(`आपका ड्रॉपिंग पॉइंट ${dp.name} है, अपेक्षित समय लगभग ${dp.scheduledTime}।`);
    } else if (language === 'english') {
      parts.push(`Your drop location is ${dp.name}, expected around ${dp.scheduledTime}.`);
    } else {
      parts.push(`Unga dropping point ${dp.name}, arrival time sumaar ${dp.scheduledTime}.`);
    }
  }

  // 4. Seat Details
  if (isAskingSeat && tripDetails) {
    const seats = tripDetails.seatNumbers;
    if (language === 'tamil') {
      parts.push(`உங்களுடைய இருக்கை எண் ${seats}.`);
    } else if (language === 'hindi') {
      parts.push(`आपकी कन्फर्म सीट संख्या ${seats} है।`);
    } else if (language === 'english') {
      parts.push(`Your confirmed seat number is ${seats}.`);
    } else {
      parts.push(`Unga seat number ${seats}.`);
    }
  }

  // 5. Driver Manifest
  if (isAskingManifest) {
    if (manifestData?.success) {
      parts.push(`Trip manifest loaded: ${manifestData.data.boardedCount} boarded out of ${manifestData.data.totalPassengers} passengers.`);
    } else {
      parts.push(manifestData?.message || 'Unauthorized to view driver manifest.');
    }
  }

  if (parts.length === 0) {
    if (language === 'tamil') {
      return 'புரிந்தது. உங்கள் பயண விவரங்களை கூறவும் அல்லது உங்கள் PNR எண்ணை பகிரவும்.';
    } else if (language === 'hindi') {
      return 'समझ गया। कृपया अपना PNR नंबर बताएं या बोर्डिंग, बस लोकेशन अथवा सीट के बारे में पूछें।';
    } else if (language === 'english') {
      return 'Understood. Please provide your booking PNR number or ask about boarding, bus location, or seats.';
    } else {
      return 'Purinjadhu. Unga booking PNR number solla mudiyuma? Boarding, bus location, or seat details pathi kekkalaam.';
    }
  }

  return parts.join(' ');
}

/**
 * Creates an ephemeral session for the OpenAI Realtime API (WebRTC / streaming audio)
 */
export async function createRealtimeSession({ user, pnr } = {}) {
  const apiKey = config.ai.openaiKey;

  // If no OpenAI key configured or mock in test environment
  if (!apiKey || apiKey === 'your_openai_api_key_here') {
    return {
      success: false,
      isConfigured: false,
      reason: 'OPENAI_API_KEY_NOT_CONFIGURED',
      message: 'OpenAI Realtime API key is not configured in .env. Falling back to high-fidelity audio/text conversational engine.',
      supportedModes: ['websocket_stream', 'audio_chat', 'text_chat'],
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-realtime-preview',
        voice: 'alloy',
        instructions: `
You are SMART ROUTE BOOKING natural voice assistant.
Languages: Tamil, Tanglish, English.
Always verify data using tools before claiming boarding times or bus locations.
        `,
        modalities: ['audio', 'text'],
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenAI Realtime session error: ${err}`);
    }

    const data = await response.json();
    return {
      success: true,
      isConfigured: true,
      clientSecret: data.client_secret?.value,
      expiresAt: data.client_secret?.expires_at,
      sessionId: data.id,
    };
  } catch (err) {
    logger.error('Error creating realtime session:', err.message);
    return {
      success: false,
      error: err.message,
      isConfigured: false,
    };
  }
}

export default {
  processConversationTurn,
  getOrCreateSession,
  getInitialGreeting,
  detectLanguage,
  extractPnrFromText,
  createRealtimeSession,
};

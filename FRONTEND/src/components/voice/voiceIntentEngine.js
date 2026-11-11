/**
 * SMART ROUTE — Dynamic Multilingual Intent Engine
 * Strictly binds AI text responses to the selected language (Hindi, Tanglish, Tamil, English).
 */
export const generateAIResponse = (userText, language) => {
  const query = (userText || '').toLowerCase().trim();
  const lang = (language || 'English').toLowerCase();

  // 1. HINDI ENGINE
  if (lang === 'hindi') {
    if (query.match(/^(hi|hello|hey|namaste|pranam)/)) {
      return "नमस्ते! स्मार्ट रूट में आपका स्वागत है। क्या आप बस टिकट बुक करना चाहते हैं या पीएनआर स्टेटस चेक करना चाहते हैं?";
    }
    if (query.includes('bus') || query.includes('route') || query.includes('timing') || query.includes('tenkasi') || query.includes('coimbatore')) {
      return "हमारे पास इस रूट पर वी वी ट्रैवल्स, स्मार्ट रूट और ट्रांज़किंग की वोल्वो और लग्जरी बसें उपलब्ध हैं। क्या मैं आपको बस लिस्ट दिखाऊं?";
    }
    if (query.includes('pnr') || query.includes('ticket') || query.includes('status')) {
      return "कृपया अपना 10 अंकों का पीएनआर नंबर बताएं, मैं तुरंत लाइव बुकिंग स्टेटस चेक करती हूँ।";
    }
    return "ज़रूर! अपनी यात्रा की तारीख, पिकअप और ड्राप लोकेशन बताएं, मैं बेस्ट बस सर्च करके दिखाती हूँ।";
  }

  // 2. TANGLISH ENGINE
  if (lang === 'tanglish') {
    if (query.match(/^(hi|hello|hey|vanakkam|hai)/)) {
      return "Vanakkam! Smart Route-ku welcome. Ungalukku bus ticket book panna thonasaaiya, illa PNR status check pannanuma?";
    }
    if (query.includes('bus') || query.includes('route') || query.includes('timing') || query.includes('tenkasi') || query.includes('coimbatore')) {
      return "Intha route-la VEE VEE Travels, SMART ROUTE, mattrum TRANZKING luxury buses daily run aaguthu. Ungalukku buses list open panni kaattavaa?";
    }
    if (query.includes('pnr') || query.includes('ticket') || query.includes('status')) {
      return "Unga 10-digit PNR number-ah type pannunga, naa live chart status check panni solren.";
    }
    return "Kandippa paarkalaam! Unga travel date mattrum boarding point sonneenga-na udaney best bus search pannidalaam.";
  }

  // 3. TAMIL ENGINE
  if (lang === 'tamil') {
    if (query.match(/^(வணக்கம்|ஹலோ|ஹாய்)/)) {
      return "வணக்கம்! ஸ்மார்ட் ரூட்-க்கு நல்வரவு. உங்களுக்கு பேருந்து டிக்கெட் முன்பதிவு செய்ய உதவவா அல்லது PNR நிலையை சரிபார்க்க வேண்டுமா?";
    }
    if (query.includes('பஸ்') || query.includes('பேருந்து') || query.includes('நேரம்') || query.includes('தென்காசி') || query.includes('கோவை')) {
      return "இந்த வழித்தடத்தில் வி வி டிராவல்ஸ், ஸ்மார்ட் ரூட் மற்றும் டிரான்ஸ்கிங் பேருந்துகள் தினசரி இயக்கப்படுகின்றன. விவரங்களை காட்டவா?";
    }
    if (query.includes('pnr') || query.includes('டிக்கெட்') || query.includes('நிலை')) {
      return "உங்கள் 10 இலக்க PNR எண்ணை பதிவிடுங்கள், உடனடி நிலையை கூறுகிறேன்.";
    }
    return "நிச்சயமாக! உங்கள் பயண தேதி மற்றும் ஏறும் இடத்தை குறிப்பிட்டால் உடனடி பேருந்துகளை கண்டறியலாம்.";
  }

  // 4. ENGLISH ENGINE (DEFAULT)
  if (query.match(/^(hi|hello|hey)/)) {
    return "Hello! Welcome to Smart Route. Would you like to reserve a bus seat, check PNR status, or explore routes?";
  }
  if (query.includes('bus') || query.includes('route') || query.includes('timing') || query.includes('tenkasi') || query.includes('coimbatore')) {
    return "We have premier coaches from VEE VEE Travels, SMART ROUTE, and TRANZKING active on this route. Shall I open the bus search for you?";
  }
  if (query.includes('pnr') || query.includes('ticket') || query.includes('status')) {
    return "Please enter your 10-digit booking PNR number to fetch live ticket details.";
  }
  return "Sure! Please share your travel date, boarding, and dropping points to find the best coaches.";
};

export const INITIAL_GREETINGS = {
  Tanglish: "Vanakkam! Smart Route-ku welcome. Ungalukku bus ticket book panna thonasaaiya, illa PNR status check pannanuma?",
  Tamil: "வணக்கம்! ஸ்மார்ட் ரூட்-க்கு நல்வரவு. உங்களுக்கு பேருந்து டிக்கெட் முன்பதிவு செய்ய உதவவா அல்லது PNR நிலையை சரிபார்க்க வேண்டுமா?",
  Hindi: "नमस्ते! स्मार्ट रूट में आपका स्वागत है। क्या आप बस टिकट बुक करना चाहते हैं या पीएनआर स्टेटस चेक करना चाहते हैं?",
  English: "Hello! Welcome to Smart Route. Would you like to reserve a bus seat, check PNR status, or explore routes?",
};

/**
 * Natural, human-like Indian female voice locator for Web Speech API TTS.
 * Prioritizes Indian female voices (Veena, Kavya, Lekha, Heera, Neerja, Swara, Kajal, Aditi, Priya).
 */
export const findIndianFemaleVoice = (language) => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (voices.length === 0) return null;

  const lang = (language || 'English').toLowerCase();

  let targetLangPrefix = 'en-in';
  if (lang === 'hindi') targetLangPrefix = 'hi-in';
  else if (lang === 'tamil') targetLangPrefix = 'ta-in';
  else if (lang === 'tanglish') targetLangPrefix = 'ta-in';

  // Indian female voice name identifiers across macOS, Windows, Android, iOS, and Chrome
  const femaleIndianNames = [
    'veena', 'kavya', 'lekha', 'heera', 'neerja', 'swara', 'kajal',
    'aditi', 'priya', 'kalpana', 'geeta', 'latha', 'pallavi', 'female'
  ];

  // 1. Exact language match + recognized female name
  let matched = voices.find((v) => {
    const vLang = (v.lang || '').replace('_', '-').toLowerCase();
    const vName = (v.name || '').toLowerCase();
    const isLang = vLang.startsWith(targetLangPrefix);
    const isFemale = femaleIndianNames.some((n) => vName.includes(n));
    return isLang && isFemale;
  });

  // 2. If Tanglish and no Tamil female voice, try Indian English female (Veena / Heera / Neerja / Aditi)
  if (!matched && lang === 'tanglish') {
    matched = voices.find((v) => {
      const vLang = (v.lang || '').replace('_', '-').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      return vLang.startsWith('en-in') && femaleIndianNames.some((n) => vName.includes(n));
    });
  }

  // 3. Any voice matching target language prefix
  if (!matched) {
    matched = voices.find((v) => {
      const vLang = (v.lang || '').replace('_', '-').toLowerCase();
      return vLang.startsWith(targetLangPrefix);
    });
  }

  // 4. Any Indian English (en-IN) voice
  if (!matched) {
    matched = voices.find((v) => {
      const vLang = (v.lang || '').replace('_', '-').toLowerCase();
      return vLang.startsWith('en-in');
    });
  }

  // 5. Fallback to warm natural English female voice
  if (!matched) {
    matched = voices.find((v) => {
      const vName = (v.name || '').toLowerCase();
      return vName.includes('female') || vName.includes('samantha') || vName.includes('google uk english female');
    });
  }

  return matched || voices[0] || null;
};


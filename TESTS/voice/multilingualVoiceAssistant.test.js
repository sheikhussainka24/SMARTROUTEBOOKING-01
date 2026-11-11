import {
  generateAIResponse,
  findIndianFemaleVoice,
} from '../../FRONTEND/src/components/voice/voiceIntentEngine.js';

describe('SMART ROUTE — Multilingual Voice AI Assistant & Indian TTS Suite', () => {
  describe('1. Hindi Intent Engine', () => {
    test('returns Hindi greeting on hello/namaste/pranam', () => {
      const res = generateAIResponse('Namaste', 'Hindi');
      expect(res).toBe('नमस्ते! स्मार्ट रूट में आपका स्वागत है। क्या आप बस टिकट बुक करना चाहते हैं या पीएनआर स्टेटस चेक करना चाहते हैं?');

      const res2 = generateAIResponse('hello assistant', 'Hindi');
      expect(res2).toBe('नमस्ते! स्मार्ट रूट में आपका स्वागत है। क्या आप बस टिकट बुक करना चाहते हैं या पीएनआर स्टेटस चेक करना चाहते हैं?');
    });

    test('returns Hindi bus route fleet details on bus/route/timing query', () => {
      const res = generateAIResponse('Coimbatore to Tenkasi bus timing', 'Hindi');
      expect(res).toBe('हमारे पास इस रूट पर वी वी ट्रैवल्स, स्मार्ट रूट और ट्रांज़किंग की वोल्वो और लग्जरी बसें उपलब्ध हैं। क्या मैं आपको बस लिस्ट दिखाऊं?');
    });

    test('returns Hindi PNR status prompt on pnr/ticket query', () => {
      const res = generateAIResponse('Check my pnr status', 'Hindi');
      expect(res).toBe('कृपया अपना 10 अंकों का पीएनआर नंबर बताएं, मैं तुरंत लाइव बुकिंग स्टेटस चेक करती हूँ।');
    });

    test('returns Hindi default helpful guidance on general query', () => {
      const res = generateAIResponse('I need travel help tomorrow morning', 'Hindi');
      expect(res).toBe('ज़रूर! अपनी यात्रा की तारीख, पिकअप और ड्राप लोकेशन बताएं, मैं बेस्ट बस सर्च करके दिखाती हूँ।');
    });
  });

  describe('2. Tanglish Intent Engine', () => {
    test('returns Tanglish welcome greeting on vanakkam/hello/hai', () => {
      const res = generateAIResponse('Vanakkam', 'Tanglish');
      expect(res).toBe('Vanakkam! Smart Route-ku welcome. Ungalukku bus ticket book panna thonasaaiya, illa PNR status check pannanuma?');

      const res2 = generateAIResponse('hai bro', 'Tanglish');
      expect(res2).toBe('Vanakkam! Smart Route-ku welcome. Ungalukku bus ticket book panna thonasaaiya, illa PNR status check pannanuma?');
    });

    test('returns Tanglish bus fleet response on bus/route query', () => {
      const res = generateAIResponse('Tenkasi to Coimbatore bus irukka', 'Tanglish');
      expect(res).toBe('Intha route-la VEE VEE Travels, SMART ROUTE, mattrum TRANZKING luxury buses daily run aaguthu. Ungalukku buses list open panni kaattavaa?');
    });

    test('returns Tanglish 10-digit PNR prompt on pnr/ticket query', () => {
      const res = generateAIResponse('ticket details check pannu', 'Tanglish');
      expect(res).toBe('Unga 10-digit PNR number-ah type pannunga, naa live chart status check panni solren.');
    });

    test('returns Tanglish fallback guidance on general trip query', () => {
      const res = generateAIResponse('Madurai trip plan pannanum', 'Tanglish');
      expect(res).toBe('Kandippa paarkalaam! Unga travel date mattrum boarding point sonneenga-na udaney best bus search pannidalaam.');
    });
  });

  describe('3. Tamil Intent Engine', () => {
    test('returns Pure Tamil greeting on வணக்கம்/ஹலோ', () => {
      const res = generateAIResponse('வணக்கம்', 'Tamil');
      expect(res).toBe('வணக்கம்! ஸ்மார்ட் ரூட்-க்கு நல்வரவு. உங்களுக்கு பேருந்து டிக்கெட் முன்பதிவு செய்ய உதவவா அல்லது PNR நிலையை சரிபார்க்க வேண்டுமா?');

      const res2 = generateAIResponse('ஹலோ', 'Tamil');
      expect(res2).toBe('வணக்கம்! ஸ்மார்ட் ரூட்-க்கு நல்வரவு. உங்களுக்கு பேருந்து டிக்கெட் முன்பதிவு செய்ய உதவவா அல்லது PNR நிலையை சரிபார்க்க வேண்டுமா?');
    });

    test('returns Tamil fleet details on பேருந்து/வழித்தடம்/தென்காசி query', () => {
      const res = generateAIResponse('கோவை தென்காசி பேருந்து நேரம்', 'Tamil');
      expect(res).toBe('இந்த வழித்தடத்தில் வி வி டிராவல்ஸ், ஸ்மார்ட் ரூட் மற்றும் டிரான்ஸ்கிங் பேருந்துகள் தினசரி இயக்கப்படுகின்றன. விவரங்களை காட்டவா?');
    });

    test('returns Tamil PNR prompt on PNR/டிக்கெட் query', () => {
      const res = generateAIResponse('எனது டிக்கெட் நிலை அறிய வேண்டும்', 'Tamil');
      expect(res).toBe('உங்கள் 10 இலக்க PNR எண்ணை பதிவிடுங்கள், உடனடி நிலையை கூறுகிறேன்.');
    });

    test('returns Tamil default guidance on general query', () => {
      const res = generateAIResponse('பயணம் செய்ய வேண்டும்', 'Tamil');
      expect(res).toBe('நிச்சயமாக! உங்கள் பயண தேதி மற்றும் ஏறும் இடத்தை குறிப்பிட்டால் உடனடி பேருந்துகளை கண்டறியலாம்.');
    });
  });

  describe('4. English Intent Engine (Default)', () => {
    test('returns English welcome greeting on hello/hi/hey', () => {
      const res = generateAIResponse('Hello there', 'English');
      expect(res).toBe('Hello! Welcome to Smart Route. Would you like to reserve a bus seat, check PNR status, or explore routes?');

      const res2 = generateAIResponse('hey', 'English');
      expect(res2).toBe('Hello! Welcome to Smart Route. Would you like to reserve a bus seat, check PNR status, or explore routes?');
    });

    test('returns English luxury fleet response on bus/route/tenkasi/coimbatore query', () => {
      const res = generateAIResponse('Show me Coimbatore to Tenkasi bus options', 'English');
      expect(res).toBe('We have premier coaches from VEE VEE Travels, SMART ROUTE, and TRANZKING active on this route. Shall I open the bus search for you?');
    });

    test('returns English 10-digit PNR prompt on pnr/ticket status query', () => {
      const res = generateAIResponse('Check my pnr status', 'English');
      expect(res).toBe('Please enter your 10-digit booking PNR number to fetch live ticket details.');
    });

    test('returns English booking guidance on general trip query', () => {
      const res = generateAIResponse('I want to travel with my family next Friday', 'English');
      expect(res).toBe('Sure! Please share your travel date, boarding, and dropping points to find the best coaches.');
    });

    test('defaults to English engine when language is omitted or unsupported', () => {
      const res = generateAIResponse('Hi', '');
      expect(res).toBe('Hello! Welcome to Smart Route. Would you like to reserve a bus seat, check PNR status, or explore routes?');
    });
  });

  describe('5. Indian Female Voice Selection & Fallbacks', () => {
    const mockVoices = [
      { name: 'Alex', lang: 'en-US' },
      { name: 'Microsoft David', lang: 'en-US' },
      { name: 'Veena', lang: 'en-IN' },
      { name: 'Microsoft Heera - English (India)', lang: 'en-IN' },
      { name: 'Lekha', lang: 'hi-IN' },
      { name: 'Kavya', lang: 'ta-IN' },
    ];

    beforeAll(() => {
      global.window = {
        speechSynthesis: {
          getVoices: () => mockVoices,
        },
      };
    });

    afterAll(() => {
      delete global.window;
    });

    test('selects Kavya for Tamil language', () => {
      const voice = findIndianFemaleVoice('Tamil');
      expect(voice).toBeDefined();
      expect(voice.name).toBe('Kavya');
      expect(voice.lang).toBe('ta-IN');
    });

    test('selects Lekha for Hindi language', () => {
      const voice = findIndianFemaleVoice('Hindi');
      expect(voice).toBeDefined();
      expect(voice.name).toBe('Lekha');
      expect(voice.lang).toBe('hi-IN');
    });

    test('selects Indian female voice (Veena/Heera) for English language', () => {
      const voice = findIndianFemaleVoice('English');
      expect(voice).toBeDefined();
      expect(['Veena', 'Microsoft Heera - English (India)']).toContain(voice.name);
      expect(voice.lang).toBe('en-IN');
    });

    test('falls back gracefully when speechSynthesis is unavailable', () => {
      const oldWindow = global.window;
      global.window = {};
      const voice = findIndianFemaleVoice('English');
      expect(voice).toBeNull();
      global.window = oldWindow;
    });
  });
});

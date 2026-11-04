import dotenv from 'dotenv';
dotenv.config();

/**
 * SMART ROUTE — AI Gemini Service
 * Abstraction layer for Google Gemini generative AI.
 */
export class GeminiService {
  constructor(apiKey = process.env.GEMINI_API_KEY) {
    this.apiKey = apiKey;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey !== 'your_gemini_api_key_here');
  }

  async ask(prompt, systemInstruction = '') {
    if (!this.isAvailable()) {
      return {
        success: false,
        error: 'CONFIG_REQUIRED',
        message: 'GEMINI_API_KEY is not configured in .env. Please provide a valid Gemini API key.',
      };
    }

    try {
      const payload = {
        contents: [
          {
            parts: [
              ...(systemInstruction ? [{ text: `Instructions: ${systemInstruction}` }] : []),
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
        },
      };

      const res = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error (${res.status}): ${errText}`);
      }

      const json = await res.json();
      const outputText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, text: outputText };
    } catch (err) {
      return { success: false, error: 'GEMINI_ERROR', message: err.message };
    }
  }
}

export default new GeminiService();

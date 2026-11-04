import config from '../config/index.js';
import logger from '../config/logger.js';

/**
 * Gemini API Client Integration Layer
 * Uses GEMINI_API_KEY from environment variables.
 */
class GeminiClient {
  constructor() {
    this.apiKey = config.ai.geminiKey;
    this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey !== 'your_gemini_api_key_here');
  }

  async generateContent(prompt, systemInstruction = '') {
    if (!this.isConfigured()) {
      logger.warn('Gemini API key is not configured in .env (GEMINI_API_KEY)');
      return {
        success: false,
        error: 'AI_CREDENTIALS_NOT_CONFIGURED',
        message: 'Gemini API key is missing or not configured. Please set GEMINI_API_KEY in .env.',
      };
    }

    try {
      const url = `${this.endpoint}?key=${this.apiKey}`;
      const payload = {
        contents: [
          {
            parts: [
              ...(systemInstruction ? [{ text: `System Instruction: ${systemInstruction}` }] : []),
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 800,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorData}`);
      }

      const data = await response.json();
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return {
        success: true,
        text: answer,
      };
    } catch (error) {
      logger.error('Gemini API call failed:', error.message);
      return {
        success: false,
        error: 'AI_PROVIDER_ERROR',
        message: error.message,
      };
    }
  }
}

export const geminiClient = new GeminiClient();
export default geminiClient;

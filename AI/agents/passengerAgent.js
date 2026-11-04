import geminiService from '../services/geminiService.js';
import { PASSENGER_ASSISTANT_PROMPT } from '../prompts/systemPrompts.js';

/**
 * Passenger Conversational Agent
 */
export class PassengerAgent {
  constructor() {
    this.systemInstruction = PASSENGER_ASSISTANT_PROMPT;
  }

  async handleQuery(userQuery, tripContext = {}) {
    const contextualPrompt = `
TRIP CONTEXT:
${JSON.stringify(tripContext, null, 2)}

PASSENGER QUESTION:
${userQuery}
`;
    return geminiService.ask(contextualPrompt, this.systemInstruction);
  }
}

export default new PassengerAgent();

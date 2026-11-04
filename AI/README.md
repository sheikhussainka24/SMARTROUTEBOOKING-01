# SMART ROUTE — AI SYSTEM

Integration architecture for Google Gemini AI, prompt engineering, conversational agents, automated voice calls, and function calling tools.

## Structure

```
AI/
├── services/     # Gemini API integration layer
├── prompts/      # System prompts (passenger assistant, delay notices)
├── agents/       # Conversational agents (passengerAgent.js)
├── voice/        # Automated voice call (Twilio / Exotel IVR) service
├── tools/        # Function calling tools for trip & inventory queries
└── README.md
```

## Configuration

Set `GEMINI_API_KEY` in `.env`:
```
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

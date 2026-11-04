import geminiClient from './geminiClient.js';
import db from '../config/database.js';
import logger from '../config/logger.js';

/**
 * AI Passenger & Operations Assistant Service
 */
export async function askTripAssistant({ tripId, question, userRole = 'passenger' }) {
  // 1. Fetch real contextual data from database
  let contextData = {};
  if (tripId) {
    const trip = await db('trips')
      .join('routes', 'trips.route_id', 'routes.id')
      .join('buses', 'trips.bus_id', 'buses.id')
      .join('travels', 'trips.travel_id', 'travels.id')
      .where('trips.id', tripId)
      .select(
        'trips.*',
        'routes.source_city',
        'routes.destination_city',
        'routes.distance_km',
        'buses.bus_number',
        'buses.bus_type',
        'travels.name as travel_name'
      )
      .first();

    const latestGps = await db('gps_telemetry')
      .where('trip_id', tripId)
      .orderBy('recorded_at', 'desc')
      .first();

    contextData = { trip, latestGps };
  }

  const systemPrompt = `
You are SMART ROUTE AI, a helpful real-time bus travel assistant.
Context:
- User Role: ${userRole}
- Trip Info: ${JSON.stringify(contextData.trip || 'No specific trip selected')}
- Current Bus Location: ${JSON.stringify(contextData.latestGps || 'Location not currently emitting')}

Rules:
- Provide accurate, polite, and actionable responses regarding boarding, timing, bus amenities, and route info.
- If GPS is not active, clearly inform the passenger that the driver has not started tracking yet.
- Never invent imaginary stops or false arrival times.
`;

  return geminiClient.generateContent(question, systemPrompt);
}

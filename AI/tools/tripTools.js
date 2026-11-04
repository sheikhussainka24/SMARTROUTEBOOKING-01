/**
 * SMART ROUTE — AI Function Calling Tools Schema
 */

export const TRIP_AI_TOOLS = [
  {
    name: 'getTripStatus',
    description: 'Retrieve real-time status, current stop, and estimated arrival time for a specific bus trip',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string', description: 'The unique trip identifier' },
      },
      required: ['tripId'],
    },
  },
  {
    name: 'checkSeatAvailability',
    description: 'Get current available seat and sleeper inventory for a given trip',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string', description: 'The trip ID' },
        deck: { type: 'string', enum: ['lower', 'upper'], description: 'Bus deck' },
      },
      required: ['tripId'],
    },
  },
  {
    name: 'getBoardingPointDetails',
    description: 'Get landmark, GPS coordinates, and arrival time for a boarding point',
    parameters: {
      type: 'object',
      properties: {
        tripId: { type: 'string', description: 'The trip ID' },
        boardingPointName: { type: 'string', description: 'Name of the boarding stop' },
      },
      required: ['tripId', 'boardingPointName'],
    },
  },
];

import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validators.js';

export const validateCreateTrip = [
  body('travelId').isUUID().withMessage('Valid travel ID is required'),
  body('routeId').isUUID().withMessage('Valid route ID is required'),
  body('busId').isUUID().withMessage('Valid bus ID is required'),
  body('departureTime').isISO8601().withMessage('Valid departure timestamp is required'),
  body('arrivalTime').isISO8601().withMessage('Valid arrival timestamp is required'),
  body('baseSeatFare').isFloat({ min: 0 }).withMessage('Valid base seat fare is required'),
  body('baseSleeperFare').isFloat({ min: 0 }).withMessage('Valid base sleeper fare is required'),
  handleValidationErrors,
];

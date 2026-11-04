import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validators.js';

export const validateCreateBooking = [
  body('tripId').isUUID().withMessage('Valid trip ID is required'),
  body('boardingStopId').isUUID().withMessage('Valid boarding stop ID is required'),
  body('droppingStopId').isUUID().withMessage('Valid dropping stop ID is required'),
  body('passengers').isArray({ min: 1 }).withMessage('At least one passenger is required'),
  body('passengers.*.seatId').isUUID().withMessage('Valid seat ID is required for each passenger'),
  body('passengers.*.name').trim().notEmpty().withMessage('Passenger name is required'),
  body('passengers.*.age').isInt({ min: 1, max: 120 }).withMessage('Valid age is required'),
  body('passengers.*.gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  handleValidationErrors,
];

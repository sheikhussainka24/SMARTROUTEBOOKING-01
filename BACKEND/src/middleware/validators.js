import { validationResult, body, param, query } from 'express-validator';
import { normalizeRole } from '../config/roles.js';

/**
 * Validation error handler middleware
 */
export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
      value: e.value,
    }));
    return res.status(400).json({
      success: false,
      error: details.map((d) => d.message).join('. ') || 'Validation failed',
      code: 'VALIDATION_ERROR',
      details,
    });
  }
  next();
}

// ======================== AUTH VALIDATORS ========================
export const registerValidator = [
  body('email').trim().isEmail().normalizeEmail().withMessage('Valid email address is required'),
  body('mobile')
    .trim()
    .custom((val) => {
      const clean = String(val || '').replace(/\D/g, '').slice(-10);
      if (clean.length !== 10) {
        throw new Error('Valid 10-digit Indian mobile number is required');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain uppercase, lowercase, number, and special character'),
  body('confirmPassword')
    .optional()
    .custom((val, { req }) => {
      if (val && val !== req.body.password) {
        throw new Error('Confirm password does not match password');
      }
      return true;
    }),
  body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
  body('lastName').optional().trim().isLength({ max: 100 }),
  body('role')
    .optional()
    .custom((val, { req }) => {
      if (val === undefined || val === null || val === '') return true;
      const canonical = normalizeRole(String(val));
      if (!canonical) {
        throw new Error('Invalid role');
      }
      req.body.role = canonical;
      return true;
    }),
  handleValidation,
];

export const loginValidator = [
  body('password').notEmpty().withMessage('Password is required'),
  body().custom((body) => {
    const id = body.mobile || body.identifier || body.email || body.login;
    if (!id || !String(id).trim()) {
      throw new Error('Mobile number or email is required');
    }
    return true;
  }),
  handleValidation,
];

export const otpRequestValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or mobile is required'),
  body('purpose').isIn(['login', 'register', 'reset_password', 'verify']).withMessage('Invalid OTP purpose'),
  handleValidation,
];

export const otpVerifyValidator = [
  body('identifier').trim().notEmpty().withMessage('Email or mobile is required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits'),
  body('purpose').isIn(['login', 'register', 'reset_password', 'verify']).withMessage('Invalid OTP purpose'),
  handleValidation,
];

// ======================== TRAVEL VALIDATORS ========================
export const travelRegistrationValidator = [
  body('name').trim().isLength({ min: 2, max: 255 }).withMessage('Travel name required'),
  body('businessName').trim().isLength({ min: 2, max: 255 }).withMessage('Business name required'),
  body('contactEmail').isEmail().normalizeEmail(),
  body('contactMobile').isMobilePhone('en-IN'),
  body('city').trim().notEmpty(),
  body('state').trim().notEmpty(),
  body('businessAddress').trim().notEmpty(),
  handleValidation,
];

// ======================== BUS VALIDATORS ========================
export const busValidator = [
  body('name').optional().trim().isLength({ max: 255 }),
  body('registrationNumber').trim().notEmpty().withMessage('Registration number required'),
  body('busType').isIn([
    'ac_seater', 'non_ac_seater', 'ac_sleeper', 'non_ac_sleeper',
    'ac_seat_cum_sleeper', 'non_ac_seat_cum_sleeper',
  ]).withMessage('Invalid bus type'),
  body('configuration').trim().notEmpty().withMessage('Configuration required (e.g., 2+1)'),
  body('totalSeats').isInt({ min: 1 }).withMessage('Total seats must be positive'),
  handleValidation,
];

// ======================== ROUTE VALIDATORS ========================
export const routeValidator = [
  body('name').trim().isLength({ min: 2, max: 255 }),
  body('source').trim().notEmpty(),
  body('destination').trim().notEmpty(),
  handleValidation,
];

// ======================== TRIP VALIDATORS ========================
export const tripValidator = [
  body('busId').isUUID().withMessage('Valid bus ID required'),
  body('routeId').isUUID().withMessage('Valid route ID required'),
  body('departureDate').isDate().withMessage('Valid departure date required'),
  body('departureTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid departure time required (HH:MM)'),
  body('baseFare').isFloat({ min: 0 }).withMessage('Base fare must be non-negative'),
  handleValidation,
];

// ======================== BOOKING VALIDATORS ========================
export const bookingValidator = [
  body('tripId').isUUID().withMessage('Valid trip ID required'),
  body('boardingStopId').isUUID().withMessage('Valid boarding stop ID required'),
  body('droppingStopId').isUUID().withMessage('Valid dropping stop ID required'),
  body('seatIds').isArray({ min: 1 }).withMessage('At least one seat must be selected'),
  body('seatIds.*').isUUID().withMessage('Valid seat IDs required'),
  body('passengers').isArray({ min: 1 }).withMessage('At least one passenger required'),
  body('passengers.*.name').trim().isLength({ min: 2 }).withMessage('Passenger name required'),
  body('passengers.*.age').optional().isInt({ min: 1, max: 120 }),
  body('passengers.*.gender').optional().isIn(['male', 'female', 'other']),
  handleValidation,
];

// ======================== COMMON VALIDATORS ========================
export const uuidParam = (paramName = 'id') => [
  param(paramName).isUUID().withMessage(`Valid ${paramName} required`),
  handleValidation,
];

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().trim(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  handleValidation,
];

// Aliases
export const validateRegister = registerValidator;
export const validateLogin = loginValidator;
export const validateOtpRequest = otpRequestValidator;
export const validateOtpVerify = otpVerifyValidator;
export const handleValidationErrors = handleValidation;


import winston from 'winston';
import config from './index.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'confirmpassword',
  'newpassword',
  'currentpassword',
  'password_hash',
  'token',
  'accesstoken',
  'refreshtoken',
  'refresh_token',
  'otp',
  'otphash',
  'otp_hash',
  'secret',
  'authorization',
  'creditcard',
  'cardnumber',
  'cvv',
  'pannumber',
  'cookie',
  'jwt',
]);

/**
 * Deep redaction of sensitive credentials, tokens, and PII
 */
export function redactSensitiveData(obj, seen = new WeakSet()) {
  if (!obj || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return '[Circular]';
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item, seen));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase().replace(/[-_]/g, '');
    if (SENSITIVE_KEYS.has(lowerKey)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value, seen);
    } else if (typeof value === 'string' && (lowerKey.includes('auth') || lowerKey.includes('bearer') || lowerKey.includes('secret'))) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }
  return result;
}

const redactFormat = winston.format((info) => {
  return redactSensitiveData(info);
});

const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    redactFormat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'smartroute' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        redactFormat(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          const metaStr = Object.keys(meta).length > 1 ? ` ${JSON.stringify(meta)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      ),
    }),
  ],
});

// Add file transport in production
if (config.env === 'production') {
  logger.add(
    new winston.transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
  logger.add(
    new winston.transports.File({
      filename: config.logging.file.replace('.log', '-error.log'),
      level: 'error',
      maxsize: 5242880,
      maxFiles: 5,
    })
  );
}

export default logger;

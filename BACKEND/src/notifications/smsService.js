import config from '../config/index.js';
import logger from '../config/logger.js';

/**
 * SMS Notification Service (Twilio / SMS Gateway abstraction)
 */
export async function sendSMS({ to, message }) {
  const { accountSid, authToken, phoneNumber } = config.sms.twilio;

  if (!accountSid || !authToken || accountSid === 'your_twilio_sid_here') {
    logger.warn(`SMS Gateway credentials not configured. SMS to ${to} skipped: "${message}"`);
    return { success: false, reason: 'SMS_GATEWAY_NOT_CONFIGURED' };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: to,
      From: phoneNumber,
      Body: message,
    });

    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`SMS delivery failed (${response.status}): ${err}`);
    }

    const data = await response.json();
    return { success: true, sid: data.sid };
  } catch (error) {
    logger.error(`SMS send error to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

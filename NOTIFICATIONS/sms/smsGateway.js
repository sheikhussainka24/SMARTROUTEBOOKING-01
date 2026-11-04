import dotenv from 'dotenv';
dotenv.config();

/**
 * SMART ROUTE — SMS Gateway Service
 */
export class SmsGateway {
  constructor() {
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.from = process.env.TWILIO_PHONE_NUMBER;
  }

  isConfigured() {
    return Boolean(
      this.accountSid &&
      this.authToken &&
      this.accountSid !== 'your_twilio_sid_here'
    );
  }

  async sendSMS(to, body) {
    if (!this.isConfigured()) {
      return { success: false, reason: 'SMS_GATEWAY_NOT_CONFIGURED' };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const params = new URLSearchParams({ To: to, From: this.from, Body: body });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      const data = await res.json();
      return { success: res.ok, messageId: data.sid };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export default new SmsGateway();

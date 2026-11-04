import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

/**
 * SMART ROUTE — Razorpay Payment Gateway Service
 */
export class RazorpayService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
  }

  isConfigured() {
    return Boolean(
      this.keyId &&
      this.keySecret &&
      this.keyId !== 'your_razorpay_key_id_here' &&
      this.keySecret !== 'your_razorpay_key_secret_here'
    );
  }

  async createOrder({ amountInINR, receiptId, notes = {} }) {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'CREDENTIALS_MISSING',
        message: 'Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.',
      };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: Math.round(amountInINR * 100), // paise
          currency: 'INR',
          receipt: receiptId,
          notes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.description || 'Failed to create Razorpay order');
      }

      return {
        success: true,
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  verifyPaymentSignature({ orderId, paymentId, signature }) {
    if (!this.isConfigured()) return false;
    const generated = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return generated === signature;
  }
}

export default new RazorpayService();

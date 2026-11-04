import crypto from 'crypto';
import config from '../config/index.js';
import logger from '../config/logger.js';

/**
 * Razorpay Payment Integration Layer
 */
class RazorpayClient {
  constructor() {
    this.keyId = config.payment.razorpay.keyId;
    this.keySecret = config.payment.razorpay.keySecret;
  }

  isConfigured() {
    return Boolean(
      this.keyId &&
      this.keySecret &&
      this.keyId !== 'your_razorpay_key_id_here' &&
      this.keySecret !== 'your_razorpay_key_secret_here'
    );
  }

  /**
   * Create an order on Razorpay
   */
  async createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
    if (!this.isConfigured()) {
      logger.warn('Razorpay credentials are not configured in .env (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)');
      return {
        success: false,
        error: 'PAYMENT_GATEWAY_NOT_CONFIGURED',
        message: 'Payment gateway credentials are not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.',
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
          amount: Math.round(amount * 100), // convert to paise
          currency,
          receipt,
          notes,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.description || 'Razorpay order creation failed');
      }

      return {
        success: true,
        orderId: data.id,
        amount: data.amount,
        currency: data.currency,
      };
    } catch (error) {
      logger.error('Razorpay createOrder error:', error.message);
      return {
        success: false,
        error: 'RAZORPAY_ERROR',
        message: error.message,
      };
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  verifySignature({ orderId, paymentId, signature }) {
    if (!this.isConfigured()) {
      return false;
    }
    const generated = crypto
      .createHmac('sha256', this.keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return generated === signature;
  }
}

export const razorpayClient = new RazorpayClient();
export default razorpayClient;

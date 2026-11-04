import dotenv from 'dotenv';
dotenv.config();

/**
 * SMART ROUTE — Refund Processing Service
 */
export class RefundService {
  constructor() {
    this.keyId = process.env.RAZORPAY_KEY_ID;
    this.keySecret = process.env.RAZORPAY_KEY_SECRET;
  }

  async initiateRefund({ paymentId, amountInINR, notes = {} }) {
    if (!this.keyId || !this.keySecret) {
      return { success: false, reason: 'PAYMENT_CREDENTIALS_MISSING' };
    }

    try {
      const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
      const url = `https://api.razorpay.com/v1/payments/${paymentId}/refund`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify({
          amount: Math.round(amountInINR * 100),
          notes,
        }),
      });

      const data = await response.json();
      return { success: response.ok, refundId: data.id, status: data.status };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export default new RefundService();

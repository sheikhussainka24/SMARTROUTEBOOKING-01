import crypto from 'crypto';
import config from '../config/index.js';
import db from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Handle incoming Razorpay Webhook events
 */
export async function handleRazorpayWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.warn('RAZORPAY_WEBHOOK_SECRET not configured');
    return res.status(200).json({ status: 'ignored_unconfigured' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (expectedSignature !== signature) {
    logger.error('Invalid Razorpay webhook signature');
    return res.status(400).json({ error: 'INVALID_SIGNATURE' });
  }

  const { event, payload } = req.body;
  logger.info(`Received Razorpay webhook event: ${event}`);

  if (event === 'payment.captured') {
    const paymentEntity = payload.payment.entity;
    const orderId = paymentEntity.order_id;

    await db('payments').where('order_id', orderId).update({
      payment_id: paymentEntity.id,
      status: 'captured',
      updated_at: new Date(),
    });

    const payment = await db('payments').where('order_id', orderId).first();
    if (payment) {
      await db('bookings').where('id', payment.booking_id).update({
        status: 'confirmed',
        updated_at: new Date(),
      });
    }
  }

  res.status(200).json({ status: 'processed' });
}

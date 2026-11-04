import razorpayClient from './razorpayClient.js';
import db from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Initialize payment order for booking
 */
export async function initiateBookingPayment(bookingId) {
  const booking = await db('bookings').where('id', bookingId).first();
  if (!booking) {
    throw new Error('Booking not found');
  }

  const orderResult = await razorpayClient.createOrder({
    amount: parseFloat(booking.total_fare),
    receipt: booking.pnr_number,
    notes: {
      bookingId: booking.id,
      pnr: booking.pnr_number,
    },
  });

  if (orderResult.success) {
    await db('payments').insert({
      booking_id: bookingId,
      gateway: 'razorpay',
      order_id: orderResult.orderId,
      amount: booking.total_fare,
      currency: 'INR',
      status: 'created',
    });
  }

  return orderResult;
}

/**
 * Confirm payment and verify signature
 */
export async function verifyAndConfirmPayment({ bookingId, orderId, paymentId, signature }) {
  const isValid = razorpayClient.verifySignature({ orderId, paymentId, signature });

  if (!isValid) {
    await db('payments').where({ booking_id: bookingId, order_id: orderId }).update({
      status: 'failed',
      updated_at: new Date(),
    });
    return { success: false, error: 'INVALID_SIGNATURE' };
  }

  // Update payment and booking in transaction
  await db.transaction(async (trx) => {
    await trx('payments').where({ booking_id: bookingId, order_id: orderId }).update({
      payment_id: paymentId,
      signature,
      status: 'captured',
      updated_at: new Date(),
    });

    await trx('bookings').where('id', bookingId).update({
      status: 'confirmed',
      updated_at: new Date(),
    });
  });

  return { success: true };
}

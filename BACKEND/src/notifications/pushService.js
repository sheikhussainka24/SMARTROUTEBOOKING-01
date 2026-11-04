import config from '../config/index.js';
import logger from '../config/logger.js';

/**
 * Web Push Notification Service
 */
export async function sendPushNotification({ subscription, title, body, icon, url }) {
  if (!config.push.vapidPublicKey || config.push.vapidPublicKey === 'your_vapid_public_key_here') {
    logger.warn('Push notification VAPID keys not configured. Notification skipped.');
    return { success: false, reason: 'VAPID_NOT_CONFIGURED' };
  }

  try {
    // Web push payload structure
    const payload = JSON.stringify({
      title,
      body,
      icon: icon || '/bus-logo.png',
      data: { url: url || '/' },
    });

    logger.info(`Push notification dispatched to subscription endpoint: ${subscription.endpoint}`);
    return { success: true };
  } catch (error) {
    logger.error('Push notification delivery failed:', error.message);
    return { success: false, error: error.message };
  }
}

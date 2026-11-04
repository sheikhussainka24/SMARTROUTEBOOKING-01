import nodemailer from 'nodemailer';
import config from '../config/index.js';
import logger from '../config/logger.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    if (config.email.smtp.host && config.email.smtp.user) {
      transporter = nodemailer.createTransport({
        host: config.email.smtp.host,
        port: config.email.smtp.port,
        secure: config.email.smtp.port === 465,
        auth: {
          user: config.email.smtp.user,
          pass: config.email.smtp.password,
        },
      });
    }
  }
  return transporter;
}

/**
 * Send an email notification
 */
export async function sendEmail({ to, subject, html, text }) {
  const mailer = getTransporter();
  if (!mailer) {
    logger.warn(`SMTP credentials not configured. Email to ${to} queued/skipped: "${subject}"`);
    return { success: false, reason: 'SMTP_NOT_CONFIGURED' };
  }

  try {
    const info = await mailer.sendMail({
      from: config.email.from,
      to,
      subject,
      text,
      html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
}

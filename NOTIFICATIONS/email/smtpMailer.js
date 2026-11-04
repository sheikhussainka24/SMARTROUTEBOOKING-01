import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * SMART ROUTE — SMTP Email Dispatcher
 */
export class SmtpMailer {
  constructor() {
    this.host = process.env.SMTP_HOST;
    this.port = parseInt(process.env.SMTP_PORT || '587', 10);
    this.user = process.env.SMTP_USER;
    this.pass = process.env.SMTP_PASSWORD;
    this.from = process.env.EMAIL_FROM || 'noreply@smartroute.in';
  }

  isConfigured() {
    return Boolean(this.host && this.user && this.user !== 'your_email@gmail.com');
  }

  async send({ to, subject, html, text }) {
    if (!this.isConfigured()) {
      return { success: false, reason: 'SMTP_CREDENTIALS_NOT_CONFIGURED' };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: this.host,
        port: this.port,
        secure: this.port === 465,
        auth: { user: this.user, pass: this.pass },
      });

      const info = await transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      return { success: true, messageId: info.messageId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export default new SmtpMailer();

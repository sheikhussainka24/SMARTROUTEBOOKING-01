# SMART ROUTE — NOTIFICATION SUBSYSTEM

Multi-channel notification infrastructure for transactional emails, SMS alerts, and browser push notifications.

## Structure

```
NOTIFICATIONS/
├── email/       # SMTP / Nodemailer email sender
├── sms/         # SMS gateway service
├── push/        # VAPID web push notifications
├── templates/   # HTML ticket layouts & transactional SMS copy
└── README.md
```

## Supported Events

- OTP Authentication & Verification
- Instant Booking Confirmation with PNR & E-Ticket
- Boarding reminder & revised ETA dispatch
- Live GPS tracking link sharing

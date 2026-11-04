# SMART ROUTE — PAYMENTS SUBSYSTEM

Production payment processing architecture using Razorpay with cryptographic signature verification, transaction logging, webhooks, and refund lifecycle.

## Structure

```
PAYMENTS/
├── razorpay/   # Order creation & signature verification
├── services/   # Refund processing & transaction reconciliation
├── webhooks/   # Webhook cryptographic verification
└── README.md
```

## Security Requirements

- Never fake payment success.
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are kept in `.env`.
- Frontend only receives `orderId` and `keyId`, never backend secret.

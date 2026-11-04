# SMART ROUTE — System Overview

## Platform Mission
SMART ROUTE is a real-time, production-grade private bus booking and travel operations platform built specifically for Indian private fleet operators.

## High-Level Topology
```
               [PASSENGER WEB / MOBILE APP]
                     │            │ (HTTP REST)
                     │ (WebSocket)▼
          ┌──────────┼───────────────┐
          │  REALTIME│(Socket.IO)    │
          │          ▼               │
    [DRIVER GPS] ──> [NODE/EXPRESS] <──> [POSTGRESQL DB]
                     │ BACKEND       │
                     ├──> [GEMINI AI]
                     ├──> [RAZORPAY]
                     └──> [SMTP / TWILIO]
```

## Multi-Tenant Isolation
- Every private bus operator is provisioned as an independent tenant (`travel_id`).
- Buses, routes, drivers, managers, and schedules are scoped strictly to the operator.
- Cross-tenant data access is blocked by database constraints and authorization middleware.

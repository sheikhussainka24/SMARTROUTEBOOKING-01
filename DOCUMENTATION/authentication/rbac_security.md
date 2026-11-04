# SMART ROUTE — RBAC & Security Architecture

## Role Hierarchy

```
SUPER ADMIN / FOUNDER
        ↓
   TRAVEL OWNER
        ↓
     MANAGER
        ↓
  DRIVER / STAFF

PASSENGER (Customer role)
```

## Security Guarantees
1. **Isolated Dashboards**: A user authenticated as a Driver cannot access Owner or Manager endpoints. Unauthorized role access returns HTTP 403.
2. **Short-Lived Access Tokens**: JWT tokens expire in 15 minutes. Long-lived refresh tokens are hashed with SHA-256 before DB persistence.
3. **Approval Gates**: Drivers and fleet managers who self-register have their accounts held in `pending` state with zero access until authorized by the Travel Owner.
4. **Super Admin Privacy**: The Super Admin dashboard only exposes operator-level aggregate counts (total buses, total staff, total active routes) without leaking personal staff details.

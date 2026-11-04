# SMART ROUTE — Seat Concurrency & Inventory Architecture

## Challenge: Multi-Stop Intermediate Booking
In long-distance Indian private bus travel, passengers book journeys between intermediate segments (e.g. Bangalore -> Salem on a Bangalore -> Madurai trip). A seat is only occupied between the passenger's boarding stop order and dropping stop order.

## Concurrency Guarantee
1. **Segment Conflict Calculation**:
   Two segments $[A_{from}, A_{to}]$ and $[B_{from}, B_{to}]$ conflict if and only if:
   $$\neg (A_{to} \le B_{from} \lor A_{from} \ge B_{to})$$
2. **Pessimistic Locking**:
   When a user clicks a seat, the backend acquires an exclusive row lock on candidate rows using `SELECT ... FOR UPDATE` inside a database transaction.
3. **10-Minute Hold Expiry**:
   Unpaid holds expire automatically after 10 minutes, making the seat immediately available to other passengers without manual intervention.

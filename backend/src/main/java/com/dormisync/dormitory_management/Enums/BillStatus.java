package com.dormisync.dormitory_management.Enums;

/**
 * UNPAID    - nothing paid yet (shown as overdue once the due date passes)
 * PENDING   - the tenant submitted a payment that staff have not confirmed yet
 * PAID      - staff confirmed the payment
 * CANCELLED - no longer owed, e.g. future months after the lease was terminated
 */
public enum BillStatus {
    UNPAID,
    PENDING,
    PAID,
    CANCELLED
}

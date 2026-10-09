package com.dormisync.dormitory_management.Repository;

import com.dormisync.dormitory_management.Entity.Payment;
import com.dormisync.dormitory_management.Enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByTenantId(Long tenantId);

    List<Payment> findByLeaseId(Long leaseId);

    List<Payment> findByStatus(PaymentStatus status);
}

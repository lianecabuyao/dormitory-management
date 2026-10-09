package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.Lease;
import com.dormisync.dormitory_management.Entity.Payment;
import com.dormisync.dormitory_management.Enums.PaymentStatus;
import com.dormisync.dormitory_management.Repository.LeaseRepository;
import com.dormisync.dormitory_management.Repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final LeaseRepository leaseRepository;

    public PaymentService(
            PaymentRepository paymentRepository,
            LeaseRepository leaseRepository) {

        this.paymentRepository = paymentRepository;
        this.leaseRepository = leaseRepository;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Payment not found"));
    }

    public Payment createPayment(
            Long leaseId,
            BigDecimal amount,
            String paymentMethod,
            String referenceNumber) {

        Lease lease = leaseRepository.findById(leaseId)
                .orElseThrow(() ->
                        new RuntimeException("Lease not found"));

        if (amount == null ||
                amount.compareTo(BigDecimal.ZERO) <= 0) {

            throw new RuntimeException(
                    "Payment amount must be greater than zero"
            );
        }

        Payment payment = new Payment();

        payment.setLease(lease);
        payment.setTenant(lease.getTenant());

        payment.setAmount(amount);
        payment.setPaymentMethod(paymentMethod);
        payment.setReferenceNumber(referenceNumber);

        payment.setStatus(PaymentStatus.PENDING);

        return paymentRepository.save(payment);
    }

    public Payment confirmPayment(Long id) {

        Payment payment = getPaymentById(id);

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaymentDate(LocalDateTime.now());

        return paymentRepository.save(payment);
    }

    public Payment markPaymentFailed(Long id) {

        Payment payment = getPaymentById(id);

        payment.setStatus(PaymentStatus.FAILED);

        return paymentRepository.save(payment);
    }

    public List<Payment> getPaymentsByTenant(Long tenantId) {
        return paymentRepository.findByTenantId(tenantId);
    }

    public List<Payment> getPaymentsByLease(Long leaseId) {
        return paymentRepository.findByLeaseId(leaseId);
    }
}

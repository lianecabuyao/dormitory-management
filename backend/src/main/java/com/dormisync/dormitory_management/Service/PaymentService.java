package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.Bill;
import com.dormisync.dormitory_management.Entity.Payment;
import com.dormisync.dormitory_management.Enums.BillStatus;
import com.dormisync.dormitory_management.Enums.PaymentStatus;
import com.dormisync.dormitory_management.Repository.BillRepository;
import com.dormisync.dormitory_management.Repository.PaymentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final BillRepository billRepository;
    private final BillService billService;

    public PaymentService(
            PaymentRepository paymentRepository,
            BillRepository billRepository,
            BillService billService) {

        this.paymentRepository = paymentRepository;
        this.billRepository = billRepository;
        this.billService = billService;
    }

    public List<Payment> getAllPayments() {
        return paymentRepository.findAll();
    }

    public Payment getPaymentById(Long id) {
        return paymentRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    /** The tenant pays one monthly bill. The bill waits as PENDING until staff confirm. */
    @Transactional
    public Payment createPayment(
            Long billId,
            String paymentMethod,
            String referenceNumber) {

        if (billId == null) {
            throw badRequest("Choose which month you are paying for");
        }
        if (paymentMethod == null || paymentMethod.isBlank()) {
            throw badRequest("Payment method is required");
        }

        Bill bill = billService.getBillById(billId);

        switch (bill.getStatus()) {
            case PENDING -> throw badRequest("This month already has a payment waiting for confirmation");
            case PAID -> throw badRequest("This month is already paid");
            case CANCELLED -> throw badRequest("This bill was cancelled and no longer needs payment");
            case UNPAID -> { }
        }

        Payment payment = new Payment();
        payment.setBill(bill);
        payment.setLease(bill.getLease());
        payment.setTenant(bill.getLease().getTenant());
        payment.setAmount(bill.getAmount());
        payment.setPaymentMethod(paymentMethod.trim());
        payment.setReferenceNumber(
                referenceNumber == null || referenceNumber.isBlank() ? null : referenceNumber.trim());
        payment.setStatus(PaymentStatus.PENDING);

        bill.setStatus(BillStatus.PENDING);
        billRepository.save(bill);

        return paymentRepository.save(payment);
    }

    /** Staff saw the money arrive: the payment and its bill become PAID. */
    @Transactional
    public Payment confirmPayment(Long id) {
        Payment payment = getPendingPayment(id);

        payment.setStatus(PaymentStatus.PAID);
        payment.setPaymentDate(LocalDateTime.now());

        Bill bill = payment.getBill();
        if (bill != null) {
            bill.setStatus(BillStatus.PAID);
            billRepository.save(bill);
        }

        return paymentRepository.save(payment);
    }

    /** The money never arrived: the payment fails and the month is UNPAID again. */
    @Transactional
    public Payment markPaymentFailed(Long id) {
        Payment payment = getPendingPayment(id);

        payment.setStatus(PaymentStatus.FAILED);

        Bill bill = payment.getBill();
        if (bill != null && bill.getStatus() == BillStatus.PENDING) {
            bill.setStatus(BillStatus.UNPAID);
            billRepository.save(bill);
        }

        return paymentRepository.save(payment);
    }

    public List<Payment> getPaymentsByTenant(Long tenantId) {
        return paymentRepository.findByTenantId(tenantId);
    }

    public List<Payment> getPaymentsByLease(Long leaseId) {
        return paymentRepository.findByLeaseId(leaseId);
    }

    private Payment getPendingPayment(Long id) {
        Payment payment = getPaymentById(id);
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw badRequest("Only pending payments can be confirmed or marked as failed");
        }
        return payment;
    }

    private static ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}

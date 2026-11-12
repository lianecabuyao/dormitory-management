package com.dormisync.dormitory_management.Controller;

import com.dormisync.dormitory_management.DTO.PaymentRequest;
import com.dormisync.dormitory_management.Entity.Payment;
import com.dormisync.dormitory_management.Service.PaymentService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {
    private final PaymentService paymentService;

    public PaymentController(
            PaymentService paymentService) {

        this.paymentService = paymentService;
    }

    @GetMapping
    public List<Payment> getAllPayments() {
        return paymentService.getAllPayments();
    }

    @GetMapping("/{id}")
    public Payment getPaymentById(
            @PathVariable Long id) {

        return paymentService.getPaymentById(id);
    }

    @PostMapping
    public Payment createPayment(
            @RequestBody PaymentRequest request) {

        return paymentService.createPayment(
                request.getBillId(),
                request.getPaymentMethod(),
                request.getReferenceNumber()
        );
    }

    @PutMapping("/{id}/confirm")
    public Payment confirmPayment(
            @PathVariable Long id) {

        return paymentService.confirmPayment(id);
    }

    @PutMapping("/{id}/fail")
    public Payment markPaymentFailed(
            @PathVariable Long id) {

        return paymentService.markPaymentFailed(id);
    }

    @GetMapping("/tenant/{tenantId}")
    public List<Payment> getPaymentsByTenant(
            @PathVariable Long tenantId) {

        return paymentService
                .getPaymentsByTenant(tenantId);
    }

    @GetMapping("/lease/{leaseId}")
    public List<Payment> getPaymentsByLease(
            @PathVariable Long leaseId) {

        return paymentService
                .getPaymentsByLease(leaseId);
    }
}

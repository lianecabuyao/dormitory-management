package com.dormisync.dormitory_management.Service;

import com.dormisync.dormitory_management.Entity.Bill;
import com.dormisync.dormitory_management.Entity.Lease;
import com.dormisync.dormitory_management.Entity.Payment;
import com.dormisync.dormitory_management.Enums.BillStatus;
import com.dormisync.dormitory_management.Enums.LeaseStatus;
import com.dormisync.dormitory_management.Enums.PaymentStatus;
import com.dormisync.dormitory_management.Repository.BillRepository;
import com.dormisync.dormitory_management.Repository.LeaseRepository;
import com.dormisync.dormitory_management.Repository.PaymentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Monthly rent bills. A lease from Nov 12 to May 12 gets six bills, due on
 * Nov 12, Dec 12, Jan 12, Feb 12, Mar 12 and Apr 12.
 */
@Service
public class BillService {
    /** Used only for old leases that were saved without an end date. */
    private static final int MONTHS_WHEN_NO_END_DATE = 6;
    /** Safety limit so a typo like year 2099 cannot create thousands of bills. */
    private static final int MAX_MONTHS = 60;

    private final BillRepository billRepository;
    private final LeaseRepository leaseRepository;
    private final PaymentRepository paymentRepository;

    public BillService(
            BillRepository billRepository,
            LeaseRepository leaseRepository,
            PaymentRepository paymentRepository) {

        this.billRepository = billRepository;
        this.leaseRepository = leaseRepository;
        this.paymentRepository = paymentRepository;
    }

    public List<Bill> getAllBills() {
        return billRepository.findAllByOrderByDueDateAsc();
    }

    public Bill getBillById(Long id) {
        return billRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bill not found"));
    }

    public List<Bill> getBillsByLease(Long leaseId) {
        return billRepository.findByLeaseIdOrderByMonthNumberAsc(leaseId);
    }

    public List<Bill> getBillsByTenant(Long tenantId) {
        return billRepository.findByLeaseTenantIdOrderByDueDateAsc(tenantId);
    }

    /** Creates one bill per month from the lease start date up to its end date. */
    @Transactional
    public List<Bill> generateBills(Lease lease) {
        LocalDate start = lease.getStartDate();
        LocalDate end = lease.getEndDate() != null
                ? lease.getEndDate()
                : start.plusMonths(MONTHS_WHEN_NO_END_DATE);

        List<Bill> bills = new ArrayList<>();

        for (int i = 0; i < MAX_MONTHS; i++) {
            // Always count from the start date so Jan 31 -> Feb 28 -> Mar 31 doesn't drift.
            LocalDate periodStart = start.plusMonths(i);

            if (i > 0 && !periodStart.isBefore(end)) {
                break;
            }

            LocalDate periodEnd = start.plusMonths(i + 1).minusDays(1);
            if (periodEnd.isAfter(end)) {
                periodEnd = end;
            }

            Bill bill = new Bill();
            bill.setLease(lease);
            bill.setMonthNumber(i + 1);
            bill.setPeriodStart(periodStart);
            bill.setPeriodEnd(periodEnd);
            bill.setDueDate(periodStart);
            bill.setAmount(lease.getMonthlyRent());
            bill.setStatus(BillStatus.UNPAID);
            bills.add(bill);
        }

        return billRepository.saveAll(bills);
    }

    /** Returns the lease's bills, creating them first if the lease has none yet. */
    @Transactional
    public List<Bill> billsFor(Lease lease) {
        List<Bill> bills = getBillsByLease(lease.getId());
        return bills.isEmpty() ? generateBills(lease) : bills;
    }

    /**
     * When a lease ends, months that haven't started yet are no longer owed.
     * Months already due stay UNPAID because the tenant still owes them.
     * If the tenant never moved in (lease was PENDING), nothing unpaid is owed.
     */
    @Transactional
    public void cancelRemainingBills(Lease lease, boolean tenantMovedIn) {
        LocalDate today = LocalDate.now();

        for (Bill bill : getBillsByLease(lease.getId())) {
            boolean notStartedYet = bill.getDueDate().isAfter(today);

            if (bill.getStatus() == BillStatus.UNPAID && (!tenantMovedIn || notStartedYet)) {
                bill.setStatus(BillStatus.CANCELLED);
                billRepository.save(bill);
            }
        }
    }

    /**
     * Gives bills to leases created before billing existed, and links their
     * earlier payments to those bills (oldest payment pays the first month).
     */
    @Transactional
    public int backfillExistingLeases() {
        int count = 0;

        for (Lease lease : leaseRepository.findAll()) {
            boolean open = lease.getStatus() == LeaseStatus.PENDING
                    || lease.getStatus() == LeaseStatus.ACTIVE;

            if (!open || billRepository.existsByLeaseId(lease.getId())) {
                continue;
            }

            List<Bill> bills = generateBills(lease);
            linkOldPayments(lease, bills);
            count++;
        }

        return count;
    }

    private void linkOldPayments(Lease lease, List<Bill> bills) {
        List<Payment> payments = paymentRepository.findByLeaseId(lease.getId()).stream()
                .filter(p -> p.getBill() == null)
                .filter(p -> p.getStatus() == PaymentStatus.PENDING || p.getStatus() == PaymentStatus.PAID)
                .sorted(Comparator.comparing(Payment::getId))
                .toList();

        int next = 0;
        for (Payment payment : payments) {
            if (next >= bills.size()) {
                break;
            }

            Bill bill = bills.get(next++);
            bill.setStatus(payment.getStatus() == PaymentStatus.PAID ? BillStatus.PAID : BillStatus.PENDING);
            billRepository.save(bill);

            payment.setBill(bill);
            paymentRepository.save(payment);
        }
    }
}

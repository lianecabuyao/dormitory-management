package com.dormisync.dormitory_management.Controller;

import com.dormisync.dormitory_management.Entity.Bill;
import com.dormisync.dormitory_management.Service.BillService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Monthly rent bills. They are created automatically with each lease. */
@RestController
@RequestMapping("/api/bills")
public class BillController {
    private final BillService billService;

    public BillController(BillService billService) {
        this.billService = billService;
    }

    @GetMapping
    public List<Bill> getAllBills() {
        return billService.getAllBills();
    }

    @GetMapping("/{id}")
    public Bill getBillById(@PathVariable Long id) {
        return billService.getBillById(id);
    }

    @GetMapping("/lease/{leaseId}")
    public List<Bill> getBillsByLease(@PathVariable Long leaseId) {
        return billService.getBillsByLease(leaseId);
    }

    @GetMapping("/tenant/{tenantId}")
    public List<Bill> getBillsByTenant(@PathVariable Long tenantId) {
        return billService.getBillsByTenant(tenantId);
    }
}

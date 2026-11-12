package com.dormisync.dormitory_management.Repository;

import com.dormisync.dormitory_management.Entity.Bill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByLeaseIdOrderByMonthNumberAsc(Long leaseId);

    List<Bill> findByLeaseTenantIdOrderByDueDateAsc(Long tenantId);

    List<Bill> findAllByOrderByDueDateAsc();

    boolean existsByLeaseId(Long leaseId);
}

package com.dormisync.dormitory_management.Config;

import com.dormisync.dormitory_management.Service.BillService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * On startup, gives monthly bills to any open lease that doesn't have them yet
 * (leases created before billing was added). Does nothing once all leases have bills.
 */
@Component
public class BillBackfill implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(BillBackfill.class);

    private final BillService billService;

    public BillBackfill(BillService billService) {
        this.billService = billService;
    }

    @Override
    public void run(ApplicationArguments args) {
        int count = billService.backfillExistingLeases();
        if (count > 0) {
            log.info("Created monthly bills for {} existing lease(s).", count);
        }
    }
}

/*
 * Copyright (c) 2026 Fincz-Track
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package com.fincz.notification.job;

import com.fincz.notification.service.NotificationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Scheduled job for sending portfolio performance alerts.
 */
@Component
@Slf4j
public class PortfolioAlertJob {


    private final NotificationService notificationService;

    // Explicit constructor
    public PortfolioAlertJob(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /**
     * Runs every hour to check for portfolio alerts.
     */
    @Scheduled(fixedRate = 3600000) // 1 hour in milliseconds
    public void sendPortfolioAlerts() {
        log.info("Running scheduled portfolio alert job");
        try {
            notificationService.sendPortfolioAlerts();
        } catch (Exception e) {
            log.error("Error in portfolio alert job: {}", e.getMessage(), e);
        }
    }
}
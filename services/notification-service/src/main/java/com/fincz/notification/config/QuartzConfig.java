package com.fincz.notification.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;

/**
 * @author Kaunain Ahmad
 * @since April 2026
 *
 * Quartz scheduler configuration for notification jobs.
 */
@Configuration
public class QuartzConfig {

    @Bean
    public SchedulerFactoryBean schedulerFactoryBean() {
        SchedulerFactoryBean schedulerFactoryBean = new SchedulerFactoryBean();
        schedulerFactoryBean.setWaitForJobsToCompleteOnShutdown(true);
        return schedulerFactoryBean;
    }
}
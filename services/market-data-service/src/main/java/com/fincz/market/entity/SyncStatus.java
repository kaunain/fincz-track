package com.fincz.market.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Singleton-like entity to track the global state of market data synchronization.
 */
@Entity
@Table(name = "sync_status")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SyncStatus {

    @Id
    private String id; // We'll use "GLOBAL_SYNC" as the key

    private boolean inProgress;
    private LocalDateTime lastSyncStart;
    private int totalSymbols;
    private int processedSymbols;
}
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
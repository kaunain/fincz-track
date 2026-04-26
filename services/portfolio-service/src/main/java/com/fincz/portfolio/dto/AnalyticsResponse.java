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

 package com.fincz.portfolio.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.HashMap;

/**
 * DTO for portfolio analytics summary.
 * Matches the requirements for CAGR, Concentration Risk, and Tax analysis.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {

    /**
     * Map of Symbol to its Compound Annual Growth Rate.
     */
    @Builder.Default
    private Map<String, BigDecimal> cagrPerAsset = new HashMap<>();

    /**
     * Map of Asset Type to its percentage allocation in the portfolio.
     */
    @Builder.Default
    private Map<String, BigDecimal> concentrationRisk = new HashMap<>();

    /**
     * Historical net worth trend data (Date to Value).
     */
    @Builder.Default
    private Map<LocalDate, BigDecimal> netWorthHistory = new HashMap<>();

    /**
     * The date this analytics snapshot was generated.
     */
    private LocalDate lastCalculated;
}
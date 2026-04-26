package com.fincz.market.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SyncSummary {
    private int totalSymbols;
    private int updatedSymbols;
    private int skippedSymbols;
    private List<String> updatedList;
}
# 🚀 Frontend Enhancement Plan - Fincz Track

## 🟢 Phase 1: UI/UX Refinement & Profile Management
- [ ] **Design System Setup**: Integrate `Shadcn/ui` (Radix UI + Tailwind) for accessible, premium-feel components.
- [x] **Skeleton Loaders**: Implement placeholder loading states for Dashboard cards and Charts. (Foundational component created)
- [x] **Interactive Toasts**: Integrate `sonner` for non-blocking action feedback. (Implemented globally)
- [x] **Dark Mode**: Add Tailwind CSS dark mode support with a persistent toggle. (ThemeContext implemented)
- [x] **Responsive Refinement**: Optimize the "Add Investment" form for one-handed mobile usage. (Modern layout + accessibility)
- [x] **Micro-animations**: Use `Framer Motion` for smooth transitions between dashboard states. (Applied to Profile & Forms)
- [x] **Data Storytelling**: Add "Insights" cards (e.g., "Your gold holdings are up 5%, hedging your equity dip"). (Implemented on Dashboard)

### 👤 User Profile & Security (New)
- [x] **Profile Settings Page**: Ek dedicated page jahan user apni details dekh sake. (Initial UI shell created)
- [x] **Contact Management**: Email aur Mobile number update/change karne ka option.
- [x] **Password Management**:
    - [x] **Change Password**: Logged-in user ke liye purana password verify karke naya set karna.
    - [x] **Forgot Password**: Unauthenticated user ke liye email-based reset link flow. (Page implemented)
- [x] **Avatar Support**: User ke naam ke initials dikhana.
- [x] **Multi-Factor Authentication (MFA)**: Security badhane ke liye TOTP setup UI. (Modal flow implemented)
- [x] **Account Deletion**: User privacy ke liye account permanently delete confirmation option. (UI logic implemented)
- [x] **Session Management**: Dekhna ki user kahan-kahan logged in hai aur "Logout from all devices" ka option.
- [x] **User Preferences**: Default currency (INR/USD) aur locale settings.

## 🔵 Phase 2: Portfolio Features (Data Control)
- [x] **CRUD Extensions**: Add "Edit" and "Delete" functionality to the investment list. (UI & logic implemented)
- [x] **Asset Tagging**: Investments ko categories mein group karna (e.g., "Retirement", "Emergency Fund", "House"). (UI display implemented)
- [x] **Advanced Tables**: Implement `TanStack Table` for sorting, filtering, and pagination in the Reports view. (Robust internal implementation added)
- [x] **CSV Import/Export**: Robust bulk import with auto-mapping (Zerodha) and manual mapping for custom files. (Fully implemented with multi-step wizard and validation)
- [x] **Search**: Global search bar to find specific assets across types. (UI & localized logic implemented)

## 🟡 Phase 3: Analytics & Financial Logic
- [x] **Historical Line Charts**: Visualize Net Worth trends via historical snapshot logic.
- [x] **Tax Tracker**: Dedicated logic for 80C/80CCD investment tracking and remaining limit alerts.
- [x] **Asset Drill-down**: Clickable segments supported by categorized concentration data.
- [x] **Performance Metrics**: Implemented CAGR calculations per asset in the service layer.
- [x] **Risk Analytics**: Concentration risk analysis implemented to detect over-exposure.
- [x] **Dividend & Interest Tracker**: Infrastructure added for passive income tracking.
- [x] **Tax-Loss Harvesting**: Logic to identify capital loss opportunities for tax offset.
- [x] **Goal Progress**: Backend support for tracking progress against financial targets.

## 🔴 Phase 4: Advanced Integrations
- [ ] **Export Engine**: "Download as PDF" for monthly portfolio summaries.
- [ ] **User Settings**: Currency preferences (INR/USD) and profile management.
- [ ] **Market News Feed**: Integrated news component based on portfolio symbols.
- [ ] **Watchlist**: Current portfolio ke bahar stocks track karne ke liye custom list.
- [ ] **Broker Auto-Sync**: Integration with external APIs or email scraping to auto-fetch transactions.
- [ ] **PWA Support**: Transform the web app into a Progressive Web App for an "App-like" experience on mobile.

### 💹 Market Data Service Enhancements
- [x] **Real-time API Integration**: Integrated Alpha Vantage (Stocks) and MFAPI (Mutual Funds).

---

## 🔧 Issue: Live Stock Price & Profit/Loss Showing 0

### Root Cause Analysis

After analyzing the codebase, following issues have been identified:

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **API Key Not Configured** | `MarketDataService.java` | Alpha Vantage API key is not set, so live prices can't be fetched |
| 2 | **Initial currentPrice = buyPrice** | `PortfolioService.java:75` | When investment is added, currentPrice defaults to buyPrice (no live update) |
| 3 | **Scheduled Sync Not Triggered** | `MarketDataService.java:41` | `@Scheduled(cron = "0 0 1 * * *")` runs at 1 AM - may not have run yet |
| 4 | **Cache Returns Stale Data** | `PortfolioController.java:148` | `@Cacheable` on networth returns cached (0) values even after price update |
| 5 | **Manual Sync Available** | `MarketDataService.java:68` | `/market/sync` endpoint exists but needs to be called manually |

### Data Flow Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Alpha Vantage  │────▶│  Market Data    │────▶│   Portfolio     │
│  / MFAPI        │     │  Service        │     │   Service       │
│  (External API) │     │  (Price Fetch)  │     │  (Price Update) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Investment DB  │
                                               │ (current_price) │
                                               └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │  Net Worth      │
                                               │  Calculation    │
                                               │ (P&L = 0 initially)
                                               └─────────────────┘
```

### Fix Plan

#### ✅ Step 1: Configure Alpha Vantage API Key
```bash
# Add to .env file
MARKET_API_KEY=your_alpha_vantage_api_key

# Get free API key from: https://www.alphavantage.co/support/#api-key
```

#### ✅ Step 2: Trigger Manual Price Sync
```http
POST /api/market/sync?force=true
Authorization: Bearer <token>
```

#### ✅ Step 3: Clear Cache After Price Update
The cache eviction is already configured but needs verification:
- `@CacheEvict(value = {"netWorth", "portfolioList", "portfolioByType"}, allEntries = true)` in `PortfolioService.java:271`

#### ✅ Step 4: Verify Database Values
Check if `current_price` column in `investments` table has been updated:
```sql
SELECT symbol, buy_price, current_price, units, 
       (current_price - buy_price) * units as pnl 
FROM investments;
```

### Code Changes Required

#### 1. Add API Key Validation
```java
// MarketDataService.java - Already implemented but needs proper env setup
if (apiKey == null || apiKey.isBlank() || "your_market_api_key".equals(apiKey)) {
    log.error("CRITICAL: Alpha Vantage API Key is NOT configured correctly...");
}
```

#### 2. Ensure Cache Eviction Works
```java
// PortfolioService.java:271 - Already configured
@Transactional
@CacheEvict(value = {"netWorth", "portfolioList", "portfolioByType"}, allEntries = true)
public int updateCurrentPrices(String symbol, BigDecimal currentPrice) {
    // This should work - verify it's being called
}
```

#### 3. Add Manual Sync Trigger from Frontend (Optional Enhancement)
- Add "Refresh Prices" button on Dashboard
- Call `/api/market/sync?force=true` when clicked

### Testing Steps

1. **Verify API Key**:
   ```bash
   curl "https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=TCS&apikey=YOUR_KEY"
   ```

2. **Check Current Prices in DB**:
   ```bash
   # Connect to PostgreSQL
   docker exec -it fincz-track-postgres-1 psql -U postgres -d fincz_portfolio
   SELECT symbol, buy_price, current_price FROM investments LIMIT 5;
   ```

3. **Trigger Manual Sync**:
   ```bash
   curl -X POST "http://localhost:8084/api/market/sync?force=true" \
        -H "Authorization: Bearer <token>"
   ```

4. **Check Net Worth Again**:
   ```bash
   curl -H "X-User-Email: user@example.com" \
        "http://localhost:8084/api/portfolio/networth"
   ```

### Expected Result After Fix

| Field | Before | After |
|-------|--------|-------|
| currentPrice | ₹150 (same as buyPrice) | ₹165 (live from API) |
| currentValue | ₹15,000 | ₹16,500 |
| P&L | ₹0 | ₹1,500 (+10%) |
| Net Worth | ₹1,50,000 | ₹1,65,000 |

---

### 📋 Additional Enhancements Pending

- [ ] **Export Engine**: "Download as PDF" for monthly portfolio summaries.
- [ ] **User Settings**: Currency preferences (INR/USD) and profile management.
- [ ] **Market News Feed**: Integrated news component based on portfolio symbols.
- [ ] **Watchlist**: Current portfolio ke bahar stocks track karne ke liye custom list.
- [ ] **Broker Auto-Sync**: Integration with external APIs or email scraping to auto-fetch transactions.
- [ ] **PWA Support**: Transform the web app into a Progressive Web App for an "App-like" experience on mobile.
- [ ] **API Rate Limit Handling**: Implement concurrency limits for Alpha Vantage (5 calls/min limit) to prevent 429 errors during bulk refreshes.
- [ ] **FX & Multi-Currency**: Implement an exchange rate service to support global assets (USD/INR/EUR).
- [ ] **Historical Price Engine**: Fetch and store End-of-Day (EOD) historical prices in a time-series database for trend analysis.
- [ ] **Resilience Patterns**: Implement Resilience4j circuit breakers and rate limiting for external financial API calls.
- [ ] **Async Refactoring**: Remove `.block()` calls from `MarketDataService` to ensure a fully non-blocking I/O stack.
- [ ] **WebSocket Price Pushes**: Stream live price updates directly to the frontend during market hours.

## 🟣 Phase 5: Wealth Management & Intelligence (Advanced)
- [ ] **Automated Rebalancing**: Alert user when asset allocation deviates >5% from target.
- [ ] **SIP Forecaster**: Visualize portfolio value projections based on current SIPs and expected ROI.
- [ ] **Family Accounts**: Support for managing multiple family member portfolios under one login.
- [ ] **AI Portfolio Health Check**: LLM-based insights (e.g., "Your portfolio is heavy on Small-caps; consider blue-chip stability").
- [ ] **Corporate Actions Tracker**: Automatic tracking of dividends, stock splits, and bonuses.

## 🏗️ Phase 6: Modern Architecture Overhaul
- [ ] **BFF Layer**: Implement a Backend-for-Frontend using GraphQL to aggregate data from multiple services in one request.
- [ ] **Real-time Engine**: Move from Polling to WebSockets/SSE for live P&L updates.
- [ ] **Distributed Caching**: Use Redis to store computed net-worth snapshots for instant dashboard loading.
- [ ] **Audit Logging**: Track every change in investment data for regulatory compliance and user transparency.
- [ ] **Multi-Tenancy**: Architecture support for "Group/Family" views without data leakage.

## ⚙️ Proposed Tech Stack Updates
| Library | Modern Alternative / Addition | Purpose |
|---------|-------------------------------|---------|
| **TanStack Query** | Essential | Server-state management, caching, and auto-refetching. |
| **Shadcn/ui** | Highly Recommended | Built on Radix UI. Provides accessible Data Tables, Modals, and Forms. |
| **React Hook Form** | Essential | High-performance form handling without re-renders. |
| **Zod** | Essential | Full type-safety from API to Form. |
| **qrcode.react** | Essential | Local TOTP QR code generation for MFA security. |
| **Lucide React** | Current | Keep for consistent, lightweight iconography. |
| **Framer Motion** | Recommended | For "Fintech-grade" smooth transitions and micro-interactions. |
| **Day.js / date-fns** | New | Financial apps need heavy date manipulation (FY calculations, SIP dates). |

## 📈 Success Metrics
- **Performance**: Page load under 1.5s for the Dashboard.
- **Engagement**: Users can add an investment in under 30 seconds.
- **Accuracy**: Portfolio valuation matches real-time market data within 1% margin.

---

## 📊 Frontend Integration Plan: New Market Metrics

**Objective:** Dashboard aur ReportsPage mein naye metrics (`marketCap`, `pe`, `eps`, `high52`, `low52`, `exchange`, `type`) ko display karna.

### Phase 1: Backend DTO & Mapping (DONE)
- [x] `PortfolioResponse` update with new fields. (Completed)
- [x] `PortfolioService.mapToResponse` logic verification. (Completed)

### Phase 2: Dashboard Integration
 [x] **Data Access**: Ensure `getPortfolio()` data includes new fields.
 [x] **UI Updates**:
    - [x] Add `currentPrice`, `P&L`, and `P&L %` columns to "Your Portfolio" table.
    - [ ] Create expandable details or tooltips for secondary metrics (`P/E`, `EPS`, `52W High/Low`, `Market Cap`, `Exchange`).
- [ ] **Formatting**: Use `toLocaleString("en-IN")` for values.

### Phase 3: Reports Page Integration
 [x] **Advanced Table**: Add columns for all new metrics (Live Price, P/E).
- [ ] **Interactivity**: Enable sorting/filtering on these columns using the internal pagination/sorting logic.
- [ ] **Asset Drill-down**: Update the drill-down modal to show detailed market stats.

### Phase 4: Financial Logic & Accuracy
- [ ] **Validation**: Gracefully handle `null` or `N/A` values for metrics.
- [ ] **Consistency**: Ensure units/currency symbols are consistent across all views.

### 📤 Phase 5: Market Data Sync Tooling (New)
- [x] **Registry Export**: Add CSV download for distinct assets (Ticker, Type, Exchange). (Backend Fix Applied)
- [ ] **Sync Instructions**: Add info modal on how to update the Google Sheet for MarketDataService.

---
**Status**: Drafted | **Date**: April 2026
# 🚀 Fincz Track - Frontend Enhancement Plan

This document outlines the strategic roadmap, completed milestones, and future enhancements for the Fincz Track frontend. It serves as a guide for new and existing developers to understand the project's trajectory.

---

## ✅ Completed Phases

### Phase 1: Foundation, UI/UX & Profile Management
- [x] **Dark Mode & Theming**: Tailwind CSS dark mode support with a persistent context toggle.
- [x] **Notifications & Animations**: Integrated `sonner` for toasts and `Framer Motion` for smooth UI transitions.
- [x] **Profile & Security**: Comprehensive settings page, Multi-Factor Authentication (MFA), avatar uploads with compression, and session management.
- [x] **Data Storytelling**: Contextual "Insights" cards on the Dashboard based on portfolio health.

### Phase 2: Portfolio Data Control
- [x] **CRUD Operations**: Add, Edit, and Delete functionality for diverse investment types.
- [x] **Bulk Import**: CSV import wizard with auto-mapping for brokers (e.g., Zerodha) and manual mapping capabilities.
- [x] **Advanced Search & Filter**: Global debounced search bar and sortable/paginated internal tables.

### Phase 3: Analytics & Financial Logic
- [x] **Tax Tracking**: Visual tracking for 80C and 80CCD limits.
- [x] **Risk & Performance**: Concentration risk pie charts, CAGR calculations, and historical Net Worth trends.
- [x] **Tax-Loss Harvesting**: Logic to identify capital loss opportunities to offset gains.
- [x] **Real-time Market Sync**: Integrated external APIs (Alpha Vantage, MFAPI) for live asset pricing.

---

## ⏳ Active Phase

### 🔴 Phase 4: Advanced Integrations
- [x] **Dynamic Currency**: Honor user currency preferences (INR/USD/EUR/GBP) across the app instead of hardcoded symbols.
- [x] **Advanced Market Metrics**: Display Market Cap, P/E, EPS, 52W High/Low safely handling `null` or `N/A` scenarios.
- [ ] **Export Engine**: Implement "Download as PDF" (via `jspdf` / `html2canvas`) for monthly portfolio summaries.
- [ ] **Watchlist**: Track external stocks and assets without adding them to the portfolio.
- [ ] **Market News Feed**: Contextual news component querying APIs based on the user's active portfolio symbols.
- [ ] **PWA Support**: Transform the web app into a Progressive Web App for offline capabilities and mobile-app feel.

---

## 📅 Future Phases

### 🟣 Phase 5: Wealth Management & Intelligence
- [ ] **Automated Rebalancing**: Visual alerts when asset allocation deviates >5% from the user's target.
- [ ] **SIP Forecaster**: Projection charts modeling future net worth based on current SIPs and expected ROI.
- [ ] **Family Accounts**: Master dashboard to manage multiple family member portfolios under a single login scope.
- [ ] **AI Portfolio Health Check**: LLM-based insights (e.g., *"Your portfolio is heavily weighted in IT; consider diversification"*).
- [ ] **Corporate Actions Tracker**: Visual timeline tracking stock splits, bonuses, and dividend yields.

### 🏗️ Phase 6: Modern Architecture Overhaul
- [ ] **BFF Layer**: Implement a Backend-for-Frontend (GraphQL) to aggregate fragmented microservice data into single, efficient queries.
- [ ] **Real-time Engine**: Upgrade from polling to WebSockets/SSE for live market P&L updates.
- [ ] **Distributed Caching**: Redis integration for sub-100ms dashboard loads.
- [ ] **Audit Logging**: Immutable action history for regulatory compliance and security transparency.

---

## ⚙️ Planned Tech Stack & Library Updates

As the application scales, the following libraries are evaluated for inclusion or replacement:

| Library / Tool | Priority | Purpose |
|----------------|----------|---------|
| **TanStack Query** | High | Migrate from standard `useEffect` to manage server-state, caching, and auto-refetching. |
| **Shadcn/ui** | Medium | Incrementally replace raw Tailwind components with accessible Radix UI primitives. |
| **React Hook Form** | Medium | Optimize the `<AddInvestment />` form to prevent unnecessary re-renders. |
| **Zod** | Medium | Schema validation to enforce strict type-safety from API responses to form inputs. |
| **jspdf & html2canvas** | High | Required for the Phase 4 PDF Export engine. |
| **date-fns** | Low | Lightweight alternative to native `Date` for heavy financial FY calculations. |

---

## 📈 Core Success Metrics

1. **Performance**: Initial Dashboard load (including charts) must remain under `< 1.5s`.
2. **Engagement**: A user should be able to manually add an investment in under `< 30 seconds`.
3. **Accuracy**: Portfolio live valuation must match external market data strictly without floating-point anomalies.
- [ ] **Historical Price Engine**: Fetch and store End-of-Day (EOD) historical prices in a time-series database for trend analysis.
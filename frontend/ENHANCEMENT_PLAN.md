# 🚀 Frontend Enhancement Plan - Fincz Track

## 🟢 Phase 1: UI/UX Refinement & Profile Management
- [ ] **Design System Setup**: Integrate `Shadcn/ui` (Radix UI + Tailwind) for accessible, premium-feel components.
- [x] **Skeleton Loaders**: Implement placeholder loading states for Dashboard cards and Charts. (Foundational component created)
- [ ] **Interactive Toasts**: Integrate `sonner` for non-blocking action feedback.
- [x] **Dark Mode**: Add Tailwind CSS dark mode support with a persistent toggle. (ThemeContext implemented)
- [x] **Responsive Refinement**: Optimize the "Add Investment" form for one-handed mobile usage. (Modern layout + accessibility)
- [x] **Micro-animations**: Use `Framer Motion` for smooth transitions between dashboard states. (Applied to Profile & Forms)
- [ ] **Data Storytelling**: Add "Insights" cards (e.g., "Your gold holdings are up 5%, hedging your equity dip").

### 👤 User Profile & Security (New)
- [x] **Profile Settings Page**: Ek dedicated page jahan user apni details dekh sake. (Initial UI shell created)
- [x] **Contact Management**: Email aur Mobile number update/change karne ka option.
- [ ] **Password Management**:
    - **Change Password**: Logged-in user ke liye purana password verify karke naya set karna.
    - [x] **Forgot Password**: Unauthenticated user ke liye email-based reset link flow. (Page implemented)
- [x] **Avatar Support**: User ke naam ke initials dikhana.
- [x] **Multi-Factor Authentication (MFA)**: Security badhane ke liye TOTP setup UI. (Modal flow implemented)
- [x] **Account Deletion**: User privacy ke liye account permanently delete confirmation option. (UI logic implemented)
- [x] **Session Management**: Dekhna ki user kahan-kahan logged in hai aur "Logout from all devices" ka option.
- [x] **User Preferences**: Default currency (INR/USD) aur locale settings.

## 🔵 Phase 2: Portfolio Features (Data Control)
- [ ] **CRUD Extensions**: Add "Edit" and "Delete" functionality to the investment list.
- [ ] **Asset Tagging**: Investments ko categories mein group karna (e.g., "Retirement", "Emergency Fund", "House").
- [ ] **Advanced Tables**: Implement `TanStack Table` for sorting, filtering, and pagination in the Reports view.
- [ ] **CSV Import/Export**: Build a utility to bulk upload transactions from broker exports.
- [ ] **Search**: Global search bar to find specific assets across types.

## 🟡 Phase 3: Analytics & Financial Logic
- [ ] **Historical Line Charts**: Visualize Net Worth trends (Daily/Monthly/Yearly).
- [ ] **Tax Tracker**: Dedicated page for 80C/80CCD investment tracking and limit alerts.
- [ ] **Asset Drill-down**: Clickable pie chart segments to filter detailed asset lists.
- [ ] **Performance Metrics**: Added "XIRR" and "CAGR" calculations per asset.
- [ ] **Risk Analytics**: Portfolio volatility (Beta) and Concentration risk analysis (e.g., "You are 40% exposed to HDFC").
- [ ] **Dividend & Interest Tracker**: Passive income track karne ke liye dashboard (stocks/bonds).
- [ ] **Tax-Loss Harvesting**: Highlight stocks that can be sold to offset capital gains and save tax.
- [ ] **Goal Progress**: User-defined goals ke liye tracking (e.g., "80% of House Downpayment target reached").

## 🔴 Phase 4: Advanced Integrations
- [ ] **WebSockets**: Real-time price updates for active market hours.
- [ ] **Export Engine**: "Download as PDF" for monthly portfolio summaries.
- [ ] **User Settings**: Currency preferences (INR/USD) and profile management.
- [ ] **Market News Feed**: Integrated news component based on portfolio symbols.
- [ ] **Watchlist**: Current portfolio ke bahar stocks track karne ke liye custom list.
- [ ] **Broker Auto-Sync**: Integration with external APIs or email scraping to auto-fetch transactions.
- [ ] **PWA Support**: Transform the web app into a Progressive Web App for an "App-like" experience on mobile.

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
| **Lucide React** | Current | Keep for consistent, lightweight iconography. |
| **Framer Motion** | Recommended | For "Fintech-grade" smooth transitions and micro-interactions. |
| **Day.js / date-fns** | New | Financial apps need heavy date manipulation (FY calculations, SIP dates). |

## 📈 Success Metrics
- **Performance**: Page load under 1.5s for the Dashboard.
- **Engagement**: Users can add an investment in under 30 seconds.
- **Accuracy**: Portfolio valuation matches real-time market data within 1% margin.

---
**Status**: Drafted | **Date**: April 2026
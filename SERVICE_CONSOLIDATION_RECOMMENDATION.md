# Recommendation: Consolidating Auth and User Services

## 1. Current State Analysis
The system currently splits "Identity & Security" (`auth-service`) from "User Metadata" (`user-service`). While this follows a strict microservices pattern, it has introduced several anti-patterns:

*   **Circular Dependencies:** `auth-service` calls `user-service` to create a profile, while `user-service` calls `auth-service` to fetch MFA status for the UI.
*   **Data Fragmentation:** The "User" is split across two databases (`auth_db` and `user_db`). This makes atomic operations (like deleting a user or creating a user with a guaranteed profile) impossible without complex distributed transactions (Sagas).
*   **Logic Duplication:** Email normalization, validation rules, and lookup logic are repeated in both services.
*   **Performance Overhead:** Fetching a profile (`/users/me`) requires an internal REST call over the network to get MFA status, increasing latency and failure points.

## 2. Recommendation: Merge into an "Identity-Service"
I recommend merging both services into a single **`user-service`** (or `account-service`).

### Benefits of Consolidation
1.  **Atomic Transactions:** You can create the user credentials and the profile in a single database transaction. If one fails, the whole operation rolls back.
2.  **Source of Truth:** All user-related data (MFA status, password, avatar, currency) lives in one table or one database schema.
3.  **Simplified Security:** You only need to configure Spring Security and JWT filters in one place.
4.  **Reduced Infrastructure:** One less JVM to run, lower memory usage, and fewer ports to manage.

### When would you keep them separate?
Only keep them separate if you plan to:
*   Use an external Identity Provider (like Keycloak, Auth0, or Okta).
*   Scale the Login flow to millions of requests per second while the Profile flow remains low-traffic.

## 3. Proposed Unified Schema
Instead of two databases, use one `user_db` with a unified table:

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    -- Profile Fields
    phone VARCHAR(20),
    currency VARCHAR(10) DEFAULT 'INR',
    avatar_url VARCHAR(255),
    -- Security Fields
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    -- Metadata
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

## 4. Implementation Roadmap
1.  **Phase 1:** Move all `auth-service` logic (Controllers, Services, Security Config) into the `user-service` project.
2.  **Phase 2:** Update the `user-service` DTOs to include authentication fields.
3.  **Phase 3:** Point the API Gateway (`8080`) to send all `/api/auth/**` and `/api/users/**` requests to the single service.
4.  **Phase 4:** Decommission the standalone `auth-service`.

## 5. Conclusion
Consolidating these services will resolve the **MFA status sync issue** permanently because the service will have direct access to the database field without needing a Feign client. It will significantly clean up your code and make the system easier to debug and extend.

## 6. Additional Analysis

### Strengths of This Recommendation
- **Circular dependency problem is real and critical.** When two services depend on each other, you've broken the fundamental microservices contract. This typically gets worse over time.
- **Data fragmentation is a legitimate pain point.** Splitting "user" across two databases makes atomic operations difficult and increases consistency risks.
- **Clean consolidated schema.** The proposed unified table properly normalizes the data and eliminates duplication.
- **Pragmatic phased roadmap.** The 4-phase approach is realistic and allows for incremental implementation.

### Points to Consider

1. **External Identity Providers:** The document mentions IdP separation in passing, but for a production fintech app, you *might* want separation if you plan to:
   - Delegate authentication to an external HSM or dedicated security service
   - Comply with strict security audits (separating identity from business logic is a common requirement)
   - Support social login, SAML, or OAuth federation (easier to add to a dedicated auth service)

2. **Data Migration Complexity:** Phase 1-3 covers the code roadmap, but actual data consolidation (migrating auth tables → users table, syncing state) could be tricky. For a live system, you'll need a **zero-downtime migration strategy**—consider:
   - Dual-write phase (both services write to both databases)
   - Cutover point with careful data validation
   - Rollback plan if issues arise

3. **API Backward Compatibility:** Existing clients may call `/api/auth/**` and `/api/users/**` separately. The API Gateway can route both endpoints to the unified service, but this should be explicitly documented in the implementation plan.

4. **Notification Service Dependencies:** Does `notification-service` depend on either `auth-service` or `user-service`? If so, consolidation simplifies those internal service calls too.

### Recommendation
**Proceed with consolidation** if this is a prototype or early-stage system. The circular dependency is a red flag that compounds over time. 

If the system is **already in production** with stable external clients, the Phase 1-3 approach is still sound—implement it gradually with careful data migration to avoid disrupting live users.

---
**Status:** Recommended for Implementation
**Author:** Gemini Code Assist
**Date:** April 2026
**Review:** GitHub Copilot Analysis
**Review Date:** April 15, 2026
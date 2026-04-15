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

---
**Status:** Recommended for Implementation
**Author:** Gemini Code Assist
**Date:** April 2026
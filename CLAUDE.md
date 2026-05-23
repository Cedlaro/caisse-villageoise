# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.


## 1. Project Overview
We are developing a secure, production-ready web application for a Credit Union. The application serves two primary user types: 
- **Staff/Admins (Internal Users):** Employees who manage credit union configurations, audit system logs, review credit scores, and approve loans.
- **Members (External Customers):** The credit union members who own savings accounts, apply for financing, track balances, and manage personal nominees. 

The system must handle five core domains:
1. **Authentication & Session Management:** Split multi-table authentication for staff vs. members, utilizing modern functional route guards and secure JWT payloads. 
2. **Member Management:** Registration, KYC/profile status, and admin dashboards.
3. **Savings Accounts:** One account per member (Share Account), tracking balance and transaction history.
4. **Loan Management:** Loan application workflow (Applied, Under Review, Approved, Active, Defaulted, Paid), amortization schedules, and repayment tracking.
5. **Beneficiaries:** Managing linked individuals entitled to account percentages, with strict validation ensuring total allocation does not exceed 100%.


## 2. Technical Stack & Constraints
To ensure architectural consistency, adhere strictly to the following technical definitions:

### Frontend: Angular 21
- **Architecture:** 100% Standalone Components. No `NgModule` files.
- **State Management:** Use Angular **Signals** (`signal`, `computed`, `effect`) for reactive local state (e.g., maintaining `currentUser` session state across the app).
- **Routing & Guards:** Component-level lazy loading using `loadComponent`. Protect private dashboards using modern functional router guards (`canActivate` functions).
- **Control Flow:** Use modern syntax exclusively (`@if`, `@for`, `@switch`).
- **Styling:** Tailwind CSS for a clean, professional financial UI.
- **HTTP Interceptors:** Functional interceptors to automatically append JWT tokens to the `Authorization` header and globally intercept 401 unauthenticated errors to force logouts.

### Backend: Node.js (Express) with TypeScript
- **Architecture:** Controller-Service-Repository pattern. Clear separation of routing, business logic, and database queries.
- **Security:** JWT-based authentication (HttpOnly cookies or secure headers), `bcrypt` for heavy password hashing, and rate-limiting middleware to protect auth endpoints against brute-force attacks.
- **Validation:** Strict request body validation using `express-validator` before hitting authentication and business logic controllers.

### Database: MySQL
- **ORM/Driver:** mysql2
- **Data Integrity:** Strict foreign keys, indexing on critical lookups (`member_number`, `employee_id`, `email`), and forced ACID transactional compliance for financial ledger balances.
- **Design Constraints:** Strict foreign keys, transactional integrity, and explicit financial types (`DECIMAL(15,2)` for currency).

## 4. Database Schema Blueprint

Ensure all written queries, repository models, and migrations align with this baseline schema:

*   **staff_users:** `id`, `employee_id` (unique), `email` (unique), `first_name`, `last_name`, `password_hash`, `role` ('staff', 'admin'), `status` ('active', 'suspended'), `failed_login_attempts`, `lockout_until`, `last_login_at`, `created_at`.
*   **members:** `id`, `member_number` (unique), `email` (unique), `first_name`, `last_name`, `address`, `dob`, `phone`, `password_hash`, `status` ('pending_kyc', 'active', 'suspended'), `failed_login_attempts`, `lockout_until`, `last_login_at`, `created_at`.ob
*   **savings_accounts:** `id`, `member_id` (FK to members), `account_number` (unique), `account_type` ('share_capital', 'regular', 'fixed'), `balance` (DECIMAL), `created_at`.
*   **transactions:** `id`, `account_id` (FK to savings_accounts), `transaction_type` ('deposit', 'withdrawal', 'transfer', 'loan_repayment'), `amount` (DECIMAL), `reference_id` (unique code), `processed_by_staff_id` (Nullable FK to staff_users, used if manual teller deposit), `created_at` (Must execute within native DB transactions).
*   **loans:** `id`, `member_id` (FK to members), `loan_amount` (DECIMAL), `interest_rate` (DECIMAL), `term_months` (INT), `status` ('applied', 'under_review', 'approved', 'active', 'defaulted', 'paid'), `remaining_balance` (DECIMAL), `reviewed_by_staff_id` (Nullable FK to staff_users), `created_at`.
*   **beneficiaries:** `id`, `member_id` (FK to members), `full_name`, `relationship`, `percentage` (INT, cumulative sum per member_id must equal exactly 100), `created_at`.


## 5. Core Feature Specs: Login & Authentication Workflow
When designing the authentication flow, ensure the following architecture is built:

### The Frontend Login Page
- A polished, modern login interface built using Tailwind CSS (split-panel view).
- Reactive Form validation for email inputs and password strength visibility toggles.
- Proper handling of UI states (loading spinners during API requests, dynamic error banners for "Invalid Credentials" or "Account Suspended").
- Successful login must store user permissions in an `AuthSignal` and seamlessly route the user to `/dashboard/member` or `/dashboard/admin` depending on their role.

### The Backend Authentication Endpoint
- **Route:** `POST /api/v1/auth/login`
- **Inputs:** `email` or `member_number`, and `password`.
- **Process:** Verify user existence -> Check if account status is `Active` -> Compare hashes using `bcrypt.compare` -> Issue a signed JWT payload containing `userId`, `memberNumber`, and `role`.

### API Authentication Hooks
- **Member Endpoint:** `POST /api/v1/auth/member/login`
  - **Payload:** `{ "member_number_or_email": "string", "password": "string" }`
  - **Context:** Queries the `members` table. Issues a token with claim `{ role: 'member' }`.
- **Staff Endpoint:** `POST /api/v1/auth/staff/login`
  - **Payload:** `{ "employee_id_or_email": "string", "password": "string" }`
  - **Context:** Queries the `staff_users` table. Issues a token with claims `{ role: 'staff' | 'admin' }`.


## 6. Schema Extensions (Authentication Focus)
Ensure the `users` table handles authentication vectors safely:
*   **users:** `id`, `member_number` (unique), `email` (unique), `password_hash` (VARCHAR 255), `role` ('member', 'staff', 'admin'), `status` ('pending', 'active', 'suspended'), `failed_login_attempts` (INT), `lockout_until` (DATETIME), `last_login_at` (DATETIME).


## 7. Coding Guardrails
1. **No Placeholders:** Avoid omitting critical logic (like JWT validation steps or form tracking) with `// TODO: add logic`.
2. **Role Safety:** Prevent horizontal privilege escalation; an authenticated member must never be able to manipulate router URLs to access admin paths.


## Commands

```bash
npm start          # Dev server at http://localhost:4200
npm run build      # Production build
npm run watch      # Development build with watch mode
npm test           # Run unit tests with Vitest
```

## Architecture

**Entry points:**
- `src/main.ts` — bootstraps with `bootstrapApplication()`
- `src/app/app.config.ts` — global providers (`provideRouter`, `provideBrowserGlobalErrorListeners`)
- `src/app/app.routes.ts` — route definitions

**Component conventions:**
- All components use Angular standalone pattern (no NgModules)
- Files are named without `.component` suffix (e.g., `app.ts`, `app.html`, `app.css`)
- State is managed via Angular Signals

**Testing:**
- Runner: Vitest (not Jasmine/Karma) — config in `tsconfig.spec.json`
- Tests use Angular `TestBed` from `@angular/core/testing`
- Test files: `*.spec.ts` alongside the file under test

## Key Constraints

- TypeScript strict mode is enabled — all types must be explicit
- Build budgets: 500kB initial bundle warning, 1MB error; 4kB per component style limit
- Code formatting: Prettier (run before committing)

# Khata Production Readiness Plan

## Executive summary

Khata has a sensible foundation for a small production application:

```text
React/Vite frontend
        |
        v
Express API + Clerk session authentication
        |
        v
PostgreSQL through Drizzle ORM
```

The pnpm monorepo is appropriate for this structure. The application is **not
ready for public production traffic yet**, however. The highest-risk gaps are:

1. Credentialed CORS is currently permissive.
2. Write endpoints do not validate request bodies.
3. Receipt ownership is not fully checked and receipt images are stored as
   base64 text in PostgreSQL.
4. Database changes are managed with schema push rather than versioned
   migrations.
5. There are no meaningful automated API, authorization, or browser tests.
6. Runtime health and operational monitoring are minimal.

This document is an implementation plan, not a recommendation to rewrite the
application. The existing React, Express, Drizzle, Clerk, and pnpm workspace
structure should be retained.

## Target production architecture

Keep the current high-level architecture, with these production safeguards:

```text
Browser
  |
  | Same-origin HTTPS requests and Clerk session cookies
  v
Khata web artifact
  |
  | /api, with strict origin policy and request limits
  v
API server
  |-- Clerk middleware and authorization
  |-- Zod request validation
  |-- centralized errors and structured logs
  |-- readiness checks
  v
PostgreSQL
  |
  | metadata only for uploaded files
  v
Object storage for receipt images
```

For the first production release, same-origin hosting is preferred: serve the
frontend and API behind the same public domain and proxy `/api` to the API
service. This minimizes CORS and cookie complexity. A split frontend/API
deployment can be supported later with explicit trusted origins.

## Priority levels

- **P0 — Launch blocker:** security, data-loss, or severe reliability risk.
- **P1 — Required before public launch:** important production control that
  should be completed before inviting real users.
- **P2 — Early post-launch:** valuable scalability, observability, or
  maintainability improvement.
- **P3 — Later optimization:** useful, but not required for the first safe
  release.

## Problem and solution register

### P0-1: Credentialed CORS accepts arbitrary origins

**Current problem**

`artifacts/api-server/src/app.ts` uses:

```ts
cors({ credentials: true, origin: true })
```

The frontend sends requests with credentials enabled. Reflecting arbitrary
origins while allowing credentials creates an unsafe cross-origin session
boundary for a cookie-authenticated API.

**Best fix**

Use same-origin deployment and disable cross-origin access by default. If a
split deployment is required, allow only an explicit list of HTTPS origins.
Never use `origin: true` in production.

**Implementation**

1. Add a validated `APP_ORIGINS` environment variable, represented as a
   comma-separated list.
2. In `artifacts/api-server/src/app.ts`, configure a CORS callback that
   accepts only those origins.
3. Use a development-only localhost allowlist; do not reuse it in production.
4. Add an automated test for allowed and rejected origins.
5. Document the production origin in the deployment configuration.

**Done when**

- An unknown origin receives no permissive CORS headers.
- The configured frontend origin can make authenticated API requests.
- The production configuration fails closed if the allowlist is missing.

**Files**

- `artifacts/api-server/src/app.ts`
- New `artifacts/api-server/src/lib/config.ts`
- New API security tests
- `replit.md` and deployment documentation

### P0-2: Cookie-authenticated writes need an explicit CSRF strategy

**Current problem**

The API uses browser session cookies and exposes `PUT`, `POST`, and `DELETE`
routes. CORS restriction is necessary but should not be the only protection
against cross-site write requests.

**Best fix**

Use a same-origin deployment with a deliberate CSRF policy:

- enforce `Origin`/`Referer` checks for state-changing requests, and
- use a CSRF token if the deployment topology or cookie policy requires it.

Do not add bearer tokens to the web client; Clerk's browser session remains
cookie-based.

**Implementation**

1. Add middleware before `/api` routes for state-changing methods.
2. Accept requests only when the `Origin` matches the configured application
   origin; allow no-origin requests only according to a documented policy for
   trusted non-browser clients.
3. Confirm Clerk cookie `SameSite`, `Secure`, and HTTPS behavior in preview and
   production.
4. Add tests covering same-origin writes and cross-origin rejection.

**Done when**

- Cross-site form/fetch attempts cannot mutate settings, records, or receipts.
- Authenticated browser requests continue to work after refresh and sign-in.

**Files**

- `artifacts/api-server/src/app.ts`
- New `artifacts/api-server/src/middlewares/csrf.ts`
- New security integration tests

### P0-3: Write endpoints accept unvalidated JSON

**Current problem**

`settings.ts`, `records.ts`, and `receipts.ts` destructure `req.body` and write
values directly to the database. Malformed nested JSON, invalid numbers,
unsupported statuses, invalid month keys, and oversized data can reach the
database or cause runtime failures.

**Best fix**

Define Zod schemas at the API boundary and validate every path parameter,
query parameter, and request body before database access. Keep schemas in a
shared package where the frontend and API need the same contract.

**Implementation**

1. Add schemas for:
   - settings create/update
   - split ratios
   - bill/payment entries
   - monthly record create/update
   - receipt upload metadata
   - UUID, `YYYY-MM`, and year route parameters
2. Constrain strings by length.
3. Constrain rents and amounts to finite, non-negative values with an
   intentional maximum.
4. Restrict `status` to the supported enum.
5. Validate the full JSONB record shape instead of accepting arbitrary objects.
6. Return a consistent `400` response containing safe field-level errors.
7. Keep server-owned fields (`userId`, IDs, timestamps) out of client input.

**Done when**

- Invalid input never reaches Drizzle.
- Valid input has one documented response shape.
- The API returns `400` for invalid input and does not expose stack traces.

**Files**

- `lib/api-zod/src/index.ts`
- `lib/api-zod/src/generated/api.ts` if the generated contract is updated
- `artifacts/api-server/src/routes/settings.ts`
- `artifacts/api-server/src/routes/records.ts`
- `artifacts/api-server/src/routes/receipts.ts`
- `artifacts/khata/src/lib/api.js`

### P0-4: Receipt routes do not verify parent-record ownership

**Current problem**

Receipt queries include `receipts.userId` and `receipts.recordId`, but the
receipt write route does not first verify that `recordId` belongs to the
authenticated user. The database has a foreign key to the record, but not a
composite ownership constraint. This also leaves a race condition in the
manual select-then-insert upsert.

**Best fix**

Make receipt ownership a database and service invariant:

1. Verify the parent monthly record belongs to the current user.
2. Add a unique constraint on `(user_id, record_id, field_ref)`.
3. Use a real database upsert (`INSERT ... ON CONFLICT DO UPDATE`).
4. Validate `fieldRef` against the supported entry paths.

**Done when**

- A user cannot attach, read, replace, or delete a receipt through another
  user's record ID.
- Concurrent uploads produce one receipt row.
- Unsupported field references are rejected.

**Files**

- `artifacts/api-server/src/routes/receipts.ts`
- `lib/db/src/schema/index.ts`
- New database migration
- Receipt authorization tests

### P1-1: Base64 receipt images are stored in PostgreSQL

**Current problem**

`receipts.imageData` stores full data URLs in a PostgreSQL text column.
`express.json` is globally configured with a 10 MB limit. This increases
database size, query payloads, memory usage, backup time, and API latency.

**Best fix**

Move binary receipt files to object storage and store only metadata in
PostgreSQL.

Recommended database fields:

- `objectKey`
- `contentType`
- `byteSize`
- `checksum` if needed
- `uploadedAt`

The API should return a controlled download endpoint or short-lived signed
URL, not the full image in ordinary record responses.

**Implementation**

1. Choose and connect Replit App Storage/object storage.
2. Add an upload endpoint with a narrow multipart or signed-upload flow.
3. Validate MIME type, decoded size, and image dimensions.
4. Upload the file under a user/record namespace.
5. Save metadata in PostgreSQL in the same logical operation.
6. Add cleanup for replaced and deleted receipts.
7. Migrate existing base64 data before removing the old column.
8. Reduce the global JSON body limit after the upload flow is separated.

**Done when**

- Record list/detail responses do not contain image bytes.
- Upload limits are enforced independently from ordinary API JSON limits.
- Deleting a receipt removes or safely schedules deletion of the stored object.

**Files**

- `lib/db/src/schema/index.ts`
- `artifacts/api-server/src/routes/receipts.ts`
- `artifacts/api-server/src/app.ts`
- `artifacts/khata/src/components/EntryField.jsx`
- `artifacts/khata/src/lib/api.js`
- New object-storage helper
- New migration and data migration script

### P1-2: Database changes are not versioned for production

**Current problem**

`lib/db/package.json` exposes `drizzle-kit push` and `push-force`, but there is
no checked-in migration directory or migration deployment step. Schema push is
not a controlled production rollout mechanism.

**Best fix**

Use versioned Drizzle SQL migrations for every schema change.

**Implementation**

1. Configure Drizzle Kit with a migrations output directory.
2. Generate an initial baseline migration from the existing development
   schema.
3. Review the baseline and all future SQL migrations.
4. Add `generate` and `migrate` scripts to `lib/db/package.json`.
5. Run migrations as an explicit deployment step before starting a compatible
   API version.
6. Test migrations against a fresh database and a copy of representative data.
7. Use expand/migrate/contract sequencing for breaking changes.
8. Remove `push-force` from normal production instructions.

**Done when**

- A new environment can be created from the repository and migrations alone.
- Deployments are repeatable and ordered.
- Rollback guidance exists for each production migration.

**Files**

- `lib/db/drizzle.config.ts`
- `lib/db/package.json`
- New `lib/db/migrations/` directory
- Deployment configuration and CI validation

### P1-3: Data model relies on unconstrained JSONB and strings

**Current problem**

Monthly record payloads are stored in JSONB, while `status` and `monthYear`
are free-form strings. The API currently relies on client behavior to keep
these shapes valid.

**Best fix**

Keep JSONB for the flexible ledger payload, but enforce its contract at the
API boundary and add database constraints for simple invariants.

**Implementation**

1. Validate JSONB with Zod before writes.
2. Add a database check constraint or equivalent validation for:
   - `month_year` format
   - supported record statuses
   - non-negative year/month values
3. Decide whether monetary values are stored as integer minor units or
   carefully handled numeric decimals. Document rounding rules.
4. Preserve snapshots as immutable historical values when a month is created.
5. Add indexes for common user/month queries.

**Done when**

- The same input rules apply from UI, API, and database.
- A malformed record cannot be inserted through a direct API request.
- Currency rounding behavior is documented and covered by tests.

**Files**

- `lib/db/src/schema/index.ts`
- `artifacts/api-server/src/routes/records.ts`
- `lib/api-zod/src/index.ts`
- New migration and calculation tests

### P1-4: User synchronization hides Clerk/database failures

**Current problem**

`requireAuth.ts` catches any Clerk lookup or database error and inserts a
minimal user stub. This can hide an actual database outage or Clerk failure and
then cause confusing downstream behavior.

**Best fix**

Separate expected “user profile is unavailable” behavior from infrastructure
failures:

1. Use an idempotent user upsert.
2. Log the failure with a request ID and user ID hash or safe identifier.
3. Return `503` for database/unavailable dependencies.
4. Return a clear, controlled error for Clerk profile failures.
5. Never convert an infrastructure failure into a successful authorization
   path silently.

**Done when**

- Dependency outages produce a detectable error and alert.
- Normal first-login provisioning remains idempotent.
- No sensitive Clerk token or profile data is logged.

**Files**

- `artifacts/api-server/src/middlewares/requireAuth.ts`
- `artifacts/api-server/src/lib/logger.ts`
- New dependency failure tests

### P1-5: No consistent error-handling boundary

**Current problem**

Routes independently catch errors and return generic `500` responses. There
is no central error middleware, error classification, or consistent request
correlation behavior.

**Best fix**

Add typed application errors and one final Express error handler.

**Implementation**

1. Add `AppError` categories for validation, authentication, authorization,
   not-found, conflict, dependency, and unexpected errors.
2. Use async route handling that forwards rejected promises to Express.
3. Add a final error middleware after all routes.
4. Return stable public error codes/messages.
5. Log stack traces only on the server, with request IDs.
6. Add a safe fallback for unexpected errors.

**Done when**

- Clients can handle errors using stable codes.
- Logs include request IDs and latency without cookies or secrets.
- Stack traces are never returned to clients.

**Files**

- New `artifacts/api-server/src/lib/errors.ts`
- New `artifacts/api-server/src/middlewares/errorHandler.ts`
- `artifacts/api-server/src/app.ts`
- All API route modules

### P1-6: No rate limiting or abuse controls

**Current problem**

Authentication-adjacent endpoints, JSON writes, and image operations do not
have explicit rate or concurrency limits.

**Best fix**

Add layered limits appropriate to the deployment:

- per-IP limit for unauthenticated endpoints
- per-user limit for authenticated writes
- stricter upload limits
- database pool/query timeouts
- request timeout and maximum URL/header sizes

Use a shared/distributed rate-limit store if more than one API instance will
run.

**Done when**

- Repeated requests are throttled with a `429`.
- Upload abuse cannot exhaust API memory or database connections.
- Limits are observable and configurable per environment.

**Files**

- `artifacts/api-server/src/app.ts`
- New rate-limit middleware
- Environment configuration
- Abuse-control tests

### P1-7: Required configuration is not validated as one unit

**Current problem**

The API validates `PORT`, and the database package validates
`DATABASE_URL`, but configuration is spread across modules. Missing Clerk,
origin, storage, or production settings may fail late or ambiguously.

**Best fix**

Create a startup configuration module using Zod. Validate required values once
and export typed configuration.

**Required configuration should include**

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `CLERK_PUBLISHABLE_KEY`
- trusted application origins
- object-storage settings after receipt migration
- log level and rate-limit settings

**Done when**

- Production starts only with a complete valid configuration.
- Development can use documented local defaults without weakening production.
- Secrets are never printed in startup errors.

**Files**

- New `artifacts/api-server/src/lib/config.ts`
- `artifacts/api-server/src/index.ts`
- `artifacts/api-server/src/app.ts`
- `lib/db/src/index.ts`

### P1-8: Health endpoint does not check readiness

**Current problem**

`/api/healthz` returns `{ status: "ok" }` without checking PostgreSQL, Clerk
configuration, migrations, or object storage. A process can be alive while the
application cannot serve authenticated data.

**Best fix**

Separate liveness and readiness:

- `/api/healthz`: process is alive, no dependency calls required.
- `/api/readyz`: database connection, migration state, and required services
  are usable.

Do not expose detailed dependency information publicly.

**Done when**

- Deployment health checks use readiness.
- A database outage makes readiness fail while liveness can remain available.
- Health responses do not leak connection details.

**Files**

- `artifacts/api-server/src/routes/health.ts`
- New database health helper
- API artifact deployment health configuration

### P1-9: No automated regression or authorization test suite

**Current problem**

The repository has no meaningful test scripts covering the API, database
contracts, Clerk sessions, user isolation, or browser flows.

**Best fix**

Add tests in layers:

1. **Unit tests**
   - calculations
   - currency rounding
   - Zod schemas
   - date/month handling
2. **API integration tests**
   - settings CRUD
   - record CRUD
   - receipt lifecycle
   - validation and error responses
   - ownership checks
3. **Database tests**
   - migrations from empty database
   - unique constraints
   - cascade behavior
4. **Browser smoke tests**
   - public landing page
   - sign-up/sign-in
   - onboarding
   - save and reload settings/records

Use test Clerk credentials or a testable auth boundary; never use production
users in tests.

**Minimum launch acceptance tests**

- User A cannot read, update, delete, or attach receipts to User B's records.
- A malformed record is rejected without a database write.
- A duplicate month is handled deterministically.
- A receipt upload is size/type limited.
- A user can sign in, onboard, save data, refresh, and see the same data.

**Files**

- Root/package test scripts
- New `artifacts/api-server/src/**/*.test.ts`
- New `lib/db/src/**/*.test.ts`
- New browser test directory
- CI/validation configuration

### P2-1: Observability is incomplete

**Current problem**

Pino logging exists and sensitive headers are redacted, but there is no
centralized error reporting, metrics, alerting, or useful readiness signal.

**Best fix**

Add operational visibility before public launch or immediately before the first
real users:

- request count, error count, latency, and status metrics
- database pool saturation and query error metrics
- structured unexpected-error reporting
- alerts for 5xx rate, readiness failure, and latency
- deployment version/build identifier in logs

Preserve the existing redaction policy and do not log receipt contents.

**Done when**

- An operator can identify a failing endpoint and deployment version.
- Alerts exist for API outage and database outage.
- Logs can be correlated using request IDs.

**Files**

- `artifacts/api-server/src/lib/logger.ts`
- `artifacts/api-server/src/app.ts`
- New metrics/error-reporting module
- Deployment monitoring configuration

### P2-2: Backups and recovery are not documented or tested

**Current problem**

The application stores user ledger data and currently stores receipt images in
the database, but there is no documented recovery objective or restore test in
the repository plan.

**Best fix**

Define:

- recovery point objective (acceptable data loss)
- recovery time objective
- database backup retention
- object-storage retention/versioning
- restore owner and procedure

Run a restore drill against a non-production environment before launch and
periodically thereafter.

**Done when**

- A new database can be restored and migrated from documented instructions.
- Receipt files and database metadata can be restored consistently.
- The team knows what data can be recovered and how long it takes.

**Files**

- `production.md`
- Deployment/operations runbook
- Migration and restore scripts as needed

### P2-3: Frontend API and failure states need production hardening

**Current problem**

The frontend hardcodes `/api`, which is correct for same-origin deployment but
fragile for a future split-domain deployment. Many pages log errors but need a
consistent user-visible error and retry experience.

**Best fix**

Keep `/api` for the initial same-origin deployment, but centralize API
configuration and error handling:

1. Define an artifact-aware API base helper.
2. Keep credentials behavior in one client module.
3. Normalize 401, 403, 409, 429, and 5xx behavior.
4. Add loading, empty, error, and retry states to every data page.
5. Clear user-scoped query state when Clerk user identity changes.
6. Add client error reporting without including ledger or receipt contents.

**Done when**

- Users receive actionable feedback when the API is unavailable.
- A session expiry sends the user through the intended auth flow.
- The app works under the configured artifact base path.

**Files**

- `artifacts/khata/src/lib/api.js`
- `artifacts/khata/src/App.jsx`
- `artifacts/khata/src/pages/`
- New frontend configuration/error components

### P2-4: Production bundle is large

**Current problem**

The production build reports a JavaScript chunk larger than 500 kB. This is
not an immediate correctness issue, but it affects first-load performance.

**Best fix**

Measure real performance first, then split by route:

- lazy-load dashboard/history/annual/settings pages
- use route-level chunks
- defer receipt/PDF export code until needed
- review unused shadcn/Radix imports
- add performance budgets after measuring

Do not manually suppress the warning without measuring the result.

**Done when**

- Public landing page does not load authenticated application code
  unnecessarily.
- Core Web Vitals are measured on representative devices.
- Performance budgets are checked in CI.

**Files**

- `artifacts/khata/src/App.jsx`
- `artifacts/khata/src/pages/`
- `artifacts/khata/vite.config.ts`

## Recommended implementation sequence

### Phase 0 — Establish the production baseline

Before changing behavior:

- create a staging environment and database
- document development, staging, and production environments
- confirm Clerk development and production tenant separation
- define trusted application origins
- define backup, RPO, and RTO targets
- capture a representative data fixture

### Phase 1 — Close security and data-integrity blockers

Implement in this order:

1. Typed startup configuration.
2. Strict CORS allowlist.
3. CSRF/origin protection for state-changing requests.
4. Zod validation for all routes.
5. Receipt parent-record ownership checks.
6. Receipt unique constraint and atomic upsert.
7. Centralized error handling.
8. Rate and upload limits.
9. Security and authorization tests.

Do not invite public users before this phase passes.

### Phase 2 — Make persistence deployable and scalable

1. Add versioned Drizzle migrations.
2. Baseline the current schema.
3. Add constraints and indexes.
4. Move receipt files to object storage.
5. Migrate existing receipt data.
6. Add database readiness checks.
7. Test backup and restore.

### Phase 3 — Add operational confidence

1. Add integration and browser smoke tests.
2. Add metrics and error reporting.
3. Add deployment health checks.
4. Add alerting for API, database, and latency failures.
5. Write the rollback and migration runbook.
6. Perform a staging release using the same build and migration process as
   production.

### Phase 4 — Optimize after measuring

1. Add route-level frontend code splitting.
2. Tune database indexes using query metrics.
3. Add pagination if record volume grows.
4. Add caching only where measurements justify it.
5. Review object-storage lifecycle and CDN behavior.

## Production release checklist

### Security

- [ ] CORS is restricted to explicit HTTPS origins.
- [ ] Cross-site state-changing requests are rejected.
- [ ] All write bodies and route parameters are validated.
- [ ] User ownership is checked on every read and write.
- [ ] Receipt MIME type, size, and field reference are validated.
- [ ] Rate limiting is enabled.
- [ ] Secrets are stored through the environment/secrets system.
- [ ] Production Clerk keys are not used in development or tests.

### Database and storage

- [ ] Versioned migrations exist and have been tested from an empty database.
- [ ] Production migration execution is explicit and logged.
- [ ] Monthly record and receipt uniqueness constraints exist.
- [ ] Receipt files are not stored as base64 in PostgreSQL.
- [ ] Backups and restore procedures have been tested.
- [ ] Database and object-storage retention are documented.

### API reliability

- [ ] Startup configuration validation is enabled.
- [ ] Centralized error middleware is enabled.
- [ ] Liveness and readiness endpoints are separate.
- [ ] Database readiness is checked.
- [ ] Request IDs appear in logs.
- [ ] Logs redact cookies, authorization headers, and private data.
- [ ] Timeouts and database pool limits are configured.

### Testing

- [ ] Unit tests pass.
- [ ] API integration tests pass.
- [ ] Cross-user authorization tests pass.
- [ ] Migration tests pass.
- [ ] Authenticated browser smoke test passes.
- [ ] Build and typecheck pass in CI.
- [ ] Staging deployment has been tested with production-like configuration.

### Deployment

- [ ] Frontend and API deployment responsibilities are explicit.
- [ ] Migrations run before the compatible API release.
- [ ] Health checks use readiness, not only process liveness.
- [ ] Rollback procedure is documented.
- [ ] Monitoring and alerts are active.
- [ ] A production release owner and incident contact are known.

## Recommended first milestone

The first implementation milestone should be **Security and API integrity
hardening**:

1. Add config validation.
2. Restrict CORS.
3. Add origin/CSRF protection.
4. Add Zod schemas to settings, records, and receipts.
5. Fix receipt ownership and atomic upsert.
6. Add centralized errors and the first authorization tests.

This milestone gives the greatest reduction in launch risk without requiring a
framework migration or monorepo restructuring.
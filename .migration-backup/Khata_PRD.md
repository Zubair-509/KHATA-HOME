# Khata — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Product Name | Khata |
| Tagline | Your Building's Ledger, On the Web |
| Version | 2.0 |
| Owner | Zubair (V Core) |
| Document Type | Product Requirements Document |
| Status | Active |
| Target Users | Building owner (1–2 users) |
| Platform | Responsive Web App (Desktop-first website) |

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | Initial | Local-only, no auth, IndexedDB storage |
| 2.0 | Jul 2026 | Added authentication, PostgreSQL backend, user-scoped data |

---

## 1. Overview

Khata is a personal website that replaces a paper diary used by a building owner to track monthly rent collection, utility bills, and payment status across a 4-floor building in Karachi. The app captures every input the owner currently writes by hand, auto-calculates per-floor splits and totals, and outputs a clean digital summary matching the diary format the owner is already familiar with — plus visual charts that the paper diary never could provide.

**v2.0 update:** The app now requires login via Replit's OAuth (no custom password form — one click). All data is stored in a PostgreSQL database instead of browser-local IndexedDB. This means records survive browser clears, are accessible from any device, and are safely tied to the logged-in user's identity.

---

## 2. Problem Statement

The owner of a 4-floor building maintains a handwritten monthly ledger to track:
- His own utility bills (KE, SSGC, KWSB, Motor) for the ground and 3rd floor
- Rent collection from the 1st and 2nd floor tenants
- Bill share collection (SSGC, Motor, and in some cases KE) from tenants
- Bill payments made on behalf of the 2nd floor tenant

**Additional problem addressed in v2.0:** Data stored in the browser (IndexedDB) is lost if the browser is cleared or the user switches to a different device. A PostgreSQL backend eliminates this risk.

---

## 3. Goals & Non-Goals

### Goals
- Eliminate manual arithmetic for bill splits and floor totals
- Match the diary's mental model so the owner doesn't have to relearn a new system
- Store complete monthly records that are searchable and exportable
- Track Paid/Pending status for every bill and payment
- Generate a shareable PDF summary per month (e.g., to send to tenants over WhatsApp)
- Provide visual charts (income vs. expense trends, per-floor breakdowns) for at-a-glance understanding
- Accessible from any device with a browser — desktop, tablet, or mobile
- **v2.0:** Require login to protect data (1–2 authorised users)
- **v2.0:** Store all data in PostgreSQL so records survive browser clears and device switches
- **v2.0:** Support up to 2 users, each with completely isolated data

### Non-Goals (v2.0)
- ~~Cloud sync or cross-device data~~ *(resolved in v2.0 via PostgreSQL)*
- ~~No backend, no login~~ *(resolved in v2.0)*
- Multi-user / multi-building support (more than 2 users)
- Custom email/password login (auth is handled by Clerk)
- Tenant-facing app or login
- Automated bill fetching from KE/SSGC/KWSB portals
- SMS/email notifications (only in-app reminders)
- Accounting-grade reporting (P&L, tax exports, etc.)

---

## 4. Target User & Use Case

**Primary User:** A single building owner managing a 4-floor residential building in Karachi with two rented floors. A second user (family member or co-manager) may be added in the future.

**User Profile:**
- Comfortable with WhatsApp and online banking, but not a power user of apps
- Previously used a paper diary as the source of truth
- Wants speed, clarity, and accuracy — not complex features
- Will access the site via a browser bookmark on desktop or phone

**Primary Use Case:**
End of each month, the owner opens Khata, logs in (first visit only — session is remembered), creates a new month, enters bill amounts and payment confirmations as money/receipts come in, and finalises the record once everyone has paid.

---

## 5. Functional Requirements

### 5.1 Authentication (NEW in v2.0)

| ID | Requirement |
|---|---|
| FR-0.1 | App requires login before showing any data |
| FR-0.2 | Login is handled by Replit OAuth — no custom username/password form |
| FR-0.3 | Session is remembered for 7 days (cookie-based) |
| FR-0.4 | Logout option is available from the Settings screen |
| FR-0.5 | Each user's data is completely isolated — one user cannot see another's records |
| FR-0.6 | Up to 2 users may use the app independently (each with their own building data) |

### 5.2 Setup & Configuration

| ID | Requirement |
|---|---|
| FR-1.1 | First-launch setup wizard captures: floor labels, tenant names, default rent per rented floor, SSGC split ratio, Motor split ratio |
| FR-1.2 | All setup values are editable anytime via a Settings screen |
| FR-1.3 | Settings changes apply only to future months — past months are immutable |
| FR-1.4 | Default split ratio is equal 3-way (Ground / 1st / 2nd) for SSGC and Motor |
| FR-1.5 | Default rent is 22,000 PKR per rented floor (editable) |
| FR-1.6 | **v2.0:** Settings are stored per-user in PostgreSQL |

### 5.3 Monthly Entry

| ID | Requirement |
|---|---|
| FR-2.1 | User can create a new monthly record by selecting Month + Year |
| FR-2.2 | Only one record per Month-Year combination is allowed per user |
| FR-2.3 | New month creation auto-snapshots current settings (rent, splits, names) |
| FR-2.4 | New month form pre-fills amounts using the previous month's values as defaults (user can overwrite) |
| FR-2.5 | Form is grouped by floor: Ground → 1st Floor → 2nd Floor |
| FR-2.6 | Each bill/payment field captures: Amount (PKR), Status (Paid / Pending), Date |
| FR-2.7 | User can attach a receipt photo (camera or gallery) per bill/payment entry |
| FR-2.8 | User can save the month as Draft (partial entry) and resume later |
| FR-2.9 | **v2.0:** Monthly records are stored per-user in PostgreSQL |

### 5.4 Calculations (Automatic)

| ID | Requirement |
|---|---|
| FR-3.1 | SSGC per-floor share = Total SSGC ÷ split ratio |
| FR-3.2 | Motor per-floor share = Total Motor ÷ split ratio |
| FR-3.3 | 1st Floor Total = Rent + own KE + SSGC share + Motor share |
| FR-3.4 | 2nd Floor Total = Rent + KE (paid by owner) + SSGC share + Motor share |
| FR-3.5 | Owner Inflow = Sum of all amounts received from tenants |
| FR-3.6 | Owner Outflow = Ground KE + KWSB + full SSGC + full Motor + 2nd Floor KE |
| FR-3.7 | Owner Net = Inflow − Outflow |
| FR-3.8 | All calculations update live as the user types |

### 5.5 Summary & Display

| ID | Requirement |
|---|---|
| FR-4.1 | Monthly Summary screen mirrors the diary's structure: header → Ground → 1st Floor → 2nd Floor → totals |
| FR-4.2 | Every bill/payment shows: Bill Month, Payable Amount, Status, Date |
| FR-4.3 | Paid items show a green badge; Pending items show an amber/red badge |
| FR-4.4 | Floor-total lines explicitly show the arithmetic (e.g., "22,000 + 8,400 + 2,100 + 1,250 = 33,750") |
| FR-4.5 | Owner Dashboard (Home screen) shows current month's inflow, outflow, net, and pending count |
| FR-4.6 | Dashboard includes an Income vs. Expense trend chart (last 6–12 months) |
| FR-4.7 | Dashboard includes a per-floor expense breakdown chart (Ground / 1st / 2nd) for the current month |
| FR-4.8 | Annual Summary includes a 12-month bar/line chart of inflow, outflow, and net |

### 5.6 History & Archive

| ID | Requirement |
|---|---|
| FR-5.1 | All saved months appear in a scrollable History list, sorted newest first |
| FR-5.2 | Each list item shows Month-Year, total inflow, total outflow, and pending indicator |
| FR-5.3 | Tapping a month opens its full Summary view (read-only) |
| FR-5.4 | A finalised month can be reopened for edit only via an explicit "Edit" action (with a warning) |
| FR-5.5 | Annual Summary view shows year-wise totals: total inflow, total outflow, total net, and a 12-month breakdown table |
| FR-5.6 | Annual Summary shows per-floor yearly totals (total rent collected, total bills paid by category) |
| FR-5.7 | Annual Summary is selectable by year and is exportable as PDF |

### 5.7 Export & Share

| ID | Requirement |
|---|---|
| FR-6.1 | User can export any monthly summary as a PDF |
| FR-6.2 | PDF layout matches the on-screen Summary view |
| FR-6.3 | PDF can be downloaded and shared manually (WhatsApp Web, Email, Drive, etc.) |
| FR-6.4 | Receipt images attached to entries are NOT included in the PDF v2.0 (kept in-app for reference) |

### 5.8 Reminders (Optional)

| ID | Requirement |
|---|---|
| FR-7.1 | In-app banner on Home screen when current month has any Pending items past the 25th |
| FR-7.2 | No push notifications in v2.0 (browser notification permissions add friction) |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Any screen loads in under 1 second on standard broadband |
| Responsiveness | Layout adapts cleanly across desktop, tablet, and mobile browser widths |
| Storage | **v2.0:** All data stored in PostgreSQL (Replit-managed). IndexedDB is no longer used. |
| Privacy | No data leaves the server unless the user manually exports a PDF |
| Reliability | Auto-save on every field change — no risk of lost work |
| Accessibility | Minimum 16px font, high-contrast Paid/Pending badges, large tap targets (min 44×44px) |
| Security | Session cookie is httpOnly, secure, sameSite=lax. All data access is scoped to the authenticated user. |
| Cost | Free to build, host, and use (Replit free tier) |

---

## 7. Data Model (v2.0 — PostgreSQL)

### users (managed by Replit Auth)
- id (varchar, PK — Replit user ID)
- email, firstName, lastName, profileImageUrl
- createdAt, updatedAt

### sessions (managed by auth middleware)
- sid (varchar, PK)
- sess (jsonb — session payload)
- expire (timestamp)

### settings (one row per user)
- id (uuid, PK)
- userId (varchar, FK → users.id)
- tenant1stFloorName, tenant2ndFloorName (varchar)
- defaultRent1st, defaultRent2nd (numeric)
- ssgcSplitRatio (jsonb — `{ ground, first, second }`)
- motorSplitRatio (jsonb — `{ ground, first, second }`)
- onboarded (boolean)
- createdAt, updatedAt

### monthlyRecords (one row per user per month)
- id (uuid, PK)
- userId (varchar, FK → users.id)
- monthYear (varchar — e.g. "2026-06"), UNIQUE per user
- year (integer)
- status (varchar — "draft" | "finalized")
- snapshot (jsonb — frozen settings at creation time)
- groundFloor (jsonb — `{ ke, kwsb, ssgcTotal, motorTotal }`)
- firstFloor (jsonb — `{ ke, rentReceived, ssgcShareReceived, motorShareReceived }`)
- secondFloor (jsonb — `{ ke, rentReceived, ssgcShareReceived, motorShareReceived, keReceived }`)
- createdAt, updatedAt

Each bill/payment entry within the jsonb columns is:
`{ amount: number, status: "paid" | "pending", date: string | null, receiptImageRef: string | null }`

---

## 8. Tech Stack (v2.0)

| Layer | Choice | Reason |
|---|---|---|
| Framework | React (Vite) | Fast dev, large ecosystem, easy deployment |
| Styling | Tailwind CSS | Quick utility-first styling |
| Storage | **PostgreSQL (Replit-managed) + Drizzle ORM** | Replaces IndexedDB — durable, cross-device, user-scoped |
| Authentication | **Replit OAuth (OIDC + PKCE)** | Zero-friction, no password form, session via cookie |
| API | **Express 5** | Backend API server for all data operations |
| PDF | jsPDF + html2canvas | Render the Summary view to PDF directly |
| Charts | Recharts | Lightweight, composable charting library |
| Hosting | Replit | Static hosting + API server at zero extra cost |

---

## 9. Success Criteria

The app is successful if, after one full month of use:
- Owner stops opening the paper diary for the current month's tracking
- Time spent on the monthly summary drops by at least 50%
- No arithmetic errors appear in the digital records
- Owner can retrieve any past month in under 10 seconds
- Owner can share a clean PDF summary on WhatsApp in under 30 seconds
- **v2.0:** Data is accessible from any device after login

---

## 10. Out of Scope (Future Considerations)

- Multi-building / multi-property support
- Tenant-facing companion app to view their own bills
- Annual summary and tax-export views
- OCR to auto-extract bill amounts from receipt photos
- Direct integration with KE/SSGC/KWSB portals
- Custom email/password auth (may be added later if needed)

---

## 11. Resolved Decisions

- **Annual Summary** — Included in v2.0 (see FR-5.5 to FR-5.7)
- **KWSB entry** — Always re-entered each month; not auto-memorised
- **3rd Floor** — Treated as grouped with Ground Floor (Owner's space); no separate utility entries
- **Auth provider** — Replit OAuth chosen for simplicity. No custom login form.
- **Storage backend** — PostgreSQL replaces IndexedDB to fix data loss across browser clears and devices
- **User limit** — Capped at 2 users for now. Data is fully isolated per user ID.
- **jsonb for floor data** — Floor data (groundFloor, firstFloor, secondFloor) stored as jsonb to match existing data shape and minimise frontend changes

# Khata — Product Requirements Document (PRD)

| Field | Value |
|---|---|
| Product Name | Khata |
| Tagline | Your Building's Ledger, On the Web |
| Version | 1.0 |
| Owner | Zubair (V Core) |
| Document Type | Product Requirements Document |
| Status | Draft |
| Target Users | Single user — building owner |
| Platform | Responsive Web App (Desktop-first website) |

---

## 1. Overview

Khata is a personal website that replaces a paper diary used by a building owner to track monthly rent collection, utility bills, and payment status across a 4-floor building in Karachi. The app captures every input the owner currently writes by hand, auto-calculates per-floor splits and totals, and outputs a clean digital summary matching the diary format the owner is already familiar with — plus visual charts that the paper diary never could provide.

The app is built for one user, accessible via any web browser (desktop or mobile), stores data locally in the browser, and has no backend, no login, and no ongoing cost beyond free static hosting.

---

## 2. Problem Statement

The owner of a 4-floor building maintains a handwritten monthly ledger to track:
- His own utility bills (KE, SSGC, KWSB, Motor) for the ground and 3rd floor
- Rent collection from the 1st and 2nd floor tenants
- Bill share collection (SSGC, Motor, and in some cases KE) from tenants
- Bill payments made on behalf of the 2nd floor tenant

This process is slow, prone to arithmetic errors, hard to search through, and the diary is a single physical artifact that can be lost or damaged. The owner needs a faster, more reliable way to record, calculate, and retrieve this information — while keeping the familiar mental model of "one entry per month, organized by floor."

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
- Cost the owner nothing to use (no subscription, no ads, no hosting fees)

### Non-Goals (v1.0)
- Multi-user / multi-building support
- Cloud sync or cross-device data
- Tenant-facing app or login
- Automated bill fetching from KE/SSGC/KWSB portals
- SMS/email notifications (only in-app reminders)
- Accounting-grade reporting (P&L, tax exports, etc.)

---

## 4. Target User & Use Case

**Primary User:** A single building owner managing a 4-floor residential building in Karachi with two rented floors.

**User Profile:**
- Comfortable with WhatsApp and online banking, but not a power user of apps
- Currently uses a paper diary as the source of truth
- Wants speed, clarity, and accuracy — not complex features
- Will access the site via a browser bookmark on desktop or phone

**Primary Use Case:**
End of each month, the owner opens Khata, creates a new month, enters bill amounts and payment confirmations as money/receipts come in, and finalizes the record once everyone has paid.

---

## 5. Functional Requirements

### 5.1 Setup & Configuration

| ID | Requirement |
|---|---|
| FR-1.1 | First-launch setup wizard captures: floor labels, tenant names, default rent per rented floor, SSGC split ratio, Motor split ratio |
| FR-1.2 | All setup values are editable anytime via a Settings screen |
| FR-1.3 | Settings changes apply only to future months — past months are immutable |
| FR-1.4 | Default split ratio is equal 3-way (Ground / 1st / 2nd) for SSGC and Motor |
| FR-1.5 | Default rent is 22,000 PKR per rented floor (editable) |

### 5.2 Monthly Entry

| ID | Requirement |
|---|---|
| FR-2.1 | User can create a new monthly record by selecting Month + Year |
| FR-2.2 | Only one record per Month-Year combination is allowed |
| FR-2.3 | New month creation auto-snapshots current settings (rent, splits, names) |
| FR-2.4 | New month form pre-fills amounts using the previous month's values as defaults (user can overwrite) |
| FR-2.5 | Form is grouped by floor: Ground → 1st Floor → 2nd Floor |
| FR-2.6 | Each bill/payment field captures: Amount (PKR), Status (Paid / Pending), Date |
| FR-2.7 | User can attach a receipt photo (camera or gallery) per bill/payment entry |
| FR-2.8 | User can save the month as Draft (partial entry) and resume later |

### 5.3 Calculations (Automatic)

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

### 5.4 Summary & Display

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

### 5.5 History & Archive

| ID | Requirement |
|---|---|
| FR-5.1 | All saved months appear in a scrollable History list, sorted newest first |
| FR-5.2 | Each list item shows Month-Year, total inflow, total outflow, and pending indicator |
| FR-5.3 | Tapping a month opens its full Summary view (read-only) |
| FR-5.4 | A finalized month can be reopened for edit only via an explicit "Edit" action (with a warning) |
| FR-5.5 | Annual Summary view shows year-wise totals: total inflow, total outflow, total net, and a 12-month breakdown table |
| FR-5.6 | Annual Summary shows per-floor yearly totals (total rent collected, total bills paid by category) |
| FR-5.7 | Annual Summary is selectable by year and is exportable as PDF |

### 5.6 Export & Share

| ID | Requirement |
|---|---|
| FR-6.1 | User can export any monthly summary as a PDF |
| FR-6.2 | PDF layout matches the on-screen Summary view |
| FR-6.3 | PDF can be downloaded and shared manually (WhatsApp Web, Email, Drive, etc.) |
| FR-6.4 | Receipt images attached to entries are NOT included in the PDF v1.0 (kept in-app for reference) |

### 5.7 Reminders (Optional)

| ID | Requirement |
|---|---|
| FR-7.1 | In-app banner on Home screen when current month has any Pending items past the 25th |
| FR-7.2 | No push notifications in v1.0 (browser notification permissions add friction) |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Any screen loads in under 1 second on standard broadband |
| Responsiveness | Layout adapts cleanly across desktop, tablet, and mobile browser widths |
| Storage | All data stored in IndexedDB on the device |
| Privacy | No data ever leaves the device unless user manually exports a PDF |
| Reliability | Auto-save on every field change — no risk of lost work |
| Accessibility | Minimum 16px font, high-contrast Paid/Pending badges, large tap targets (min 44×44px) |
| Cost | Free to build, host, and use |

---

## 7. Data Model (Conceptual)

### Settings (single record)
- tenant1stFloorName, tenant2ndFloorName
- defaultRent1st, defaultRent2nd
- ssgcSplitRatio (default {ground: 1, first: 1, second: 1})
- motorSplitRatio (default {ground: 1, first: 1, second: 1})

### MonthlyRecord (one per Month-Year)
- id, monthYear, createdAt, status (Draft / Finalized)
- snapshot: { rents, splits, tenantNames } — frozen at creation
- groundFloor: { ke, kwsb, ssgcTotal, motorTotal }
- firstFloor: { ke, rentReceived, ssgcShareReceived, motorShareReceived }
- secondFloor: { ke, rentReceived, ssgcShareReceived, motorShareReceived, keReceived }
- Each bill/payment object: { amount, status, date, receiptImageRef }

### Receipt (image blob, stored in IndexedDB)
- id, recordId, fieldRef, imageBlob, uploadedAt

---

## 8. Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | React (Vite) | Fast dev, large ecosystem, easy deployment |
| Styling | Tailwind CSS | Quick utility-first styling |
| Storage | IndexedDB (via Dexie.js) | Robust local storage with image blob support |
| PDF | jsPDF + html2canvas | Render the Summary view to PDF directly |
| Charts | Recharts | Lightweight, composable charting library for dashboard visuals |
| Hosting | Vercel or Netlify (free tier) | Static hosting at zero cost |

---

## 9. Success Criteria

The app is successful if, after one full month of use:
- Owner stops opening the paper diary for the current month's tracking
- Time spent on the monthly summary drops by at least 50%
- No arithmetic errors appear in the digital records
- Owner can retrieve any past month in under 10 seconds
- Owner can share a clean PDF summary on WhatsApp in under 30 seconds

---

## 10. Out of Scope (Future Considerations)

- Multi-building / multi-property support
- Cloud backup and sync across devices
- Tenant-facing companion app to view their own bills
- Annual summary and tax-export views
- OCR to auto-extract bill amounts from receipt photos
- Direct integration with KE/SSGC/KWSB portals

---

## 11. Resolved Decisions

- **Annual Summary** — Included in v1.0 (see FR-5.5 to FR-5.7)
- **KWSB entry** — Always re-entered each month; not auto-memorized
- **3rd Floor** — Treated as grouped with Ground Floor (Owner's space); no separate utility entries

---

## Next Step
Proceed to the Design Document Specification (DDS) covering visual design, color system, typography, screen layouts, and component states.

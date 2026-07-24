# Khata

A personal building ledger for tracking monthly rent, utility bills, and payment status across a 4-floor building in Karachi. Data is stored locally in the browser (IndexedDB via Dexie) — no backend required.

## Run & Operate

- **Frontend (main app):** Managed by the `artifacts/khata: web` workflow — runs `pnpm --filter @workspace/khata run dev` on port 21533 with `BASE_PATH=/`
- `pnpm install` — install all workspace deps (run from repo root)
- `npm run typecheck` — full typecheck across all packages
- `npm run build` — typecheck + build all packages
- **API server** (`artifacts/api-server`): not required for the Khata app (which is fully client-side); requires `DATABASE_URL` if started

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- **Frontend:** React 19, Vite 7, Tailwind CSS 3, shadcn/ui, Wouter (routing), Dexie (IndexedDB)
- **API (unused by frontend):** Express 5, PostgreSQL + Drizzle ORM, Zod
- Fonts: Playfair Display, DM Sans, JetBrains Mono (Google Fonts)

## Where things live

- `artifacts/khata/src/` — main React app
  - `pages/` — Dashboard, NewMonth, History, MonthlySummary, Annual, Settings, Onboarding
  - `components/` — Layout, EntryField, ui/
  - `hooks/` — useSettings, others
  - `lib/` — Dexie DB (db.js), formatting (format.js)
  - `App.jsx` + `main.jsx` — real entry points (index.html loads main.jsx)
  - `App.tsx` + `main.tsx` — boilerplate stubs (not loaded)
- `artifacts/api-server/src/` — Express API (not used by Khata frontend)
- `lib/db/` — Drizzle schema (empty; DB not used by frontend)
- `lib/api-spec/` — OpenAPI spec + Orval codegen config

## Architecture decisions

- **Dexie (IndexedDB) for all persistence** — fully offline, no backend needed. Tradeoff: data lives in-browser only, no sync across devices.
- **JSX + TSX hybrid** — pages are `.jsx`, UI components are `.tsx`. Entry point is `main.jsx` (loaded by `index.html` directly).
- **Hash router** — `react-router-dom` HashRouter used so the SPA works without server-side routing config.
- **PDF export** — `jspdf` + `html2canvas` used in MonthlySummary and Annual pages for PDF generation.
- **Singleton settings** — one `settings` record (id: `'singleton'`) holds tenant names, default rents, SSGC/motor split ratios, onboarded flag.

## Product

Khata tracks rent and utility bills for a 4-floor building:
- **Onboarding:** Configure tenant names, default rents, bill split ratios (SSGC/motor)
- **Dashboard:** Inflow/outflow summary, pending items alert (post-25th), trend chart, recent months
- **New Month entry:** Per-floor form (Ground, 1st, 2nd) with auto-save, previous-month pre-fill, receipt image upload
- **History:** Filterable list of all months (Draft/Finalized status)
- **Monthly Summary:** Detailed per-floor breakdown, PDF export
- **Annual Summary:** Yearly totals with charts, PDF export
- **Settings:** Edit tenant/rent config, export data (JSON), clear all data

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm install` from the repo root before starting the workflow if node_modules are missing.
- `index.html` loads `main.jsx` directly — the `.tsx` variants (App.tsx, main.tsx) are unused stubs.
- The API server (`artifacts/api-server`) is wired up in the monorepo but **not** used by the Khata frontend.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

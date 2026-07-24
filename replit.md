# Khata

A personal building ledger for tracking monthly rent, utility bills, and payment status across a 4-floor building in Karachi. Data is stored locally in the browser (IndexedDB via Dexie) — no backend required.

## Run & Operate

- **Frontend (main app):** Managed by the `artifacts/khata: web` workflow — runs `npm run dev --workspace=@workspace/khata` on port 21533 with `BASE_PATH=/`
- `npm run typecheck` — full typecheck across all packages
- `npm run build` — typecheck + build all packages
- **API server** (`artifacts/api-server`): not required for the Khata app (which is fully client-side); requires `DATABASE_URL` if started

## Stack

- pnpm workspaces, Node.js 20, TypeScript 5.9
- Frontend: React 19 + Vite 7, Tailwind CSS v3, wouter (routing), Recharts
- Auth: Clerk (Replit-managed, `@clerk/react` + `@clerk/express`)
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM (lib/db) — not yet wired to frontend (v1 uses IndexedDB/Dexie)
- Validation: Zod, drizzle-zod
- Build: esbuild

## Where things live

- `artifacts/khata/src/App.jsx` — root with ClerkProvider + wouter Router, all route definitions
- `artifacts/khata/src/components/Layout.jsx` — sidebar (desktop) + bottom tab (mobile) shell
- `artifacts/khata/src/pages/` — Dashboard, NewMonth, History, MonthlySummary, Annual, Settings, Onboarding
- `artifacts/khata/src/lib/db.js` — IndexedDB (Dexie) data layer (v1; will be replaced with API calls in v2)
- `artifacts/khata/src/lib/calculations.js` — bill split math, floor totals
- `artifacts/api-server/src/app.ts` — Express app with Clerk proxy + middleware wired
- `artifacts/api-server/src/routes/` — only health.ts today; settings + monthly records routes to be added
- `lib/db/src/schema/index.ts` — Drizzle schema (currently empty; to be populated for v2)
- `.migration-backup/Khata_PRD.md` — full product requirements
- `.migration-backup/Khata_DDS (1).md` — full design system specification

## Architecture decisions

- **Routing:** Switched from react-router-dom (HashRouter) to wouter — required for Clerk's auth redirects and path-based routing. All pages updated to use `useLocation` / `useSearch` / `useParams` from wouter.
- **Auth:** Clerk (Replit-managed). Landing page at `/` shows branded login for unauthenticated users; all app routes (`/dashboard`, `/new-month`, etc.) require auth via `ProtectedRoute`. Sign-in/sign-up at `/sign-in` and `/sign-up` use Clerk's hosted components with custom Khata branding.
- **Data storage (v1):** IndexedDB via Dexie — all data is local to the browser. The v2 migration will replace this with PostgreSQL via the Express API server.
- **Onboarding:** Handled inside `ProtectedRoute` — if authenticated but `settings.onboarded === false`, shows the Onboarding screen regardless of route.
- **Design tokens:** All colors, fonts, spacing defined as CSS custom properties in `artifacts/khata/src/index.css`, matching the Hisaab hackathon palette (forest green `#1B4332` primary).

## Product

Khata is a building ledger for a 4-floor property in Karachi. The owner tracks monthly rent, utility bills (KE, SSGC, KWSB, Motor), and payment status. The app auto-calculates per-floor splits and totals, shows income vs. expense charts, and exports monthly summaries as PDF.

**v2.0 additions (in progress):** Clerk login, PostgreSQL backend, user-scoped data.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

---
name: Khata auth setup
description: Clerk auth integration details, entry-point decisions, routing conventions, and database setup for the Khata app.
---

# Khata Clerk Auth Setup

## Entry point
`index.html` loads `src/main.jsx` → `src/App.jsx` (explicit `.jsx` extension in the import).
`src/main.tsx` and `src/App.tsx` also exist but are NOT used — `index.html` hard-references `main.jsx`.
All auth and routing changes belong in `App.jsx`.

**Why:** `main.tsx` imports `App` without extension (picks up `App.tsx`), but the HTML entry point bypasses it.

## HashRouter → BrowserRouter
Switched from `HashRouter` to `BrowserRouter` for Clerk auth to work.
Clerk's `routing="path"` reads `window.location.pathname` directly; with HashRouter the pathname is always `/` regardless of the current route, breaking all Clerk internal navigation.

**Why:** Clerk `<SignIn routing="path">` + `<SignUp routing="path">` only work with real browser pathnames.

## Routing layout
- `/` → HomeRoute: landing for guests, redirect to `/dashboard` for auth users
- `/sign-in/*` → Clerk SignIn component
- `/sign-up/*` → Clerk SignUp component
- `/dashboard`, `/new-month`, `/history`, `/history/:id`, `/annual`, `/settings` → ProtectedLayout

The app's old home route was `/` → Dashboard. It is now `/dashboard`.
`Layout.jsx` nav updated accordingly (removed `end: true` from the home nav item).

## Tailwind v3 note
The app uses Tailwind v3 (PostCSS), NOT v4. Do NOT add `cssLayerName: "clerk"` to the Clerk appearance object and do NOT reorder CSS layers. The `@tailwind base/components/utilities` directives stay as-is.

## publishableKeyFromHost
Import path: `import { publishableKeyFromHost } from '@clerk/react/internal'`
Used in App.jsx (JSX, not TSX) — works fine.

## Pre-existing Dexie bug
`ConstraintError: Unable to add key to index 'monthYear'` appears in console when attempting to create a duplicate monthly record. This is a pre-existing app bug unrelated to auth.

## Clerk management status
Replit-managed Clerk (`app_3GzrWfTlOyDw3QkKi9DZIGcGhzl`). Secrets auto-provisioned:
- `CLERK_SECRET_KEY` — used by api-server requireAuth middleware
- `CLERK_PUBLISHABLE_KEY` — used by api-server clerkMiddleware
- `VITE_CLERK_PUBLISHABLE_KEY` — used by khata frontend
The dev console warning "Loaded with development keys" is expected and normal.

## PostgreSQL schema (fully applied)
All 4 tables created and live in development DB:
- `users` — synced from Clerk on first API call (by requireAuth middleware)
- `settings` — one row per user, FK → users.id
- `monthly_records` — one per user per month, unique(user_id, month_year)
- `receipts` — one per bill entry per record, stores base64 image_data

Schema source: `lib/db/src/schema/index.ts` (Drizzle ORM definitions)

## Data layer — FULLY MIGRATED
All frontend pages import from `artifacts/khata/src/lib/api.js` (API client, not Dexie).
`artifacts/khata/src/lib/db.js` (Dexie) still exists as dead code — safe to remove later.
`artifacts/khata/src/lib/calculations.js` imports from `./api` (migrated).
`artifacts/khata/src/components/EntryField.jsx` imports from `../lib/api` (migrated).

## Running services
- `artifacts/khata: web` — Vite dev server, PORT 21533, path `/`
- `artifacts/api-server: API Server` — Express on PORT 8080, path `/api`
  - Dev script: `export NODE_ENV=development && npm run build && npm run start`
  - esbuild build succeeds (binary available via npx)

## API server Clerk proxy
`/api/__clerk` — proxies Clerk Frontend API in production only (no-op in dev).
`VITE_CLERK_PROXY_URL` is empty in dev (intentional); auto-populated in prod by Replit.

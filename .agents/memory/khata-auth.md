---
name: Khata auth setup
description: Clerk auth integration details, entry-point decisions, routing conventions, and database setup for the Khata app.
---

# Khata Clerk Auth Setup

## Entry point
`index.html` loads `src/main.jsx` → `src/App.jsx` (explicit `.jsx` extension in the import).
`src/main.tsx` and `src/App.tsx` have been deleted — they were dead code.
All auth and routing changes belong in `App.jsx`.

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

## ProtectedLayout null guard
`useSettings()` returns `undefined` while loading and `null` on API error.
The guard must be `settings == null` (loose equality), NOT `settings === undefined`.
Using strict equality lets `null` through and causes `Cannot read properties of null (reading 'onboarded')`.

## Clerk management status
Replit-managed Clerk. Secrets auto-provisioned:
- `CLERK_SECRET_KEY` — used by api-server requireAuth middleware
- `CLERK_PUBLISHABLE_KEY` — used by api-server clerkMiddleware
- `VITE_CLERK_PUBLISHABLE_KEY` — used by khata frontend
The dev console warning "Loaded with development keys" is expected and normal.

**Re-import note:** After re-importing from GitHub, Clerk is `not_configured`. Must call `setupClerkWhitelabelAuth()` and restart both workflows to re-provision.

## PostgreSQL schema
All 4 tables in development DB:
- `users` — synced from Clerk on first API call (by requireAuth middleware)
- `settings` — one row per user, FK → users.id
- `monthly_records` — one per user per month, unique(user_id, month_year)
- `receipts` — one per bill entry per record, stores base64 image_data

Schema source: `lib/db/src/schema/index.ts` (Drizzle ORM definitions)
**To apply after re-import:** `pnpm --filter @workspace/db run push`

## Data layer — FULLY MIGRATED
All frontend pages import from `artifacts/khata/src/lib/api.js` (API client, not Dexie).
`artifacts/khata/src/lib/db.js` (Dexie) has been deleted.

## Running services
- `artifacts/khata: web` — Vite dev server, PORT 21533, path `/`
- `artifacts/api-server: API Server` — Express on PORT 8080, path `/api`
  - Dev script: `export NODE_ENV=development && npm run build && npm run start`
  - esbuild build succeeds (binary available via npx)

## API server Clerk proxy
`/api/__clerk` — proxies Clerk Frontend API in production only (no-op in dev).
`VITE_CLERK_PROXY_URL` is empty in dev (intentional); auto-populated in prod by Replit.

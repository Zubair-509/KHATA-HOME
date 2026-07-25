---
name: Khata auth setup
description: Clerk auth integration details, entry-point decisions, and routing conventions for the Khata app.
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

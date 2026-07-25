# Khata — Your Building's Ledger, On the Web

A personal finance ledger app for tracking monthly building expenses, with annual summaries and history.

## Stack

- **Frontend** (`artifacts/khata`): React + Vite, Tailwind v3, Clerk auth, Dexie (IndexedDB), react-router-dom v7
- **API Server** (`artifacts/api-server`): Express v5, Clerk auth middleware, Drizzle ORM, PostgreSQL
- **DB** (`lib/db`): Drizzle schema + migrations (PostgreSQL)
- **API Client** (`lib/api-client-react`): Generated from OpenAPI spec in `lib/api-spec`

## Running the project

All three services start automatically via Replit workflows:

| Service | Workflow | Port |
|---|---|---|
| Frontend (Khata) | `artifacts/khata: web` | 21533 |
| API Server | `artifacts/api-server: API Server` | 8080 |
| Mockup Sandbox | `artifacts/mockup-sandbox: Component Preview Server` | 8081 |

To start manually:
```bash
# Install all dependencies (monorepo root)
pnpm install

# Frontend dev server
pnpm --filter @workspace/khata run dev

# API server
pnpm --filter @workspace/api-server run dev
```

## Auth (Clerk)

Clerk is provisioned via Replit-managed Clerk. Keys are auto-set as secrets:
- `VITE_CLERK_PUBLISHABLE_KEY` — used by the frontend
- `CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` — used by the API server

The frontend entry point is `artifacts/khata/index.html` → `src/main.jsx` → `src/App.jsx`.
Auth uses `BrowserRouter` (not `HashRouter`) — required for Clerk path routing.

## Database

The app uses **Dexie (IndexedDB)** for local client-side storage in the frontend — no network DB required for basic usage. The API server connects to PostgreSQL via Drizzle ORM when a `DATABASE_URL` is set.

## User Preferences

<!-- Record preferences here as they come up -->

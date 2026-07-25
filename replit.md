# Khata

A local-first building ledger app for tracking monthly rent, utility bills, and expenses — denominated in Pakistani Rupees (PKR). All data is stored in the browser's IndexedDB (via Dexie), so no backend or database setup is required.

## Stack

- **Frontend:** React 19 + Vite, Tailwind CSS, shadcn/ui components
- **Storage:** Dexie (IndexedDB) — client-side only, no server needed
- **Routing:** react-router-dom with HashRouter
- **Charts:** Recharts
- **Monorepo:** pnpm workspaces

## Running the app

The Khata frontend is the only service you need to start:

```
pnpm --filter @workspace/khata run dev
```

Or use the configured workflow: **artifacts/khata: web**

The app runs at `http://localhost:21533` in development.

## Project structure

```
artifacts/khata/        # React + Vite frontend (the main app)
  src/
    pages/              # Dashboard, History, NewMonth, MonthlySummary, Annual, Settings, Onboarding
    components/         # Layout, EntryField, UI primitives
    hooks/              # useSettings (Dexie live query)
    lib/                # db.js (Dexie schema), calculations.js, format.js

artifacts/api-server/   # Express API server scaffold (not used by current app)
lib/db/                 # Drizzle/PostgreSQL schema (not used by current app)
lib/api-spec/           # OpenAPI spec + codegen (not used by current app)
lib/api-client-react/   # Generated React Query hooks (not used by current app)
```

## Notes

- The backend scaffold (`api-server`, `lib/db`) exists but is unused — the app is fully client-side.
- On first launch, the app shows an Onboarding screen to configure tenant names, rent defaults, and utility bill split ratios.
- Currency is formatted in PKR throughout.

## User preferences

<!-- Add user preferences here as they are communicated -->

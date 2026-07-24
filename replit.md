# Khata

A personal building ledger for tracking monthly rent, utility bills, and payment status across a 4-floor building in Karachi. Data is stored locally in the browser (IndexedDB via Dexie) — no backend required.

## Run & Operate

- **Frontend (main app):** Managed by the `artifacts/khata: web` workflow — runs `npm run dev --workspace=@workspace/khata` on port 21533 with `BASE_PATH=/`
- `npm run typecheck` — full typecheck across all packages
- `npm run build` — typecheck + build all packages
- **API server** (`artifacts/api-server`): not required for the Khata app (which is fully client-side); requires `DATABASE_URL` if started

## Stack

- npm workspaces, Node.js 20, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details

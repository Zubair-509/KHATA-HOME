---
name: Clerk + wouter setup
description: How Clerk auth and wouter routing are wired in Khata; key pitfalls from the migration.
---

## Rule
Khata uses wouter for routing (not react-router-dom). Clerk requires path-based routing and sign-in/sign-up routes using wouter's `/*?` wildcard syntax.

**Why:** Clerk's SignIn/SignUp components need `routing="path"` with a full `path` prop (including basePath). react-router-dom's HashRouter is incompatible. The migration from HashRouter to wouter touched all pages.

## How to apply
- Page navigation: `const [, setLocation] = useLocation()` from wouter, then `setLocation('/path')`.
- Query params: `const search = useSearch()` → `new URLSearchParams(search).get('key')`.
- URL params: `useParams()` from wouter (same API as react-router-dom).
- Layout wraps children explicitly — no `Outlet`. `<Layout><Component /></Layout>`.
- Routes for Clerk MUST be exactly `/sign-in/*?` and `/sign-up/*?` (optional wildcard).
- `publishableKeyFromHost(window.location.hostname, import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)` — never use raw env var.
- `clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL` — always unconditional, empty in dev is intentional.
- Tailwind v3 (PostCSS): do NOT add `cssLayerName: "clerk"` to appearance, do NOT import `@clerk/themes/shadcn.css`.

## pnpm workspace packages
Local packages must use `"workspace:*"` protocol in package.json (NOT `"*"`). Also requires `pnpm-workspace.yaml` at root listing all workspace globs.

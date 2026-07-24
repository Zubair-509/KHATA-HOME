# Khata — Design Document Specification (DDS)

| Field | Value |
|---|---|
| Product | Khata — Building Expense Tracker |
| Version | 2.1 |
| Owner | Zubair (V Core) |
| Platform | Responsive Website (desktop-first, mobile-friendly) |
| Target Viewport | 1280px+ primary, responsive down to 360px |

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 2.0 | Initial | Dashboard-first design, forest green palette, Playfair/DM Sans/JetBrains Mono stack |
| 2.1 | Jul 2026 | Added Login screen (Section 7.0), Logout in Settings (Section 7.7), auth loading state |

---

## 1. Design Philosophy

Khata is a **website**, not a mobile-only PWA — the owner can sit at a desktop at month-end, see everything at a glance, and use real charts to understand trends. The design direction matches the visual language of the **Hisaab hackathon project**: refined utilitarian with Pakistani warmth, forest green as primary, ledger-meets-dashboard feel.

### Core Principles
1. **Ledger meets dashboard** — the diary-style monthly summary remains the emotional core, but the Home/Dashboard is now a real analytics view with charts.
2. **Forest green + Pakistani warmth** — matches the Hisaab hackathon palette for visual consistency across V Core's products.
3. **Numbers are the hero** — currency amounts get a distinct typeface (Playfair Display) and tabular alignment.
4. **Desktop-first, mobile-graceful** — layouts use a sidebar/content structure on desktop, collapsing to a stacked single-column on mobile.
5. **Data tells a story** — charts aren't decoration; each one answers a specific question.
6. **v2.1 addition — Auth is invisible** — login is a single click; the screen is minimal and never feels like a barrier.

---

## 2. Color System

Adopting the **exact Hisaab hackathon design tokens** for brand consistency across V Core products:

| Token | Hex | Usage |
|---|---|---|
| `--color-primary-900` | `#1B4332` | Primary brand, headers, primary buttons, sidebar |
| `--color-primary-700` | `#2D6A4F` | Hover states on primary elements |
| `--color-primary-500` | `#40916C` | Interactive elements, links, active states |
| `--color-primary-300` | `#74C69D` | Progress indicators, subtle highlights |
| `--color-primary-100` | `#D8F3DC` | Inflow row background, success surfaces |
| `--color-primary-50` | `#F0FAF3` | Hover tint on inflow rows |
| `--color-bg-base` | `#F8F4EE` | Page background (warm cream) |
| `--color-bg-card` | `#FFFFFF` | Card and panel backgrounds |
| `--color-neutral-900` | `#1C1C1E` | Primary body text |
| `--color-neutral-700` | `#374151` | Secondary text, labels |
| `--color-neutral-500` | `#6B7280` | Placeholder text, metadata |
| `--color-neutral-300` | `#D1D5DB` | Borders, dividers |
| `--color-neutral-100` | `#F3F4F6` | Alternate row background |

### Semantic Colors (Inflow / Outflow / Pending)

| Role | Text | Background | Border |
|---|---|---|---|
| Inflow (money received) | `#2D6A4F` | `#D8F3DC` | `#40916C` |
| Outflow (money paid out) | `#9B1C1C` | `#FEE2E2` | `#EF4444` |
| Pending / Unclear | `#92400E` | `#FEF3C7` | `#F59E0B` |
| Neutral / Manual entry | `#374151` | `#F9FAFB` | `#D1D5DB` |

### Chart Colors

| Token | Hex | Usage |
|---|---|---|
| `--chart-inflow` | `#40916C` | Inflow series |
| `--chart-outflow` | `#EF4444` | Outflow series |
| `--chart-net` | `#1B4332` | Net series |
| `--chart-accent` | `#74C69D` | Secondary highlight |

### Color Usage Rules
- Inflow/Outflow rows use **color + icon/label**, never color alone (accessibility)
- All text/background combinations meet WCAG AA (4.5:1 normal text, 3:1 large text)
- `#1B4332` on white achieves 12.6:1 contrast — use freely for headers and primary text

---

## 3. Typography

Matching Hisaab hackathon stack exactly for cross-product consistency:

| Role | Font | Fallback |
|---|---|---|
| Headings / Display | **Playfair Display** | Georgia, serif |
| Body / UI | **DM Sans** | system-ui, sans-serif |
| Currency / Numbers | **JetBrains Mono** | Menlo, monospace |

```css
--font-display: 'Playfair Display', Georgia, serif;
--font-body:    'DM Sans', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', monospace;
```

Currency amounts use `font-variant-numeric: tabular-nums` so columns align.

### Type Scale (matches Hisaab tokens)

| Token | Size | Line Height | Weight | Use |
|---|---|---|---|---|
| `--text-display` | 48px | 1.1 | 700 | Hero dashboard totals (Net Position) |
| `--text-title-xl` | 32px | 1.2 | 700 | Page titles, Monthly Summary header |
| `--text-title-lg` | 24px | — | 600 | Section headers (Dashboard cards) |
| `--text-title-md` | 20px | — | 600 | Floor section headers |
| `--text-body-lg` | 16px | — | 400 | Default body text |
| `--text-body-md` | 14px | — | 400/600 | Labels, secondary text |
| `--text-body-sm` | 12px | — | 400 | Captions, dates, chart labels |
| `--text-label` | 11px | — | 600 | Uppercase micro-labels |
| `--text-mono-lg` | 18px | — | 500 | Floor totals, bill amounts |
| `--text-mono-md` | 14px | — | 500 | Inline amounts in tables/lists |

---

## 4. Layout System (Website)

### Desktop Layout (≥1024px)
```
┌──────────┬─────────────────────────────────────────┐
│          │  Top Bar: Page Title         [Settings] │
│ Sidebar  ├─────────────────────────────────────────┤
│          │                                          │
│ • Home   │              Main Content                │
│ • New    │           (max-width: 1100px,            │
│   Month  │            centered)                     │
│ • History│                                          │
│ • Annual │                                          │
│ • Settings│                                         │
│          │                                          │
└──────────┴─────────────────────────────────────────┘
```
- Sidebar: fixed 220px width, `--color-primary-900` background, white/cream text
- Main content: `--color-bg-base` background, 32px padding
- Sidebar collapses to a top horizontal nav bar below 1024px

### Mobile Layout (<768px)
- Single column, stacked cards
- Sidebar becomes a bottom tab bar or hamburger menu
- Charts resize to full-width, simplified (fewer gridlines, larger touch targets)

### Spacing Scale (8px base)
`4 · 8 · 12 · 16 · 24 · 32 · 40 · 56 · 72 · 96`

### Grid
- Dashboard cards: 12-column grid, gap 24px
- Card widths: full (12), half (6), third (4) — used for chart layouts

---

## 5. Component Library

### 5.1 Buttons

| Variant | Background | Text | Border |
|---|---|---|---|
| Primary | `--color-primary-900` | white | none |
| Secondary | `--color-neutral-100` | `--color-primary-900` | 1px `--color-neutral-300` |
| Ghost | transparent | `--color-primary-500` | none |
| Danger | white | `--color-expense-text (#9B1C1C)` | 1px `--color-expense-text (#9B1C1C)` |

- Height: 44px (desktop), Radius: 8px, Font: DM Sans 15px / 600

### 5.2 Cards

**Dashboard Stat Card**:
```
┌─────────────────────────────────┐
│  TOTAL INFLOW (THIS MONTH)       │  ← caption, uppercase, --color-neutral-500
│  PKR 68,400                      │  ← --text-display, mono, --color-primary-900
│  ▲ 4.2% vs last month            │  ← caption, #2D6A4F
└─────────────────────────────────┘
```
- Background: white, Border: 1px `--color-neutral-300`, Radius: 12px, Padding: 24px
- Subtle shadow on hover (desktop): `0 4px 12px rgba(0,0,0,0.04)`

**Chart Card**:
```
┌─────────────────────────────────────────────┐
│  Income vs Expense — Last 6 Months           │  ← h3
│                                               │
│  [ Chart Area ]                              │
│                                               │
│  Legend: ■ Inflow  ■ Outflow  ■ Net          │
└─────────────────────────────────────────────┘
```

### 5.3 Status Badges
Same as before — Paid (green), Pending (amber), Draft (gray). Pill shape, uppercase, 12px font.

### 5.4 Tables (Website-Appropriate)
History list as a proper data table on desktop:

```
┌────────────┬──────────┬──────────┬──────────┬─────────┐
│ Month      │ Inflow   │ Outflow  │ Net      │ Status  │
├────────────┼──────────┼──────────┼──────────┼─────────┤
│ Jan 2026   │ 68,400   │ 41,200   │ 27,200   │ [PAID]  │
│ Dec 2025   │ 68,800   │ 41,500   │ 27,300   │ [PAID]  │
└────────────┴──────────┴──────────┴──────────┴─────────┘
```
- Row height: 56px, hover highlight `--color-neutral-100`, click → Summary view
- Mobile: collapses to stacked cards (one per month)

---

## 6. Dashboard — Charts

### 6.1 Income vs. Expense Trend (Line/Area Chart)
- X-axis: last 6–12 months
- Two lines: Inflow (`--chart-inflow`), Outflow (`--chart-outflow`)
- Optional shaded area between lines showing Net
- Tooltip on hover shows exact PKR values for that month

### 6.2 Per-Floor Expense Breakdown (Donut/Pie Chart)
- Current month only
- Segments: Ground (Owner outflow), 1st Floor Total, 2nd Floor Total
- Center label: total building expense for the month
- Colors: `--chart-inflow`, `--chart-outflow`, `--chart-net`

### 6.3 Annual Summary — 12-Month Bar Chart
- Grouped bars per month: Inflow, Outflow, Net
- X-axis: Jan–Dec
- Used on the Annual Summary page above the month-by-month table

### 6.4 Pending Items Widget
- Not a chart — a small list/card showing current month's pending items with amber badges and a "Go to entry" link

---

## 7. Screen-by-Screen Specifications

### 7.0 Login Screen (NEW in v2.1)

This screen appears before everything else if the user is not authenticated. It is minimal — auth is one click.

```
┌──────────────────────────────────────────────────────┐
│                                                        │
│                                                        │
│                   [ Khata wordmark ]                   │
│              Your Building's Ledger, On the Web        │
│                                                        │
│                                                        │
│          ┌──────────────────────────────────┐          │
│          │                                  │          │
│          │  Sign in to access your ledger   │          │
│          │                                  │          │
│          │    [ Log In ]  ← primary button  │          │
│          │                                  │          │
│          └──────────────────────────────────┘          │
│                                                        │
│                                                        │
└──────────────────────────────────────────────────────┘
```

**Design rules:**
- Full-page, `--color-bg-base` background
- Center-aligned card on white, max-width 400px, radius 16px, shadow-md
- Khata wordmark in Playfair Display, 36px, `--color-primary-900`
- Tagline in DM Sans, 14px, `--color-neutral-500`
- "Sign in to access your ledger" — DM Sans, 16px, `--color-neutral-700`
- "Log In" button — Primary variant (full width within the card)
- No "Sign Up" button or link — auth is unified; new users are registered automatically on first login
- Loading state: "Checking your session…" spinner replaces the card while auth state is being resolved

**Behaviour:**
- Clicking "Log In" redirects to `/api/login?returnTo=/` (Replit OAuth)
- After successful auth, user is redirected back to Dashboard
- If already authenticated, this screen is never shown

### 7.1 Onboarding (First Visit After Login)
Single-page setup form (not a multi-step wizard, since desktop has room):
- Tenant names (1st, 2nd floor)
- Default rent amounts
- SSGC / Motor split ratios
- "Save & Continue" → Dashboard
- Shown only once per user (tracked via `onboarded` flag in PostgreSQL settings)

### 7.2 Dashboard (Home)

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                                    [Settings] │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Inflow   │ │ Outflow  │ │ Net      │ │ Pending  │    │
│  │ 68,400   │ │ 41,200   │ │ 27,200   │ │ 2 items  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│  ┌─────────────────────────┐ ┌─────────────────────┐    │
│  │ Income vs Expense Trend  │ │ Per-Floor Breakdown │    │
│  │ [Area Chart]              │ │ [Donut Chart]       │    │
│  └─────────────────────────┘ └─────────────────────┘    │
│                                                           │
│  [ Continue This Month ]  or  [ Start New Month ]        │
│                                                           │
│  Recent Months (table)                                    │
│  ...                                                      │
└─────────────────────────────────────────────────────────┘
```

### 7.3 New Month Entry
Same field structure as before (Ground → 1st → 2nd Floor cards), but laid out as a two-column form on desktop: form on the left, live-calculation summary sticky on the right.

### 7.4 Monthly Summary (Diary Replica)
Unchanged in structure — still the diary-format replica — but typography updated to Playfair Display headers + JetBrains Mono amounts + forest green accents. Add a small chart at the bottom: "This Month vs Last Month" mini bar comparison.

### 7.5 History (Table View)
Desktop: full data table (Section 5.4). Mobile: stacked cards. Filter chips for year remain.

### 7.6 Annual Summary
Structure unchanged, but add the 12-month bar chart (Section 6.3) at the top, before the month-by-month table.

### 7.7 Settings (updated in v2.1)
Content unchanged — Tenants, Default Rent, Bill Splits, Data export/clear, About.

**v2.1 addition:** A "Log Out" button is added at the bottom of the Settings screen, in the Danger variant. Clicking it ends the session and returns to the Login screen. The label is simply "Log Out" — no mention of Replit or the auth provider.

```
┌─────────────────────────────────────────────────────────┐
│  Settings                                                │
│  ...existing sections unchanged...                       │
│  ─────────────────────────────────────────────────────  │
│  Account                                                 │
│  Logged in as: [user's name or email]                    │
│  [ Log Out ]  ← Danger variant button                   │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Auth UX Rules (v2.1)

- **Never say "Replit" or "Replit Auth"** in any user-facing text.
- **Never show a password field** — there is none; auth is via OAuth.
- **"Log In" / "Log Out"** are the only labels used. No "Sign Up" (new users self-register on first login).
- The Login screen is the only unauthenticated surface. All other screens require auth.
- Loading state (checking session) uses a centred spinner or skeleton — never a flash of unauthenticated content.

---

## 9. Tech Stack Additions (v2.1)
- **Auth**: Replit OAuth + Express sessions stored in PostgreSQL
- **ORM**: Drizzle ORM with Drizzle Kit for schema push
- **API**: Express 5 backend serving `/api/*` routes
- **Charting**: Recharts
- **Routing**: React Router (multi-page feel)
- **Layout**: Tailwind CSS grid/flex for sidebar + content structure

---

## 10. Design Tokens (CSS Variables)

```css
:root {
  /* ── BRAND COLORS ── */
  --color-primary-900: #1B4332;
  --color-primary-700: #2D6A4F;
  --color-primary-500: #40916C;
  --color-primary-300: #74C69D;
  --color-primary-100: #D8F3DC;
  --color-primary-50:  #F0FAF3;

  /* ── SEMANTIC COLORS ── */
  --color-inflow-text:    #2D6A4F;
  --color-inflow-bg:      #D8F3DC;
  --color-inflow-border:  #40916C;

  --color-outflow-text:   #9B1C1C;
  --color-outflow-bg:     #FEE2E2;
  --color-outflow-border: #EF4444;

  --color-pending-text:   #92400E;
  --color-pending-bg:     #FEF3C7;
  --color-pending-border: #F59E0B;

  /* ── NEUTRALS ── */
  --color-neutral-900: #1C1C1E;
  --color-neutral-700: #374151;
  --color-neutral-500: #6B7280;
  --color-neutral-300: #D1D5DB;
  --color-neutral-100: #F3F4F6;
  --color-neutral-50:  #F9FAFB;

  /* ── BACKGROUNDS ── */
  --color-bg-base:    #F8F4EE;
  --color-bg-card:    #FFFFFF;
  --color-bg-overlay: rgba(0, 0, 0, 0.4);

  /* ── CHARTS ── */
  --chart-inflow:  #40916C;
  --chart-outflow: #EF4444;
  --chart-net:     #1B4332;
  --chart-accent:  #74C69D;

  /* ── TYPOGRAPHY ── */
  --font-display: 'Playfair Display', Georgia, serif;
  --font-body:    'DM Sans', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', monospace;

  --text-display:   3rem;      /* 48px */
  --text-title-xl:  2rem;      /* 32px */
  --text-title-lg:  1.5rem;    /* 24px */
  --text-title-md:  1.25rem;   /* 20px */
  --text-body-lg:   1rem;      /* 16px */
  --text-body-md:   0.875rem;  /* 14px */
  --text-body-sm:   0.75rem;   /* 12px */
  --text-label:     0.6875rem; /* 11px */
  --text-mono-lg:   1.125rem;  /* 18px */
  --text-mono-md:   0.875rem;  /* 14px */

  /* ── SPACING ── */
  --space-1:  4px;
  --space-2:  8px;
  --space-3:  12px;
  --space-4:  16px;
  --space-5:  20px;
  --space-6:  24px;
  --space-8:  32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ── BORDER RADIUS ── */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-xl:   16px;
  --radius-full: 9999px;

  /* ── SHADOWS ── */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 20px 60px rgba(0,0,0,0.12);

  /* ── TRANSITIONS ── */
  --transition-fast:   150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow:   400ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## 11. Iconography
Lucide Icons, stroke width 1.5. Add: `TrendingUp`, `PieChart`, `BarChart3` for dashboard chart card headers. `LogOut` for the logout button in Settings.

---

## 12. Accessibility
Same standards as Hisaab (contrast ratios per Section 2, status via color+label+icon, tabular numerals, focus rings). Charts must include text-equivalent data (table view toggle or tooltips accessible via keyboard). Form inputs always have associated `<label>` elements. Dashboard amounts get descriptive `aria-label`s (e.g., `aria-label="Total inflow this month: 68,400 rupees"`). Login button has `aria-label="Log in to Khata"`.

---

## 13. Build Order (v2.1 implementation)

1. **Login screen** — the new entry point; build first so the auth flow can be tested end-to-end
2. **Settings screen update** — add Account section + Log Out button
3. **Data layer swap** — replace IndexedDB calls with API calls (settings, monthly records)
4. **Onboarding** — unchanged visually; only data layer changes
5. **All other screens** — Dashboard, New Month, History, Monthly Summary, Annual — unchanged visually; only data layer changes

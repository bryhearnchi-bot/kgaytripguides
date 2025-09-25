# Admin UI Redesign Plan (ui-redesign branch)

We are rebuilding the Atlantis/KGAY custom CRM admin on the `ui-redesign` branch using the minimal shadcn-inspired table concept as our baseline. The goals are to modernise the talent/trip management UX, keep parity with existing Supabase CRUD flows, and ensure the experience stays aligned with the ocean-first brand.

## 1. Discovery & Audit
- Catalogue the current admin routes (`/admin/trips`, `/admin/ships`, `/admin/artists`, `/admin/locations`, `/admin/users`, `/admin/party-themes`, `/admin/info-sections`, etc.) and record the data they fetch/mutate.
- Review existing components (tables, filters, dialogs, forms) to understand shared logic, state hooks, and Supabase service calls.
- Inventory Supabase policies (RLS) and API wrappers used in each module so we can confirm CRUD parity after the redesign.

### Current Admin Implementation Audit (summary)

| Admin Tab / Feature | Front-end Entry | Primary API Endpoints | Supabase Tables / Services | Notes |
| --- | --- | --- | --- | --- |
| Trips list + stats | `client/src/pages/admin/trips.tsx` | `GET /api/trips`, `DELETE /api/trips/:id` (plus the create/edit flows in `trip-form.tsx`, duplication, export/import endpoints) | `trips`, `itinerary`, `events`, `trip_info_sections` via `tripStorage` & related storages in `server/routes/trips.ts` | Uses React Query & `useSupabaseAuthContext` for role checks. Additional wizard (`trip-wizard.tsx`) pulls `/api/ships`, `/api/locations`, `/api/talent`. |
| Ships | `client/src/pages/admin/ships.tsx` | `GET/POST/PUT/DELETE /api/ships` | `ships` (Drizzle via `server/routes/trips.ts` helpers) | Uses shared `api` client wrapper. CRUD gated by `requireContentEditor`. |
| Locations | `client/src/pages/admin/locations.tsx` | `GET /api/locations`, `POST/PUT/DELETE /api/locations/:id` | `locations` (Drizzle in `server/routes/locations.ts`) | Supports search & filters; deletion restricted when referenced. |
| Artists / Talent | `client/src/pages/admin/artists.tsx` | `GET/POST/PUT/DELETE /api/talent`, `GET /api/talent-categories`, `POST /api/talent/bulk-assign` | `talent`, `talent_categories`, `trip_talent` via `server/routes/media.ts` | Handles social links + bio fields; deletion blocked if talent assigned to events. |
| Party Themes | `client/src/pages/admin/themes.tsx` | `GET/POST/PUT/DELETE /api/party-themes` | `party_themes` (`server/routes/party-themes.ts`) | Tracks usage counts; crud restricted by `requireContentEditor`. |
| Info Sections | `client/src/pages/admin/info-sections.tsx` | `GET/POST/PUT/DELETE /api/admin/info-sections` | `trip_info_sections` | Includes bulk reorder + publish toggles. Requires admin token (`requireTripAdmin`). |
| Users & Invitations | `client/src/pages/admin/users.tsx`, `components/admin/InviteUserModal.tsx` | `GET/POST/PUT/DELETE /api/admin/users`, `PATCH /api/admin/users/:id/status`, `POST /api/admin/users/invite`, `/api/csrf-token` | Supabase Auth (`profiles` table), invites stored via `invitations` | Uses Supabase session token for Authorization. RLS enforced through `requireTripAdmin`/`requireSuperAdmin`. |
| Settings | `client/src/pages/admin/settings.tsx` | `GET /api/admin/settings`, `POST /api/admin/settings`, `POST /api/admin/settings/export`, `/api/admin/settings/initialize` | Mix of config persistence and supabase env storage | Provides global toggles (email, supabase keys). |
| Profile & Password | `client/src/pages/admin/profile.tsx` | `GET /api/admin/profile`, `POST /api/admin/change-password` | Uses supabase auth + `profiles` | Allows user to edit their Supabase profile and password. |
| Trip Wizard & Trip Detail tabs | `client/src/pages/admin/trip-wizard.tsx`, `trip-detail.tsx`, `components/admin/TripDetailsTab.tsx` | Multi-endpoint (ships/locations/talent/trips) | same tables as above | Provide guided onboarding / detail editing for a trip. |

## 2. Design System Alignment
- Adopt the **minimal admin table** mockup as the default list-view style (rounded panels, pill filters, airy spacing).
- Establish supporting components: sticky header with Atlantis logo, KGAY Travel badge, KokonutUI profile dropdown, left sidebar navigation (Trips, Ships, Artists, Locations, Users, Party Themes, Info).
- Define colour tokens that extend the existing ocean palette (`base`, `surface`, `brand`, accent gradients) and document how they map to Tailwind/shadcn classes for consistent use.

### UI Tokens & Component Architecture

| Token | Value / Usage | Notes |
| --- | --- | --- |
| `--bg-base` | `#0b1222` (midnight navy) | Page background; matches landing redesign. |
| `--bg-surface` | `#10192f` | Panel/card surfaces; 80–90% opacity with blur. |
| `--border-muted` | `rgba(255,255,255,0.08)` | Subtle borders/dividers. |
| `--brand-primary` | `#22d3ee` | Action buttons, highlights. |
| `--brand-secondary` | `linear-gradient(135deg, #1d4ed8, #22d3ee)` | Header accents and selection state. |
| `--success` | `#34d399` | Active status badges. |
| `--danger` | `#fb7185` | Destructive actions. |

**Core Layout Components**

- `AdminShell` (new) – wraps the entire admin app with sidebar + header, renders KokonutUI profile dropdown in top-right, accepts nav configuration.
- `AdminSidebar` – vertical nav with logo stack (Atlantis primary, KGAY secondary), role-aware sections, collapse behaviour.
- `AdminHeader` – sticky gradient bar containing breadcrumbs, search, and the profile dropdown (KokonutUI `ProfileDropdown` on the right).
- `AdminTable` – generic table wrapper using shadcn `Table` primitives, adds shadow, alternating row styles, empty state, pagination slots.
- `FilterBar` – pill-shaped filters + search input (shared across Artists/Trips/etc.).
- `StatusBadge` + `CategoryChip` – unify badge styling; map to tokens above.
- `PageStats` – optional top-of-page stat cards (reuse `Card` but adopt new palette).

**3 Breakpoints to honour**

- Desktop (`min-width: 1024px`): Sidebar expanded, tables show full columns.
- Tablet (`768px–1023px`): Sidebar collapsible, table columns condense (hide actions label, use icons).
- Mobile (<768px): Sidebar offcanvas, tables fall back to card layout (optional second phase; current scope ensures at least horizontal scroll). 

## 3. Component Implementation
- Build reusable primitives in `components/admin/`:
  - `AdminLayout` (header + sidebar + main container using KokonutUI profile dropdown).
  - `AdminTable` wrapper with slots for columns, bulk actions, pagination.
  - Shared Pills/Filters (`StatusBadge`, `CategoryChip`), search input, action buttons.
- Replace each list view with the new layout while keeping current query hooks and Supabase client usage intact.
- Ensure forms/modals (create/edit/delete) are restyled to match the new surface but reuse existing validation (Zod/React Hook Form) and service calls.

## 4. Supabase Integration & CRUD Verification
- Confirm each admin module still reads/writes through the existing Supabase services or RPC endpoints; update imports only if necessary.
- Manually validate RLS coverage by:
  - Creating/deleting sample records via UI and verifying changes persist in Supabase.
  - Testing with accounts of different roles (admin, content_manager, viewer) to ensure policies restrict access as before.
- Update unit/integration tests (Vitest/Jest/Playwright) to reflect new components or DOM changes, focusing on table rendering, filter behaviour, and create/edit/delete flows.

## 5. QA & Handoff
- Run an accessibility pass (keyboard focus states, contrast) and responsive checks (desktop → tablet → mobile).
- Document any new utilities or component guidelines in `docs/` (e.g., how to add a new admin section using the layout).
- Prepare a concise “before/after” summary for PR reviewers and include screenshots of key tabs.

## Milestones
1. Audit + component architecture draft (1 day).
2. Implement Artists module as reference (1–2 days) and confirm Supabase CRUD.
3. Roll out redesign to remaining tabs (2–3 days).
4. QA, tests, docs update, and final polish (1 day).

> Note: All work happens on `ui-redesign`. Keep the branch rebased, and coordinate with backend changes if new Supabase columns/endpoints are introduced.

## Current Progress Snapshot
- **Shell**: `AdminLayout` now uses the ocean-themed collapsible sidebar, Kokonut UI profile dropdown in the header (mobile-only top bar), and removes the duplicate banner. Sidebar nav items align to the redesign aesthetic.
- **Artists tab**: Migrated to the new layout; Supabase CRUD intact; footer shows exact row count.
- **Trips tab**: Rebuilt with the new design system (`FilterBar`, `AdminTable`, `StatusBadge`, `CategoryChip`, `PageStats`) and refreshed quick view/report modals. Needs QA on archive/delete/export flows and responsive states before marking complete.
- **Remaining**: Ships, Locations, Themes, Info Sections, Users, Settings, Profile still queued for conversion using the new primitives. Testing pass required once modules are migrated.

## 6. Execution Checklist

| Status | Module | Conversion Notes |
| --- | --- | --- |
| ✅ | Artists (`client/src/pages/admin/artists.tsx`) | Uses the redesigned layout via `AdminLayout` + new table primitives. Treat as the reference implementation for list/table UX, filtering, and modals. |
| 🔄 | Trips (`client/src/pages/admin/trips-management.tsx`) | UI refactor landed with shared primitives + modals restyle. Next session: QA archive/delete/export, verify counts for grouped stats, and wire up shared filter hook once extracted. |
| ⏳ | Ships (`client/src/pages/admin/ships.tsx`) | Mirror Trips once complete. Simplify table columns, add vessel status badge, reuse shared bulk actions. Ensure CRUD hooks point to existing `/api/ships` endpoints. |
| ⏳ | Locations (`client/src/pages/admin/locations.tsx`) | Adopt shared search + filter pills (region, status). Implement inline drawer for editing to avoid full dialogs where possible. Validate deletion guard messaging remains clear. |
| ⏳ | Themes (`client/src/pages/admin/themes.tsx`) | Convert list to card-with-table hybrid using `AdminTable` + badge styling. Highlight usage count and status chips. |
| ⏳ | Info Sections (`client/src/pages/admin/info-sections.tsx`) | Move reorder UI into redesigned surface: sticky action bar, accent gradient for publish toggle. Keep bulk reorder logic intact. |
| ⏳ | Users (`client/src/pages/admin/users.tsx`) | Integrate new table; add role badge + active/inactive pill. Ensure invite modal mounts within redesigned layout and matches glass surface tokens. |
| ⏳ | Settings (`client/src/pages/admin/settings.tsx`) | Rewrap forms inside `AdminShell` stat cards. Use two-column layout for env toggles vs. content settings. |
| ⏳ | Profile (`client/src/pages/admin/profile.tsx`) | Apply redesigned surface with minimal form styling, match new typography tokens. |

### Shared Component Work
- ✅ Scaffolded `AdminTable`, `FilterBar`, `StatusBadge`, `CategoryChip`, and `PageStats` in `client/src/components/admin/`; confirm API is stable before rolling into other modules.
- ⏳ Extract the search + pill filter logic from Artists/Trips into a reusable hook (planned: `useAdminFilters`) to reduce duplication as Ships and Locations adopt the pattern.
- ⏳ Audit remaining modals/dialogs and restyle them once for the redesign tokens (glass surface, border-muted) to avoid per-page overrides.

## 8. Session Notes – Admin Rebuild Progress
- **Shared primitives added**: Introduced the new admin UI kit (`AdminTable`, `FilterBar`, `StatusBadge`, `CategoryChip`, `PageStats`) and wired them into the Trips management experience. Artists still uses bespoke code; plan to migrate after verifying Trips.
- **Trips redesign**: Legacy table UX replaced with the ocean-glass variant. Status filtering now powered by `StatusFilter` state + grouped helpers. Quick view and performance report dialogs match the redesign aesthetic. All CRUD mutations remain the original fetch calls—needs manual smoke test.
- **Open follow-ups (next working session)**:
  1. Exercise archive/delete/export on `client/src/pages/admin/trips-management.tsx` to confirm the new layout did not break API wiring (check toast copy + loading states).
  2. Extract shared filter logic into `useAdminFilters` (or similar) and backfill Artists to use it so future modules inherit consistent behaviour.
  3. Add responsive polish: ensure the new table scroll gutter behaves on tablet/mobile, validate the stats grid collapses gracefully, and tweak button spacing if needed.
  4. Update Vitest snapshots/selectors for Trips once functionality is confirmed; note that `npm run check` currently fails due to long-standing type errors across unrelated modules—address separately before CI.
- **Context for tomorrow**: Work paused after swapping in the new Trips layout. No tests were run because `npm run check` surfaces ~200 existing TypeScript violations in other areas (auth, mobile, server). Focus next time on behavioural QA of Trips, shared hook extraction, then proceed to Ships conversion using the new primitives.

## 7. QA, Testing, and Handoff
- **Accessibility**: Verify focus order, skip links in `AdminLayout`, and contrast on badges/actions post-conversion.
- **Responsiveness**: For each module, screenshot breakpoints at 1440, 1024, and 768 to confirm sidebar collapse behaviour and table overflow handling.
- **Regression Testing**: Update Vitest suites that assert on DOM selectors for tables (Trips, Artists, Users). Run `npm run test:run` after each module converts; rerun Playwright smoke (`npm run test:e2e`) before shipping.
- **Supabase Parity**: Smoke-test CRUD per module using seeded data. Confirm Supabase policies by exercising admin vs. content_manager roles in staging.
- **Docs & Handoff**: Capture before/after screenshots of each admin tab, add notes on adding new sections via `AdminLayout`, and mention completed test runs in the PR template.

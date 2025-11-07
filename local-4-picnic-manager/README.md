# Local 4 Picnic Manager

Production-ready WordPress plugin delivering a premium Local Picnic operations dashboard for coordinators and volunteers. The SPA mounts inside `wp-admin` (menu: **Local Picnic**) and via the `[l4p_dashboard]` shortcode on the front-end for authenticated members, and the compiled assets ship with the plugin so it works immediately after activation.

## Features

- **Viewport locked SPA** with fixed sidebar/header, responsive breakpoints, and polished design tokens – the body never scrolls, only content regions.
- **Roles & permissions** for `l4p_coordinator` (full control) and `l4p_volunteer` (limited with capability toggles managed in Settings).
- **Custom data layer** via dedicated tables (`l4p_tasks`, `l4p_funding_tx`, `l4p_posts`, `l4p_comments`, `l4p_notifications`, `l4p_crew`).
- **Secure REST API** under `/wp-json/l4p/v1` with nonce validation, capability checks, sanitised payloads, and `$wpdb->prepare` queries.
- **Modules** covering dashboard analytics, task management with optimistic workflows, funding ledger + CSV export, crew directory/avatars, threaded community chat + moderation, notifications, and coordinator settings (branding, theme colours, timezone/currency, volunteer toggles).
- **Crew auto-sync** mirrors WordPress/Ultimate Member users into the crew roster with role mapping, avatars, and profile shortcuts.
- **Branding controls** let coordinators customise the navigation title, upload an icon, and adjust primary/accent palette live.
- **WP-CLI seeding** (`wp l4p seed`) provisions demo users (1 coordinator, 2 volunteers) with sample data.

## Installation

1. Upload or symlink the plugin folder into your WordPress installation and activate **Local 4 Picnic Manager**.
2. Visit **Local Picnic** inside `wp-admin` or place `[l4p_dashboard]` on a page to load the dashboard instantly.
3. (Optional) Package a distributable ZIP:

   ```bash
   npm run package
   ```

   Outputs `dist/local-4-picnic-manager.zip` excluding development-only files.

4. (Optional) Seed demo data:

   ```bash
   wp l4p seed [--force]
   ```

   Creates coordinator `coordinator@local4picnic.test` (`coordinator123`) plus volunteers `victor@local4picnic.test` / `violet@local4picnic.test` with sample tasks, funding, community posts, and notifications. Pass `--force` to refresh seeded content safely.

> The dashboard bundle lives in `build/index.js`. You can customise its behaviour and styles directly—no additional tooling required. Re-run `npm run package` afterwards if you need a refreshed ZIP.

## Shortcode usage

Add `[l4p_dashboard]` to any page. Logged-out visitors see a login prompt; authenticated users receive the full SPA once the assets from `npm run build` are present (otherwise a reminder card prompts administrators to compile the bundle).

## REST endpoints (selection)

| Route | Description |
| --- | --- |
| `GET /l4p/v1/tasks` | List tasks (filters: `status`, `assignee`), ordered with “my tasks” first. |
| `POST /l4p/v1/tasks` | Create task (coordinator or volunteers if enabled). Notifications include assigner/assignee context. |
| `POST /l4p/v1/tasks/{id}/status` | Update status (assignee or coordinator). Optimistic UI with rollback. |
| `GET|POST|PUT|DELETE /l4p/v1/funding` | Funding CRUD with coordinator-only writes, CSV export at `/funding/export`. |
| `GET /l4p/v1/crew` | Crew roster auto-synced from WordPress users; `POST /crew/{id}/avatar` handles ≤1 MB uploads. |
| `GET|POST /community` | Chat threads + replies with draft persistence, 15-minute delete window, moderation requests. |
| `GET /notifications` | Timeline + badge, `POST` helpers to mark read/all. |
| `GET|POST /settings` | Branding, theme, timezone/currency, volunteer toggles, WP role sync. |

All endpoints expect the WordPress REST nonce provided to the SPA (`X-WP-Nonce`).

## Design system & UX

- Palette: Primary `#0B5CD6`, Accent `#06B6D4`, Success `#22C55E`, Warning `#F59E0B`, Background `#F6F8FB`, Cards `#FFFFFF` (coordinators can override primary/accent live).
- Components use 16px radii, premium shadows, skeleton loaders, and accessible focus outlines.
- Layout enforces internal scroll regions only; header/sidebar remain fixed at every breakpoint.

## Development scripts

- `npm run build` – rebuild JS/CSS bundle via `@wordpress/scripts` (Node 18+).
- `npm run package` – rebuild then zip the plugin into `dist/local-4-picnic-manager.zip`.
- `npm run clean` – remove `build/` and `dist/` artefacts.

## Testing notes

- **PHP:** Activate the plugin, run `wp l4p seed`, and exercise each module; no notices should surface.
- **JS:** A Playwright/Cypress smoke suite is recommended for full regression coverage (not bundled).

## Uninstall considerations

Tables persist for auditability. To completely remove data, manually drop the `wp_l4p_*` tables and delete custom roles/capabilities or extend the plugin with a custom uninstall routine.

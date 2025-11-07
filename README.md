# Local 4 Picnic – Role Dashboard

Local 4 Picnic – Role Dashboard is a production-ready WordPress plugin that equips coordinators and volunteers with a premium operations hub directly on the front end. Drop a shortcode onto any protected WordPress page and the role-aware React portal appears for logged-in members, letting teams orchestrate picnic logistics, finances, crew, notifications, and community chatter from one place.

## Feature highlights

- **Role-aware portal** – ships a Tailwind-inspired React SPA via the `[local4picnic_dashboard]` shortcode, gated to the custom `l4p_coordinator` and `l4p_volunteer` roles (MemberPress compatible).
- **Structured data layer** – activation seeds dedicated tables (`l4p_tasks`, `l4p_funding_tx`, `l4p_posts`, `l4p_comments`, `l4p_notifications`) with indexes tuned for dashboard queries.
- **Full CRUD REST API** – `/wp-json/l4p/v1/...` endpoints handle tasks, funding, community posts/comments, crew management, settings, notifications, and dashboard aggregates with nonce + capability enforcement.
- **Realtime-friendly notifications** – automatic alerts fire on new members, task assignment/updates, funding transactions, and community replies. Coordinators can optionally send matching emails.
- **Premium analytics** – responsive cards surface My Tasks, a Chart.js donut and 7-day trend, notification timeline, and a live mini-feed – all styled with design tokens (`primary #0B5CD6`, `success #22C55E`, `warning #F59E0B`).
- **Crew operations** – coordinators can add/disable members, reset roles, capture skills, and bootstrap WordPress users directly from the Crew grid.
- **Settings controls** – configure branding, colors, timezone, currency, feature toggles (volunteer posting/task creation, post images, CSV export), and email notifications without leaving the UI.
- **Seed + tests ready** – includes a WP-CLI `wp l4p seed` command for demo data and Playwright scaffolding for happy-path automation.

## Installation

1. Copy this repository into your WordPress `wp-content/plugins/` directory (e.g. `wp-content/plugins/local-4-picnic-role-dashboard`).
2. Activate **Local 4 Picnic – Role Dashboard** from the Plugins screen. Activation registers roles and builds the required custom tables.
3. Assign users the `l4p_coordinator` or `l4p_volunteer` role (the seed command creates demo accounts).
4. Create or edit a WordPress page and add the `[local4picnic_dashboard]` shortcode. Logged-in coordinators receive full CRUD access while volunteers inherit read-limited experiences.

## Developer workflow

```bash
# Install JS dependencies
npm install

# Run the React build (outputs to build/index.js & style-index.css)
npm run build

# Live rebuild while developing the admin app
npm start

# PHP lint helper (optional)
find . -name "*.php" -not -path './vendor/*' -print0 | xargs -0 -n1 php -l
```

The bundled `build/index.js` is authored in vanilla React for portability. TypeScript sources live in `assets/src/` for local iteration with `@wordpress/scripts`.

## Phase 2 polish checklist

- ✅ Task drawer discussion threads with local-storage drafts and role-aware delete controls (`assets/src/views/TasksView.tsx`).
- ✅ Funding ledger supports coordinator-only delete while surfacing permission toasts for volunteers (`assets/src/views/FundingView.tsx`).
- ✅ Community feed exposes edit/delete moderation, respects volunteer posting toggle, and preserves reply drafts (`assets/src/views/CommunityView.tsx`).
- ✅ Notifications list supports mark-one/mark-all actions and keeps the sidebar badge in sync (`assets/src/views/NotificationsView.tsx`, `assets/src/index.tsx`).
- ✅ Crew management captures avatars, disable flags, and surfaces badges in the grid (`assets/src/views/CrewView.tsx`).
- ✅ Settings page includes email notification toggles plus subject/body templates (`assets/src/views/SettingsView.tsx`).
- ✅ Dashboard listens for refresh events so funding/task deletes update charts (`assets/src/views/DashboardView.tsx`).
- ✅ Playwright suite covers coordinator/volunteer workflows and the community toggle (`tests/playwright/e2e.spec.ts`).

## REST endpoints

All endpoints live under `https://example.com/wp-json/l4p/v1/` and require a valid nonce (`wp_create_nonce( 'wp_rest' )`) plus role capabilities:

| Resource | Path | Permissions |
| --- | --- | --- |
| Tasks | `/tasks`, `/tasks/<id>` | Volunteers can manage their own tasks when `volunteer_create_tasks` is on; coordinators can CRUD all tasks and assignments. |
| Funding | `/funding`, `/funding/<id>`, `/funding/export` | Coordinators manage funding; volunteers receive read-only access. |
| Community | `/community/posts`, `/community/posts/<id>`, `/community/posts/<id>/comments`, `/community/comments/<id>` | Coordinators moderate all content; volunteers can post/reply if enabled. |
| Notifications | `/notifications`, `/notifications/<id>/read` | Authenticated users retrieve and mark notifications. |
| Dashboard | `/dashboard` | Aggregated snapshot powering the landing cards. |
| Crew | `/crew`, `/crew/<id>` | Coordinators maintain roster details and roles. |
| Settings | `/settings` | Coordinators update plugin options and email toggles. |

## CLI utilities

Seed demo data (roles, users, sample tasks/funding/community content) with:

```bash
wp l4p seed
```

## Testing

Playwright specs live in `tests/playwright/`. Install dependencies (`npm install`) then run `npx playwright test` once your WordPress test environment is reachable. Expand the suite to cover project-specific flows.

## Uninstall considerations

Deactivating the plugin preserves custom tables and data for safety. Implement a bespoke uninstall routine if you need automatic cleanup of tasks, funding history, crew metadata, and notifications.

## License

Provided as-is for Local 4 Picnic initiatives. Customize the codebase to match your organization’s workflows and infrastructure.

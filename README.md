# Local 4 Picnic Manager

Local 4 Picnic Manager is a WordPress plugin that gives coordinators and volunteers a role-aware operations hub inside `wp-admin` and on any page via the `[l4p_dashboard]` shortcode. It bundles a locked-viewport dashboard, secure REST API, and custom database layer so crews can run tasks, funding, community chat, crew profiles, notifications, and settings without leaving WordPress – no build step required.

## Highlights

- **Premium SPA layout** – fixed sidebar + header shell that adapts across desktop and tablet widths while keeping the viewport free of page scroll.
- **Role-driven workflows** – `l4p_coordinator` receives full CRUD control; `l4p_volunteer` has read access with optional toggles for task creation and community posting.
- **Dedicated tables** – activation provisions `l4p_tasks`, `l4p_funding_tx`, `l4p_posts`, `l4p_comments`, `l4p_notifications`, and `l4p_crew` with indexes for fast lookups.
- **REST namespace** – `/wp-json/l4p/v1/*` routes enforce nonces, capability callbacks, and sanitised SQL via `$wpdb->prepare`.
- **Full module stack** – Dashboard analytics, Tasks, Funding (with CSV export and coordinator-only mutations), Crew directory + avatar upload, threaded Community feed with moderation window, Notifications centre, and Settings with branding/theme controls.
- **WordPress user sync** – optional toggle to automatically mirror every WordPress/Ultimate Member account into the Crew module, complete with WP role mapping and quick profile links.
- **Seed command** – `wp l4p seed` spins up demo users (1 coordinator, 2 volunteers) and realistic sample data for quick demos.

## Getting started

1. Copy `local-4-picnic-manager/` into `wp-content/plugins/` (or symlink) and activate **Local 4 Picnic Manager**.
2. Add the `[l4p_dashboard]` shortcode to any protected page or open **Local Picnic** in `wp-admin` to load the SPA instantly.
3. (Optional) Run `wp l4p seed [--force]` to populate demo content and accounts.

If you want to produce a distributable ZIP, run `npm run package` from the plugin folder (Node 18+ required).

For a deeper breakdown of endpoints, UI behaviour, and design tokens, see [`local-4-picnic-manager/README.md`](local-4-picnic-manager/README.md).

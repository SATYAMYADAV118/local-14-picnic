# Local 4 Picnic Manager

Production-ready WordPress plugin that powers a multi-section dashboard for the Local 4 picnic team. Drop the `[local4picnic_dashboard]` shortcode onto any page to provide volunteers and coordinators with a single place to manage tasks, funding, crew contacts, notifications, and community posts.

## Features

- **Shortcode dashboard** – renders premium cards, tab navigation, and dynamic lists that update via the WordPress REST API.
- **Custom data tables** – tasks, funding entries, crew records, notifications, and feed posts are stored in bespoke tables created during activation.
- **Role-aware controls** – Volunteer and Coordinator roles with granular capabilities; administrators inherit all permissions automatically.
- **REST endpoints** – CRUD routes under `local4picnic/v1` secure every interaction and surface summaries for the dashboard UI.
- **Settings panel** – configure organization branding, funding goal & visibility, community feed replies, and uninstall behaviour.
- **Clean uninstall** – opt-in purge removes tables, settings, and capabilities when the plugin is deleted.

## Installation

1. Copy the `local4picnic` directory into your site’s `wp-content/plugins` folder or zip the directory and upload it through **Plugins → Add New → Upload Plugin**.
2. Activate **Local 4 Picnic Manager** from the plugins screen. Activation installs custom database tables, registers roles, and seeds default settings.
3. Create or edit a page and add the shortcode `[local4picnic_dashboard]`. Only logged-in users with the appropriate capabilities will see the dashboard.

## Development

- PHP requires WordPress 5.8+ and PHP 7.4+.
- All REST requests use the WordPress nonce system; front-end assets are localized with `local4picnicDashboard` data.
- Custom tables carry the `wp_l4p_` prefix (tasks, funding, crew, feed, notifications).
- Run `find local4picnic -name '*.php' -print0 | xargs -0 -n1 php -l` before committing changes to ensure PHP syntax correctness.

## Branching

The `production-ready` branch contains the clean, conflict-free version of the plugin. Create feature branches from `production-ready` and open pull requests against it for future enhancements.

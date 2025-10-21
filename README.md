# Local 4 Picnic Manager

Local 4 Picnic Manager is a WordPress plugin that turns any page into an immersive command center for Local 4 picnic organizers. Drop the `[local4picnic_dashboard]` shortcode into a page and authenticated volunteers/coordinators can coordinate tasks, balance funding, manage crew rosters, review notifications, and post to the community feed in real time.

## Highlights

- **Shortcode-powered dashboard** – renders a premium dashboard UI with tabbed navigation and live data blocks for tasks, funding, crew, notifications, and the community feed.
- **Interactive task board** – volunteers can move assigned work through *To Do → In Progress → Completed*, while coordinators can create, assign, and delete tasks for the whole team.
- **Funding tracker & ledger** – log sponsorships and expenses, review totals by category/direction, and visualize burn-down with a conic pie chart.
- **Crew management** – maintain a rich roster of volunteers, coordinators, sponsors, or vendors with contact details and notes.
- **Notification center** – surface automated alerts for new assignments, funding activity, and feed updates with quick “mark as read” actions.
- **Community feed with replies** – share wins, reminders, and threaded replies. Updates poll automatically to keep the conversation moving.
- **Custom roles & capabilities** – activation registers *Volunteer* and *Coordinator* roles alongside granular capabilities used by the REST permissions layer.

## Getting started

1. Clone this repository into your WordPress `wp-content/plugins` directory.
2. Run `composer install` or `npm install` if your environment requires additional tooling (not necessary for the core plugin).
3. Activate **Local 4 Picnic Manager** from the WordPress admin dashboard.
4. Create a page and add the `[local4picnic_dashboard]` shortcode.
5. Visit the page while logged in to explore the dashboard.

> **Note:** Only logged-in users can access the dashboard UI. Volunteers can view funding and their own tasks; coordinators gain task, funding, crew, and notification management permissions automatically.

## Settings

Navigate to **L4P → Settings** to configure:

- Organization name and logo URL
- Default currency and funding goal
- Funding visibility, community feed comments toggle, notification preferences
- Whether plugin data is removed on uninstall

Enabling **Remove Data on Uninstall** ensures the custom tables, roles, and options are purged when the plugin is deleted.

## Technical architecture

- **Custom tables:** tasks, funding entries, crew directory, notifications, and community feed items are stored in dedicated tables created on activation.
- **REST API:** all dashboard interactions use `local4picnic/v1` endpoints with capability-aware permission callbacks.
- **Assets:** dashboard styles (`assets/public/css/local4picnic-dashboard.css`) and scripts (`assets/public/js/local4picnic-dashboard.js`) power the interactive front-end, while admin/public base assets remain for extensibility.
- **Upgrade safety:** database migrations run on `plugins_loaded` to ensure schema consistency as the plugin evolves.

## Development

- Lint PHP: `find local4picnic -name '*.php' -print0 | xargs -0 -n1 php -l`
- The dashboard script uses vanilla ES2015 modules without a bundler; adjust the script in `assets/public/js/local4picnic-dashboard.js` and enqueue it through the shortcode renderer.
- REST endpoints live in `includes/class-local4picnic-rest.php`; extend or adjust capabilities as your project requires.

## Uninstall behavior

If **Remove Data on Uninstall** is enabled, deactivating and deleting the plugin will:

- Drop all custom Local4Picnic tables
- Remove custom roles and capabilities
- Delete stored plugin options and database version markers

## License

This project is provided as-is for demonstration purposes. Adapt it to fit your Local 4 picnic initiatives.

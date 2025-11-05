# Local 4 Picnic Manager

Local 4 Picnic Manager is a WordPress plugin that turns any page into an immersive command center for Local 4 picnic organizers. Drop the `[local4picnic_dashboard]` shortcode into a page and authenticated volunteers or coordinators can coordinate tasks, log funding, manage crew rosters, review notifications, and post to the community feed.

## Highlights

- **Shortcode-powered dashboard** – renders a premium dashboard UI with tabbed navigation and live data blocks for tasks, funding, crew, notifications, and the community feed.
- **Interactive task board** – volunteers can move assigned work through *To Do → In Progress → Complete*, while coordinators can create tasks and reassign work for the whole team.
- **Funding tracker & ledger** – log sponsorships and expenses, review income vs. outflow totals, download CSV exports, and visualize the category breakdown with an inline canvas pie chart.
- **Crew management** – maintain a rich roster of volunteers with contact details, availability, and linked WordPress user accounts so assignments surface automatically.
- **Notification center** – automated alerts for new assignments, task status changes, funding activity, and feed updates with quick “mark as read” actions.
- **Community feed with replies** – share wins, reminders, and threaded replies. Updates poll automatically to keep the conversation moving.
- **Custom roles & capabilities** – activation registers *Volunteer* and *Coordinator* roles alongside granular capabilities enforced by the REST permissions layer.
- **Branding controls** – upload a sidebar logo, tweak the color palette, and edit the hero copy from the Local 4 Picnic settings screen without touching code.
- **Crew snapshots** – dashboard cards surface profile photos, roles, and quick stats for the team so coordinators can drill into a member’s full record instantly.

## Getting started

1. Clone this repository into your WordPress `wp-content/plugins` directory.
2. Activate **Local 4 Picnic Manager** from the WordPress admin dashboard.
3. Create a page and add the `[local4picnic_dashboard]` shortcode.
4. (Optional) Visit **Settings → Local 4 Picnic** to upload a logo, adjust the color theme, and fine-tune the hero heading/subheading.
5. Visit the dashboard page while logged in to explore the experience.

> **Note:** Only logged-in users can access the dashboard UI. Volunteers can view funding and community updates, plus update the status of tasks assigned to them. Coordinators and administrators can create tasks, manage funding, edit crew records, and oversee notifications.

## Technical architecture

- **Custom post types & meta:** tasks, funding entries, crew profiles, and community feed items are modelled as custom post types with REST-enabled meta for statuses, assignments, and financial data.
- **Custom table:** notifications are stored in `wp_l4p_notifications`, installed automatically on activation.
- **REST API:** the dashboard consumes `/wp-json/local4/v1/…` endpoints with capability-aware permission callbacks and volunteer-friendly rules for updating their own work.
- **Assets:** vanilla ES2015 JavaScript (`assets/js/dashboard.js`) powers the interactive dashboard while SCSS-inspired utility styles live in `assets/css/dashboard.css`.

## Development

- Lint PHP: `find . -name '*.php' -not -path './vendor/*' -print0 | xargs -0 -n1 php -l`
- Edit the dashboard UI in `assets/js/dashboard.js` or `assets/css/dashboard.css`; both files are enqueued directly without a build step.
- Extend REST behaviour in `includes/class-l4p-rest.php` or adjust custom roles in `includes/class-l4p-roles.php`.

## Uninstall behavior

Deactivating the plugin does **not** remove data by default. If you need a full uninstall routine, hook into the provided classes to drop the notification table and custom post data.

## License

This project is provided as-is for demonstration purposes. Adapt it to fit your Local 4 picnic initiatives.

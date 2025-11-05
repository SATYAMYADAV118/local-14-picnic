<?php
/**
 * Shortcode rendering.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class L4P_Dashboard {
    /**
     * Singleton.
     */
    protected static $instance = null;

    /**
     * Instance accessor.
     */
    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
            self::$instance->hooks();
        }

        return self::$instance;
    }

    /**
     * Register hooks.
     */
    protected function hooks() {
        add_shortcode( 'local4picnic_dashboard', array( $this, 'render_shortcode' ) );
    }

    /**
     * Render shortcode output.
     */
    public function render_shortcode( $atts ) {
        if ( ! is_user_logged_in() ) {
            $login_url = wp_login_url( get_permalink() );
            return sprintf(
                '<div class="l4p-dashboard-login-gate">%s</div>',
                sprintf(
                    /* translators: %s: login url */
                    __( 'Please <a href="%s">log in</a> to access the Local 4 Picnic dashboard.', 'local4-picnic' ),
                    esc_url( $login_url )
                )
            );
        }

        $branding = L4P_Settings::get_frontend_settings();
        $style    = sprintf(
            '--l4p-primary-color:%1$s;--l4p-accent-color:%2$s;--l4p-surface-color:%3$s;--l4p-sidebar-color:%4$s;',
            esc_attr( $branding['primaryColor'] ),
            esc_attr( $branding['accentColor'] ),
            esc_attr( $branding['surfaceColor'] ),
            esc_attr( $branding['sidebarColor'] )
        );

        $logo_html = '';
        if ( ! empty( $branding['logoUrl'] ) ) {
            $logo_html = sprintf(
                '<img class="l4p-dashboard__brand-logo" src="%1$s" alt="%2$s" />',
                esc_url( $branding['logoUrl'] ),
                esc_attr( $branding['title'] )
            );
        }

        $current_user = wp_get_current_user();
        $role_labels = array_map(
            static function ( $role ) {
                return ucwords( str_replace( '_', ' ', $role ) );
            },
            (array) $current_user->roles
        );

        ob_start();
        ?>
        <div class="l4p-dashboard" data-view="dashboard" style="<?php echo esc_attr( $style ); ?>">
            <aside class="l4p-dashboard__sidebar">
                <div class="l4p-dashboard__branding">
                    <?php echo $logo_html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
                    <h2><?php echo esc_html( $branding['title'] ); ?></h2>
                    <p><?php echo esc_html( $branding['tagline'] ); ?></p>
                </div>
                <nav class="l4p-dashboard__nav" aria-label="<?php esc_attr_e( 'Dashboard sections', 'local4-picnic' ); ?>">
                    <button class="l4p-dashboard__nav-link is-active" data-target="dashboard"><?php esc_html_e( 'Dashboard', 'local4-picnic' ); ?></button>
                    <button class="l4p-dashboard__nav-link" data-target="tasks"><?php esc_html_e( 'Tasks', 'local4-picnic' ); ?></button>
                    <button class="l4p-dashboard__nav-link" data-target="funding"><?php esc_html_e( 'Funding', 'local4-picnic' ); ?></button>
                    <button class="l4p-dashboard__nav-link" data-target="crew"><?php esc_html_e( 'Crew', 'local4-picnic' ); ?></button>
                    <button class="l4p-dashboard__nav-link" data-target="notifications"><?php esc_html_e( 'Notifications', 'local4-picnic' ); ?></button>
                    <button class="l4p-dashboard__nav-link" data-target="community"><?php esc_html_e( 'Community', 'local4-picnic' ); ?></button>
                </nav>
            </aside>
            <main class="l4p-dashboard__content" aria-live="polite">
                <header class="l4p-dashboard__hero" data-hero>
                    <div class="l4p-dashboard__hero-text">
                        <h1><?php echo esc_html( $branding['heroTitle'] ); ?></h1>
                        <p><?php echo esc_html( $branding['heroSubtitle'] ); ?></p>
                    </div>
                    <div class="l4p-dashboard__hero-meta">
                        <div class="l4p-dashboard__hero-avatar"><?php echo get_avatar( $current_user->ID, 48 ); ?></div>
                        <div>
                            <strong><?php echo esc_html( $current_user->display_name ); ?></strong>
                            <span><?php echo esc_html( implode( ', ', $role_labels ) ); ?></span>
                        </div>
                    </div>
                </header>
                <div class="l4p-dashboard__panel" data-panel="dashboard"></div>
                <div class="l4p-dashboard__panel" data-panel="tasks" hidden></div>
                <div class="l4p-dashboard__panel" data-panel="funding" hidden></div>
                <div class="l4p-dashboard__panel" data-panel="crew" hidden></div>
                <div class="l4p-dashboard__panel" data-panel="notifications" hidden></div>
                <div class="l4p-dashboard__panel" data-panel="community" hidden></div>
            </main>
        </div>
        <?php
        return ob_get_clean();
    }
}

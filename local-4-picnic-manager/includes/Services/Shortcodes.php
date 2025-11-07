<?php
namespace Local4Picnic\Services;

class Shortcodes {
    public static function init(): void {
        add_shortcode( 'l4p_dashboard', [ static::class, 'render_dashboard' ] );
    }

    public static function render_dashboard( $atts = [], $content = '' ): string {
        if ( ! is_user_logged_in() ) {
            return sprintf(
                '<div class="l4p-login-required"><a class="l4p-btn" href="%s">%s</a></div>',
                esc_url( wp_login_url( get_permalink() ) ),
                esc_html__( 'Log in to view the Local Picnic dashboard', 'local-4-picnic-manager' )
            );
        }

        Assets::enqueue_for_shortcode();

        return '<div id="l4p-dashboard-root" class="l4p-viewport"></div>';
    }
}

<?php
namespace Local4Picnic\Admin;

class AdminApp {
    public static function init(): void {
        add_action( 'admin_menu', [ static::class, 'register_menu' ] );
    }

    public static function register_menu(): void {
        add_menu_page(
            __( 'Local Picnic', 'local-4-picnic-manager' ),
            __( 'Local Picnic', 'local-4-picnic-manager' ),
            'read',
            'local-4-picnic',
            [ static::class, 'render_page' ],
            'dashicons-groups',
            3
        );
    }

    public static function render_page(): void {
        echo '<div class="wrap l4p-wrap"><div id="l4p-dashboard-root" class="l4p-viewport"></div></div>';
    }
}

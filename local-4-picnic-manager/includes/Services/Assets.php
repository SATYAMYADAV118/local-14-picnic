<?php
namespace Local4Picnic\Services;

use Local4Picnic\Utils\Settings;

class Assets {
    private static bool $registered = false;
    private static array $style_handles = [];

    public static function init(): void {
        add_action( 'init', [ static::class, 'register_assets' ] );
        add_action( 'admin_enqueue_scripts', [ static::class, 'enqueue_admin' ] );
    }

    public static function register_assets(): void {
        $asset_path = L4P_PLUGIN_DIR . 'build/index.asset.php';
        if ( ! file_exists( $asset_path ) ) {
            return;
        }

        $asset = include $asset_path;
        $deps  = $asset['dependencies'] ?? [];
        $ver   = $asset['version'] ?? L4P_VERSION;

        wp_register_script( 'l4p-app', L4P_PLUGIN_URL . 'build/index.js', $deps, $ver, true );

        self::$style_handles = [];
        foreach ( [ 'index.css', 'style-index.css' ] as $style_file ) {
            $full_path = L4P_PLUGIN_DIR . 'build/' . $style_file;
            if ( file_exists( $full_path ) ) {
                $handle = 'l4p-app-' . sanitize_key( $style_file );
                wp_register_style( $handle, L4P_PLUGIN_URL . 'build/' . $style_file, [], $ver );
                wp_style_add_data( $handle, 'rtl', 'replace' );
                self::$style_handles[] = $handle;
            }
        }

        self::$registered = true;
    }

    public static function enqueue_admin( $hook ): void {
        if ( 'toplevel_page_local-4-picnic' !== $hook ) {
            return;
        }

        self::enqueue( true );
    }

    public static function enqueue_for_shortcode(): void {
        self::enqueue( false );
    }

    private static function enqueue( bool $admin ): void {
        if ( ! self::$registered ) {
            self::register_assets();
        }

        if ( ! self::$registered ) {
            return;
        }

        foreach ( self::$style_handles as $handle ) {
            wp_enqueue_style( $handle );
        }

        wp_enqueue_script( 'l4p-app' );

        wp_localize_script(
            'l4p-app',
            'l4pDashboard',
            [
                'nonce'        => wp_create_nonce( 'wp_rest' ),
                'restUrl'      => esc_url_raw( rest_url( 'l4p/v1' ) ),
                'currentUser'  => self::current_user_payload(),
                'settings'     => Settings::get_public_settings(),
                'isAdmin'      => $admin,
            ]
        );
    }

    private static function current_user_payload(): array {
        $user = wp_get_current_user();
        if ( ! $user || 0 === $user->ID ) {
            return [];
        }

        return [
            'id'     => $user->ID,
            'name'   => $user->display_name,
            'email'  => $user->user_email,
            'roles'  => $user->roles,
            'caps'   => array_keys( array_filter( (array) $user->allcaps ) ),
            'avatar' => get_avatar_url( $user->ID ),
            'logoutUrl' => wp_logout_url( home_url( '/home/' ) ),
        ];
    }
}

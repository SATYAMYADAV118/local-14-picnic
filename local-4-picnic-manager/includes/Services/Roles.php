<?php
namespace Local4Picnic\Services;

use Local4Picnic\Utils\Settings;

class Roles {
    public const COORDINATOR = 'l4p_coordinator';
    public const VOLUNTEER   = 'l4p_volunteer';

    private static $caps = [
        self::COORDINATOR => [
            'read'               => true,
            'manage_l4p_tasks'   => true,
            'manage_l4p_funding' => true,
            'manage_l4p_crew'    => true,
            'manage_l4p_posts'   => true,
            'manage_l4p_settings'=> true,
        ],
        self::VOLUNTEER => [
            'read'               => true,
            'manage_l4p_tasks'   => true,
            'manage_l4p_posts'   => true,
        ],
    ];

    public static function init(): void {
        add_action( 'init', [ static::class, 'register_roles' ] );
        add_action( 'init', [ static::class, 'sync_settings_roles' ], 20 );
    }

    public static function register_roles(): void {
        foreach ( self::$caps as $role => $caps ) {
            if ( get_role( $role ) ) {
                continue;
            }
            add_role( $role, ucwords( str_replace( '_', ' ', $role ) ), $caps );
        }

        $admin = get_role( 'administrator' );
        if ( $admin ) {
            foreach ( self::$caps[ self::COORDINATOR ] as $cap => $grant ) {
                if ( $grant ) {
                    $admin->add_cap( $cap );
                }
            }
        }

        self::sync_settings_roles();
    }

    public static function get_caps_for_role( string $role ): array {
        return self::$caps[ $role ] ?? [];
    }

    public static function sync_settings_roles(): void {
        $settings = Settings::get();

        self::assign_caps_to_roles( (array) ( $settings['coordinator_roles'] ?? [] ), self::$caps[ self::COORDINATOR ] );
        self::assign_caps_to_roles( (array) ( $settings['volunteer_roles'] ?? [] ), self::$caps[ self::VOLUNTEER ] );
    }

    private static function assign_caps_to_roles( array $roles, array $caps ): void {
        foreach ( $roles as $role_name ) {
            $role_name = sanitize_key( $role_name );
            if ( ! $role_name ) {
                continue;
            }

            $role = get_role( $role_name );
            if ( ! $role ) {
                continue;
            }

            foreach ( $caps as $capability => $grant ) {
                if ( $grant ) {
                    $role->add_cap( $capability );
                } else {
                    $role->remove_cap( $capability );
                }
            }
        }
    }
}

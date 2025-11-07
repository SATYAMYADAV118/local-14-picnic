<?php
namespace Local4Picnic\Services;

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
    }

    public static function get_caps_for_role( string $role ): array {
        return self::$caps[ $role ] ?? [];
    }
}

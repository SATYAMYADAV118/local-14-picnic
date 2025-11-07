<?php
namespace Local4Picnic\Utils;

class Settings {
    private const OPTION_KEY = 'l4p_settings';

    public static function get(): array {
        $defaults = [
            'dashboard_title'        => __( 'Local 4 Picnic Manager', 'local-4-picnic-manager' ),
            'dashboard_icon'         => '',
            'theme_primary'          => '#0B5CD6',
            'theme_accent'           => '#06B6D4',
            'timezone'               => wp_timezone_string(),
            'currency'               => 'USD',
            'volunteer_create_tasks' => false,
            'volunteer_post_chat'    => true,
            'auto_sync_users'        => true,
            'coordinator_roles'      => [ 'administrator', 'l4p_coordinator' ],
            'volunteer_roles'        => [ 'l4p_volunteer', 'subscriber' ],
        ];

        $stored = get_option( self::OPTION_KEY, [] );

        if ( isset( $stored['coordinator_roles'] ) && ! is_array( $stored['coordinator_roles'] ) ) {
            $stored['coordinator_roles'] = array_filter( array_map( 'sanitize_key', (array) $stored['coordinator_roles'] ) );
        }

        if ( isset( $stored['volunteer_roles'] ) && ! is_array( $stored['volunteer_roles'] ) ) {
            $stored['volunteer_roles'] = array_filter( array_map( 'sanitize_key', (array) $stored['volunteer_roles'] ) );
        }

        return wp_parse_args( $stored, $defaults );
    }

    public static function get_public_settings(): array {
        $settings = self::get();
        unset( $settings['volunteer_create_tasks'], $settings['volunteer_post_chat'] );
        return $settings;
    }

    public static function update( array $settings ): void {
        update_option( self::OPTION_KEY, $settings );
    }
}

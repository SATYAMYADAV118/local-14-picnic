<?php
namespace Local4Picnic\Services;

use Local4Picnic\Services\Repositories\CrewRepository;
use Local4Picnic\Utils\Settings;

class CrewSync {
    private const OPTION_BOOTSTRAP = 'l4p_crew_bootstrap_complete';

    public static function init(): void {
        add_action( 'init', [ static::class, 'maybe_bootstrap' ], 20 );
        add_action( 'user_register', [ static::class, 'sync_user' ] );
        add_action( 'profile_update', [ static::class, 'sync_user' ] );
        add_action( 'set_user_role', [ static::class, 'sync_role' ], 10, 3 );
        add_action( 'deleted_user', [ static::class, 'remove_user' ] );
    }

    public static function maybe_bootstrap(): void {
        $settings = Settings::get();
        if ( empty( $settings['auto_sync_users'] ) ) {
            return;
        }

        if ( get_option( self::OPTION_BOOTSTRAP ) ) {
            return;
        }

        $user_ids = get_users( [ 'fields' => 'ID' ] );
        foreach ( $user_ids as $user_id ) {
            self::sync_user( (int) $user_id );
        }

        update_option( self::OPTION_BOOTSTRAP, current_time( 'timestamp' ) );
    }

    public static function sync_user( int $user_id ): void {
        $settings = Settings::get();
        if ( empty( $settings['auto_sync_users'] ) ) {
            return;
        }

        global $wpdb;
        $repo = new CrewRepository( $wpdb );
        $repo->create_or_update_from_user( $user_id );
    }

    public static function remove_user( int $user_id ): void {
        global $wpdb;
        $repo = new CrewRepository( $wpdb );
        $repo->delete_by_user_id( $user_id );
    }

    public static function sync_role( int $user_id ): void {
        self::sync_user( $user_id );
    }

    public static function force_resync(): void {
        delete_option( self::OPTION_BOOTSTRAP );
        self::maybe_bootstrap();
    }
}

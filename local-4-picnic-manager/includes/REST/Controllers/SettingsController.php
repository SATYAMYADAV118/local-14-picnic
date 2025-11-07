<?php
namespace Local4Picnic\REST\Controllers;

use Local4Picnic\Services\CrewSync;
use Local4Picnic\Utils\Settings;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

class SettingsController extends BaseController {
    public function register_routes(): void {
        register_rest_route(
            self::NAMESPACE,
            '/settings',
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'get_settings' ],
                    'permission_callback' => [ $this, 'can_view' ],
                ],
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'save_settings' ],
                    'permission_callback' => [ $this, 'can_manage' ],
                ],
            ]
        );
    }

    public function can_view( WP_REST_Request $request ): bool|WP_Error {
        return $this->permissions_check( $request, 'manage_l4p_tasks' );
    }

    public function can_manage( WP_REST_Request $request ): bool|WP_Error {
        return $this->permissions_check( $request, 'manage_l4p_settings' );
    }

    public function get_settings( WP_REST_Request $request ): WP_REST_Response {
        return new WP_REST_Response( Settings::get() );
    }

    public function save_settings( WP_REST_Request $request ): WP_REST_Response {
        $coordinator_roles = array_filter( array_map( 'sanitize_key', (array) $request->get_param( 'coordinator_roles' ) ) );
        $volunteer_roles   = array_filter( array_map( 'sanitize_key', (array) $request->get_param( 'volunteer_roles' ) ) );

        $data = [
            'dashboard_title'        => sanitize_text_field( $request->get_param( 'dashboard_title' ) ),
            'dashboard_icon'         => esc_url_raw( $request->get_param( 'dashboard_icon' ) ),
            'theme_primary'          => sanitize_hex_color( $request->get_param( 'theme_primary' ) ) ?: '#0B5CD6',
            'theme_accent'           => sanitize_hex_color( $request->get_param( 'theme_accent' ) ) ?: '#06B6D4',
            'timezone'               => sanitize_text_field( $request->get_param( 'timezone' ) ),
            'currency'               => sanitize_text_field( $request->get_param( 'currency' ) ),
            'volunteer_create_tasks' => (bool) $request->get_param( 'volunteer_create_tasks' ),
            'volunteer_post_chat'    => (bool) $request->get_param( 'volunteer_post_chat' ),
            'auto_sync_users'        => (bool) $request->get_param( 'auto_sync_users' ),
            'coordinator_roles'      => $coordinator_roles,
            'volunteer_roles'        => $volunteer_roles,
        ];

        Settings::update( $data );

        if ( $data['auto_sync_users'] ) {
            CrewSync::force_resync();
        }

        return new WP_REST_Response( Settings::get() );
    }
}

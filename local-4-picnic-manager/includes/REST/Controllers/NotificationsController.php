<?php
namespace Local4Picnic\REST\Controllers;

use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

class NotificationsController extends BaseController {
    public function register_routes(): void {
        register_rest_route(
            self::NAMESPACE,
            '/notifications',
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'list_notifications' ],
                    'permission_callback' => [ $this, 'permissions' ],
                ],
            ]
        );

        register_rest_route(
            self::NAMESPACE,
            '/notifications/(?P<id>\d+)/read',
            [
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'mark_read' ],
                    'permission_callback' => [ $this, 'permissions' ],
                ],
            ]
        );

        register_rest_route(
            self::NAMESPACE,
            '/notifications/read-all',
            [
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'mark_all' ],
                    'permission_callback' => [ $this, 'permissions' ],
                ],
            ]
        );
    }

    public function permissions( WP_REST_Request $request ): bool|WP_Error {
        return $this->permissions_check( $request, 'manage_l4p_tasks' );
    }

    public function list_notifications( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $table = $wpdb->prefix . 'l4p_notifications';
        $user  = get_current_user_id();

        $notifications = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE user_id IS NULL OR user_id = %d ORDER BY created_at DESC LIMIT 100",
                $user
            ),
            ARRAY_A
        ) ?: [];

        return new WP_REST_Response(
            [
                'data'  => $notifications,
                'badge' => $this->badge_count( $notifications ),
            ]
        );
    }

    public function mark_read( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $table = $wpdb->prefix . 'l4p_notifications';
        $id    = (int) $request->get_param( 'id' );
        $user  = get_current_user_id();

        $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$table} SET is_read = 1 WHERE id = %d AND (user_id IS NULL OR user_id = %d)",
                $id,
                $user
            )
        );

        return new WP_REST_Response( [ 'success' => true ] );
    }

    public function mark_all( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $table = $wpdb->prefix . 'l4p_notifications';
        $user  = get_current_user_id();

        $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$table} SET is_read = 1 WHERE user_id IS NULL OR user_id = %d",
                $user
            )
        );

        return new WP_REST_Response( [ 'success' => true ] );
    }

    private function badge_count( array $notifications ): int {
        $count = 0;
        foreach ( $notifications as $notification ) {
            if ( (int) $notification['is_read'] === 0 ) {
                $count++;
            }
        }
        return $count;
    }
}

<?php
namespace Local4Picnic\REST\Controllers;

use Local4Picnic\Services\Capabilities;
use Local4Picnic\Services\CrewSync;
use Local4Picnic\Services\Repositories\CrewRepository;
use Local4Picnic\Services\Repositories\TasksRepository;
use Local4Picnic\Utils\Settings;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

class CrewController extends BaseController {
    public function register_routes(): void {
        register_rest_route(
            self::NAMESPACE,
            '/crew',
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'list_crew' ],
                    'permission_callback' => [ $this, 'can_view' ],
                ],
            ]
        );

        register_rest_route(
            self::NAMESPACE,
            '/crew/(?P<id>\d+)',
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'get_member' ],
                    'permission_callback' => [ $this, 'can_view' ],
                ],
            ]
        );

        register_rest_route(
            self::NAMESPACE,
            '/crew/(?P<id>\d+)/avatar',
            [
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'upload_avatar' ],
                    'permission_callback' => [ $this, 'can_manage' ],
                ],
            ]
        );
    }

    public function can_view( WP_REST_Request $request ): bool|WP_Error {
        return $this->permissions_check( $request, 'manage_l4p_tasks' );
    }

    public function can_manage( WP_REST_Request $request ): bool|WP_Error {
        if ( Capabilities::is_coordinator() ) {
            return $this->permissions_check( $request, 'manage_l4p_crew' );
        }

        return new WP_Error( 'rest_forbidden', __( 'Only coordinators can manage crew.', 'local-4-picnic-manager' ), [ 'status' => 403 ] );
    }

    public function list_crew( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $repo = new CrewRepository( $wpdb );

        CrewSync::maybe_bootstrap();

        $current_user = get_current_user_id();
        if ( $current_user ) {
            $settings = Settings::get();
            if ( ! empty( $settings['auto_sync_users'] ) ) {
                CrewSync::sync_user( (int) $current_user );
            } else {
                $repo->create_or_update_from_user( (int) $current_user );
            }
        }

        $list = $repo->list();

        return new WP_REST_Response( [ 'data' => $list ] );
    }

    public function get_member( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $repo = new CrewRepository( $wpdb );
        $member = $repo->find( (int) $request->get_param( 'id' ) );

        if ( ! $member ) {
            return new WP_REST_Response( [ 'error' => 'Not found' ], 404 );
        }

        $tasks_repo = new TasksRepository( $wpdb );
        $tasks = $tasks_repo->list( [ 'assignee' => $member['wp_user_id'] ] );

        return new WP_REST_Response(
            [
                'member' => $member,
                'tasks'  => $tasks,
            ]
        );
    }

    public function upload_avatar( WP_REST_Request $request ): WP_REST_Response {
        $id = (int) $request->get_param( 'id' );
        if ( empty( $_FILES['avatar'] ) ) {
            return new WP_REST_Response( [ 'error' => 'No file provided' ], 400 );
        }

        $file = $_FILES['avatar'];
        if ( $file['size'] > 1024 * 1024 ) {
            return new WP_REST_Response( [ 'error' => 'File exceeds 1MB limit.' ], 400 );
        }

        $allowed_types = [ 'image/png', 'image/jpeg' ];
        if ( ! in_array( $file['type'], $allowed_types, true ) ) {
            return new WP_REST_Response( [ 'error' => 'Invalid file type.' ], 400 );
        }

        $upload = wp_handle_upload( $file, [ 'test_form' => false, 'mimes' => [ 'png' => 'image/png', 'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg' ] ] );
        if ( isset( $upload['error'] ) ) {
            return new WP_REST_Response( [ 'error' => $upload['error'] ], 400 );
        }

        $url = $upload['url'];
        global $wpdb;
        $repo = new CrewRepository( $wpdb );
        $repo->save_avatar( $id, $url );

        return new WP_REST_Response( [ 'url' => $url ] );
    }
}

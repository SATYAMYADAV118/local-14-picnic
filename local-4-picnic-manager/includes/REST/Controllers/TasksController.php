<?php
namespace Local4Picnic\REST\Controllers;

use Local4Picnic\Services\Capabilities;
use Local4Picnic\Services\Repositories\TasksRepository;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

class TasksController extends BaseController {
    public function register_routes(): void {
        register_rest_route(
            self::NAMESPACE,
            '/tasks',
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'get_tasks' ],
                    'permission_callback' => [ $this, 'can_view_tasks' ],
                ],
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'create_task' ],
                    'permission_callback' => [ $this, 'can_create_tasks' ],
                ],
            ]
        );

        register_rest_route(
            self::NAMESPACE,
            '/tasks/(?P<id>\d+)/status',
            [
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'update_status' ],
                    'permission_callback' => [ $this, 'can_view_tasks' ],
                ],
            ]
        );
    }

    public function can_view_tasks( WP_REST_Request $request ): bool|WP_Error {
        return $this->permissions_check( $request, 'manage_l4p_tasks' );
    }

    public function can_create_tasks( WP_REST_Request $request ): bool|WP_Error {
        $permission = $this->permissions_check( $request, 'manage_l4p_tasks' );
        if ( is_wp_error( $permission ) ) {
            return $permission;
        }

        if ( Capabilities::is_coordinator() ) {
            return true;
        }

        if ( Capabilities::volunteer_create_tasks_enabled() ) {
            return true;
        }

        return new WP_Error( 'rest_forbidden', __( 'Task creation disabled for volunteers.', 'local-4-picnic-manager' ), [ 'status' => 403 ] );
    }

    public function get_tasks( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $repo  = new TasksRepository( $wpdb );
        $tasks = $repo->list(
            [
                'status'   => $request->get_param( 'status' ),
                'assignee' => $request->get_param( 'assignee' ),
            ]
        );

        return new WP_REST_Response( [ 'data' => $tasks ] );
    }

    public function create_task( WP_REST_Request $request ): WP_REST_Response {
        $data = [
            'title'       => $request->get_param( 'title' ),
            'description' => $request->get_param( 'description' ),
            'status'      => $request->get_param( 'status' ) ?: 'todo',
            'priority'    => $request->get_param( 'priority' ) ?: 'medium',
            'due_date'    => $request->get_param( 'due_date' ),
            'url'         => $request->get_param( 'url' ),
            'assignee_id' => (int) $request->get_param( 'assignee_id' ) ?: null,
        ];

        $errors = $this->validate_task( $data );
        if ( ! empty( $errors ) ) {
            return new WP_REST_Response( [ 'errors' => $errors ], 400 );
        }

        global $wpdb;
        $repo = new TasksRepository( $wpdb );
        $task = $repo->create( $data );

        do_action( 'l4p_task_created', $task, get_current_user_id() );

        return new WP_REST_Response( $task, 201 );
    }

    public function update_status( WP_REST_Request $request ): WP_REST_Response {
        $id     = (int) $request->get_param( 'id' );
        $status = sanitize_text_field( $request->get_param( 'status' ) );
        $allowed_statuses = [ 'todo', 'progress', 'done' ];
        if ( ! in_array( $status, $allowed_statuses, true ) ) {
            return new WP_REST_Response( [ 'error' => 'Invalid status' ], 400 );
        }

        global $wpdb;
        $repo = new TasksRepository( $wpdb );
        $task = $repo->find( $id );
        if ( ! $task ) {
            return new WP_REST_Response( [ 'error' => 'Task not found' ], 404 );
        }

        $current = get_current_user_id();
        if ( ! Capabilities::is_coordinator() && (int) $task['assignee_id'] !== $current ) {
            return new WP_REST_Response( [ 'error' => 'You cannot update other members\' tasks.' ], 403 );
        }

        $repo->update_status( $id, $status );

        $task = $repo->find( $id );

        do_action( 'l4p_task_status_changed', $task, $current, $status );

        return new WP_REST_Response( $task );
    }

    private function validate_task( array $data ): array {
        $errors = [];
        if ( empty( $data['title'] ) ) {
            $errors['title'] = __( 'Title is required.', 'local-4-picnic-manager' );
        }

        if ( $data['due_date'] && false === strtotime( $data['due_date'] ) ) {
            $errors['due_date'] = __( 'Invalid due date.', 'local-4-picnic-manager' );
        }

        if ( $data['assignee_id'] && ! get_user_by( 'id', $data['assignee_id'] ) ) {
            $errors['assignee_id'] = __( 'Assignee not found.', 'local-4-picnic-manager' );
        }

        return $errors;
    }
}

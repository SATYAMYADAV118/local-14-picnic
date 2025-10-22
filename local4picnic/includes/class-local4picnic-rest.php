<?php
/**
 * REST API endpoints for Local4Picnic.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_REST {

    const ROUTE_NAMESPACE = 'local4picnic/v1';

    /**
     * Register routes.
     */
    public function register_routes() {
        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/tasks',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_tasks' ),
                    'permission_callback' => array( $this, 'can_view_tasks' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_task' ),
                    'permission_callback' => array( $this, 'can_manage_tasks' ),
                    'args'                => $this->get_task_args(),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/tasks/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_task' ),
                    'permission_callback' => array( $this, 'can_view_tasks' ),
                ),
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_task' ),
                    'permission_callback' => array( $this, 'can_manage_tasks' ),
                    'args'                => $this->get_task_args( true ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_task' ),
                    'permission_callback' => array( $this, 'can_manage_tasks' ),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/funding',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_funding' ),
                    'permission_callback' => array( $this, 'can_view_funding' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_funding' ),
                    'permission_callback' => array( $this, 'can_manage_funding' ),
                    'args'                => $this->get_funding_args(),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/funding/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_funding' ),
                    'permission_callback' => array( $this, 'can_manage_funding' ),
                    'args'                => $this->get_funding_args( true ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_funding' ),
                    'permission_callback' => array( $this, 'can_manage_funding' ),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/crew',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_crew' ),
                    'permission_callback' => array( $this, 'can_view_crew' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_crew' ),
                    'permission_callback' => array( $this, 'can_manage_crew' ),
                    'args'                => $this->get_crew_args(),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/crew/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_crew' ),
                    'permission_callback' => array( $this, 'can_manage_crew' ),
                    'args'                => $this->get_crew_args( true ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_crew' ),
                    'permission_callback' => array( $this, 'can_manage_crew' ),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/feed',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_feed' ),
                    'permission_callback' => array( $this, 'can_view_feed' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_feed_post' ),
                    'permission_callback' => array( $this, 'can_manage_feed' ),
                    'args'                => $this->get_feed_args(),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/feed/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_feed_post' ),
                    'permission_callback' => array( $this, 'can_manage_feed' ),
                    'args'                => $this->get_feed_args( true ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_feed_post' ),
                    'permission_callback' => array( $this, 'can_manage_feed' ),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/notifications',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_notifications' ),
                    'permission_callback' => array( $this, 'is_logged_in' ),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/notifications/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_notification' ),
                    'permission_callback' => array( $this, 'is_logged_in' ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_notification' ),
                    'permission_callback' => array( $this, 'can_manage_notifications' ),
                ),
            )
        );

        register_rest_route(
            self::ROUTE_NAMESPACE,
            '/assignable-users',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_assignable_users' ),
                    'permission_callback' => array( $this, 'can_manage_tasks' ),
                ),
            )
        );
    }

    /**
     * Get tasks.
     */
    public function get_tasks( WP_REST_Request $request ) {
        $args = array();

        if ( $request->get_param( 'status' ) ) {
            $args['status'] = sanitize_key( $request->get_param( 'status' ) );
        }

        if ( $request->get_param( 'assigned_to' ) !== null ) {
            $args['assigned_to'] = (int) $request->get_param( 'assigned_to' );
        }

        if ( $request->get_param( 'search' ) ) {
            $args['search'] = sanitize_text_field( $request->get_param( 'search' ) );
        }

        $tasks = Local4Picnic_Data::get_tasks( $args );

        return rest_ensure_response( $tasks );
    }

    /**
     * Get single task.
     */
    public function get_task( WP_REST_Request $request ) {
        $task = Local4Picnic_Data::get_task( (int) $request['id'] );

        if ( ! $task ) {
            return new WP_Error( 'not_found', __( 'Task not found.', 'local4picnic' ), array( 'status' => 404 ) );
        }

        return rest_ensure_response( $task );
    }

    /**
     * Create task.
     */
    public function create_task( WP_REST_Request $request ) {
        $result = Local4Picnic_Data::insert_task( $request->get_params() );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        $this->notify( array(
            'message' => sprintf( __( 'New task created: %s', 'local4picnic' ), $result['title'] ),
        ) );

        return rest_ensure_response( $result );
    }

    /**
     * Update task.
     */
    public function update_task( WP_REST_Request $request ) {
        $result = Local4Picnic_Data::update_task( (int) $request['id'], $request->get_params() );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        return rest_ensure_response( $result );
    }

    /**
     * Delete task.
     */
    public function delete_task( WP_REST_Request $request ) {
        $deleted = Local4Picnic_Data::delete_task( (int) $request['id'] );

        if ( ! $deleted ) {
            return new WP_Error( 'delete_error', __( 'Unable to delete task.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Get funding entries.
     */
    public function get_funding( WP_REST_Request $request ) {
        $args = array();

        if ( $request->get_param( 'direction' ) ) {
            $args['direction'] = sanitize_key( $request->get_param( 'direction' ) );
        }

        $entries = Local4Picnic_Data::get_funding_entries( $args );

        $summary = array(
            'income'  => 0,
            'expense' => 0,
        );

        foreach ( $entries as $entry ) {
            if ( 'expense' === $entry['direction'] ) {
                $summary['expense'] += $entry['amount'];
            } else {
                $summary['income'] += $entry['amount'];
            }
        }

        return rest_ensure_response( array(
            'entries' => $entries,
            'summary' => $summary,
        ) );
    }

    /**
     * Create funding entry.
     */
    public function create_funding( WP_REST_Request $request ) {
        $result = Local4Picnic_Data::insert_funding( $request->get_params() );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        $this->notify( array(
            'message' => __( 'Funding record saved.', 'local4picnic' ),
            'type'    => 'success',
        ) );

        return rest_ensure_response( $result );
    }

    /**
     * Update funding entry.
     */
    public function update_funding( WP_REST_Request $request ) {
        $result = Local4Picnic_Data::update_funding( (int) $request['id'], $request->get_params() );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        return rest_ensure_response( $result );
    }

    /**
     * Delete funding entry.
     */
    public function delete_funding( WP_REST_Request $request ) {
        $deleted = Local4Picnic_Data::delete_funding( (int) $request['id'] );

        if ( ! $deleted ) {
            return new WP_Error( 'delete_error', __( 'Unable to delete funding entry.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Get crew list.
     */
    public function get_crew() {
        $crew = Local4Picnic_Data::get_crew();

        return rest_ensure_response( $crew );
    }

    /**
     * Create crew member.
     */
    public function create_crew( WP_REST_Request $request ) {
        $result = Local4Picnic_Data::insert_crew( $request->get_params() );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        $this->notify( array(
            'message' => sprintf( __( 'New crew member added: %s', 'local4picnic' ), $result['name'] ),
        ) );

        return rest_ensure_response( $result );
    }

    /**
     * Update crew member.
     */
    public function update_crew( WP_REST_Request $request ) {
        $result = Local4Picnic_Data::update_crew( (int) $request['id'], $request->get_params() );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        return rest_ensure_response( $result );
    }

    /**
     * Delete crew member.
     */
    public function delete_crew( WP_REST_Request $request ) {
        $deleted = Local4Picnic_Data::delete_crew( (int) $request['id'] );

        if ( ! $deleted ) {
            return new WP_Error( 'delete_error', __( 'Unable to delete crew member.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Get feed posts.
     */
    public function get_feed( WP_REST_Request $request ) {
        $parent_id = (int) $request->get_param( 'parent_id' );

        $posts = Local4Picnic_Data::get_feed_posts( $parent_id );

        $with_replies = array();

        foreach ( $posts as $post ) {
            $post['replies'] = Local4Picnic_Data::get_feed_posts( $post['id'] );
            $with_replies[]  = $post;
        }

        return rest_ensure_response( $with_replies );
    }

    /**
     * Create feed post.
     */
    public function create_feed_post( WP_REST_Request $request ) {
        $result = Local4Picnic_Data::insert_feed_post( $request->get_params() );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        $this->notify( array(
            'message' => __( 'New community update posted.', 'local4picnic' ),
        ) );

        return rest_ensure_response( $result );
    }

    /**
     * Update feed post.
     */
    public function update_feed_post( WP_REST_Request $request ) {
        $result = Local4Picnic_Data::update_feed_post( (int) $request['id'], $request->get_params() );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        return rest_ensure_response( $result );
    }

    /**
     * Delete feed post.
     */
    public function delete_feed_post( WP_REST_Request $request ) {
        $deleted = Local4Picnic_Data::delete_feed_post( (int) $request['id'] );

        if ( ! $deleted ) {
            return new WP_Error( 'delete_error', __( 'Unable to delete feed post.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Get notifications.
     */
    public function get_notifications( WP_REST_Request $request ) {
        $args = array(
            'user_id' => get_current_user_id(),
        );

        if ( $request->get_param( 'unread' ) ) {
            $args['unread'] = true;
        }

        $notifications = Local4Picnic_Data::get_notifications( $args );

        return rest_ensure_response( $notifications );
    }

    /**
     * Update notification.
     */
    public function update_notification( WP_REST_Request $request ) {
        $result = Local4Picnic_Data::update_notification( (int) $request['id'], $request->get_params() );

        if ( is_wp_error( $result ) ) {
            return $this->error_response( $result );
        }

        return rest_ensure_response( $result );
    }

    /**
     * Delete notification.
     */
    public function delete_notification( WP_REST_Request $request ) {
        $deleted = Local4Picnic_Data::delete_notification( (int) $request['id'] );

        if ( ! $deleted ) {
            return new WP_Error( 'delete_error', __( 'Unable to delete notification.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Return assignable users.
     */
    public function get_assignable_users() {
        $users = get_users( array(
            'fields'  => array( 'ID', 'display_name', 'user_email' ),
            'orderby' => 'display_name',
        ) );

        $list = array();

        foreach ( $users as $user ) {
            $list[] = array(
                'id'    => (int) $user->ID,
                'name'  => $user->display_name,
                'email' => $user->user_email,
            );
        }

        return rest_ensure_response( $list );
    }

    /**
     * Generic error handler.
     */
    protected function error_response( WP_Error $error ) {
        $status = $error->get_error_data();

        if ( is_array( $status ) && isset( $status['status'] ) ) {
            $status = $status['status'];
        }

        if ( ! $status ) {
            $status = 400;
        }

        return new WP_REST_Response(
            array(
                'code'    => $error->get_error_code(),
                'message' => $error->get_error_message(),
            ),
            (int) $status
        );
    }

    /**
     * Create a notification entry.
     *
     * @param array $data Notification data.
     */
    protected function notify( $data ) {
        $data = wp_parse_args( $data, array(
            'user_id' => 0,
            'message' => '',
            'type'    => 'info',
        ) );

        if ( ! $data['message'] ) {
            return;
        }

        Local4Picnic_Data::insert_notification( $data );
    }

    /**
     * Arguments for task endpoints.
     */
    protected function get_task_args( $is_update = false ) {
        $args = array(
            'title' => array(
                'required'          => ! $is_update,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'description' => array(
                'required'          => false,
                'sanitize_callback' => 'wp_kses_post',
            ),
            'status' => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_key',
            ),
            'assigned_to' => array(
                'required'          => false,
                'sanitize_callback' => 'absint',
            ),
            'due_date' => array(
                'required'          => false,
                'sanitize_callback' => array( $this, 'sanitize_datetime' ),
            ),
        );

        return $args;
    }

    /**
     * Arguments for funding endpoints.
     */
    protected function get_funding_args( $is_update = false ) {
        return array(
            'category' => array(
                'required'          => ! $is_update,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'amount' => array(
                'required'          => ! $is_update,
                'sanitize_callback' => 'floatval',
            ),
            'direction' => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_key',
            ),
            'source' => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'notes' => array(
                'required'          => false,
                'sanitize_callback' => 'wp_kses_post',
            ),
            'recorded_at' => array(
                'required'          => false,
                'sanitize_callback' => array( $this, 'sanitize_datetime' ),
            ),
        );
    }

    /**
     * Crew args.
     */
    protected function get_crew_args( $is_update = false ) {
        return array(
            'name' => array(
                'required'          => ! $is_update,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'email' => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_email',
            ),
            'phone' => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'role' => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_key',
            ),
            'notes' => array(
                'required'          => false,
                'sanitize_callback' => 'wp_kses_post',
            ),
        );
    }

    /**
     * Feed args.
     */
    protected function get_feed_args( $is_update = false ) {
        return array(
            'content' => array(
                'required'          => ! $is_update,
                'sanitize_callback' => 'wp_kses_post',
            ),
            'parent_id' => array(
                'required'          => false,
                'sanitize_callback' => 'absint',
            ),
        );
    }

    /**
     * Sanitize datetime string.
     */
    public function sanitize_datetime( $value ) {
        if ( empty( $value ) ) {
            return '';
        }

        $timestamp = strtotime( $value );

        if ( ! $timestamp ) {
            return current_time( 'mysql', true );
        }

        return gmdate( 'Y-m-d H:i:s', $timestamp );
    }

    /**
     * Permission callbacks.
     */
    public function can_view_tasks() {
        return current_user_can( 'l4p_view_tasks' ) || current_user_can( 'l4p_manage_tasks' );
    }

    public function can_manage_tasks() {
        return current_user_can( 'l4p_manage_tasks' );
    }

    public function can_view_funding() {
        return current_user_can( 'l4p_view_funding' ) || current_user_can( 'l4p_manage_funding' );
    }

    public function can_manage_funding() {
        return current_user_can( 'l4p_manage_funding' );
    }

    public function can_view_crew() {
        return current_user_can( 'l4p_view_crew' ) || current_user_can( 'l4p_manage_crew' );
    }

    public function can_manage_crew() {
        return current_user_can( 'l4p_manage_crew' );
    }

    public function can_view_feed() {
        return current_user_can( 'l4p_view_feed' ) || current_user_can( 'l4p_manage_feed' );
    }

    public function can_manage_feed() {
        return current_user_can( 'l4p_manage_feed' );
    }

    public function can_manage_notifications() {
        return current_user_can( 'l4p_manage_notifications' );
    }

    public function is_logged_in() {
        return is_user_logged_in();
    }
}

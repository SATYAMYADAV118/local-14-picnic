<?php
/**
 * REST API controller for Local4Picnic dashboard data.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_REST {

    /**
     * Register routes.
     */
    public function register_routes() {
        register_rest_route(
            'local4picnic/v1',
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
            'local4picnic/v1',
            '/tasks/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_task' ),
                    'permission_callback' => array( $this, 'can_edit_task' ),
                    'args'                => $this->get_task_update_args(),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_task' ),
                    'permission_callback' => array( $this, 'can_manage_tasks' ),
                ),
            )
        );

        register_rest_route(
            'local4picnic/v1',
            '/users',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_users' ),
                    'permission_callback' => array( $this, 'can_view_users' ),
                    'args'                => array(
                        'search' => array(
                            'required'          => false,
                            'sanitize_callback' => 'sanitize_text_field',
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            'local4picnic/v1',
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
            'local4picnic/v1',
            '/funding/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_funding' ),
                    'permission_callback' => array( $this, 'can_manage_funding' ),
                    'args'                => $this->get_funding_update_args(),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_funding' ),
                    'permission_callback' => array( $this, 'can_manage_funding' ),
                ),
            )
        );

        register_rest_route(
            'local4picnic/v1',
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
            'local4picnic/v1',
            '/crew/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_crew' ),
                    'permission_callback' => array( $this, 'can_manage_crew' ),
                    'args'                => $this->get_crew_update_args(),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_crew' ),
                    'permission_callback' => array( $this, 'can_manage_crew' ),
                ),
            )
        );

        register_rest_route(
            'local4picnic/v1',
            '/feed',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_feed' ),
                    'permission_callback' => array( $this, 'must_be_logged_in' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_feed_entry' ),
                    'permission_callback' => array( $this, 'must_be_logged_in' ),
                    'args'                => $this->get_feed_args(),
                ),
            )
        );

        register_rest_route(
            'local4picnic/v1',
            '/notifications',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_notifications' ),
                    'permission_callback' => array( $this, 'must_be_logged_in' ),
                    'args'                => array(
                        'since' => array(
                            'required'          => false,
                            'sanitize_callback' => 'sanitize_text_field',
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            'local4picnic/v1',
            '/notifications/(?P<id>\d+)/read',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'mark_notification_read' ),
                    'permission_callback' => array( $this, 'must_be_logged_in' ),
                ),
            )
        );
    }

    /**
     * Check whether current user can view tasks.
     */
    public function can_view_tasks() {
        return is_user_logged_in();
    }

    /**
     * Check whether current user can manage all tasks.
     */
    public function can_manage_tasks() {
        return current_user_can( 'l4p_manage_volunteers' );
    }

    /**
     * Check whether current user can view assignable users.
     */
    public function can_view_users() {
        return current_user_can( 'l4p_manage_volunteers' ) || current_user_can( 'manage_options' );
    }

    /**
     * Check whether current user can edit a task.
     *
     * @param WP_REST_Request $request Request.
     */
    public function can_edit_task( WP_REST_Request $request ) {
        $task = Local4Picnic_Data::get_task( (int) $request['id'] );

        if ( ! $task ) {
            return new WP_Error( 'local4picnic_task_missing', __( 'Task not found.', 'local4picnic' ), array( 'status' => 404 ) );
        }

        if ( current_user_can( 'l4p_manage_volunteers' ) ) {
            return true;
        }

        $user_id = get_current_user_id();

        if ( $task['assigned_to'] === $user_id ) {
            return true;
        }

        $requested_assignee = absint( $request->get_param( 'assigned_to' ) );

        if ( 0 === (int) $task['assigned_to'] && $requested_assignee === $user_id ) {
            return true;
        }

        return new WP_Error( 'local4picnic_forbidden', __( 'You are not allowed to modify this task.', 'local4picnic' ), array( 'status' => 403 ) );
    }

    /**
     * Check whether current user can view funding entries.
     */
    public function can_view_funding() {
        return current_user_can( 'l4p_view_funding' ) || current_user_can( 'l4p_manage_funding' );
    }

    /**
     * Check whether current user can manage funding entries.
     */
    public function can_manage_funding() {
        return current_user_can( 'l4p_manage_funding' );
    }

    /**
     * Check whether user can view crew list.
     */
    public function can_view_crew() {
        return is_user_logged_in();
    }

    /**
     * Check whether user can manage crew data.
     */
    public function can_manage_crew() {
        return current_user_can( 'l4p_manage_volunteers' );
    }

    /**
     * Require authentication.
     */
    public function must_be_logged_in() {
        return is_user_logged_in();
    }

    /**
     * Task arguments for creation.
     */
    protected function get_task_args() {
        return array(
            'title'       => array(
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'description' => array(
                'required'          => false,
                'sanitize_callback' => array( $this, 'sanitize_rich_text' ),
                'default'           => '',
            ),
            'assigned_to' => array(
                'required'          => false,
                'sanitize_callback' => 'absint',
                'default'           => 0,
            ),
            'status'      => array(
                'required'          => false,
                'sanitize_callback' => array( $this, 'sanitize_task_status' ),
                'default'           => 'not_started',
            ),
            'due_date'    => array(
                'required'          => false,
                'sanitize_callback' => array( $this, 'sanitize_datetime' ),
                'default'           => '',
            ),
        );
    }

    /**
     * Task update arguments.
     */
    protected function get_task_update_args() {
        $args = $this->get_task_args();

        foreach ( $args as &$config ) {
            $config['required'] = false;
        }

        return $args;
    }

    /**
     * Funding creation arguments.
     */
    protected function get_funding_args() {
        return array(
            'category'  => array(
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'amount'    => array(
                'required'          => true,
                'sanitize_callback' => array( $this, 'sanitize_float' ),
            ),
            'direction' => array(
                'required'          => true,
                'sanitize_callback' => array( $this, 'sanitize_direction' ),
            ),
            'source'    => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ),
            'notes'     => array(
                'required'          => false,
                'sanitize_callback' => array( $this, 'sanitize_rich_text' ),
                'default'           => '',
            ),
            'recorded_at' => array(
                'required'          => false,
                'sanitize_callback' => array( $this, 'sanitize_datetime' ),
                'default'           => '',
            ),
        );
    }

    /**
     * Funding update arguments.
     */
    protected function get_funding_update_args() {
        $args = $this->get_funding_args();

        foreach ( $args as &$config ) {
            $config['required'] = false;
        }

        return $args;
    }

    /**
     * Crew creation arguments.
     */
    protected function get_crew_args() {
        return array(
            'name'  => array(
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
            ),
            'email' => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_email',
                'default'           => '',
            ),
            'phone' => array(
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
                'default'           => '',
            ),
            'role'  => array(
                'required'          => true,
                'sanitize_callback' => array( $this, 'sanitize_crew_role' ),
            ),
            'notes' => array(
                'required'          => false,
                'sanitize_callback' => array( $this, 'sanitize_rich_text' ),
                'default'           => '',
            ),
        );
    }

    /**
     * Crew update arguments.
     */
    protected function get_crew_update_args() {
        $args = $this->get_crew_args();

        foreach ( $args as &$config ) {
            $config['required'] = false;
        }

        return $args;
    }

    /**
     * Feed arguments.
     */
    protected function get_feed_args() {
        return array(
            'content'   => array(
                'required'          => true,
                'sanitize_callback' => array( $this, 'sanitize_rich_text' ),
            ),
            'parent_id' => array(
                'required'          => false,
                'sanitize_callback' => 'absint',
                'default'           => 0,
            ),
        );
    }

    /**
     * Fetch tasks response.
     *
     * @param WP_REST_Request $request Request.
     */
    public function get_tasks( WP_REST_Request $request ) {
        $user_id    = get_current_user_id();
        $can_manage = current_user_can( 'l4p_manage_volunteers' );

        $tasks = Local4Picnic_Data::get_tasks_for_user( $user_id, $can_manage );

        return rest_ensure_response(
            array(
                'tasks' => $tasks,
            )
        );
    }

    /**
     * Retrieve assignable users.
     *
     * @param WP_REST_Request $request Request.
     */
    public function get_users( WP_REST_Request $request ) {
        return rest_ensure_response(
            array(
                'users' => Local4Picnic_Data::get_assignable_users( $request->get_param( 'search' ) ),
            )
        );
    }

    /**
     * Create a task.
     *
     * @param WP_REST_Request $request Request.
     */
    public function create_task( WP_REST_Request $request ) {
        $data = $request->get_params();

        $assignee = absint( $data['assigned_to'] );

        if ( $assignee && ! get_user_by( 'id', $assignee ) ) {
            return new WP_Error( 'local4picnic_task_assignee', __( 'Selected assignee does not exist.', 'local4picnic' ), array( 'status' => 400 ) );
        }

        $task = Local4Picnic_Data::create_task(
            array(
                'title'       => $data['title'],
                'description' => wp_kses_post( $data['description'] ),
                'status'      => $data['status'],
                'assigned_to' => $assignee,
                'created_by'  => get_current_user_id(),
                'due_date'    => $data['due_date'] ? gmdate( 'Y-m-d H:i:s', strtotime( $data['due_date'] ) ) : null,
                'created_at'  => current_time( 'mysql', true ),
                'updated_at'  => current_time( 'mysql', true ),
            )
        );

        if ( is_wp_error( $task ) ) {
            return $task;
        }

        $this->notify_task_assignment( $task );

        return rest_ensure_response( $task );
    }

    /**
     * Update a task.
     *
     * @param WP_REST_Request $request Request.
     */
    public function update_task( WP_REST_Request $request ) {
        $task_id = (int) $request['id'];
        $data    = $request->get_params();

        $update   = array();
        $original = Local4Picnic_Data::get_task( $task_id );

        if ( isset( $data['title'] ) ) {
            $update['title'] = sanitize_text_field( $data['title'] );
        }

        if ( isset( $data['description'] ) ) {
            $update['description'] = wp_kses_post( $data['description'] );
        }

        if ( isset( $data['status'] ) ) {
            $update['status'] = $this->sanitize_task_status( $data['status'] );
        }

        if ( isset( $data['assigned_to'] ) ) {
            $assignee = absint( $data['assigned_to'] );

            if ( $assignee && ! get_user_by( 'id', $assignee ) ) {
                return new WP_Error( 'local4picnic_task_assignee', __( 'Selected assignee does not exist.', 'local4picnic' ), array( 'status' => 400 ) );
            }

            $update['assigned_to'] = $assignee;
        }

        if ( isset( $data['due_date'] ) ) {
            $update['due_date'] = $data['due_date'] ? gmdate( 'Y-m-d H:i:s', strtotime( $data['due_date'] ) ) : null;
        }

        $update['updated_at'] = current_time( 'mysql', true );

        if ( ! current_user_can( 'l4p_manage_volunteers' ) ) {
            $user_id = get_current_user_id();
            $allowed = array( 'status' => true, 'updated_at' => true );

            if ( isset( $update['assigned_to'] ) && (int) $original['assigned_to'] === 0 && $update['assigned_to'] === $user_id ) {
                $allowed['assigned_to'] = true;
            }

            $update = array_intersect_key( $update, $allowed );
        }

        $task = Local4Picnic_Data::update_task( $task_id, $update );

        if ( is_wp_error( $task ) ) {
            return $task;
        }

        $this->notify_task_assignment( $task, $original );

        return rest_ensure_response( $task );
    }

    /**
     * Delete a task.
     *
     * @param WP_REST_Request $request Request.
     */
    public function delete_task( WP_REST_Request $request ) {
        Local4Picnic_Data::delete_task( (int) $request['id'] );

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Get funding entries.
     */
    public function get_funding() {
        $entries = Local4Picnic_Data::get_funding_entries();
        $summary = Local4Picnic_Data::get_funding_summary();
        $options = Local4Picnic_Settings::get_options();

        return rest_ensure_response(
            array(
                'entries' => $entries,
                'summary' => $summary,
                'goal'    => isset( $options['funding_goal'] ) ? (float) $options['funding_goal'] : 0,
                'visibility' => isset( $options['funding_visibility'] ) ? $options['funding_visibility'] : 'public',
            )
        );
    }

    /**
     * Create funding entry.
     *
     * @param WP_REST_Request $request Request.
     */
    public function create_funding( WP_REST_Request $request ) {
        $data = $request->get_params();

        $entry = Local4Picnic_Data::create_funding_entry(
            array(
                'category'    => sanitize_text_field( $data['category'] ),
                'amount'      => (float) $data['amount'],
                'direction'   => $this->sanitize_direction( $data['direction'] ),
                'source'      => sanitize_text_field( $data['source'] ),
                'notes'       => wp_kses_post( $data['notes'] ),
                'recorded_by' => get_current_user_id(),
                'recorded_at' => $data['recorded_at'] ? gmdate( 'Y-m-d H:i:s', strtotime( $data['recorded_at'] ) ) : current_time( 'mysql', true ),
                'created_at'  => current_time( 'mysql', true ),
                'updated_at'  => current_time( 'mysql', true ),
            )
        );

        if ( is_wp_error( $entry ) ) {
            return $entry;
        }

        $this->notify_funding_update( $entry );

        return rest_ensure_response( $entry );
    }

    /**
     * Update funding entry.
     *
     * @param WP_REST_Request $request Request.
     */
    public function update_funding( WP_REST_Request $request ) {
        $entry_id = (int) $request['id'];
        $data     = $request->get_params();

        $update = array();

        if ( isset( $data['category'] ) ) {
            $update['category'] = sanitize_text_field( $data['category'] );
        }

        if ( isset( $data['amount'] ) ) {
            $update['amount'] = $this->sanitize_float( $data['amount'] );
        }

        if ( isset( $data['direction'] ) ) {
            $update['direction'] = $this->sanitize_direction( $data['direction'] );
        }

        if ( isset( $data['source'] ) ) {
            $update['source'] = sanitize_text_field( $data['source'] );
        }

        if ( isset( $data['notes'] ) ) {
            $update['notes'] = wp_kses_post( $data['notes'] );
        }

        if ( isset( $data['recorded_at'] ) ) {
            $update['recorded_at'] = $data['recorded_at'] ? gmdate( 'Y-m-d H:i:s', strtotime( $data['recorded_at'] ) ) : current_time( 'mysql', true );
        }

        $entry = Local4Picnic_Data::update_funding_entry( $entry_id, $update );

        if ( is_wp_error( $entry ) ) {
            return $entry;
        }

        $this->notify_funding_update( $entry );

        return rest_ensure_response( $entry );
    }

    /**
     * Delete funding entry.
     *
     * @param WP_REST_Request $request Request.
     */
    public function delete_funding( WP_REST_Request $request ) {
        Local4Picnic_Data::delete_funding_entry( (int) $request['id'] );

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Get crew list.
     */
    public function get_crew() {
        return rest_ensure_response(
            array(
                'crew' => Local4Picnic_Data::get_crew_members(),
            )
        );
    }

    /**
     * Create crew member.
     *
     * @param WP_REST_Request $request Request.
     */
    public function create_crew( WP_REST_Request $request ) {
        $data = $request->get_params();

        $crew = Local4Picnic_Data::create_crew_member(
            array(
                'name'       => sanitize_text_field( $data['name'] ),
                'email'      => sanitize_email( $data['email'] ),
                'phone'      => sanitize_text_field( $data['phone'] ),
                'role'       => $this->sanitize_crew_role( $data['role'] ),
                'notes'      => wp_kses_post( $data['notes'] ),
                'created_by' => get_current_user_id(),
                'created_at' => current_time( 'mysql', true ),
                'updated_at' => current_time( 'mysql', true ),
            )
        );

        if ( is_wp_error( $crew ) ) {
            return $crew;
        }

        return rest_ensure_response( $crew );
    }

    /**
     * Update crew member.
     *
     * @param WP_REST_Request $request Request.
     */
    public function update_crew( WP_REST_Request $request ) {
        $crew_id = (int) $request['id'];
        $data    = $request->get_params();

        $update = array();

        if ( isset( $data['name'] ) ) {
            $update['name'] = sanitize_text_field( $data['name'] );
        }

        if ( isset( $data['email'] ) ) {
            $update['email'] = sanitize_email( $data['email'] );
        }

        if ( isset( $data['phone'] ) ) {
            $update['phone'] = sanitize_text_field( $data['phone'] );
        }

        if ( isset( $data['role'] ) ) {
            $update['role'] = $this->sanitize_crew_role( $data['role'] );
        }

        if ( isset( $data['notes'] ) ) {
            $update['notes'] = wp_kses_post( $data['notes'] );
        }

        $crew = Local4Picnic_Data::update_crew_member( $crew_id, $update );

        if ( is_wp_error( $crew ) ) {
            return $crew;
        }

        return rest_ensure_response( $crew );
    }

    /**
     * Delete crew member.
     *
     * @param WP_REST_Request $request Request.
     */
    public function delete_crew( WP_REST_Request $request ) {
        Local4Picnic_Data::delete_crew_member( (int) $request['id'] );

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Get feed threads.
     */
    public function get_feed() {
        $threads = Local4Picnic_Data::get_feed_threads();
        $options = Local4Picnic_Settings::get_options();

        return rest_ensure_response(
            array(
                'threads' => $threads,
                'allow_comments' => ! empty( $options['feed_comments'] ),
            )
        );
    }

    /**
     * Create feed entry.
     *
     * @param WP_REST_Request $request Request.
     */
    public function create_feed_entry( WP_REST_Request $request ) {
        $data = $request->get_params();

        $options = Local4Picnic_Settings::get_options();

        if ( ! empty( $data['parent_id'] ) && empty( $options['feed_comments'] ) ) {
            return new WP_Error( 'local4picnic_feed_locked', __( 'Replies are disabled for the community feed.', 'local4picnic' ), array( 'status' => 403 ) );
        }

        $entry = Local4Picnic_Data::create_feed_entry(
            array(
                'user_id'    => get_current_user_id(),
                'parent_id'  => absint( $data['parent_id'] ),
                'content'    => wp_kses_post( $data['content'] ),
                'created_at' => current_time( 'mysql', true ),
                'updated_at' => current_time( 'mysql', true ),
            )
        );

        if ( is_wp_error( $entry ) ) {
            return $entry;
        }

        $this->notify_feed_update( $entry );

        return rest_ensure_response( $entry );
    }

    /**
     * Get notifications.
     */
    public function get_notifications( WP_REST_Request $request ) {
        $user_id = get_current_user_id();

        return rest_ensure_response(
            array(
                'notifications' => Local4Picnic_Data::get_notifications_for_user( $user_id, $request->get_param( 'since' ) ),
                'unread'        => Local4Picnic_Data::count_unread_notifications( $user_id ),
                'refreshed_at'  => current_time( 'mysql', true ),
            )
        );
    }

    /**
     * Mark notification read.
     *
     * @param WP_REST_Request $request Request.
     */
    public function mark_notification_read( WP_REST_Request $request ) {
        $notification = Local4Picnic_Data::get_notification( (int) $request['id'] );

        if ( ! $notification ) {
            return new WP_Error( 'local4picnic_notification_missing', __( 'Notification not found.', 'local4picnic' ), array( 'status' => 404 ) );
        }

        $user_id = get_current_user_id();

        if ( $notification['user_id'] !== 0 && (int) $notification['user_id'] !== $user_id ) {
            return new WP_Error( 'local4picnic_forbidden', __( 'You cannot modify this notification.', 'local4picnic' ), array( 'status' => 403 ) );
        }

        Local4Picnic_Data::mark_notification_read( $notification['id'] );

        return rest_ensure_response(
            array(
                'updated' => true,
                'unread'  => Local4Picnic_Data::count_unread_notifications( $user_id ),
            )
        );
    }

    /**
     * Sanitize wysiwyg fields.
     *
     * @param string $value Raw value.
     */
    public function sanitize_rich_text( $value ) {
        return wp_kses_post( $value );
    }

    /**
     * Sanitize task status.
     *
     * @param string $status Status key.
     */
    public function sanitize_task_status( $status ) {
        $allowed = array( 'not_started', 'in_progress', 'completed' );

        if ( ! in_array( $status, $allowed, true ) ) {
            return 'not_started';
        }

        return $status;
    }

    /**
     * Sanitize decimal value.
     *
     * @param mixed $value Value.
     */
    public function sanitize_float( $value ) {
        return round( floatval( $value ), 2 );
    }

    /**
     * Sanitize funding direction.
     *
     * @param string $value Direction value.
     */
    public function sanitize_direction( $value ) {
        $allowed = array( 'income', 'expense' );

        if ( ! in_array( $value, $allowed, true ) ) {
            return 'income';
        }

        return $value;
    }

    /**
     * Sanitize crew role values.
     *
     * @param string $value Role.
     */
    public function sanitize_crew_role( $value ) {
        $allowed = array( 'volunteer', 'coordinator', 'vendor', 'sponsor' );

        $value = strtolower( sanitize_text_field( $value ) );

        if ( ! in_array( $value, $allowed, true ) ) {
            $value = 'volunteer';
        }

        return $value;
    }

    /**
     * Sanitize datetime string.
     *
     * @param string $value Value.
     */
    public function sanitize_datetime( $value ) {
        if ( empty( $value ) ) {
            return '';
        }

        $timestamp = strtotime( $value );

        if ( ! $timestamp ) {
            return '';
        }

        return gmdate( 'Y-m-d H:i:s', $timestamp );
    }

    /**
     * Add notifications for task updates.
     *
     * @param array $task Task data.
     */
    protected function notify_task_assignment( $task, $original = null ) {
        if ( empty( $task['assigned_to'] ) ) {
            return;
        }

        if ( isset( $original['assigned_to'] ) && (int) $original['assigned_to'] === (int) $task['assigned_to'] ) {
            return;
        }

        Local4Picnic_Data::create_notification(
            array(
                'user_id'   => (int) $task['assigned_to'],
                'message'   => sprintf(
                    /* translators: %s: task title */
                    __( 'You have been assigned to "%s".', 'local4picnic' ),
                    $task['title']
                ),
                'type'      => 'task',
                'is_read'   => 0,
                'created_at'=> current_time( 'mysql', true ),
            )
        );
    }

    /**
     * Add notifications for funding updates.
     *
     * @param array $entry Funding entry.
     */
    protected function notify_funding_update( $entry ) {
        Local4Picnic_Data::create_notification(
            array(
                'user_id'   => 0,
                'message'   => sprintf(
                    /* translators: 1: funding direction, 2: formatted amount */
                    __( 'Funding %1$s of %2$s recorded.', 'local4picnic' ),
                    $entry['direction'],
                    $this->format_currency( $entry['amount'] )
                ),
                'type'      => 'funding',
                'is_read'   => 0,
                'created_at'=> current_time( 'mysql', true ),
            )
        );
    }

    /**
     * Add notifications for feed activity.
     *
     * @param array $entry Feed entry.
     */
    protected function notify_feed_update( $entry ) {
        Local4Picnic_Data::create_notification(
            array(
                'user_id'   => 0,
                'message'   => __( 'Community feed has a new update.', 'local4picnic' ),
                'type'      => 'feed',
                'is_read'   => 0,
                'created_at'=> current_time( 'mysql', true ),
            )
        );
    }

    /**
     * Format an amount with the configured currency.
     *
     * @param float $amount Amount to format.
     */
    protected function format_currency( $amount ) {
        $options  = Local4Picnic_Settings::get_options();
        $currency = isset( $options['currency'] ) ? $options['currency'] : 'USD';

        $formatted = number_format_i18n( (float) $amount, 2 );

        return sprintf( '%s %s', $currency, $formatted );
    }
}

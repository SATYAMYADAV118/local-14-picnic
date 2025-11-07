<?php
/**
 * REST API registration.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Local4Picnic_Rest
 */
class Local4Picnic_Rest {

    /**
     * Notifications handler.
     *
     * @var Local4Picnic_Notifications
     */
    protected $notifications;

    /**
     * Dashboard aggregator.
     *
     * @var Local4Picnic_Dashboard
     */
    protected $dashboard;

    /**
     * Crew handler.
     *
     * @var Local4Picnic_Crew
     */
    protected $crew;

    /**
     * Settings handler.
     *
     * @var Local4Picnic_Settings
     */
    protected $settings;

    /**
     * Constructor.
     */
    public function __construct( Local4Picnic_Notifications $notifications, Local4Picnic_Dashboard $dashboard, Local4Picnic_Crew $crew, Local4Picnic_Settings $settings ) {
        $this->notifications = $notifications;
        $this->dashboard     = $dashboard;
        $this->crew          = $crew;
        $this->settings      = $settings;
    }

    /**
     * Register routes.
     */
    public function register_routes() {
        register_rest_route(
            'l4p/v1',
            '/tasks',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_tasks' ),
                    'permission_callback' => array( $this, 'can_read_tasks' ),
                    'args'                => array(
                        'status'   => array(
                            'sanitize_callback' => 'sanitize_text_field',
                        ),
                        'assignee' => array(
                            'sanitize_callback' => 'absint',
                        ),
                    ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_task' ),
                    'permission_callback' => array( $this, 'can_write_tasks' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/tasks/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_task' ),
                    'permission_callback' => array( $this, 'can_read_tasks' ),
                ),
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_task' ),
                    'permission_callback' => array( $this, 'can_write_tasks' ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_task' ),
                    'permission_callback' => array( $this, 'can_manage_tasks' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/tasks/(?P<task_id>\d+)/comments',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_task_comments' ),
                    'permission_callback' => array( $this, 'can_read_tasks' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_task_comment' ),
                    'permission_callback' => array( $this, 'can_comment_tasks' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/tasks/comments/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_task_comment' ),
                    'permission_callback' => array( $this, 'can_delete_task_comment' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/funding',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_funding' ),
                    'permission_callback' => array( $this, 'can_read_funding' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_funding' ),
                    'permission_callback' => array( $this, 'can_manage_funding' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/funding/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_funding' ),
                    'permission_callback' => array( $this, 'can_manage_funding' ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_funding' ),
                    'permission_callback' => array( $this, 'can_manage_funding' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/community/posts',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_posts' ),
                    'permission_callback' => array( $this, 'can_read_community' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_post' ),
                    'permission_callback' => array( $this, 'can_write_community' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/community/posts/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_post' ),
                    'permission_callback' => array( $this, 'can_edit_post' ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_post' ),
                    'permission_callback' => array( $this, 'can_delete_post' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/community/posts/(?P<post_id>\d+)/comments',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_comments' ),
                    'permission_callback' => array( $this, 'can_read_community' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_comment' ),
                    'permission_callback' => array( $this, 'can_write_community' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/community/comments/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_comment' ),
                    'permission_callback' => array( $this, 'can_edit_comment' ),
                ),
                array(
                    'methods'             => WP_REST_Server::DELETABLE,
                    'callback'            => array( $this, 'delete_comment' ),
                    'permission_callback' => array( $this, 'can_delete_comment' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/dashboard',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_dashboard' ),
                    'permission_callback' => array( $this, 'can_read_dashboard' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/notifications',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_notifications' ),
                    'permission_callback' => array( $this, 'can_read_notifications' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/notifications/(?P<id>\d+)/read',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'mark_notification_read' ),
                    'permission_callback' => array( $this, 'can_read_notifications' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/notifications/mark-all',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'mark_all_notifications' ),
                    'permission_callback' => array( $this, 'can_read_notifications' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/settings',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_settings' ),
                    'permission_callback' => array( $this, 'can_read_settings' ),
                ),
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_settings' ),
                    'permission_callback' => array( $this, 'can_manage_settings' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/crew',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_crew' ),
                    'permission_callback' => array( $this, 'can_read_crew' ),
                ),
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'create_member' ),
                    'permission_callback' => array( $this, 'can_manage_crew' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/crew/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_member' ),
                    'permission_callback' => array( $this, 'can_manage_crew' ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/crew/upload',
            array(
                array(
                    'methods'             => WP_REST_Server::CREATABLE,
                    'callback'            => array( $this, 'upload_crew_avatar' ),
                    'permission_callback' => array( $this, 'can_manage_crew' ),
                    'args'                => array(
                        'avatar' => array(
                            'required' => true,
                        ),
                    ),
                ),
            )
        );

        register_rest_route(
            'l4p/v1',
            '/funding/export',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'export_funding_csv' ),
                    'permission_callback' => array( $this, 'can_export_funding' ),
                ),
            )
        );
    }

    /**
     * Fetch tasks.
     */
    public function get_tasks( WP_REST_Request $request ) {
        global $wpdb;

        $status   = $request->get_param( 'status' );
        $assignee = $request->get_param( 'assignee' );

        $query = "SELECT * FROM {$wpdb->prefix}l4p_tasks WHERE 1=1";
        $args  = array();

        if ( $status ) {
            $query .= ' AND status = %s';
            $args[] = $status;
        }

        if ( $assignee ) {
            $query .= ' AND assignee_id = %d';
            $args[] = absint( $assignee );
        }

        $query .= ' ORDER BY due_date IS NULL, due_date ASC';

        $prepared = empty( $args ) ? $query : $wpdb->prepare( $query, $args );
        $items    = $wpdb->get_results( $prepared, ARRAY_A );

        return rest_ensure_response( array_map( array( $this, 'prepare_task_for_response' ), $items ) );
    }

    /**
     * Prepare task for response.
     */
    protected function prepare_task_for_response( $task ) {
        if ( ! $task ) {
            return array();
        }

        $task['id']          = (int) $task['id'];
        $task['assignee_id'] = $task['assignee_id'] ? (int) $task['assignee_id'] : null;
        $task['created_by']  = (int) $task['created_by'];

        return $task;
    }

    /**
     * Fetch comments for a task.
     */
    public function get_task_comments( WP_REST_Request $request ) {
        global $wpdb;

        $task_id = (int) $request['task_id'];

        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT c.*, u.display_name AS author_name FROM {$wpdb->prefix}l4p_task_comments c LEFT JOIN {$wpdb->users} u ON c.author_id = u.ID WHERE c.task_id = %d ORDER BY c.created_at ASC",
                $task_id
            ),
            ARRAY_A
        );

        foreach ( $results as &$comment ) {
            $comment['id']         = (int) $comment['id'];
            $comment['task_id']    = (int) $comment['task_id'];
            $comment['parent_id']  = $comment['parent_id'] ? (int) $comment['parent_id'] : null;
            $comment['author_id']  = (int) $comment['author_id'];
            $comment['author_name'] = $comment['author_name'] ? $comment['author_name'] : __( 'Member', 'local4picnic' );
        }

        return rest_ensure_response( $results );
    }

    /**
     * Create task comment.
     */
    public function create_task_comment( WP_REST_Request $request ) {
        global $wpdb;

        $task_id   = (int) $request['task_id'];
        $body      = wp_kses_post( $request['body'] );
        $parent_id = $request->get_param( 'parent_id' );

        if ( empty( $body ) ) {
            return new WP_Error( 'l4p_task_comment_body', __( 'Comment cannot be empty.', 'local4picnic' ), array( 'status' => 400 ) );
        }

        if ( $parent_id ) {
            $parent_task = (int) $wpdb->get_var( $wpdb->prepare( "SELECT task_id FROM {$wpdb->prefix}l4p_task_comments WHERE id = %d", $parent_id ) );
            if ( $task_id !== $parent_task ) {
                $parent_id = null;
            }
        }

        $wpdb->insert(
            $wpdb->prefix . 'l4p_task_comments',
            array(
                'task_id'   => $task_id,
                'author_id' => get_current_user_id(),
                'body'      => $body,
                'parent_id' => $parent_id ? (int) $parent_id : null,
            ),
            array( '%d', '%d', '%s', '%d' )
        );

        $comment = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT c.*, u.display_name AS author_name FROM {$wpdb->prefix}l4p_task_comments c LEFT JOIN {$wpdb->users} u ON c.author_id = u.ID WHERE c.id = %d",
                $wpdb->insert_id
            ),
            ARRAY_A
        );

        $comment['id']         = (int) $comment['id'];
        $comment['task_id']    = (int) $comment['task_id'];
        $comment['parent_id']  = $comment['parent_id'] ? (int) $comment['parent_id'] : null;
        $comment['author_id']  = (int) $comment['author_id'];
        $comment['author_name'] = $comment['author_name'] ? $comment['author_name'] : __( 'Member', 'local4picnic' );

        return rest_ensure_response( $comment );
    }

    /**
     * Delete task comment.
     */
    public function delete_task_comment( WP_REST_Request $request ) {
        global $wpdb;

        $id = (int) $request['id'];

        $wpdb->delete( $wpdb->prefix . 'l4p_task_comments', array( 'id' => $id ), array( '%d' ) );
        $wpdb->delete( $wpdb->prefix . 'l4p_task_comments', array( 'parent_id' => $id ), array( '%d' ) );

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Create a task.
     */
    public function create_task( WP_REST_Request $request ) {
        $current_user = get_current_user_id();
        $params       = $this->sanitize_task_params( $request );
        $params['created_by'] = $current_user;

        if ( empty( $params['title'] ) ) {
            return new WP_Error( 'l4p_task_title_required', __( 'Task title is required.', 'local4picnic' ), array( 'status' => 400 ) );
        }

        $inserted = $this->insert_task( $params );

        if ( is_wp_error( $inserted ) ) {
            return $inserted;
        }

        $task = $this->get_task_by_id( $inserted );
        $this->notifications->notify_task_event( 'created', $task );

        return rest_ensure_response( $task );
    }

    /**
     * Update task.
     */
    public function update_task( WP_REST_Request $request ) {
        $id      = (int) $request->get_param( 'id' );
        $task    = $this->get_task_by_id( $id );
        $params  = $this->sanitize_task_params( $request );

        if ( empty( $task ) ) {
            return new WP_Error( 'l4p_task_not_found', __( 'Task not found.', 'local4picnic' ), array( 'status' => 404 ) );
        }

        $updated = $this->update_task_record( $id, $params );

        if ( is_wp_error( $updated ) ) {
            return $updated;
        }

        $task = $this->get_task_by_id( $id );
        $this->notifications->notify_task_event( 'updated', $task );

        return rest_ensure_response( $task );
    }

    /**
     * Delete a task.
     */
    public function delete_task( WP_REST_Request $request ) {
        global $wpdb;

        $id = (int) $request->get_param( 'id' );

        $deleted = $wpdb->delete( $wpdb->prefix . 'l4p_tasks', array( 'id' => $id ), array( '%d' ) );

        if ( false === $deleted ) {
            return new WP_Error( 'l4p_task_delete_failed', __( 'Could not delete task.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        $this->notifications->notify_task_deleted( $id );

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Get single task.
     */
    public function get_task( WP_REST_Request $request ) {
        $task = $this->get_task_by_id( (int) $request['id'] );

        if ( empty( $task ) ) {
            return new WP_Error( 'l4p_task_not_found', __( 'Task not found.', 'local4picnic' ), array( 'status' => 404 ) );
        }

        return rest_ensure_response( $task );
    }

    /**
     * Sanitize task parameters.
     */
    protected function sanitize_task_params( WP_REST_Request $request ) {
        $params = array();

        if ( $request->has_param( 'title' ) ) {
            $params['title'] = sanitize_text_field( $request['title'] );
        }

        if ( $request->has_param( 'description' ) ) {
            $params['description'] = wp_kses_post( $request['description'] );
        }

        if ( $request->has_param( 'status' ) ) {
            $params['status'] = sanitize_key( $request['status'] );
        }

        if ( $request->has_param( 'priority' ) ) {
            $params['priority'] = sanitize_text_field( $request['priority'] );
        }

        if ( $request->has_param( 'due_date' ) ) {
            $params['due_date'] = sanitize_text_field( $request['due_date'] );
        }

        if ( $request->has_param( 'url' ) ) {
            $params['url'] = esc_url_raw( $request['url'] );
        }

        if ( $request->has_param( 'assignee_id' ) ) {
            $raw = $request->get_param( 'assignee_id' );
            if ( '' === $raw || null === $raw ) {
                $params['assignee_id'] = null;
            } else {
                $assignee = absint( $raw );
                $params['assignee_id'] = $assignee > 0 ? $assignee : null;
            }
        }

        return $params;
    }

    /**
     * Insert task.
     */
    protected function insert_task( array $data ) {
        global $wpdb;

        $table = $wpdb->prefix . 'l4p_tasks';

        $insert_data = array(
            'title'       => $data['title'],
            'description' => isset( $data['description'] ) ? $data['description'] : '',
            'status'      => isset( $data['status'] ) ? $data['status'] : 'todo',
            'priority'    => isset( $data['priority'] ) ? $data['priority'] : null,
            'due_date'    => isset( $data['due_date'] ) ? $data['due_date'] : null,
            'url'         => isset( $data['url'] ) ? $data['url'] : null,
            'created_by'  => $data['created_by'],
        );

        $format = array( '%s', '%s', '%s', '%s', '%s', '%s', '%d' );

        if ( isset( $data['assignee_id'] ) && $data['assignee_id'] ) {
            $insert_data['assignee_id'] = $data['assignee_id'];
            $format[]                   = '%d';
        }

        $insert = $wpdb->insert(
            $table,
            $insert_data,
            $format
        );

        if ( false === $insert ) {
            return new WP_Error( 'l4p_task_insert_failed', __( 'Could not create task.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        return $wpdb->insert_id;
    }

    /**
     * Update task record.
     */
    protected function update_task_record( $id, array $data ) {
        global $wpdb;

        if ( empty( $data ) ) {
            return true;
        }

        $table  = $wpdb->prefix . 'l4p_tasks';
        $format = array();

        $allowed = array( 'title', 'description', 'status', 'priority', 'due_date', 'url', 'assignee_id' );

        if ( array_key_exists( 'assignee_id', $data ) && null === $data['assignee_id'] ) {
            $wpdb->query( $wpdb->prepare( "UPDATE {$table} SET assignee_id = NULL WHERE id = %d", $id ) );
            unset( $data['assignee_id'] );
        }

        foreach ( $data as $key => $value ) {
            if ( ! in_array( $key, $allowed, true ) ) {
                unset( $data[ $key ] );
                continue;
            }

            if ( 'assignee_id' === $key ) {
                $format[] = '%d';
            } else {
                $format[] = '%s';
            }
        }

        if ( empty( $data ) ) {
            return true;
        }

        $updated = $wpdb->update( $table, $data, array( 'id' => $id ), $format, array( '%d' ) );

        if ( false === $updated ) {
            return new WP_Error( 'l4p_task_update_failed', __( 'Could not update task.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        return true;
    }

    /**
     * Get task by ID.
     */
    protected function get_task_by_id( $id ) {
        global $wpdb;

        $task = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}l4p_tasks WHERE id = %d", $id ), ARRAY_A );

        if ( ! $task ) {
            return array();
        }

        return $this->prepare_task_for_response( $task );
    }

    /**
     * Fetch funding records.
     */
    public function get_funding( WP_REST_Request $request ) {
        global $wpdb;

        $items = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}l4p_funding_tx ORDER BY tx_date DESC", ARRAY_A );

        foreach ( $items as &$item ) {
            $item['id']         = (int) $item['id'];
            $item['amount']     = (float) $item['amount'];
            $item['created_by'] = (int) $item['created_by'];
        }

        return rest_ensure_response( $items );
    }

    /**
     * Create funding transaction.
     */
    public function create_funding( WP_REST_Request $request ) {
        global $wpdb;

        $data = $this->sanitize_funding_params( $request );

        $data['created_by'] = get_current_user_id();

        $insert = $wpdb->insert(
            $wpdb->prefix . 'l4p_funding_tx',
            $data,
            array( '%s', '%f', '%s', '%s', '%s', '%d' )
        );

        if ( false === $insert ) {
            return new WP_Error( 'l4p_funding_insert_failed', __( 'Could not add funding transaction.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        $record = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}l4p_funding_tx WHERE id = %d", $wpdb->insert_id ), ARRAY_A );

        if ( $record ) {
            $record['id']         = (int) $record['id'];
            $record['amount']     = (float) $record['amount'];
            $record['created_by'] = (int) $record['created_by'];
        }

        $this->notifications->notify_funding_event( $record );

        return rest_ensure_response( $record );
    }

    /**
     * Update funding record.
     */
    public function update_funding( WP_REST_Request $request ) {
        global $wpdb;

        $id   = (int) $request['id'];
        $data = $this->sanitize_funding_params( $request );

        if ( empty( $data ) ) {
            return rest_ensure_response( $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}l4p_funding_tx WHERE id = %d", $id ), ARRAY_A ) );
        }

        $format = array();

        foreach ( $data as $key => $value ) {
            if ( 'amount' === $key ) {
                $format[] = '%f';
                $data[ $key ] = floatval( $value );
            } elseif ( 'type' === $key ) {
                $format[] = '%s';
                $data[ $key ] = sanitize_key( $value );
            } elseif ( 'tx_date' === $key ) {
                $format[] = '%s';
            } else {
                $format[] = '%s';
            }
        }

        $updated = $wpdb->update( $wpdb->prefix . 'l4p_funding_tx', $data, array( 'id' => $id ), $format, array( '%d' ) );

        if ( false === $updated ) {
            return new WP_Error( 'l4p_funding_update_failed', __( 'Could not update funding transaction.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        $record = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}l4p_funding_tx WHERE id = %d", $id ), ARRAY_A );

        if ( $record ) {
            $record['id']         = (int) $record['id'];
            $record['amount']     = (float) $record['amount'];
            $record['created_by'] = (int) $record['created_by'];
        }

        $this->notifications->notify_funding_event( $record );

        return rest_ensure_response( $record );
    }

    /**
     * Delete funding record.
     */
    public function delete_funding( WP_REST_Request $request ) {
        global $wpdb;

        $id = (int) $request['id'];

        $deleted = $wpdb->delete( $wpdb->prefix . 'l4p_funding_tx', array( 'id' => $id ), array( '%d' ) );

        if ( false === $deleted ) {
            return new WP_Error( 'l4p_funding_delete_failed', __( 'Could not delete funding transaction.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Sanitize funding params.
     */
    protected function sanitize_funding_params( WP_REST_Request $request ) {
        $data = array();

        if ( $request->has_param( 'type' ) ) {
            $data['type'] = sanitize_key( $request['type'] );
        }

        if ( $request->has_param( 'amount' ) ) {
            $data['amount'] = floatval( $request['amount'] );
        }

        if ( $request->has_param( 'category' ) ) {
            $data['category'] = sanitize_text_field( $request['category'] );
        }

        if ( $request->has_param( 'note' ) ) {
            $data['note'] = sanitize_textarea_field( $request['note'] );
        }

        if ( $request->has_param( 'tx_date' ) ) {
            $data['tx_date'] = sanitize_text_field( $request['tx_date'] );
        }

        return $data;
    }

    /**
     * Community posts.
     */
    public function get_posts() {
        global $wpdb;

        $posts = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}l4p_posts ORDER BY created_at DESC LIMIT 50", ARRAY_A );

        foreach ( $posts as &$post ) {
            $post['id']        = (int) $post['id'];
            $post['author_id'] = (int) $post['author_id'];
            $post['author_name'] = get_the_author_meta( 'display_name', $post['author_id'] );
        }

        return rest_ensure_response( $posts );
    }

    public function create_post( WP_REST_Request $request ) {
        global $wpdb;

        $body = wp_kses_post( $request['body'] );

        $wpdb->insert(
            $wpdb->prefix . 'l4p_posts',
            array(
                'author_id' => get_current_user_id(),
                'body'      => $body,
            ),
            array( '%d', '%s' )
        );

        $post = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}l4p_posts WHERE id = %d", $wpdb->insert_id ), ARRAY_A );
        $post['author_id']   = (int) $post['author_id'];
        $post['author_name'] = get_the_author_meta( 'display_name', $post['author_id'] );

        $this->notifications->notify_community_event( 'post', $post );

        return rest_ensure_response( $post );
    }

    public function update_post( WP_REST_Request $request ) {
        global $wpdb;

        $id   = (int) $request['id'];
        $body = wp_kses_post( $request['body'] );

        $wpdb->update(
            $wpdb->prefix . 'l4p_posts',
            array( 'body' => $body ),
            array( 'id' => $id ),
            array( '%s' ),
            array( '%d' )
        );

        $post = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$wpdb->prefix}l4p_posts WHERE id = %d", $id ), ARRAY_A );
        $post['author_id']   = (int) $post['author_id'];
        $post['author_name'] = get_the_author_meta( 'display_name', $post['author_id'] );

        return rest_ensure_response( $post );
    }

    public function delete_post( WP_REST_Request $request ) {
        global $wpdb;

        $id = (int) $request['id'];

        $wpdb->delete( $wpdb->prefix . 'l4p_posts', array( 'id' => $id ), array( '%d' ) );
        $wpdb->delete( $wpdb->prefix . 'l4p_comments', array( 'post_id' => $id ), array( '%d' ) );

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    public function get_comments( WP_REST_Request $request ) {
        global $wpdb;

        $post_id  = (int) $request['post_id'];
        $comments = $wpdb->get_results( $wpdb->prepare( "SELECT c.*, u.display_name AS author_name FROM {$wpdb->prefix}l4p_comments c LEFT JOIN {$wpdb->users} u ON c.author_id = u.ID WHERE c.post_id = %d ORDER BY c.created_at ASC", $post_id ), ARRAY_A );

        foreach ( $comments as &$comment ) {
            $comment['id']        = (int) $comment['id'];
            $comment['author_id'] = (int) $comment['author_id'];
            $comment['author_name'] = $comment['author_name'] ? $comment['author_name'] : __( 'Member', 'local4picnic' );
        }

        return rest_ensure_response( $comments );
    }

    public function create_comment( WP_REST_Request $request ) {
        global $wpdb;

        $post_id = (int) $request['post_id'];
        $body    = wp_kses_post( $request['body'] );

        $wpdb->insert(
            $wpdb->prefix . 'l4p_comments',
            array(
                'post_id'   => $post_id,
                'author_id' => get_current_user_id(),
                'body'      => $body,
            ),
            array( '%d', '%d', '%s' )
        );

        $comment = $wpdb->get_row( $wpdb->prepare( "SELECT c.*, u.display_name AS author_name FROM {$wpdb->prefix}l4p_comments c LEFT JOIN {$wpdb->users} u ON c.author_id = u.ID WHERE c.id = %d", $wpdb->insert_id ), ARRAY_A );
        $comment['author_id']   = (int) $comment['author_id'];
        $comment['author_name'] = $comment['author_name'] ? $comment['author_name'] : __( 'Member', 'local4picnic' );

        $this->notifications->notify_community_event( 'comment', $comment );

        return rest_ensure_response( $comment );
    }

    public function update_comment( WP_REST_Request $request ) {
        global $wpdb;

        $id   = (int) $request['id'];
        $body = wp_kses_post( $request['body'] );

        $wpdb->update( $wpdb->prefix . 'l4p_comments', array( 'body' => $body ), array( 'id' => $id ), array( '%s' ), array( '%d' ) );

        $comment = $wpdb->get_row( $wpdb->prepare( "SELECT c.*, u.display_name AS author_name FROM {$wpdb->prefix}l4p_comments c LEFT JOIN {$wpdb->users} u ON c.author_id = u.ID WHERE c.id = %d", $id ), ARRAY_A );
        $comment['author_id']   = (int) $comment['author_id'];
        $comment['author_name'] = $comment['author_name'] ? $comment['author_name'] : __( 'Member', 'local4picnic' );

        return rest_ensure_response( $comment );
    }

    public function delete_comment( WP_REST_Request $request ) {
        global $wpdb;

        $id = (int) $request['id'];

        $wpdb->delete( $wpdb->prefix . 'l4p_comments', array( 'id' => $id ), array( '%d' ) );

        return rest_ensure_response( array( 'deleted' => true ) );
    }

    /**
     * Dashboard aggregate endpoint.
     */
    public function get_dashboard() {
        return rest_ensure_response( $this->dashboard->build_snapshot() );
    }

    /**
     * Get notifications.
     */
    public function get_notifications( WP_REST_Request $request ) {
        $limit = (int) $request->get_param( 'limit' );
        $limit = $limit ? $limit : 20;

        $user_id = get_current_user_id();

        return rest_ensure_response(
            array(
                'items'  => $this->notifications->get_notifications( $user_id, $limit ),
                'unread' => $this->notifications->count_unread( $user_id ),
            )
        );
    }

    /**
     * Mark notification as read.
     */
    public function mark_notification_read( WP_REST_Request $request ) {
        $id = (int) $request['id'];
        $user_id = get_current_user_id();
        $this->notifications->mark_read( $id, $user_id );

        return rest_ensure_response( array( 'read' => true, 'unread' => $this->notifications->count_unread( $user_id ) ) );
    }

    /**
     * Mark all notifications as read.
     */
    public function mark_all_notifications() {
        $user_id = get_current_user_id();
        $this->notifications->mark_all_read( $user_id );

        return rest_ensure_response( array( 'read' => true, 'unread' => 0 ) );
    }

    /**
     * Get settings.
     */
    public function get_settings() {
        return rest_ensure_response( $this->settings->get_settings() );
    }

    /**
     * Update settings.
     */
    public function update_settings( WP_REST_Request $request ) {
        $params = $request->get_json_params();

        $result = $this->settings->update_settings( $params );

        if ( is_wp_error( $result ) ) {
            return $result;
        }

        return rest_ensure_response( $this->settings->get_settings() );
    }

    /**
     * Crew endpoints.
     */
    public function get_crew() {
        return rest_ensure_response( $this->crew->list_members() );
    }

    public function create_member( WP_REST_Request $request ) {
        $params = $request->get_json_params();

        $member = $this->crew->create_member( $params );

        if ( is_wp_error( $member ) ) {
            return $member;
        }

        return rest_ensure_response( $member );
    }

    public function update_member( WP_REST_Request $request ) {
        $params     = $request->get_json_params();
        $params['id'] = (int) $request['id'];

        $member = $this->crew->update_member( $params );

        if ( is_wp_error( $member ) ) {
            return $member;
        }

        return rest_ensure_response( $member );
    }

    /**
     * Upload crew avatar.
     */
    public function upload_crew_avatar( WP_REST_Request $request ) {
        $files = $request->get_file_params();

        if ( empty( $files['avatar'] ) ) {
            return new WP_Error( 'l4p_avatar_missing', __( 'Avatar upload missing.', 'local4picnic' ), array( 'status' => 400 ) );
        }

        $file = $files['avatar'];

        if ( ! empty( $file['error'] ) ) {
            return new WP_Error( 'l4p_avatar_upload_error', __( 'Avatar upload failed.', 'local4picnic' ), array( 'status' => 400 ) );
        }

        if ( (int) $file['size'] > 1024 * 1024 ) {
            return new WP_Error( 'l4p_avatar_too_large', __( 'Avatar must be smaller than 1MB.', 'local4picnic' ), array( 'status' => 400 ) );
        }

        $type = wp_check_filetype( $file['name'] );
        if ( empty( $type['type'] ) || ! in_array( $type['type'], array( 'image/jpeg', 'image/png' ), true ) ) {
            return new WP_Error( 'l4p_avatar_type', __( 'Avatar must be a JPG or PNG image.', 'local4picnic' ), array( 'status' => 400 ) );
        }

        $uploads    = wp_upload_dir();
        $target_dir = trailingslashit( $uploads['basedir'] ) . 'l4p/crew/';
        wp_mkdir_p( $target_dir );

        $filename = wp_unique_filename( $target_dir, sanitize_file_name( $file['name'] ) );
        $target   = trailingslashit( $target_dir ) . $filename;

        if ( ! is_uploaded_file( $file['tmp_name'] ) || ! move_uploaded_file( $file['tmp_name'], $target ) ) {
            return new WP_Error( 'l4p_avatar_move_failed', __( 'Unable to store avatar.', 'local4picnic' ), array( 'status' => 500 ) );
        }

        $url = trailingslashit( $uploads['baseurl'] ) . 'l4p/crew/' . $filename;

        return rest_ensure_response(
            array(
                'url' => esc_url_raw( $url ),
            )
        );
    }

    /**
     * Export funding to CSV.
     */
    public function export_funding_csv() {
        $enabled = $this->settings->is_feature_enabled( 'funding_csv_export' );

        if ( ! $enabled ) {
            return new WP_Error( 'l4p_export_disabled', __( 'Export is disabled.', 'local4picnic' ), array( 'status' => 403 ) );
        }

        $records = $this->get_funding( new WP_REST_Request() );
        $records = $records->get_data();

        $output = fopen( 'php://temp', 'w' );

        fputcsv( $output, array( 'ID', 'Type', 'Amount', 'Category', 'Note', 'Transaction Date', 'Created By' ) );

        foreach ( $records as $record ) {
            fputcsv( $output, array(
                $record['id'],
                $record['type'],
                $record['amount'],
                $record['category'],
                $record['note'],
                $record['tx_date'],
                $record['created_by'],
            ) );
        }

        rewind( $output );

        $csv = stream_get_contents( $output );

        return new WP_REST_Response( $csv, 200, array( 'Content-Type' => 'text/csv' ) );
    }

    /**
     * Permission checks.
     */
    public function can_read_tasks() {
        return current_user_can( 'l4p_read_tasks' ) || current_user_can( 'l4p_manage_tasks' );
    }

    public function can_write_tasks() {
        if ( current_user_can( 'l4p_manage_tasks' ) ) {
            return true;
        }

        return current_user_can( 'l4p_write_tasks' ) && $this->settings->is_feature_enabled( 'volunteer_create_tasks', true );
    }

    public function can_manage_tasks() {
        return current_user_can( 'l4p_manage_tasks' );
    }

    public function can_comment_tasks() {
        return current_user_can( 'l4p_manage_tasks' ) || current_user_can( 'l4p_read_tasks' );
    }

    public function can_delete_task_comment( WP_REST_Request $request ) {
        if ( current_user_can( 'l4p_manage_tasks' ) ) {
            return true;
        }

        $author = $this->get_task_comment_author( (int) $request['id'] );

        return $author === get_current_user_id();
    }

    public function can_read_funding() {
        return current_user_can( 'l4p_read_funding' ) || current_user_can( 'l4p_manage_funding' );
    }

    public function can_manage_funding() {
        return current_user_can( 'l4p_manage_funding' );
    }

    public function can_read_community() {
        return current_user_can( 'l4p_read_community' ) || current_user_can( 'l4p_manage_community' );
    }

    public function can_write_community() {
        if ( current_user_can( 'l4p_manage_community' ) ) {
            return true;
        }

        if ( ! $this->settings->is_feature_enabled( 'volunteer_community_post', true ) ) {
            return false;
        }

        return current_user_can( 'l4p_write_community' );
    }

    public function can_edit_post( WP_REST_Request $request ) {
        $post = $this->get_post_author( (int) $request['id'] );

        if ( $post === get_current_user_id() ) {
            return true;
        }

        return current_user_can( 'l4p_manage_community' );
    }

    public function can_delete_post( WP_REST_Request $request ) {
        return $this->can_edit_post( $request );
    }

    public function can_edit_comment( WP_REST_Request $request ) {
        $author = $this->get_comment_author( (int) $request['id'] );

        if ( $author === get_current_user_id() ) {
            return true;
        }

        return current_user_can( 'l4p_manage_community' );
    }

    public function can_delete_comment( WP_REST_Request $request ) {
        return $this->can_edit_comment( $request );
    }

    protected function get_post_author( $id ) {
        global $wpdb;

        return (int) $wpdb->get_var( $wpdb->prepare( "SELECT author_id FROM {$wpdb->prefix}l4p_posts WHERE id = %d", $id ) );
    }

    protected function get_comment_author( $id ) {
        global $wpdb;

        return (int) $wpdb->get_var( $wpdb->prepare( "SELECT author_id FROM {$wpdb->prefix}l4p_comments WHERE id = %d", $id ) );
    }

    protected function get_task_comment_author( $id ) {
        global $wpdb;

        return (int) $wpdb->get_var( $wpdb->prepare( "SELECT author_id FROM {$wpdb->prefix}l4p_task_comments WHERE id = %d", $id ) );
    }

    public function can_read_notifications() {
        return is_user_logged_in();
    }

    public function can_read_settings() {
        return current_user_can( 'read' );
    }

    public function can_manage_settings() {
        return current_user_can( 'l4p_manage_settings' );
    }

    public function can_read_crew() {
        return current_user_can( 'read' );
    }

    public function can_manage_crew() {
        return current_user_can( 'l4p_manage_crew' );
    }

    public function can_export_funding() {
        return current_user_can( 'l4p_manage_funding' );
    }

    public function can_read_dashboard() {
        return is_user_logged_in();
    }
}

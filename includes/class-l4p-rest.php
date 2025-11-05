<?php
/**
 * REST API controllers.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class L4P_REST {
    protected static $instance = null;

    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
            self::$instance->hooks();
        }

        return self::$instance;
    }

    protected function hooks() {
        add_action( 'rest_api_init', array( $this, 'register_routes' ) );
    }

    public function register_routes() {
        register_rest_route(
            'local4/v1',
            '/dashboard',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_dashboard' ),
                'permission_callback' => array( $this, 'ensure_logged_in' ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/tasks',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_tasks' ),
                'permission_callback' => array( $this, 'ensure_logged_in' ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/tasks',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'create_task' ),
                'permission_callback' => array( $this, 'can_manage_tasks' ),
                'args'                => $this->get_task_args(),
            )
        );

        register_rest_route(
            'local4/v1',
            '/tasks/(?P<id>\d+)',
            array(
                array(
                    'methods'             => WP_REST_Server::READABLE,
                    'callback'            => array( $this, 'get_task' ),
                    'permission_callback' => array( $this, 'ensure_logged_in' ),
                ),
                array(
                    'methods'             => WP_REST_Server::EDITABLE,
                    'callback'            => array( $this, 'update_task' ),
                    'permission_callback' => array( $this, 'can_edit_task' ),
                    'args'                => $this->get_task_args(),
                ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/funding',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_funding' ),
                'permission_callback' => array( $this, 'ensure_logged_in' ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/funding',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'create_funding' ),
                'permission_callback' => array( $this, 'can_manage_funding' ),
                'args'                => array(
                    'title'  => array(
                        'required' => true,
                        'type'     => 'string',
                    ),
                    'amount' => array(
                        'required' => true,
                        'type'     => 'number',
                    ),
                    'entry_type' => array(
                        'required' => false,
                        'type'     => 'string',
                        'enum'     => array( 'income', 'expense' ),
                    ),
                    'source_type' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                    'notes' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                    'received_date' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/funding/export',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'export_funding' ),
                'permission_callback' => array( $this, 'can_manage_funding' ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/crew',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_crew' ),
                'permission_callback' => array( $this, 'ensure_logged_in' ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/crew',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'create_crew' ),
                'permission_callback' => array( $this, 'can_manage_crew' ),
                'args'                => array(
                    'name'  => array(
                        'required' => true,
                        'type'     => 'string',
                    ),
                    'phone' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                    'email' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                    'role' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                    'availability' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                    'user_id' => array(
                        'required' => false,
                        'type'     => 'integer',
                    ),
                    'avatar_url' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/community',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_community_feed' ),
                'permission_callback' => array( $this, 'ensure_logged_in' ),
                'args'                => array(
                    'since' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/community',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'create_feed_post' ),
                'permission_callback' => array( $this, 'can_post_feed' ),
                'args'                => array(
                    'message' => array(
                        'required' => true,
                        'type'     => 'string',
                    ),
                    'title' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/community/(?P<id>\d+)/reply',
            array(
                'methods'             => WP_REST_Server::CREATABLE,
                'callback'            => array( $this, 'create_feed_reply' ),
                'permission_callback' => array( $this, 'ensure_logged_in' ),
                'args'                => array(
                    'message' => array(
                        'required' => true,
                        'type'     => 'string',
                    ),
                ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/notifications',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_notifications' ),
                'permission_callback' => array( $this, 'ensure_logged_in' ),
                'args'                => array(
                    'since' => array(
                        'required' => false,
                        'type'     => 'string',
                    ),
                ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/notifications/read',
            array(
                'methods'             => WP_REST_Server::EDITABLE,
                'callback'            => array( $this, 'mark_notifications' ),
                'permission_callback' => array( $this, 'ensure_logged_in' ),
            )
        );

        register_rest_route(
            'local4/v1',
            '/users',
            array(
                'methods'             => WP_REST_Server::READABLE,
                'callback'            => array( $this, 'get_users' ),
                'permission_callback' => array( $this, 'ensure_logged_in' ),
            )
        );
    }

    public function ensure_logged_in() {
        return is_user_logged_in();
    }

    public function can_manage_tasks() {
        return current_user_can( 'edit_l4p_tasks' );
    }

    public function can_edit_task( $request ) {
        $task_id = (int) $request['id'];

        if ( current_user_can( 'edit_l4p_tasks' ) ) {
            return true;
        }

        // Volunteers can update status of their own tasks.
        $assignee = (int) get_post_meta( $task_id, '_l4p_assignee', true );
        if ( $assignee === get_current_user_id() ) {
            return current_user_can( 'edit_l4p_task', $task_id );
        }

        return false;
    }

    public function can_manage_funding() {
        return current_user_can( 'edit_l4p_fundings' );
    }

    public function can_manage_crew() {
        return current_user_can( 'edit_l4p_crews' );
    }

    public function can_post_feed() {
        return current_user_can( 'publish_l4p_feeds' );
    }

    protected function get_task_args() {
        return array(
            'title'       => array(
                'required' => true,
                'type'     => 'string',
            ),
            'content'     => array(
                'required' => false,
                'type'     => 'string',
            ),
            'status'      => array(
                'required' => false,
                'type'     => 'string',
            ),
            'due_date'    => array(
                'required' => false,
                'type'     => 'string',
            ),
            'assignee'    => array(
                'required' => false,
                'type'     => 'integer',
            ),
            'labels'      => array(
                'required' => false,
                'type'     => 'array',
            ),
        );
    }

    public function get_dashboard( WP_REST_Request $request ) {
        $summary = array();

        $summary['tasks'] = $this->get_task_summary();
        $summary['notifications'] = $this->get_notifications_collection( get_current_user_id(), 4 );
        $summary['funding'] = $this->get_funding_summary();
        $summary['community'] = $this->get_feed_summary();
        $summary['crew'] = $this->get_crew_summary();

        return rest_ensure_response( $summary );
    }

    protected function get_task_summary() {
        $statuses = array( 'todo', 'in_progress', 'complete' );
        $counts   = array(
            'todo'        => 0,
            'in_progress' => 0,
            'complete'    => 0,
        );

        $tasks = get_posts(
            array(
                'post_type'      => 'l4p_task',
                'post_status'    => 'publish',
                'posts_per_page' => 20,
                'orderby'        => 'date',
                'order'          => 'DESC',
            )
        );

        $items = array();

        foreach ( $tasks as $task ) {
            $status   = get_post_meta( $task->ID, '_l4p_status', true );
            $assignee = (int) get_post_meta( $task->ID, '_l4p_assignee', true );

            if ( ! in_array( $status, $statuses, true ) ) {
                $status = 'todo';
            }

            $counts[ $status ]++;

            $items[] = array(
                'id'          => $task->ID,
                'title'       => get_the_title( $task ),
                'excerpt'     => wp_trim_words( $task->post_content, 20 ),
                'status'      => $status,
                'due_date'    => get_post_meta( $task->ID, '_l4p_due_date', true ),
                'assignee'    => $assignee,
                'assignee_name' => $assignee ? get_the_author_meta( 'display_name', $assignee ) : '',
            );
        }

        return array(
            'counts' => $counts,
            'items'  => array_slice( $items, 0, 4 ),
        );
    }

    protected function get_crew_summary() {
        $posts = get_posts(
            array(
                'post_type'      => 'l4p_crew',
                'post_status'    => 'publish',
                'posts_per_page' => 6,
                'orderby'        => 'title',
                'order'          => 'ASC',
            )
        );

        $members = array();

        foreach ( $posts as $post ) {
            $crew = $this->format_crew( $post );
            $members[] = array(
                'id'     => $crew['id'],
                'name'   => $crew['name'],
                'role'   => $crew['role'],
                'avatar' => $crew['avatar'],
            );
        }

        $count = wp_count_posts( 'l4p_crew' );
        $total = isset( $count->publish ) ? (int) $count->publish : count( $members );

        return array(
            'total'   => $total,
            'members' => $members,
        );
    }

    public function get_tasks( WP_REST_Request $request ) {
        $args = array(
            'post_type'      => 'l4p_task',
            'post_status'    => 'publish',
            'posts_per_page' => 50,
            'orderby'        => 'date',
            'order'          => 'DESC',
        );

        if ( $request['status'] ) {
            $args['meta_query'][] = array(
                'key'   => '_l4p_status',
                'value' => sanitize_text_field( $request['status'] ),
            );
        }

        $posts = get_posts( $args );
        $data  = array();

        foreach ( $posts as $post ) {
            $data[] = $this->format_task( $post );
        }

        return rest_ensure_response( $data );
    }

    public function get_task( WP_REST_Request $request ) {
        $task = get_post( (int) $request['id'] );

        if ( ! $task || 'l4p_task' !== $task->post_type ) {
            return new WP_Error( 'not_found', __( 'Task not found.', 'local4-picnic' ), array( 'status' => 404 ) );
        }

        return rest_ensure_response( $this->format_task( $task ) );
    }

    protected function format_task( WP_Post $task ) {
        $assignee = (int) get_post_meta( $task->ID, '_l4p_assignee', true );

        return array(
            'id'           => $task->ID,
            'title'        => get_the_title( $task ),
            'content'      => apply_filters( 'the_content', $task->post_content ),
            'status'       => get_post_meta( $task->ID, '_l4p_status', true ),
            'due_date'     => get_post_meta( $task->ID, '_l4p_due_date', true ),
            'assignee'     => $assignee,
            'assignee_name'=> $assignee ? get_the_author_meta( 'display_name', $assignee ) : '',
            'labels'       => (array) get_post_meta( $task->ID, '_l4p_labels', true ),
        );
    }

    public function create_task( WP_REST_Request $request ) {
        $task_id = wp_insert_post(
            array(
                'post_type'   => 'l4p_task',
                'post_title'  => sanitize_text_field( $request['title'] ),
                'post_content'=> isset( $request['content'] ) ? wp_kses_post( $request['content'] ) : '',
                'post_status' => 'publish',
                'post_author' => get_current_user_id(),
            )
        );

        if ( is_wp_error( $task_id ) ) {
            return $task_id;
        }

        if ( $request['status'] ) {
            update_post_meta( $task_id, '_l4p_status', sanitize_text_field( $request['status'] ) );
        }

        if ( $request['due_date'] ) {
            update_post_meta( $task_id, '_l4p_due_date', sanitize_text_field( $request['due_date'] ) );
        }

        if ( $request['assignee'] ) {
            update_post_meta( $task_id, '_l4p_assignee', absint( $request['assignee'] ) );
        }

        if ( $request['labels'] ) {
            update_post_meta( $task_id, '_l4p_labels', array_map( 'sanitize_text_field', (array) $request['labels'] ) );
        }

        return rest_ensure_response( $this->format_task( get_post( $task_id ) ) );
    }

    public function update_task( WP_REST_Request $request ) {
        $task_id = (int) $request['id'];
        $task    = get_post( $task_id );

        if ( ! $task || 'l4p_task' !== $task->post_type ) {
            return new WP_Error( 'not_found', __( 'Task not found.', 'local4-picnic' ), array( 'status' => 404 ) );
        }

        $update_args = array( 'ID' => $task_id );

        if ( isset( $request['title'] ) ) {
            $update_args['post_title'] = sanitize_text_field( $request['title'] );
        }

        if ( isset( $request['content'] ) ) {
            $update_args['post_content'] = wp_kses_post( $request['content'] );
        }

        wp_update_post( $update_args );

        if ( isset( $request['status'] ) ) {
            update_post_meta( $task_id, '_l4p_status', sanitize_text_field( $request['status'] ) );
        }

        if ( isset( $request['due_date'] ) ) {
            update_post_meta( $task_id, '_l4p_due_date', sanitize_text_field( $request['due_date'] ) );
        }

        if ( isset( $request['assignee'] ) ) {
            update_post_meta( $task_id, '_l4p_assignee', absint( $request['assignee'] ) );
        }

        if ( isset( $request['labels'] ) ) {
            update_post_meta( $task_id, '_l4p_labels', array_map( 'sanitize_text_field', (array) $request['labels'] ) );
        }

        return rest_ensure_response( $this->format_task( get_post( $task_id ) ) );
    }

    public function get_funding( WP_REST_Request $request ) {
        $summary = $this->get_funding_summary( true );

        return rest_ensure_response(
            array(
                'entries'      => $summary['entries'],
                'totals'       => array(
                    'income'  => $summary['income_total'],
                    'expense' => $summary['expense_total'],
                    'net'     => $summary['net_total'],
                ),
                'distribution' => $summary['distribution'],
            )
        );
    }

    public function export_funding( WP_REST_Request $request ) {
        $summary = $this->get_funding_summary( true );
        $rows    = array();

        $rows[] = array( 'Title', 'Amount', 'Category', 'Entry Type', 'Date', 'Notes' );

        foreach ( $summary['entries'] as $entry ) {
            $rows[] = array(
                $entry['title'],
                $entry['amount'],
                implode( ', ', (array) $entry['source_types'] ),
                $entry['entry_type'],
                $entry['received_date'],
                wp_strip_all_tags( $entry['notes'] ),
            );
        }

        $lines = array_map(
            function( $row ) {
                return implode(
                    ',',
                    array_map(
                        function( $value ) {
                            $value = (string) $value;
                            $value = str_replace( '"', '""', $value );
                            return '"' . $value . '"';
                        },
                        $row
                    )
                );
            },
            $rows
        );

        $csv      = implode( "\r\n", $lines );
        $response = new WP_REST_Response( $csv );
        $response->set_headers(
            array(
                'Content-Type'        => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename="local4-funding-' . gmdate( 'Ymd-His' ) . '.csv"',
            )
        );

        return $response;
    }

    public function create_funding( WP_REST_Request $request ) {
        $funding_id = wp_insert_post(
            array(
                'post_type'   => 'l4p_funding',
                'post_title'  => sanitize_text_field( $request['title'] ),
                'post_content'=> isset( $request['notes'] ) ? wp_kses_post( $request['notes'] ) : '',
                'post_status' => 'publish',
                'post_author' => get_current_user_id(),
            )
        );

        if ( is_wp_error( $funding_id ) ) {
            return $funding_id;
        }

        update_post_meta( $funding_id, '_l4p_amount', (float) $request['amount'] );

        if ( $request['source_type'] ) {
            wp_set_post_terms( $funding_id, array( sanitize_text_field( $request['source_type'] ) ), 'l4p_funding_source', false );
        }

        if ( $request['received_date'] ) {
            update_post_meta( $funding_id, '_l4p_received_date', sanitize_text_field( $request['received_date'] ) );
        }

        if ( isset( $request['notes'] ) ) {
            update_post_meta( $funding_id, '_l4p_notes', wp_kses_post( $request['notes'] ) );
        }

        if ( $request['entry_type'] ) {
            update_post_meta( $funding_id, '_l4p_entry_type', sanitize_text_field( $request['entry_type'] ) );
        }

        return rest_ensure_response( $this->get_funding_entry( $funding_id ) );
    }

    protected function get_funding_entry( $id ) {
        $post = get_post( $id );
        if ( ! $post ) {
            return array();
        }

        return array(
            'id'            => $post->ID,
            'title'         => get_the_title( $post ),
            'amount'        => (float) get_post_meta( $post->ID, '_l4p_amount', true ),
            'source_types'  => wp_get_post_terms( $post->ID, 'l4p_funding_source', array( 'fields' => 'names' ) ),
            'received_date' => get_post_meta( $post->ID, '_l4p_received_date', true ),
            'notes'         => get_post_meta( $post->ID, '_l4p_notes', true ) ?: $post->post_content,
            'entry_type'    => get_post_meta( $post->ID, '_l4p_entry_type', true ) ?: 'income',
            'author_name'   => get_the_author_meta( 'display_name', $post->post_author ),
        );
    }

    protected function get_funding_summary( $include_entries = false ) {
        $posts = get_posts(
            array(
                'post_type'      => 'l4p_funding',
                'post_status'    => 'publish',
                'posts_per_page' => -1,
                'orderby'        => 'date',
                'order'          => 'DESC',
            )
        );

        $income_total = 0;
        $expense_total = 0;
        $income_breakdown = array();
        $entries = array();

        foreach ( $posts as $post ) {
            $entry  = $this->get_funding_entry( $post->ID );
            $amount = (float) $entry['amount'];

            $entries[] = $entry;

            if ( 'expense' === $entry['entry_type'] ) {
                $expense_total += $amount;
            } else {
                $income_total += $amount;
                $sources = ! empty( $entry['source_types'] ) ? $entry['source_types'] : array( __( 'Uncategorized', 'local4-picnic' ) );
                $label   = $sources[0];
                if ( ! isset( $income_breakdown[ $label ] ) ) {
                    $income_breakdown[ $label ] = 0;
                }
                $income_breakdown[ $label ] += $amount;
            }
        }

        $distribution = $income_breakdown;

        if ( $expense_total > 0 ) {
            $distribution[ __( 'Expenses', 'local4-picnic' ) ] = $expense_total;
        }

        $summary = array(
            'income_total' => $income_total,
            'expense_total'=> $expense_total,
            'net_total'    => $income_total - $expense_total,
            'distribution' => $distribution,
        );

        if ( $include_entries ) {
            $summary['entries'] = $entries;
        } else {
            $summary['latest'] = array_slice( $entries, 0, 5 );
        }

        return $summary;
    }

    public function get_crew( WP_REST_Request $request ) {
        $posts = get_posts(
            array(
                'post_type'      => 'l4p_crew',
                'post_status'    => 'publish',
                'posts_per_page' => 100,
                'orderby'        => 'title',
                'order'          => 'ASC',
            )
        );

        $data = array();
        foreach ( $posts as $post ) {
            $data[] = $this->format_crew( $post );
        }

        return rest_ensure_response( $data );
    }

    protected function format_crew( WP_Post $post ) {
        $user_id = (int) get_post_meta( $post->ID, '_l4p_user_id', true );
        $assigned_tasks = array();

        if ( $user_id ) {
            $assigned_tasks = get_posts(
                array(
                    'post_type'  => 'l4p_task',
                    'post_status'=> 'publish',
                    'meta_key'   => '_l4p_assignee',
                    'meta_value' => $user_id,
                )
            );
        }

        $tasks = array();
        foreach ( $assigned_tasks as $task ) {
            $tasks[] = array(
                'id'     => $task->ID,
                'title'  => get_the_title( $task ),
                'status' => get_post_meta( $task->ID, '_l4p_status', true ),
            );
        }

        $avatar_url = get_post_meta( $post->ID, '_l4p_avatar_url', true );

        if ( ! $avatar_url && has_post_thumbnail( $post ) ) {
            $avatar_url = get_the_post_thumbnail_url( $post, 'thumbnail' );
        }

        if ( ! $avatar_url && $user_id ) {
            $avatar_url = get_avatar_url( $user_id, array( 'size' => 128 ) );
        }

        $initials = $this->get_initials( get_the_title( $post ) );

        return array(
            'id'           => $post->ID,
            'name'         => get_the_title( $post ),
            'content'      => apply_filters( 'the_content', $post->post_content ),
            'phone'        => get_post_meta( $post->ID, '_l4p_phone', true ),
            'email'        => get_post_meta( $post->ID, '_l4p_email', true ),
            'role'         => get_post_meta( $post->ID, '_l4p_role', true ),
            'availability' => get_post_meta( $post->ID, '_l4p_availability', true ),
            'user_id'      => $user_id,
            'tasks'        => $tasks,
            'avatar'       => array(
                'url'      => $avatar_url,
                'initials' => $initials,
            ),
        );
    }

    public function create_crew( WP_REST_Request $request ) {
        $crew_id = wp_insert_post(
            array(
                'post_type'   => 'l4p_crew',
                'post_title'  => sanitize_text_field( $request['name'] ),
                'post_content'=> isset( $request['content'] ) ? wp_kses_post( $request['content'] ) : '',
                'post_status' => 'publish',
                'post_author' => get_current_user_id(),
            )
        );

        if ( is_wp_error( $crew_id ) ) {
            return $crew_id;
        }

        if ( $request['phone'] ) {
            update_post_meta( $crew_id, '_l4p_phone', sanitize_text_field( $request['phone'] ) );
        }

        if ( $request['email'] ) {
            update_post_meta( $crew_id, '_l4p_email', sanitize_email( $request['email'] ) );
        }

        if ( $request['role'] ) {
            update_post_meta( $crew_id, '_l4p_role', sanitize_text_field( $request['role'] ) );
        }

        if ( $request['availability'] ) {
            update_post_meta( $crew_id, '_l4p_availability', sanitize_text_field( $request['availability'] ) );
        }

        if ( $request['user_id'] ) {
            update_post_meta( $crew_id, '_l4p_user_id', absint( $request['user_id'] ) );
        }

        if ( $request['avatar_url'] ) {
            update_post_meta( $crew_id, '_l4p_avatar_url', esc_url_raw( $request['avatar_url'] ) );
        }

        return rest_ensure_response( $this->format_crew( get_post( $crew_id ) ) );
    }

    public function get_community_feed( WP_REST_Request $request ) {
        $args = array(
            'post_type'      => 'l4p_feed',
            'post_status'    => 'publish',
            'posts_per_page' => 20,
            'orderby'        => 'date',
            'order'          => 'DESC',
        );

        if ( $request['since'] ) {
            $timestamp = strtotime( sanitize_text_field( $request['since'] ) );
            if ( $timestamp ) {
                $args['date_query'] = array(
                    array(
                        'after'     => gmdate( 'Y-m-d H:i:s', $timestamp ),
                        'inclusive' => true,
                    ),
                );
            }
        }

        $posts = get_posts( $args );

        $data = array();

        foreach ( $posts as $post ) {
            $data[] = $this->format_feed_post( $post );
        }

        return rest_ensure_response( $data );
    }

    protected function format_feed_post( WP_Post $post ) {
        $comments = get_comments(
            array(
                'post_id' => $post->ID,
                'status'  => 'approve',
                'orderby' => 'comment_date_gmt',
                'order'   => 'ASC',
            )
        );

        $replies = array();
        foreach ( $comments as $comment ) {
            $replies[] = array(
                'id'      => $comment->comment_ID,
                'author'  => $comment->comment_author,
                'content' => wpautop( esc_html( $comment->comment_content ) ),
                'date'    => mysql2date( 'c', $comment->comment_date_gmt ),
            );
        }

        return array(
            'id'        => $post->ID,
            'title'     => get_the_title( $post ),
            'content'   => apply_filters( 'the_content', $post->post_content ),
            'author'    => get_the_author_meta( 'display_name', $post->post_author ),
            'date'      => mysql2date( 'c', $post->post_date_gmt ),
            'replies'   => $replies,
        );
    }

    public function create_feed_post( WP_REST_Request $request ) {
        $title = $request['title'] ? sanitize_text_field( $request['title'] ) : wp_trim_words( $request['message'], 6, '…' );

        $post_id = wp_insert_post(
            array(
                'post_type'   => 'l4p_feed',
                'post_title'  => $title,
                'post_content'=> wp_kses_post( $request['message'] ),
                'post_status' => 'publish',
                'post_author' => get_current_user_id(),
            )
        );

        if ( is_wp_error( $post_id ) ) {
            return $post_id;
        }

        return rest_ensure_response( $this->format_feed_post( get_post( $post_id ) ) );
    }

    public function create_feed_reply( WP_REST_Request $request ) {
        $post_id = (int) $request['id'];
        $post    = get_post( $post_id );

        if ( ! $post || 'l4p_feed' !== $post->post_type ) {
            return new WP_Error( 'not_found', __( 'Feed post not found.', 'local4-picnic' ), array( 'status' => 404 ) );
        }

        $comment_id = wp_insert_comment(
            array(
                'comment_post_ID'      => $post_id,
                'comment_content'      => wp_kses_post( $request['message'] ),
                'comment_author'       => wp_get_current_user()->display_name,
                'comment_author_email' => wp_get_current_user()->user_email,
                'user_id'              => get_current_user_id(),
                'comment_approved'     => 1,
            )
        );

        if ( ! $comment_id ) {
            return new WP_Error( 'comment_error', __( 'Unable to save reply.', 'local4-picnic' ), array( 'status' => 500 ) );
        }

        return rest_ensure_response(
            array(
                'id'      => $comment_id,
                'author'  => wp_get_current_user()->display_name,
                'content' => wpautop( esc_html( $request['message'] ) ),
                'date'    => mysql2date( 'c', current_time( 'mysql' ) ),
            )
        );
    }

    public function get_notifications( WP_REST_Request $request ) {
        $limit = $request->get_param( 'limit' ) ? absint( $request['limit'] ) : 20;
        $since = $request->get_param( 'since' ) ? sanitize_text_field( $request['since'] ) : '';
        $items = $this->get_notifications_collection( get_current_user_id(), $limit, $since );

        return rest_ensure_response( $items );
    }

    protected function get_notifications_collection( $user_id, $limit = 20, $since = '' ) {
        $items = L4P_Notifications::get_notifications( $user_id, $limit, array(), $since );

        return array_map(
            function( $item ) {
                return array(
                    'id'          => (int) $item['id'],
                    'type'        => $item['type'],
                    'message'     => $item['message'],
                    'is_read'     => (bool) $item['is_read'],
                    'created_at'  => mysql2date( 'c', $item['created_at'] ),
                    'related_type'=> $item['related_type'],
                    'related_id'  => (int) $item['related_id'],
                );
            },
            $items
        );
    }

    public function mark_notifications( WP_REST_Request $request ) {
        $ids = $request->get_param( 'ids' );

        if ( empty( $ids ) ) {
            return rest_ensure_response( array() );
        }

        L4P_Notifications::mark_as_read( $ids, get_current_user_id() );

        return rest_ensure_response( array( 'success' => true ) );
    }

    public function get_users( WP_REST_Request $request ) {
        $users = get_users(
            array(
                'role__in' => array( 'administrator', L4P_Roles::COORDINATOR, L4P_Roles::VOLUNTEER ),
                'orderby'  => 'display_name',
                'fields'   => array( 'ID', 'display_name', 'user_email', 'roles' ),
            )
        );

        $items = array();
        foreach ( $users as $user ) {
            $items[] = array(
                'id'    => $user->ID,
                'name'  => $user->display_name,
                'email' => $user->user_email,
                'roles' => $user->roles,
            );
        }

        return rest_ensure_response( $items );
    }

    protected function get_initials( $name ) {
        $name      = trim( $name );
        $initials  = '';
        $segments  = preg_split( '/\s+/', $name );

        foreach ( $segments as $segment ) {
            $initials .= mb_substr( $segment, 0, 1 );
            if ( mb_strlen( $initials ) >= 2 ) {
                break;
            }
        }

        return strtoupper( $initials );
    }

    protected function get_feed_summary() {
        $posts = get_posts(
            array(
                'post_type'      => 'l4p_feed',
                'post_status'    => 'publish',
                'posts_per_page' => 4,
                'orderby'        => 'date',
                'order'          => 'DESC',
            )
        );

        $items = array();
        foreach ( $posts as $post ) {
            $items[] = array(
                'id'      => $post->ID,
                'title'   => get_the_title( $post ),
                'excerpt' => wp_trim_words( $post->post_content, 20 ),
                'author'  => get_the_author_meta( 'display_name', $post->post_author ),
                'date'    => mysql2date( 'c', $post->post_date_gmt ),
            );
        }

        return $items;
    }
}

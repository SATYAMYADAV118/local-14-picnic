<?php
/**
 * Core plugin bootstrap.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class L4P_Plugin {
    /**
     * Singleton instance.
     *
     * @var L4P_Plugin
     */
    protected static $instance = null;

    /**
     * Get singleton instance.
     *
     * @return L4P_Plugin
     */
    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
            self::$instance->init_hooks();
        }

        return self::$instance;
    }

    /**
     * Register WordPress hooks.
     */
    protected function init_hooks() {
        add_action( 'init', array( $this, 'register_post_types' ) );
        add_action( 'init', array( $this, 'register_taxonomies' ) );
        add_action( 'init', array( $this, 'register_meta_fields' ) );
        add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_assets' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_frontend_assets' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
        add_action( 'post_updated', array( $this, 'track_task_changes' ), 10, 3 );
        add_action( 'save_post_l4p_funding', array( $this, 'maybe_record_funding_notification' ), 10, 3 );
        add_action( 'save_post_l4p_feed', array( $this, 'maybe_record_feed_notification' ), 10, 3 );
    }

    /**
     * Register plugin custom post types.
     */
    public function register_post_types() {
        $supports = array( 'title', 'editor', 'author' );

        register_post_type(
            'l4p_task',
            array(
                'labels'       => array(
                    'name'          => __( 'Tasks', 'local4-picnic' ),
                    'singular_name' => __( 'Task', 'local4-picnic' ),
                ),
                'public'       => false,
                'show_ui'      => true,
                'show_in_menu' => true,
                'menu_position'=> 24,
                'menu_icon'    => 'dashicons-clipboard',
                'supports'     => $supports,
                'capability_type' => array( 'l4p_task', 'l4p_tasks' ),
                'map_meta_cap'    => true,
                'show_in_rest'    => true,
                'rest_base'       => 'l4p_tasks',
            )
        );

        register_post_type(
            'l4p_funding',
            array(
                'labels'       => array(
                    'name'          => __( 'Funding Entries', 'local4-picnic' ),
                    'singular_name' => __( 'Funding Entry', 'local4-picnic' ),
                ),
                'public'       => false,
                'show_ui'      => true,
                'show_in_menu' => true,
                'menu_position'=> 25,
                'menu_icon'    => 'dashicons-chart-pie',
                'supports'     => array( 'title', 'editor', 'author' ),
                'capability_type' => array( 'l4p_funding', 'l4p_fundings' ),
                'map_meta_cap'    => true,
                'show_in_rest'    => true,
                'rest_base'       => 'l4p_funding',
            )
        );

        register_post_type(
            'l4p_crew',
            array(
                'labels'       => array(
                    'name'          => __( 'Crew', 'local4-picnic' ),
                    'singular_name' => __( 'Crew Member', 'local4-picnic' ),
                ),
                'public'       => false,
                'show_ui'      => true,
                'show_in_menu' => true,
                'menu_position'=> 26,
                'menu_icon'    => 'dashicons-groups',
                'supports'     => array( 'title', 'editor', 'thumbnail' ),
                'capability_type' => array( 'l4p_crew', 'l4p_crews' ),
                'map_meta_cap'    => true,
                'show_in_rest'    => true,
                'rest_base'       => 'l4p_crew',
            )
        );

        register_post_type(
            'l4p_feed',
            array(
                'labels'       => array(
                    'name'          => __( 'Community Feed', 'local4-picnic' ),
                    'singular_name' => __( 'Feed Post', 'local4-picnic' ),
                ),
                'public'       => false,
                'show_ui'      => true,
                'show_in_menu' => true,
                'menu_position'=> 27,
                'menu_icon'    => 'dashicons-megaphone',
                'supports'     => array( 'title', 'editor', 'comments', 'author' ),
                'capability_type' => array( 'l4p_feed', 'l4p_feeds' ),
                'map_meta_cap'    => true,
                'show_in_rest'    => true,
                'rest_base'       => 'l4p_feed',
            )
        );
    }

    /**
     * Register taxonomies.
     */
    public function register_taxonomies() {
        register_taxonomy(
            'l4p_funding_source',
            'l4p_funding',
            array(
                'labels'       => array(
                    'name'          => __( 'Funding Sources', 'local4-picnic' ),
                    'singular_name' => __( 'Funding Source', 'local4-picnic' ),
                ),
                'public'       => false,
                'show_ui'      => true,
                'show_admin_column' => true,
                'show_in_rest' => true,
                'hierarchical' => false,
            )
        );

        register_taxonomy(
            'l4p_task_priority',
            'l4p_task',
            array(
                'labels'       => array(
                    'name'          => __( 'Task Priorities', 'local4-picnic' ),
                    'singular_name' => __( 'Task Priority', 'local4-picnic' ),
                ),
                'public'       => false,
                'show_ui'      => true,
                'show_admin_column' => true,
                'show_in_rest' => true,
                'hierarchical' => false,
            )
        );
    }

    /**
     * Register meta fields for CPTs.
     */
    public function register_meta_fields() {
        register_post_meta(
            'l4p_task',
            '_l4p_status',
            array(
                'type'              => 'string',
                'single'            => true,
                'default'           => 'todo',
                'show_in_rest'      => true,
                'auth_callback'     => array( $this, 'can_edit_tasks' ),
                'sanitize_callback' => 'sanitize_text_field',
            )
        );

        register_post_meta(
            'l4p_task',
            '_l4p_due_date',
            array(
                'type'              => 'string',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'sanitize_text_field',
            )
        );

        register_post_meta(
            'l4p_task',
            '_l4p_assignee',
            array(
                'type'              => 'integer',
                'single'            => true,
                'show_in_rest'      => true,
                'auth_callback'     => array( $this, 'can_assign_tasks' ),
                'sanitize_callback' => 'absint',
            )
        );

        register_post_meta(
            'l4p_task',
            '_l4p_labels',
            array(
                'type'         => 'array',
                'single'       => true,
                'show_in_rest' => array(
                    'schema' => array(
                        'type'  => 'array',
                        'items' => array( 'type' => 'string' ),
                    ),
                ),
                'sanitize_callback' => array( $this, 'sanitize_labels' ),
            )
        );

        register_post_meta(
            'l4p_funding',
            '_l4p_amount',
            array(
                'type'              => 'number',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'floatval',
            )
        );

        register_post_meta(
            'l4p_funding',
            '_l4p_received_date',
            array(
                'type'              => 'string',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'sanitize_text_field',
            )
        );

        register_post_meta(
            'l4p_funding',
            '_l4p_notes',
            array(
                'type'              => 'string',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'sanitize_textarea_field',
            )
        );

        register_post_meta(
            'l4p_funding',
            '_l4p_entry_type',
            array(
                'type'              => 'string',
                'single'            => true,
                'show_in_rest'      => true,
                'default'           => 'income',
                'sanitize_callback' => array( $this, 'sanitize_entry_type' ),
            )
        );

        register_post_meta(
            'l4p_crew',
            '_l4p_phone',
            array(
                'type'              => 'string',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'sanitize_text_field',
            )
        );

        register_post_meta(
            'l4p_crew',
            '_l4p_email',
            array(
                'type'              => 'string',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'sanitize_email',
            )
        );

        register_post_meta(
            'l4p_crew',
            '_l4p_role',
            array(
                'type'              => 'string',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'sanitize_text_field',
            )
        );

        register_post_meta(
            'l4p_crew',
            '_l4p_availability',
            array(
                'type'              => 'string',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'sanitize_text_field',
            )
        );

        register_post_meta(
            'l4p_crew',
            '_l4p_user_id',
            array(
                'type'              => 'integer',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'absint',
            )
        );

        register_post_meta(
            'l4p_crew',
            '_l4p_avatar_url',
            array(
                'type'              => 'string',
                'single'            => true,
                'show_in_rest'      => true,
                'sanitize_callback' => 'esc_url_raw',
            )
        );
    }

    /**
     * Sanitize array of labels.
     */
    public function sanitize_labels( $labels ) {
        if ( ! is_array( $labels ) ) {
            return array();
        }

        return array_map( 'sanitize_text_field', $labels );
    }

    /**
     * Sanitize funding entry type values.
     *
     * @param string $type Provided type.
     * @return string
     */
    public function sanitize_entry_type( $type ) {
        $allowed = array( 'income', 'expense' );
        $type    = strtolower( sanitize_text_field( $type ) );

        if ( in_array( $type, $allowed, true ) ) {
            return $type;
        }

        return 'income';
    }

    /**
     * Permission callback for editing tasks.
     */
    public function can_edit_tasks() {
        return current_user_can( 'edit_l4p_tasks' );
    }

    /**
     * Permission callback for assigning tasks.
     */
    public function can_assign_tasks() {
        return current_user_can( 'assign_l4p_tasks' );
    }

    /**
     * Enqueue editor assets (placeholder for future block integration).
     */
    public function enqueue_editor_assets() {
        // Intentionally left blank for potential block editor support.
    }

    /**
     * Enqueue front-end assets.
     */
    public function enqueue_frontend_assets() {
        if ( ! is_singular() ) {
            return;
        }

        global $post;
        if ( ! $post ) {
            return;
        }

        if ( has_shortcode( $post->post_content, 'local4picnic_dashboard' ) ) {
            $this->enqueue_dashboard_assets();
        }
    }

    /**
     * Enqueue admin assets when editing plugin post types.
     */
    public function enqueue_admin_assets( $hook ) {
        $screen = get_current_screen();
        if ( ! $screen ) {
            return;
        }

        if ( in_array( $screen->post_type, array( 'l4p_task', 'l4p_funding', 'l4p_crew', 'l4p_feed' ), true ) ) {
            wp_enqueue_style( 'l4p-admin', L4P_PLUGIN_URL . 'assets/css/dashboard.css', array(), L4P_PLUGIN_VERSION );
        }
    }

    /**
     * Enqueue dashboard assets.
     */
    protected function enqueue_dashboard_assets() {
        wp_enqueue_style( 'l4p-dashboard', L4P_PLUGIN_URL . 'assets/css/dashboard.css', array(), L4P_PLUGIN_VERSION );

        wp_register_script(
            'l4p-dashboard',
            L4P_PLUGIN_URL . 'assets/js/dashboard.js',
            array(),
            L4P_PLUGIN_VERSION,
            true
        );

        wp_localize_script(
            'l4p-dashboard',
            'l4pDashboard',
            array(
                'restUrl'      => esc_url_raw( rest_url( 'local4/v1/' ) ),
                'nonce'        => wp_create_nonce( 'wp_rest' ),
                'currentUser'  => array(
                    'id'       => get_current_user_id(),
                    'name'     => wp_get_current_user()->display_name,
                    'email'    => wp_get_current_user()->user_email,
                    'roles'    => wp_get_current_user()->roles,
                ),
                'strings'      => array(
                    'dashboard'   => __( 'Dashboard', 'local4-picnic' ),
                    'tasks'       => __( 'Tasks', 'local4-picnic' ),
                    'notifications'=> __( 'Notifications', 'local4-picnic' ),
                    'funding'     => __( 'Funding', 'local4-picnic' ),
                    'crew'        => __( 'Crew', 'local4-picnic' ),
                    'community'   => __( 'Community', 'local4-picnic' ),
                ),
                'branding'    => L4P_Settings::get_frontend_settings(),
            )
        );

        wp_enqueue_script( 'l4p-dashboard' );
    }

    /**
     * Track task changes and create notifications.
     */
    public function track_task_changes( $post_ID, $post_after, $post_before ) {
        if ( 'l4p_task' !== $post_after->post_type || 'auto-draft' === $post_after->post_status ) {
            return;
        }

        $old_status = get_post_meta( $post_before->ID, '_l4p_status', true );
        $new_status = get_post_meta( $post_after->ID, '_l4p_status', true );

        $old_assignee = get_post_meta( $post_before->ID, '_l4p_assignee', true );
        $new_assignee = get_post_meta( $post_after->ID, '_l4p_assignee', true );

        if ( $old_status !== $new_status && ! empty( $new_status ) ) {
            L4P_Notifications::add_notification(
                'task_status',
                sprintf(
                    /* translators: 1: task title, 2: status */
                    __( 'Task "%1$s" marked as %2$s.', 'local4-picnic' ),
                    get_the_title( $post_after ),
                    ucfirst( $new_status )
                ),
                $new_assignee ? absint( $new_assignee ) : 0,
                'l4p_task',
                $post_ID
            );
        }

        if ( $old_assignee !== $new_assignee && $new_assignee ) {
            L4P_Notifications::add_notification(
                'task_assignment',
                sprintf(
                    /* translators: 1: task title */
                    __( 'You have been assigned to task "%s".', 'local4-picnic' ),
                    get_the_title( $post_after )
                ),
                absint( $new_assignee ),
                'l4p_task',
                $post_ID
            );
        }
    }

    /**
     * Record funding notifications when amounts change.
     */
    public function maybe_record_funding_notification( $post_ID, $post, $update ) {
        if ( ! $update ) {
            $amount   = get_post_meta( $post_ID, '_l4p_amount', true );
            $formatted_amount = $amount ? sprintf( '$%s', number_format_i18n( (float) $amount, 2 ) ) : __( 'an unspecified amount', 'local4-picnic' );

            L4P_Notifications::add_notification(
                'funding_new',
                sprintf(
                    /* translators: 1: funding title, 2: amount */
                    __( 'New funding entry "%1$s" recorded for %2$s.', 'local4-picnic' ),
                    get_the_title( $post_ID ),
                    $formatted_amount
                ),
                0,
                'l4p_funding',
                $post_ID
            );
        }
    }

    /**
     * Record notifications for community posts.
     */
    public function maybe_record_feed_notification( $post_ID, $post, $update ) {
        if ( $update ) {
            return;
        }

        L4P_Notifications::add_notification(
            'community_new',
            sprintf(
                /* translators: %s: feed title */
                __( 'New community update "%s" posted.', 'local4-picnic' ),
                get_the_title( $post_ID )
            ),
            0,
            'l4p_feed',
            $post_ID
        );
    }
}

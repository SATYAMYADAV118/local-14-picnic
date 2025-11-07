<?php
/**
 * Main plugin bootstrap.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once L4P_PLUGIN_DIR . 'includes/class-local4picnic-activator.php';
require_once L4P_PLUGIN_DIR . 'includes/class-local4picnic-rest.php';
require_once L4P_PLUGIN_DIR . 'includes/class-local4picnic-settings.php';
require_once L4P_PLUGIN_DIR . 'includes/class-local4picnic-crew.php';
require_once L4P_PLUGIN_DIR . 'includes/class-local4picnic-notifications.php';
require_once L4P_PLUGIN_DIR . 'includes/class-local4picnic-dashboard.php';
require_once L4P_PLUGIN_DIR . 'includes/class-local4picnic-cli.php';

/**
 * Class Local4Picnic_Plugin
 */
class Local4Picnic_Plugin {

    /**
     * Activator instance.
     *
     * @var Local4Picnic_Activator
     */
    protected $activator;

    /**
     * REST manager.
     *
     * @var Local4Picnic_Rest
     */
    protected $rest;

    /**
     * Settings handler.
     *
     * @var Local4Picnic_Settings
     */
    protected $settings;

    /**
     * Crew manager.
     *
     * @var Local4Picnic_Crew
     */
    protected $crew;

    /**
     * Notifications manager.
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
     * CLI command handler.
     *
     * @var Local4Picnic_CLI
     */
    protected $cli;

    /**
     * Run the plugin.
     */
    public function run() {
        $this->activator      = new Local4Picnic_Activator();
        $this->settings       = new Local4Picnic_Settings();
        $this->crew           = new Local4Picnic_Crew( $this->settings );
        $this->notifications  = new Local4Picnic_Notifications( $this->settings );
        $this->dashboard      = new Local4Picnic_Dashboard( $this->notifications );
        $this->rest           = new Local4Picnic_Rest( $this->notifications, $this->dashboard, $this->crew, $this->settings );
        $this->cli            = new Local4Picnic_CLI();

        register_activation_hook( L4P_PLUGIN_FILE, array( $this->activator, 'activate' ) );
        register_deactivation_hook( L4P_PLUGIN_FILE, array( $this->activator, 'deactivate' ) );

        add_action( 'admin_menu', array( $this, 'register_admin_menu' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
        add_action( 'init', array( $this->settings, 'register_settings' ) );
        add_action( 'rest_api_init', array( $this->rest, 'register_routes' ) );
        add_action( 'user_register', array( $this->notifications, 'notify_new_member' ) );
        add_action( 'admin_init', array( $this->crew, 'maybe_sync_roles' ) );
        add_action( 'init', array( $this->crew, 'register_media_sizes' ) );
        add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );

        if ( defined( 'WP_CLI' ) && WP_CLI ) {
            $this->cli->register();
        }
    }

    /**
     * Load text domain for translations.
     */
    public function load_textdomain() {
        load_plugin_textdomain( 'local4picnic', false, dirname( plugin_basename( L4P_PLUGIN_FILE ) ) . '/languages/' );
    }

    /**
     * Register admin menu entry.
     */
    public function register_admin_menu() {
        if ( ! current_user_can( 'read' ) ) {
            return;
        }

        $page_hook = add_menu_page(
            __( 'Local Picnic', 'local4picnic' ),
            __( 'Local Picnic', 'local4picnic' ),
            'read',
            'local4picnic',
            array( $this, 'render_admin_app' ),
            'dashicons-groups',
            3
        );

        add_action( 'load-' . $page_hook, array( $this, 'ensure_admin_capabilities' ) );
        add_filter( 'admin_body_class', array( $this, 'add_admin_body_class' ) );
    }

    /**
     * Ensure current user can access based on role.
     */
    public function ensure_admin_capabilities() {
        $allowed_roles = array( 'l4p_coordinator', 'l4p_volunteer' );
        $user          = wp_get_current_user();

        if ( empty( array_intersect( $allowed_roles, (array) $user->roles ) ) && ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'You do not have permission to access this dashboard.', 'local4picnic' ) );
        }
    }

    /**
     * Render admin app root container.
     */
    public function render_admin_app() {
        echo '<div id="l4p-admin-app"></div>';
    }

    /**
     * Add custom body class.
     */
    public function add_admin_body_class( $classes ) {
        $screen = get_current_screen();

        if ( isset( $screen->id ) && 'toplevel_page_local4picnic' === $screen->id ) {
            $classes .= ' local4picnic-admin';
        }

        return $classes;
    }

    /**
     * Enqueue admin assets for React dashboard.
     */
    public function enqueue_admin_assets( $hook ) {
        if ( 'toplevel_page_local4picnic' !== $hook ) {
            return;
        }

        $asset_path = L4P_PLUGIN_DIR . 'build/index.asset.php';
        $deps       = array( 'wp-element' );
        $version    = L4P_PLUGIN_VERSION;

        if ( file_exists( $asset_path ) ) {
            $asset   = include $asset_path;
            $deps    = isset( $asset['dependencies'] ) ? $asset['dependencies'] : $deps;
            $version = isset( $asset['version'] ) ? $asset['version'] : $version;
        }

        wp_enqueue_media();

        wp_enqueue_script(
            'chart.js',
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
            array(),
            '4.4.0',
            true
        );

        wp_enqueue_script(
            'l4p-admin-app',
            L4P_PLUGIN_URL . 'build/index.js',
            $deps,
            $version,
            true
        );

        wp_localize_script(
            'l4p-admin-app',
            'l4pApp',
            array(
                'root'              => esc_url_raw( rest_url( 'l4p/v1/' ) ),
                'nonce'             => wp_create_nonce( 'wp_rest' ),
                'currentUser'       => array(
                    'id'    => get_current_user_id(),
                    'roles' => wp_get_current_user()->roles,
                ),
                'settings'          => $this->settings->get_settings(),
                'notifications'     => array(
                    'toasts' => array(),
                    'unread' => $this->notifications->count_unread( get_current_user_id() ),
                ),
                'designTokens'      => $this->settings->get_design_tokens(),
            )
        );

        wp_enqueue_style(
            'l4p-admin-style',
            L4P_PLUGIN_URL . 'build/style-index.css',
            array(),
            $version
        );
    }
}

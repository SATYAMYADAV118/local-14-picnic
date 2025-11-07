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

        add_action( 'init', array( $this->settings, 'register_settings' ) );
        add_action( 'rest_api_init', array( $this->rest, 'register_routes' ) );
        add_action( 'user_register', array( $this->notifications, 'notify_new_member' ) );
        add_action( 'admin_init', array( $this->crew, 'maybe_sync_roles' ) );
        add_action( 'init', array( $this->crew, 'register_media_sizes' ) );
        add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
        add_action( 'wp_enqueue_scripts', array( $this, 'register_frontend_assets' ) );
        add_shortcode( 'local4picnic_dashboard', array( $this, 'render_frontend_app' ) );

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
     * Register frontend assets for the shortcode-driven app.
     */
    public function register_frontend_assets() {
        $asset_path = L4P_PLUGIN_DIR . 'build/index.asset.php';
        $deps       = array( 'wp-element' );
        $version    = L4P_PLUGIN_VERSION;

        if ( file_exists( $asset_path ) ) {
            $asset   = include $asset_path;
            $deps    = isset( $asset['dependencies'] ) ? $asset['dependencies'] : $deps;
            $version = isset( $asset['version'] ) ? $asset['version'] : $version;
        }

        wp_register_script(
            'l4p-dashboard-app',
            L4P_PLUGIN_URL . 'build/index.js',
            $deps,
            $version,
            true
        );

        wp_register_style(
            'l4p-dashboard-style',
            L4P_PLUGIN_URL . 'build/style-index.css',
            array(),
            $version
        );

        wp_register_script(
            'l4p-chartjs',
            'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
            array(),
            '4.4.0',
            true
        );
    }

    /**
     * Render the dashboard shortcode.
     *
     * @param array $atts Shortcode attributes.
     *
     * @return string
     */
    public function render_frontend_app( $atts = array() ) {
        if ( ! is_user_logged_in() ) {
            $request_uri = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
            $redirect    = $request_uri ? home_url( $request_uri ) : home_url();

            $form = wp_login_form( array(
                'echo'     => false,
                'redirect' => $redirect,
            ) );

            return sprintf(
                '<div class="l4p-login-required"><p>%s</p>%s</div>',
                esc_html__( 'Please log in to access the Local Picnic dashboard.', 'local4picnic' ),
                $form
            );
        }

        $user          = wp_get_current_user();
        $allowed_roles = array( 'l4p_coordinator', 'l4p_volunteer', 'administrator' );

        if ( empty( array_intersect( $allowed_roles, (array) $user->roles ) ) && ! current_user_can( 'manage_options' ) ) {
            return sprintf(
                '<div class="l4p-dashboard-denied">%s</div>',
                esc_html__( 'You do not have access to this dashboard.', 'local4picnic' )
            );
        }

        if ( ! wp_script_is( 'l4p-dashboard-app', 'registered' ) || ! wp_style_is( 'l4p-dashboard-style', 'registered' ) ) {
            $this->register_frontend_assets();
        }

        wp_enqueue_style( 'l4p-dashboard-style' );
        wp_enqueue_script( 'l4p-chartjs' );
        wp_enqueue_script( 'l4p-dashboard-app' );

        wp_localize_script(
            'l4p-dashboard-app',
            'l4pApp',
            array(
                'root'          => esc_url_raw( rest_url( 'l4p/v1/' ) ),
                'nonce'         => wp_create_nonce( 'wp_rest' ),
                'currentUser'   => array(
                    'id'    => get_current_user_id(),
                    'roles' => $user->roles,
                ),
                'settings'      => $this->settings->get_settings(),
                'notifications' => array(
                    'toasts' => array(),
                    'unread' => $this->notifications->count_unread( get_current_user_id() ),
                ),
                'designTokens'  => $this->settings->get_design_tokens(),
            )
        );

        return '<div class="l4p-portal-wrapper"><div id="l4p-portal-app"></div></div>';
    }
}

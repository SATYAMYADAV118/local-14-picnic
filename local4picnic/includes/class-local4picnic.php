<?php
/**
 * Core plugin class that wires together the functionality.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

require_once LOCAL4PICNIC_PLUGIN_DIR . 'admin/class-local4picnic-admin.php';
require_once LOCAL4PICNIC_PLUGIN_DIR . 'public/class-local4picnic-public.php';

class Local4Picnic {

    /**
     * Admin handler instance.
     *
     * @var Local4Picnic_Admin
     */
    protected $admin;

    /**
     * Public handler instance.
     *
     * @var Local4Picnic_Public
     */
    protected $public;

    /**
     * Shortcode handler.
     *
     * @var Local4Picnic_Shortcode
     */
    protected $shortcode;

    /**
     * REST API controller.
     *
     * @var Local4Picnic_REST
     */
    protected $rest;

    /**
     * Constructor.
     */
    public function __construct() {
        $this->admin     = new Local4Picnic_Admin();
        $this->public    = new Local4Picnic_Public();
        $this->rest      = new Local4Picnic_REST();
        $this->shortcode = new Local4Picnic_Shortcode( $this->public );
    }

    /**
     * Register all WordPress hooks.
     */
    public function run() {
        add_action( 'plugins_loaded', array( 'Local4Picnic_Install', 'maybe_upgrade' ), 5 );
        add_action( 'plugins_loaded', array( $this, 'load_textdomain' ) );
        add_action( 'admin_init', array( 'Local4Picnic_Settings', 'register_settings' ) );
        add_action( 'admin_menu', array( 'Local4Picnic_Settings', 'register_menu' ) );
        add_action( 'init', array( 'Local4Picnic_Roles', 'add_roles' ) );
        add_action( 'init', array( 'Local4Picnic_Roles', 'add_caps' ) );
        add_action( 'init', array( $this->shortcode, 'register' ) );
        add_action( 'admin_enqueue_scripts', array( $this->admin, 'enqueue_assets' ) );
        add_action( 'wp_enqueue_scripts', array( $this->public, 'enqueue_assets' ) );
        add_action( 'rest_api_init', array( $this->rest, 'register_routes' ) );
        add_filter( 'plugin_action_links_' . LOCAL4PICNIC_PLUGIN_BASENAME, array( $this, 'register_action_links' ) );
    }

    /**
     * Load plugin textdomain for translations.
     */
    public function load_textdomain() {
        load_plugin_textdomain( 'local4picnic', false, dirname( LOCAL4PICNIC_PLUGIN_BASENAME ) . '/languages' );
    }

    /**
     * Add quick links to the plugin listing.
     *
     * @param array $links Existing plugin links.
     *
     * @return array
     */
    public function register_action_links( $links ) {
        $settings_link = sprintf(
            '<a href="%s">%s</a>',
            esc_url( admin_url( 'admin.php?page=local4picnic' ) ),
            esc_html__( 'Settings', 'local4picnic' )
        );

        array_unshift( $links, $settings_link );

        return $links;
    }
}

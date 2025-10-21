<?php
/**
 * Plugin Name:       Local 4 Picnic Manager
 * Plugin URI:        https://example.com/plugins/local4picnic
 * Description:       Manage Local 4 picnic events, volunteers, and funding goals from the WordPress dashboard.
 * Version:           1.0.0
 * Author:            Local 4 Picnic Team
 * Author URI:        https://example.com
 * Text Domain:       local4picnic
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! defined( 'LOCAL4PICNIC_VERSION' ) ) {
    define( 'LOCAL4PICNIC_VERSION', '1.0.0' );
}

define( 'LOCAL4PICNIC_PLUGIN_FILE', __FILE__ );
define( 'LOCAL4PICNIC_PLUGIN_BASENAME', plugin_basename( __FILE__ ) );
define( 'LOCAL4PICNIC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'LOCAL4PICNIC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once LOCAL4PICNIC_PLUGIN_DIR . 'includes/class-local4picnic-activator.php';
require_once LOCAL4PICNIC_PLUGIN_DIR . 'includes/class-local4picnic-deactivator.php';
require_once LOCAL4PICNIC_PLUGIN_DIR . 'includes/class-local4picnic-roles.php';
require_once LOCAL4PICNIC_PLUGIN_DIR . 'includes/class-local4picnic-settings.php';
require_once LOCAL4PICNIC_PLUGIN_DIR . 'includes/class-local4picnic-data.php';
require_once LOCAL4PICNIC_PLUGIN_DIR . 'includes/class-local4picnic-install.php';
require_once LOCAL4PICNIC_PLUGIN_DIR . 'includes/class-local4picnic-rest.php';
require_once LOCAL4PICNIC_PLUGIN_DIR . 'includes/class-local4picnic-shortcode.php';
require_once LOCAL4PICNIC_PLUGIN_DIR . 'includes/class-local4picnic.php';

register_activation_hook( __FILE__, array( 'Local4Picnic_Activator', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'Local4Picnic_Deactivator', 'deactivate' ) );

/**
 * Begins execution of the plugin.
 */
function run_local4picnic() {
    $plugin = new Local4Picnic();
    $plugin->run();
}
run_local4picnic();

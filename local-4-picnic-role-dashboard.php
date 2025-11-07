<?php
/**
 * Plugin Name: Local 4 Picnic – Role Dashboard
 * Description: Coordinator and volunteer dashboard with tasks, funding, community, notifications, and crew management.
 * Version: 1.0.0
 * Author: Local 4 Picnic Team
 * Text Domain: local4picnic
 */

define( 'L4P_PLUGIN_VERSION', '1.0.0' );
define( 'L4P_PLUGIN_FILE', __FILE__ );
define( 'L4P_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'L4P_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once L4P_PLUGIN_DIR . 'includes/class-local4picnic-plugin.php';

function l4p_run_plugin() {
    $plugin = new Local4Picnic_Plugin();
    $plugin->run();
}

l4p_run_plugin();

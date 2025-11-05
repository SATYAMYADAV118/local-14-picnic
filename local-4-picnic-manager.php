<?php
/**
 * Plugin Name: Local 4 Picnic Manager
 * Description: Frontline coordination dashboard for Local 4 Picnic events with tasks, funding, crew, notifications, and community feed modules.
 * Version: 1.0.0
 * Author: Local 4
 * Text Domain: local4-picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'L4P_PLUGIN_FILE', __FILE__ );
define( 'L4P_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'L4P_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'L4P_PLUGIN_VERSION', '1.0.0' );

require_once L4P_PLUGIN_DIR . 'includes/class-l4p-settings.php';
require_once L4P_PLUGIN_DIR . 'includes/class-l4p-plugin.php';
require_once L4P_PLUGIN_DIR . 'includes/class-l4p-roles.php';
require_once L4P_PLUGIN_DIR . 'includes/class-l4p-notifications.php';
require_once L4P_PLUGIN_DIR . 'includes/class-l4p-dashboard.php';
require_once L4P_PLUGIN_DIR . 'includes/class-l4p-rest.php';

register_activation_hook( __FILE__, array( 'L4P_Roles', 'activate' ) );
register_deactivation_hook( __FILE__, array( 'L4P_Roles', 'deactivate' ) );
register_activation_hook( __FILE__, array( 'L4P_Notifications', 'activate' ) );

L4P_Settings::instance();
L4P_Plugin::instance();
L4P_Dashboard::instance();
L4P_REST::instance();

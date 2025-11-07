<?php
/**
 * Plugin Name:       Local 4 Picnic Manager
 * Plugin URI:        https://local4picnic.example.com
 * Description:       Role-based operations dashboard for Local 4 Picnic crews with premium responsive UI.
 * Version:           1.1.0
 * Author:            Local Picnic Collective
 * Author URI:        https://local4picnic.example.com
 * License:           GPL-2.0-or-later
 * License URI:       http://www.gnu.org/licenses/gpl-2.0.txt
 * Text Domain:       local-4-picnic-manager
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

define( 'L4P_VERSION', '1.1.0' );
define( 'L4P_PLUGIN_FILE', __FILE__ );
define( 'L4P_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'L4P_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

autoload_l4p();

register_activation_hook( __FILE__, [ '\\Local4Picnic\\Services\\Activator', 'activate' ] );
register_deactivation_hook( __FILE__, [ '\\Local4Picnic\\Services\\Activator', 'deactivate' ] );

add_action( 'plugins_loaded', '\\Local4Picnic\\Services\\Plugin::init' );

/**
 * Minimal PSR-4 style autoloader for plugin classes.
 *
 * @return void
 */
function autoload_l4p() {
    spl_autoload_register(
        static function ( $class ) {
            if ( strpos( $class, 'Local4Picnic\\' ) !== 0 ) {
                return;
            }

            $relative = str_replace( 'Local4Picnic\\', '', $class );
            $relative = str_replace( '\\', DIRECTORY_SEPARATOR, $relative );
            $path     = L4P_PLUGIN_DIR . 'includes/' . $relative . '.php';

            if ( file_exists( $path ) ) {
                require_once $path;
            }
        }
    );
}

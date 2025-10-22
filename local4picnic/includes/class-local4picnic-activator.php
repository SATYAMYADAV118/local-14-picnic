<?php
/**
 * Fired during plugin activation.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Activator {

    /**
     * Run tasks on plugin activation.
     */
    public static function activate() {
        Local4Picnic_Install::activate();
        Local4Picnic_Roles::add_roles();
        Local4Picnic_Roles::add_caps();
        Local4Picnic_Settings::initialize_options();
    }
}

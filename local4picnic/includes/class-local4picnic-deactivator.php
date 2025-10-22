<?php
/**
 * Fired during plugin deactivation.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Deactivator {

    /**
     * Run tasks on plugin deactivation.
     */
    public static function deactivate() {
        Local4Picnic_Roles::remove_caps();
    }
}

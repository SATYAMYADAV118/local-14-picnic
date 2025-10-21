<?php
/**
 * Admin-specific functionality.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Admin {

    /**
     * Enqueue styles and scripts for the admin area.
     */
    public function enqueue_assets( $hook_suffix ) {
        if ( strpos( $hook_suffix, 'local4picnic' ) === false ) {
            return;
        }

        wp_enqueue_style(
            'local4picnic-admin',
            LOCAL4PICNIC_PLUGIN_URL . 'assets/admin/css/local4picnic-admin.css',
            array(),
            LOCAL4PICNIC_VERSION
        );

        wp_enqueue_script(
            'local4picnic-admin',
            LOCAL4PICNIC_PLUGIN_URL . 'assets/admin/js/local4picnic-admin.js',
            array( 'jquery' ),
            LOCAL4PICNIC_VERSION,
            true
        );
    }
}

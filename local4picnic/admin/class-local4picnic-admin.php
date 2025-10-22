<?php
/**
 * Admin side logic.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Admin {

    /**
     * Enqueue admin assets.
     *
     * @param string $hook Current screen hook.
     */
    public function enqueue_assets( $hook ) {
        if ( false === strpos( $hook, 'local4picnic' ) ) {
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

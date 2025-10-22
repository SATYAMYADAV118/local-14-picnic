<?php
/**
 * Public-facing functionality.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Public {

    /**
     * Register public assets.
     */
    public function enqueue_assets() {
        wp_register_style(
            'local4picnic-public',
            LOCAL4PICNIC_PLUGIN_URL . 'assets/public/css/local4picnic-public.css',
            array(),
            LOCAL4PICNIC_VERSION
        );

        wp_register_script(
            'local4picnic-public',
            LOCAL4PICNIC_PLUGIN_URL . 'assets/public/js/local4picnic-public.js',
            array(),
            LOCAL4PICNIC_VERSION,
            true
        );

        wp_register_style(
            'local4picnic-dashboard',
            LOCAL4PICNIC_PLUGIN_URL . 'assets/public/css/local4picnic-dashboard.css',
            array( 'local4picnic-public' ),
            LOCAL4PICNIC_VERSION
        );

        wp_register_script(
            'local4picnic-dashboard',
            LOCAL4PICNIC_PLUGIN_URL . 'assets/public/js/local4picnic-dashboard.js',
            array(),
            LOCAL4PICNIC_VERSION,
            true
        );

        // Maintain legacy behaviour by ensuring base assets are available globally.
        wp_enqueue_style( 'local4picnic-public' );
        wp_enqueue_script( 'local4picnic-public' );
    }
}

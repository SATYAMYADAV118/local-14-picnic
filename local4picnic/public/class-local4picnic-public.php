<?php
/**
 * Public facing helpers.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Public {

    /**
     * Whether the shortcode is active on the page.
     *
     * @var bool
     */
    protected $shortcode_active = false;

    /**
     * Register public assets.
     */
    public function enqueue_assets() {
        wp_register_style(
            'local4picnic-dashboard',
            LOCAL4PICNIC_PLUGIN_URL . 'assets/public/css/local4picnic-dashboard.css',
            array(),
            LOCAL4PICNIC_VERSION
        );

        wp_register_script(
            'local4picnic-dashboard',
            LOCAL4PICNIC_PLUGIN_URL . 'assets/public/js/local4picnic-dashboard.js',
            array(),
            LOCAL4PICNIC_VERSION,
            true
        );
    }

    /**
     * Mark shortcode usage and enqueue assets immediately.
     */
    public function set_shortcode_active() {
        $this->shortcode_active = true;

        $this->localize();

        wp_enqueue_style( 'local4picnic-dashboard' );
        wp_enqueue_script( 'local4picnic-dashboard' );
    }

    /**
     * Localize data for the dashboard script.
     */
    protected function localize() {
        if ( ! wp_script_is( 'local4picnic-dashboard', 'registered' ) ) {
            $this->enqueue_assets();
        }

        $current_user = wp_get_current_user();
        $options      = Local4Picnic_Settings::get_options();

        $data = array(
            'restUrl'      => esc_url_raw( rest_url( Local4Picnic_REST::ROUTE_NAMESPACE . '/' ) ),
            'nonce'        => wp_create_nonce( 'wp_rest' ),
            'currentUser'  => array(
                'id'    => (int) $current_user->ID,
                'name'  => $current_user->display_name,
                'email' => $current_user->user_email,
            ),
            'options'      => array(
                'organization'      => $options['org_name'],
                'logo'              => $options['org_logo'],
                'currency'          => $options['currency'],
                'fundingGoal'       => (float) $options['funding_goal'],
                'fundingVisibility' => $options['funding_visibility'],
                'feedComments'      => (bool) $options['feed_comments'],
            ),
            'capabilities' => array(
                'manageTasks'         => current_user_can( 'l4p_manage_tasks' ),
                'manageFunding'       => current_user_can( 'l4p_manage_funding' ),
                'manageCrew'          => current_user_can( 'l4p_manage_crew' ),
                'manageFeed'          => current_user_can( 'l4p_manage_feed' ),
                'manageNotifications' => current_user_can( 'l4p_manage_notifications' ),
            ),
            'strings'      => array(
                'tasks'        => __( 'Tasks', 'local4picnic' ),
                'funding'      => __( 'Funding', 'local4picnic' ),
                'crew'         => __( 'Crew', 'local4picnic' ),
                'notifications'=> __( 'Notifications', 'local4picnic' ),
                'community'    => __( 'Community', 'local4picnic' ),
                'save'         => __( 'Save', 'local4picnic' ),
                'cancel'       => __( 'Cancel', 'local4picnic' ),
                'delete'       => __( 'Delete', 'local4picnic' ),
            ),
        );

        wp_localize_script( 'local4picnic-dashboard', 'local4picnicDashboard', $data );
    }
}

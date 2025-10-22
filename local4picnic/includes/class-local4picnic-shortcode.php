<?php
/**
 * Shortcode registration for the dashboard.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Shortcode {

    /**
     * Public handler.
     *
     * @var Local4Picnic_Public
     */
    protected $public;

    /**
     * Constructor.
     *
     * @param Local4Picnic_Public $public Public handler.
     */
    public function __construct( Local4Picnic_Public $public ) {
        $this->public = $public;
    }

    /**
     * Register shortcode.
     */
    public function register() {
        add_shortcode( 'local4picnic_dashboard', array( $this, 'render_dashboard' ) );
    }

    /**
     * Render the dashboard output.
     *
     * @param array $atts Shortcode attributes.
     * @return string
     */
    public function render_dashboard( $atts = array() ) {
        if ( ! is_user_logged_in() ) {
            return '<div class="local4picnic-alert">' . esc_html__( 'Please log in to view the picnic dashboard.', 'local4picnic' ) . '</div>';
        }

        $this->public->set_shortcode_active();

        ob_start();
        ?>
        <div class="local4picnic-dashboard" id="local4picnic-dashboard">
            <div class="local4picnic-dashboard__tabs" role="tablist" aria-label="<?php esc_attr_e( 'Picnic dashboard sections', 'local4picnic' ); ?>">
                <button class="is-active" data-tab="overview" role="tab" aria-selected="true"><?php esc_html_e( 'Overview', 'local4picnic' ); ?></button>
                <button data-tab="tasks" role="tab" aria-selected="false"><?php esc_html_e( 'Tasks', 'local4picnic' ); ?></button>
                <button data-tab="funding" role="tab" aria-selected="false"><?php esc_html_e( 'Funding', 'local4picnic' ); ?></button>
                <button data-tab="crew" role="tab" aria-selected="false"><?php esc_html_e( 'Crew', 'local4picnic' ); ?></button>
                <button data-tab="notifications" role="tab" aria-selected="false"><?php esc_html_e( 'Notifications', 'local4picnic' ); ?></button>
                <button data-tab="community" role="tab" aria-selected="false"><?php esc_html_e( 'Community', 'local4picnic' ); ?></button>
            </div>
            <div class="local4picnic-dashboard__panel" data-panel="overview"></div>
            <div class="local4picnic-dashboard__panel" data-panel="tasks" hidden></div>
            <div class="local4picnic-dashboard__panel" data-panel="funding" hidden></div>
            <div class="local4picnic-dashboard__panel" data-panel="crew" hidden></div>
            <div class="local4picnic-dashboard__panel" data-panel="notifications" hidden></div>
            <div class="local4picnic-dashboard__panel" data-panel="community" hidden></div>
        </div>
        <?php
        return ob_get_clean();
    }
}

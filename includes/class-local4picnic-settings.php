<?php
/**
 * Plugin settings handler.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Local4Picnic_Settings
 */
class Local4Picnic_Settings {

    const OPTION_KEY = 'l4p_settings';

    /**
     * Default settings.
     *
     * @var array<string,mixed>
     */
    protected $defaults = array(
        'brand_name'                => 'Local 4 Picnic',
        'primary_color'            => '#0B5CD6',
        'accent_color'             => '#22C55E',
        'timezone'                 => 'America/New_York',
        'currency'                 => 'USD',
        'volunteer_community_post' => true,
        'volunteer_create_tasks'   => true,
        'funding_csv_export'       => true,
        'allow_post_images'        => false,
        'volunteer_task_write'     => true,
        'notifications_email'      => array(
            'enabled' => false,
            'events'  => array(
                'new_member'    => array(
                    'enabled' => true,
                    'subject' => 'A new member has joined the crew.',
                    'body'    => 'A new member has joined the crew.',
                ),
                'task_assigned' => array(
                    'enabled' => true,
                    'subject' => 'You have been assigned a new task.',
                    'body'    => 'You have been assigned a new task.',
                ),
                'funding_added' => array(
                    'enabled' => true,
                    'subject' => 'A new funding transaction was recorded.',
                    'body'    => 'A new funding transaction was recorded.',
                ),
                'post_reply'    => array(
                    'enabled' => true,
                    'subject' => 'Someone replied to your post.',
                    'body'    => 'Someone replied to your post.',
                ),
            ),
        ),
        'logo_id'                  => 0,
    );

    /**
     * Register settings option.
     */
    public function register_settings() {
        register_setting( 'l4p_settings', self::OPTION_KEY, array( $this, 'sanitize' ) );
    }

    /**
     * Get settings.
     */
    public function get_settings() {
        $settings = get_option( self::OPTION_KEY, array() );

        $settings = wp_parse_args( $settings, $this->defaults );

        $settings['logo_url'] = $settings['logo_id'] ? wp_get_attachment_url( $settings['logo_id'] ) : '';

        return $settings;
    }

    /**
     * Sanitize settings input.
     */
    public function sanitize( $settings ) {
        $settings = wp_parse_args( $settings, $this->defaults );

        $settings['brand_name']                = sanitize_text_field( $settings['brand_name'] );
        $settings['primary_color']            = sanitize_hex_color( $settings['primary_color'] );
        $settings['accent_color']             = sanitize_hex_color( $settings['accent_color'] );
        $settings['timezone']                 = sanitize_text_field( $settings['timezone'] );
        $settings['currency']                 = sanitize_text_field( $settings['currency'] );
        $settings['volunteer_community_post'] = (bool) $settings['volunteer_community_post'];
        $settings['volunteer_create_tasks']   = (bool) $settings['volunteer_create_tasks'];
        $settings['funding_csv_export']       = (bool) $settings['funding_csv_export'];
        $settings['allow_post_images']        = (bool) $settings['allow_post_images'];
        $settings['logo_id']                  = absint( $settings['logo_id'] );

        if ( isset( $settings['notifications_email'] ) && is_array( $settings['notifications_email'] ) ) {
            $settings['notifications_email']['enabled'] = ! empty( $settings['notifications_email']['enabled'] );

            if ( isset( $settings['notifications_email']['events'] ) && is_array( $settings['notifications_email']['events'] ) ) {
                foreach ( $settings['notifications_email']['events'] as $event_key => $event_settings ) {
                    $settings['notifications_email']['events'][ $event_key ]['enabled'] = ! empty( $event_settings['enabled'] );
                    $settings['notifications_email']['events'][ $event_key ]['subject'] = sanitize_text_field( $event_settings['subject'] );
                    $settings['notifications_email']['events'][ $event_key ]['body']    = sanitize_textarea_field( $event_settings['body'] );
                }
            }
        }

        unset( $settings['logo_url'] );

        return $settings;
    }

    /**
     * Update settings via REST.
     */
    public function update_settings( array $params ) {
        $current = $this->get_settings();
        $merged  = array_merge( $current, $params );

        $sanitized = $this->sanitize( $merged );

        update_option( self::OPTION_KEY, $sanitized );

        return true;
    }

    /**
     * Check feature toggle.
     */
    public function is_feature_enabled( $key, $fallback = false ) {
        $settings = $this->get_settings();

        return isset( $settings[ $key ] ) ? (bool) $settings[ $key ] : $fallback;
    }

    /**
     * Design tokens for UI.
     */
    public function get_design_tokens() {
        return array(
            'primary' => '#0B5CD6',
            'success' => '#22C55E',
            'warning' => '#F59E0B',
            'background' => '#F6F8FB',
            'card' => '#FFFFFF',
            'radius' => '16px',
            'shadow' => '0 10px 30px rgba(11,92,214,0.08)',
        );
    }
}

<?php
/**
 * Settings registration and rendering.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Settings {

    const OPTION_NAME = 'local4picnic_options';

    /**
     * Register plugin settings and fields.
     */
    public static function register_settings() {
        register_setting(
            'local4picnic_options_group',
            self::OPTION_NAME,
            array( 'sanitize_callback' => array( __CLASS__, 'sanitize_options' ) )
        );

        add_settings_section(
            'local4picnic_org_section',
            __( 'Organization', 'local4picnic' ),
            '__return_false',
            self::OPTION_NAME
        );

        add_settings_field(
            'org_name',
            __( 'Organization name', 'local4picnic' ),
            array( __CLASS__, 'render_text_field' ),
            self::OPTION_NAME,
            'local4picnic_org_section',
            array(
                'label_for' => 'local4picnic_org_name',
                'option'    => 'org_name',
            )
        );

        add_settings_field(
            'org_logo',
            __( 'Logo URL', 'local4picnic' ),
            array( __CLASS__, 'render_text_field' ),
            self::OPTION_NAME,
            'local4picnic_org_section',
            array(
                'label_for'   => 'local4picnic_org_logo',
                'option'      => 'org_logo',
                'description' => __( 'Paste a URL or use the media library.', 'local4picnic' ),
            )
        );

        add_settings_section(
            'local4picnic_funding_section',
            __( 'Funding', 'local4picnic' ),
            '__return_false',
            self::OPTION_NAME
        );

        add_settings_field(
            'currency',
            __( 'Currency', 'local4picnic' ),
            array( __CLASS__, 'render_text_field' ),
            self::OPTION_NAME,
            'local4picnic_funding_section',
            array(
                'label_for' => 'local4picnic_currency',
                'option'    => 'currency',
            )
        );

        add_settings_field(
            'funding_goal',
            __( 'Funding goal', 'local4picnic' ),
            array( __CLASS__, 'render_number_field' ),
            self::OPTION_NAME,
            'local4picnic_funding_section',
            array(
                'label_for' => 'local4picnic_goal',
                'option'    => 'funding_goal',
                'step'      => '0.01',
            )
        );

        add_settings_field(
            'funding_visibility',
            __( 'Funding visibility', 'local4picnic' ),
            array( __CLASS__, 'render_select_field' ),
            self::OPTION_NAME,
            'local4picnic_funding_section',
            array(
                'label_for' => 'local4picnic_visibility',
                'option'    => 'funding_visibility',
                'choices'   => array(
                    'public'  => __( 'Public', 'local4picnic' ),
                    'private' => __( 'Private', 'local4picnic' ),
                ),
            )
        );

        add_settings_section(
            'local4picnic_feed_section',
            __( 'Community feed', 'local4picnic' ),
            '__return_false',
            self::OPTION_NAME
        );

        add_settings_field(
            'feed_comments',
            __( 'Allow replies', 'local4picnic' ),
            array( __CLASS__, 'render_checkbox_field' ),
            self::OPTION_NAME,
            'local4picnic_feed_section',
            array(
                'label_for' => 'local4picnic_feed_comments',
                'option'    => 'feed_comments',
            )
        );

        add_settings_section(
            'local4picnic_notifications_section',
            __( 'Notifications', 'local4picnic' ),
            '__return_false',
            self::OPTION_NAME
        );

        add_settings_field(
            'notifications_email',
            __( 'Email alerts', 'local4picnic' ),
            array( __CLASS__, 'render_checkbox_field' ),
            self::OPTION_NAME,
            'local4picnic_notifications_section',
            array(
                'label_for' => 'local4picnic_notifications_email',
                'option'    => 'notifications_email',
            )
        );

        add_settings_field(
            'notifications_sms',
            __( 'SMS alerts (manual)', 'local4picnic' ),
            array( __CLASS__, 'render_checkbox_field' ),
            self::OPTION_NAME,
            'local4picnic_notifications_section',
            array(
                'label_for'   => 'local4picnic_notifications_sms',
                'option'      => 'notifications_sms',
                'description' => __( 'Toggle for future integrations.', 'local4picnic' ),
            )
        );

        add_settings_section(
            'local4picnic_data_section',
            __( 'Data retention', 'local4picnic' ),
            '__return_false',
            self::OPTION_NAME
        );

        add_settings_field(
            'uninstall_purge',
            __( 'Remove data on uninstall', 'local4picnic' ),
            array( __CLASS__, 'render_checkbox_field' ),
            self::OPTION_NAME,
            'local4picnic_data_section',
            array(
                'label_for'   => 'local4picnic_uninstall_purge',
                'option'      => 'uninstall_purge',
                'description' => __( 'Deletes custom tables and options when uninstalling.', 'local4picnic' ),
            )
        );
    }

    /**
     * Register the admin menu entries.
     */
    public static function register_menu() {
        $capability = 'manage_options';

        add_menu_page(
            __( 'Local 4 Picnic', 'local4picnic' ),
            __( 'L4P', 'local4picnic' ),
            $capability,
            'local4picnic',
            array( __CLASS__, 'render_settings_page' ),
            'dashicons-groups',
            58
        );

        add_submenu_page(
            'local4picnic',
            __( 'Settings', 'local4picnic' ),
            __( 'Settings', 'local4picnic' ),
            $capability,
            'local4picnic',
            array( __CLASS__, 'render_settings_page' )
        );
    }

    /**
     * Render settings page.
     */
    public static function render_settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $options = self::get_options();

        require LOCAL4PICNIC_PLUGIN_DIR . 'admin/partials/local4picnic-admin-settings.php';
    }

    /**
     * Render a text field.
     *
     * @param array $args Arguments.
     */
    public static function render_text_field( $args ) {
        $options = self::get_options();
        $value   = isset( $options[ $args['option'] ] ) ? $options[ $args['option'] ] : '';
        $description = isset( $args['description'] ) ? $args['description'] : '';
        ?>
        <input type="text" id="<?php echo esc_attr( $args['label_for'] ); ?>" name="<?php echo esc_attr( self::OPTION_NAME ); ?>[<?php echo esc_attr( $args['option'] ); ?>]" value="<?php echo esc_attr( $value ); ?>" class="regular-text" />
        <?php if ( $description ) : ?>
            <p class="description"><?php echo esc_html( $description ); ?></p>
        <?php endif; ?>
        <?php
    }

    /**
     * Render number field.
     *
     * @param array $args Field arguments.
     */
    public static function render_number_field( $args ) {
        $options = self::get_options();
        $value   = isset( $options[ $args['option'] ] ) ? $options[ $args['option'] ] : '';
        $step    = isset( $args['step'] ) ? $args['step'] : '1';
        ?>
        <input type="number" id="<?php echo esc_attr( $args['label_for'] ); ?>" step="<?php echo esc_attr( $step ); ?>" name="<?php echo esc_attr( self::OPTION_NAME ); ?>[<?php echo esc_attr( $args['option'] ); ?>]" value="<?php echo esc_attr( $value ); ?>" />
        <?php
    }

    /**
     * Render select field.
     *
     * @param array $args Arguments.
     */
    public static function render_select_field( $args ) {
        $options = self::get_options();
        $value   = isset( $options[ $args['option'] ] ) ? $options[ $args['option'] ] : '';
        ?>
        <select id="<?php echo esc_attr( $args['label_for'] ); ?>" name="<?php echo esc_attr( self::OPTION_NAME ); ?>[<?php echo esc_attr( $args['option'] ); ?>]">
            <?php foreach ( $args['choices'] as $choice_value => $label ) : ?>
                <option value="<?php echo esc_attr( $choice_value ); ?>" <?php selected( $value, $choice_value ); ?>><?php echo esc_html( $label ); ?></option>
            <?php endforeach; ?>
        </select>
        <?php
    }

    /**
     * Render checkbox field.
     *
     * @param array $args Arguments.
     */
    public static function render_checkbox_field( $args ) {
        $options = self::get_options();
        $checked = ! empty( $options[ $args['option'] ] );
        $description = isset( $args['description'] ) ? $args['description'] : '';
        ?>
        <label for="<?php echo esc_attr( $args['label_for'] ); ?>">
            <input type="checkbox" id="<?php echo esc_attr( $args['label_for'] ); ?>" name="<?php echo esc_attr( self::OPTION_NAME ); ?>[<?php echo esc_attr( $args['option'] ); ?>]" value="1" <?php checked( $checked ); ?> />
            <?php esc_html_e( 'Enable', 'local4picnic' ); ?>
        </label>
        <?php if ( $description ) : ?>
            <p class="description"><?php echo esc_html( $description ); ?></p>
        <?php endif; ?>
        <?php
    }

    /**
     * Sanitize options.
     *
     * @param array $input Raw values.
     * @return array
     */
    public static function sanitize_options( $input ) {
        $defaults  = self::get_default_options();
        $sanitized = $defaults;

        if ( ! is_array( $input ) ) {
            return $sanitized;
        }

        if ( isset( $input['org_name'] ) ) {
            $sanitized['org_name'] = sanitize_text_field( $input['org_name'] );
        }

        if ( isset( $input['org_logo'] ) ) {
            $sanitized['org_logo'] = esc_url_raw( $input['org_logo'] );
        }

        if ( isset( $input['currency'] ) ) {
            $sanitized['currency'] = strtoupper( sanitize_text_field( $input['currency'] ) );
        }

        if ( isset( $input['funding_goal'] ) ) {
            $sanitized['funding_goal'] = floatval( $input['funding_goal'] );
        }

        if ( isset( $input['funding_visibility'] ) && in_array( $input['funding_visibility'], array( 'public', 'private' ), true ) ) {
            $sanitized['funding_visibility'] = $input['funding_visibility'];
        }

        $sanitized['feed_comments']        = ! empty( $input['feed_comments'] ) ? 1 : 0;
        $sanitized['notifications_email']  = ! empty( $input['notifications_email'] ) ? 1 : 0;
        $sanitized['notifications_sms']    = ! empty( $input['notifications_sms'] ) ? 1 : 0;
        $sanitized['uninstall_purge']      = ! empty( $input['uninstall_purge'] ) ? 1 : 0;

        return $sanitized;
    }

    /**
     * Get options with defaults.
     *
     * @return array
     */
    public static function get_options() {
        $saved = get_option( self::OPTION_NAME, array() );

        return wp_parse_args( $saved, self::get_default_options() );
    }

    /**
     * Seed default options on activation.
     */
    public static function initialize_options() {
        if ( false === get_option( self::OPTION_NAME ) ) {
            add_option( self::OPTION_NAME, self::get_default_options() );
        }
    }

    /**
     * Default option values.
     *
     * @return array
     */
    public static function get_default_options() {
        return array(
            'org_name'             => '',
            'org_logo'             => '',
            'currency'             => 'USD',
            'funding_goal'         => 0,
            'funding_visibility'   => 'public',
            'feed_comments'        => 1,
            'notifications_email'  => 1,
            'notifications_sms'    => 0,
            'uninstall_purge'      => 0,
        );
    }
}

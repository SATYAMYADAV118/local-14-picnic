<?php
/**
 * Handle Local4Picnic settings registration and rendering.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Settings {

    /**
     * Option name used to store plugin settings.
     */
    const OPTION_NAME = 'local4picnic_options';

    /**
     * Register settings, sections, and fields.
     */
    public static function register_settings() {
        register_setting(
            'local4picnic_options_group',
            self::OPTION_NAME,
            array( 'sanitize_callback' => array( __CLASS__, 'sanitize_options' ) )
        );

        add_settings_section(
            'local4picnic_org_section',
            __( 'Organization Details', 'local4picnic' ),
            '__return_false',
            self::OPTION_NAME
        );

        add_settings_field(
            'org_name',
            __( 'Organization Name', 'local4picnic' ),
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
            __( 'Organization Logo URL', 'local4picnic' ),
            array( __CLASS__, 'render_text_field' ),
            self::OPTION_NAME,
            'local4picnic_org_section',
            array(
                'label_for'   => 'local4picnic_org_logo',
                'option'      => 'org_logo',
                'description' => __( 'Provide the URL to the organization logo or use the media library.', 'local4picnic' ),
            )
        );

        add_settings_section(
            'local4picnic_funding_section',
            __( 'Funding Preferences', 'local4picnic' ),
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
            __( 'Funding Goal', 'local4picnic' ),
            array( __CLASS__, 'render_number_field' ),
            self::OPTION_NAME,
            'local4picnic_funding_section',
            array(
                'label_for' => 'local4picnic_funding_goal',
                'option'    => 'funding_goal',
                'step'      => '0.01',
            )
        );

        add_settings_field(
            'funding_visibility',
            __( 'Funding Visibility', 'local4picnic' ),
            array( __CLASS__, 'render_select_field' ),
            self::OPTION_NAME,
            'local4picnic_funding_section',
            array(
                'label_for' => 'local4picnic_funding_visibility',
                'option'    => 'funding_visibility',
                'choices'   => array(
                    'public'  => __( 'Public', 'local4picnic' ),
                    'private' => __( 'Private', 'local4picnic' ),
                ),
            )
        );

        add_settings_section(
            'local4picnic_feed_section',
            __( 'Community Feed', 'local4picnic' ),
            '__return_false',
            self::OPTION_NAME
        );

        add_settings_field(
            'feed_comments',
            __( 'Enable Feed Comments', 'local4picnic' ),
            array( __CLASS__, 'render_toggle_field' ),
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
            'notify_email',
            __( 'Email Notifications', 'local4picnic' ),
            array( __CLASS__, 'render_toggle_field' ),
            self::OPTION_NAME,
            'local4picnic_notifications_section',
            array(
                'label_for' => 'local4picnic_notify_email',
                'option'    => 'notify_email',
            )
        );

        add_settings_field(
            'notify_sms',
            __( 'SMS Notifications', 'local4picnic' ),
            array( __CLASS__, 'render_toggle_field' ),
            self::OPTION_NAME,
            'local4picnic_notifications_section',
            array(
                'label_for' => 'local4picnic_notify_sms',
                'option'    => 'notify_sms',
            )
        );

        add_settings_section(
            'local4picnic_sms_section',
            __( 'SMS Delivery', 'local4picnic' ),
            array( __CLASS__, 'render_sms_help' ),
            self::OPTION_NAME
        );

        add_settings_field(
            'sms_provider',
            __( 'Provider', 'local4picnic' ),
            array( __CLASS__, 'render_select_field' ),
            self::OPTION_NAME,
            'local4picnic_sms_section',
            array(
                'label_for' => 'local4picnic_sms_provider',
                'option'    => 'sms_provider',
                'choices'   => array(
                    ''        => __( 'Disabled', 'local4picnic' ),
                    'twilio'  => __( 'Twilio', 'local4picnic' ),
                ),
            )
        );

        add_settings_field(
            'sms_twilio_sid',
            __( 'Twilio Account SID', 'local4picnic' ),
            array( __CLASS__, 'render_text_field' ),
            self::OPTION_NAME,
            'local4picnic_sms_section',
            array(
                'label_for'   => 'local4picnic_twilio_sid',
                'option'      => 'sms_twilio_sid',
                'autocomplete'=> 'off',
                'description' => __( 'Find this in your Twilio console.', 'local4picnic' ),
            )
        );

        add_settings_field(
            'sms_twilio_token',
            __( 'Twilio Auth Token', 'local4picnic' ),
            array( __CLASS__, 'render_text_field' ),
            self::OPTION_NAME,
            'local4picnic_sms_section',
            array(
                'label_for'   => 'local4picnic_twilio_token',
                'option'      => 'sms_twilio_token',
                'input_type'  => 'password',
                'autocomplete'=> 'off',
                'description' => __( 'Used to authenticate API requests to Twilio.', 'local4picnic' ),
            )
        );

        add_settings_field(
            'sms_twilio_from',
            __( 'Twilio From Number', 'local4picnic' ),
            array( __CLASS__, 'render_text_field' ),
            self::OPTION_NAME,
            'local4picnic_sms_section',
            array(
                'label_for'   => 'local4picnic_twilio_from',
                'option'      => 'sms_twilio_from',
                'input_type'  => 'tel',
                'autocomplete'=> 'off',
                'description' => __( 'Enter the sending number in E.164 format (e.g. +15551234567).', 'local4picnic' ),
            )
        );

        add_settings_field(
            'sms_admin_number',
            __( 'Fallback Admin Number', 'local4picnic' ),
            array( __CLASS__, 'render_text_field' ),
            self::OPTION_NAME,
            'local4picnic_sms_section',
            array(
                'label_for'   => 'local4picnic_sms_admin',
                'option'      => 'sms_admin_number',
                'input_type'  => 'tel',
                'autocomplete'=> 'off',
                'description' => __( 'Notifications sent to the whole team fall back to this number.', 'local4picnic' ),
            )
        );

        add_settings_section(
            'local4picnic_uninstall_section',
            __( 'Data Management', 'local4picnic' ),
            '__return_false',
            self::OPTION_NAME
        );

        add_settings_field(
            'uninstall_purge',
            __( 'Remove Data on Uninstall', 'local4picnic' ),
            array( __CLASS__, 'render_toggle_field' ),
            self::OPTION_NAME,
            'local4picnic_uninstall_section',
            array(
                'label_for'   => 'local4picnic_uninstall_purge',
                'option'      => 'uninstall_purge',
                'description' => __( 'If enabled, plugin settings and roles are removed when the plugin is uninstalled.', 'local4picnic' ),
            )
        );
    }

    /**
     * Add the plugin settings page to the admin menu.
     */
    public static function register_menu() {
        $parent_slug = 'local4picnic';

        add_menu_page(
            __( 'Local 4 Picnic Manager', 'local4picnic' ),
            __( 'L4P', 'local4picnic' ),
            'manage_options',
            $parent_slug,
            array( __CLASS__, 'render_settings_page' ),
            'dashicons-carrot',
            59
        );

        add_submenu_page(
            $parent_slug,
            __( 'Settings', 'local4picnic' ),
            __( 'Settings', 'local4picnic' ),
            'manage_options',
            $parent_slug,
            array( __CLASS__, 'render_settings_page' )
        );
    }

    /**
     * Render the settings page.
     */
    public static function render_settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $options = self::get_options();
        $roles   = Local4Picnic_Roles::get_roles();

        require LOCAL4PICNIC_PLUGIN_DIR . 'admin/partials/local4picnic-admin-settings.php';
    }

    /**
     * Render helper text for the SMS section.
     */
    public static function render_sms_help() {
        echo '<p class="description">' . esc_html__( 'Configure SMS delivery so urgent notifications reach teammates instantly.', 'local4picnic' ) . '</p>';
    }

    /**
     * Render a text input field.
     *
     * @param array $args Field arguments.
     */
    public static function render_text_field( $args ) {
        $options = self::get_options();
        $value   = isset( $options[ $args['option'] ] ) ? $options[ $args['option'] ] : '';
        $description = isset( $args['description'] ) ? $args['description'] : '';
        $type        = isset( $args['input_type'] ) ? $args['input_type'] : 'text';
        $autocomplete = isset( $args['autocomplete'] ) ? $args['autocomplete'] : '';
        $autocomplete_attr = '';

        if ( '' !== $autocomplete ) {
            $autocomplete_attr = sprintf( ' autocomplete="%s"', esc_attr( $autocomplete ) );
        }
        ?>
        <input type="<?php echo esc_attr( $type ); ?>" id="<?php echo esc_attr( $args['label_for'] ); ?>" name="<?php echo esc_attr( self::OPTION_NAME ); ?>[<?php echo esc_attr( $args['option'] ); ?>]" value="<?php echo esc_attr( $value ); ?>" class="regular-text"<?php echo $autocomplete_attr; ?> />
        <?php if ( $description ) : ?>
            <p class="description"><?php echo esc_html( $description ); ?></p>
        <?php endif; ?>
        <?php
    }

    /**
     * Render a number field.
     *
     * @param array $args Field arguments.
     */
    public static function render_number_field( $args ) {
        $options = self::get_options();
        $value   = isset( $options[ $args['option'] ] ) ? $options[ $args['option'] ] : '';
        $step    = isset( $args['step'] ) ? $args['step'] : '1';
        ?>
        <input type="number" step="<?php echo esc_attr( $step ); ?>" id="<?php echo esc_attr( $args['label_for'] ); ?>" name="<?php echo esc_attr( self::OPTION_NAME ); ?>[<?php echo esc_attr( $args['option'] ); ?>]" value="<?php echo esc_attr( $value ); ?>" />
        <?php
    }

    /**
     * Render a select field.
     *
     * @param array $args Field arguments.
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
     * Render a checkbox toggle field.
     *
     * @param array $args Field arguments.
     */
    public static function render_toggle_field( $args ) {
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
     * Sanitize options before saving.
     *
     * @param array $input Raw input.
     *
     * @return array
     */
    public static function sanitize_options( $input ) {
        $defaults = self::get_default_options();
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

        $sanitized['feed_comments']    = ! empty( $input['feed_comments'] ) ? 1 : 0;
        $sanitized['notify_email']     = ! empty( $input['notify_email'] ) ? 1 : 0;
        $sanitized['notify_sms']       = ! empty( $input['notify_sms'] ) ? 1 : 0;
        $sanitized['uninstall_purge']  = ! empty( $input['uninstall_purge'] ) ? 1 : 0;

        if ( isset( $input['sms_provider'] ) && in_array( $input['sms_provider'], array( '', 'twilio' ), true ) ) {
            $sanitized['sms_provider'] = $input['sms_provider'];
        }

        if ( isset( $input['sms_twilio_sid'] ) ) {
            $sanitized['sms_twilio_sid'] = sanitize_text_field( $input['sms_twilio_sid'] );
        }

        if ( isset( $input['sms_twilio_token'] ) ) {
            $sanitized['sms_twilio_token'] = sanitize_text_field( $input['sms_twilio_token'] );
        }

        if ( isset( $input['sms_twilio_from'] ) ) {
            $sanitized['sms_twilio_from'] = self::sanitize_phone_option( $input['sms_twilio_from'] );
        }

        if ( isset( $input['sms_admin_number'] ) ) {
            $sanitized['sms_admin_number'] = self::sanitize_phone_option( $input['sms_admin_number'] );
        }

        return $sanitized;
    }

    /**
     * Normalize phone inputs.
     *
     * @param string $value Raw phone.
     *
     * @return string
     */
    protected static function sanitize_phone_option( $value ) {
        $value = trim( (string) $value );

        if ( '' === $value ) {
            return '';
        }

        $digits = preg_replace( '/[^0-9+]/', '', $value );

        if ( '' === $digits ) {
            return '';
        }

        if ( strpos( $digits, '+' ) !== 0 ) {
            $digits = '+' . ltrim( $digits, '+' );
        }

        return $digits;
    }

    /**
     * Retrieve plugin options merged with defaults.
     *
     * @return array
     */
    public static function get_options() {
        $saved = get_option( self::OPTION_NAME, array() );

        return wp_parse_args( $saved, self::get_default_options() );
    }

    /**
     * Initialize the plugin options on activation.
     */
    public static function initialize_options() {
        if ( false === get_option( self::OPTION_NAME ) ) {
            add_option( self::OPTION_NAME, self::get_default_options() );
        }
    }

    /**
     * Provide default option values.
     *
     * @return array
     */
    public static function get_default_options() {
        return array(
            'org_name'           => '',
            'org_logo'           => '',
            'currency'           => 'USD',
            'funding_goal'       => 0,
            'funding_visibility' => 'public',
            'feed_comments'      => 1,
            'notify_email'       => 1,
            'notify_sms'         => 0,
            'sms_provider'       => '',
            'sms_twilio_sid'     => '',
            'sms_twilio_token'   => '',
            'sms_twilio_from'    => '',
            'sms_admin_number'   => '',
            'uninstall_purge'    => 0,
        );
    }
}

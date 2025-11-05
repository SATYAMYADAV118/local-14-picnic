<?php
/**
 * Plugin settings for branding and theme controls.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class L4P_Settings {
    /**
     * Singleton instance.
     *
     * @var L4P_Settings|null
     */
    protected static $instance = null;

    /**
     * Cached admin page hook suffix.
     *
     * @var string
     */
    protected $page_hook = '';

    /**
     * Retrieve singleton instance.
     *
     * @return L4P_Settings
     */
    public static function instance() {
        if ( null === self::$instance ) {
            self::$instance = new self();
            self::$instance->hooks();
        }

        return self::$instance;
    }

    /**
     * Register WordPress hooks.
     */
    protected function hooks() {
        add_action( 'admin_menu', array( $this, 'register_settings_page' ) );
        add_action( 'admin_init', array( $this, 'register_settings' ) );
        add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_assets' ) );
    }

    /**
     * Register the plugin settings page.
     */
    public function register_settings_page() {
        $this->page_hook = add_options_page(
            __( 'Local 4 Picnic Manager Settings', 'local4-picnic' ),
            __( 'Local 4 Picnic', 'local4-picnic' ),
            'manage_options',
            'l4p-settings',
            array( $this, 'render_settings_page' )
        );
    }

    /**
     * Register branding options using the Settings API.
     */
    public function register_settings() {
        $options = array(
            'l4p_brand_title'          => 'sanitize_text_field',
            'l4p_brand_tagline'        => 'sanitize_text_field',
            'l4p_brand_logo_id'        => 'absint',
            'l4p_brand_primary_color'  => array( $this, 'sanitize_color' ),
            'l4p_brand_accent_color'   => array( $this, 'sanitize_color' ),
            'l4p_brand_surface_color'  => array( $this, 'sanitize_color' ),
            'l4p_brand_sidebar_color'  => array( $this, 'sanitize_color' ),
            'l4p_brand_hero_title'     => 'sanitize_text_field',
            'l4p_brand_hero_subtitle'  => 'sanitize_text_field',
        );

        foreach ( $options as $option => $sanitize_callback ) {
            register_setting(
                'l4p_branding',
                $option,
                array(
                    'type'              => 'string',
                    'sanitize_callback' => $sanitize_callback,
                    'default'           => self::get_default( $option ),
                )
            );
        }
    }

    /**
     * Enqueue admin assets for the settings page.
     *
     * @param string $hook Hook suffix.
     */
    public function enqueue_assets( $hook ) {
        if ( 'settings_page_l4p-settings' !== $hook ) {
            return;
        }

        wp_enqueue_style( 'wp-color-picker' );
        wp_enqueue_media();

        wp_enqueue_script(
            'l4p-settings',
            L4P_PLUGIN_URL . 'assets/js/settings.js',
            array( 'jquery', 'wp-color-picker' ),
            L4P_PLUGIN_VERSION,
            true
        );
    }

    /**
     * Render the settings page markup.
     */
    public function render_settings_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return;
        }

        $branding = self::get_branding();
        ?>
        <div class="wrap l4p-settings">
            <h1><?php esc_html_e( 'Local 4 Picnic Manager – Branding', 'local4-picnic' ); ?></h1>
            <p class="description"><?php esc_html_e( 'Customize the dashboard identity, hero copy, and color palette used on the volunteer portal.', 'local4-picnic' ); ?></p>
            <form method="post" action="options.php">
                <?php
                settings_fields( 'l4p_branding' );
                ?>
                <table class="form-table" role="presentation">
                    <tbody>
                        <tr>
                            <th scope="row"><label for="l4p_brand_title"><?php esc_html_e( 'Sidebar title', 'local4-picnic' ); ?></label></th>
                            <td><input name="l4p_brand_title" id="l4p_brand_title" type="text" value="<?php echo esc_attr( $branding['title'] ); ?>" class="regular-text" /></td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="l4p_brand_tagline"><?php esc_html_e( 'Sidebar tagline', 'local4-picnic' ); ?></label></th>
                            <td><input name="l4p_brand_tagline" id="l4p_brand_tagline" type="text" value="<?php echo esc_attr( $branding['tagline'] ); ?>" class="regular-text" /></td>
                        </tr>
                        <tr>
                            <th scope="row"><?php esc_html_e( 'Sidebar logo', 'local4-picnic' ); ?></th>
                            <td>
                                <div class="l4p-settings__media">
                                    <div class="l4p-settings__preview">
                                        <?php
                                        if ( $branding['logo_id'] ) {
                                            echo wp_get_attachment_image( $branding['logo_id'], 'thumbnail' );
                                        }
                                        ?>
                                    </div>
                                    <input type="hidden" name="l4p_brand_logo_id" id="l4p_brand_logo_id" value="<?php echo esc_attr( $branding['logo_id'] ); ?>" />
                                    <button type="button" class="button l4p-settings__choose-logo"><?php esc_html_e( 'Select logo', 'local4-picnic' ); ?></button>
                                    <button type="button" class="button l4p-settings__remove-logo" <?php disabled( ! $branding['logo_id'] ); ?>><?php esc_html_e( 'Remove', 'local4-picnic' ); ?></button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="l4p_brand_hero_title"><?php esc_html_e( 'Hero title', 'local4-picnic' ); ?></label></th>
                            <td><input name="l4p_brand_hero_title" id="l4p_brand_hero_title" type="text" value="<?php echo esc_attr( $branding['hero_title'] ); ?>" class="regular-text" /></td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="l4p_brand_hero_subtitle"><?php esc_html_e( 'Hero subtitle', 'local4-picnic' ); ?></label></th>
                            <td><input name="l4p_brand_hero_subtitle" id="l4p_brand_hero_subtitle" type="text" value="<?php echo esc_attr( $branding['hero_subtitle'] ); ?>" class="regular-text" /></td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="l4p_brand_primary_color"><?php esc_html_e( 'Primary color', 'local4-picnic' ); ?></label></th>
                            <td><input name="l4p_brand_primary_color" id="l4p_brand_primary_color" type="text" value="<?php echo esc_attr( $branding['primary_color'] ); ?>" class="l4p-color-field" data-default-color="<?php echo esc_attr( self::get_default( 'l4p_brand_primary_color' ) ); ?>" /></td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="l4p_brand_accent_color"><?php esc_html_e( 'Accent color', 'local4-picnic' ); ?></label></th>
                            <td><input name="l4p_brand_accent_color" id="l4p_brand_accent_color" type="text" value="<?php echo esc_attr( $branding['accent_color'] ); ?>" class="l4p-color-field" data-default-color="<?php echo esc_attr( self::get_default( 'l4p_brand_accent_color' ) ); ?>" /></td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="l4p_brand_surface_color"><?php esc_html_e( 'Background color', 'local4-picnic' ); ?></label></th>
                            <td><input name="l4p_brand_surface_color" id="l4p_brand_surface_color" type="text" value="<?php echo esc_attr( $branding['surface_color'] ); ?>" class="l4p-color-field" data-default-color="<?php echo esc_attr( self::get_default( 'l4p_brand_surface_color' ) ); ?>" /></td>
                        </tr>
                        <tr>
                            <th scope="row"><label for="l4p_brand_sidebar_color"><?php esc_html_e( 'Sidebar color', 'local4-picnic' ); ?></label></th>
                            <td><input name="l4p_brand_sidebar_color" id="l4p_brand_sidebar_color" type="text" value="<?php echo esc_attr( $branding['sidebar_color'] ); ?>" class="l4p-color-field" data-default-color="<?php echo esc_attr( self::get_default( 'l4p_brand_sidebar_color' ) ); ?>" /></td>
                        </tr>
                    </tbody>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }

    /**
     * Sanitize hexadecimal color values.
     *
     * @param string $value Raw input value.
     * @return string
     */
    public function sanitize_color( $value ) {
        $value = trim( $value );

        if ( empty( $value ) ) {
            return '';
        }

        if ( preg_match( '/^#([A-Fa-f0-9]{3}){1,2}$/', $value ) ) {
            return $value;
        }

        return '';
    }

    /**
     * Retrieve default values for settings.
     *
     * @param string $option Option name.
     * @return string
     */
    public static function get_default( $option ) {
        $defaults = array(
            'l4p_brand_title'         => __( 'Local 4 Picnic Manager', 'local4-picnic' ),
            'l4p_brand_tagline'       => __( 'Coordinate volunteers, funding, and community updates from one place.', 'local4-picnic' ),
            'l4p_brand_logo_id'       => 0,
            'l4p_brand_primary_color' => '#0b4aa2',
            'l4p_brand_accent_color'  => '#ff784f',
            'l4p_brand_surface_color' => '#f7f9fc',
            'l4p_brand_sidebar_color' => '#0b4aa2',
            'l4p_brand_hero_title'    => __( 'Welcome back', 'local4-picnic' ),
            'l4p_brand_hero_subtitle' => __( 'Stay on top of assignments, funding, and crew updates in one streamlined hub.', 'local4-picnic' ),
        );

        return isset( $defaults[ $option ] ) ? $defaults[ $option ] : '';
    }

    /**
     * Return all branding settings merged with defaults.
     *
     * @return array
     */
    public static function get_branding() {
        $keys = array(
            'title'         => 'l4p_brand_title',
            'tagline'       => 'l4p_brand_tagline',
            'logo_id'       => 'l4p_brand_logo_id',
            'primary_color' => 'l4p_brand_primary_color',
            'accent_color'  => 'l4p_brand_accent_color',
            'surface_color' => 'l4p_brand_surface_color',
            'sidebar_color' => 'l4p_brand_sidebar_color',
            'hero_title'    => 'l4p_brand_hero_title',
            'hero_subtitle' => 'l4p_brand_hero_subtitle',
        );

        $branding = array();

        foreach ( $keys as $key => $option ) {
            $value = get_option( $option, self::get_default( $option ) );
            if ( in_array( $key, array( 'title', 'tagline', 'hero_title', 'hero_subtitle' ), true ) ) {
                $branding[ $key ] = $value;
            } else {
                $branding[ $key ] = $value ? $value : self::get_default( $option );
            }
        }

        return $branding;
    }

    /**
     * Retrieve branding data for the JavaScript application.
     *
     * @return array
     */
    public static function get_frontend_settings() {
        $branding = self::get_branding();
        $logo_url = $branding['logo_id'] ? wp_get_attachment_image_url( $branding['logo_id'], 'full' ) : '';

        return array(
            'title'        => $branding['title'],
            'tagline'      => $branding['tagline'],
            'logoUrl'      => $logo_url,
            'primaryColor' => $branding['primary_color'],
            'accentColor'  => $branding['accent_color'],
            'surfaceColor' => $branding['surface_color'],
            'sidebarColor' => $branding['sidebar_color'],
            'heroTitle'    => $branding['hero_title'],
            'heroSubtitle' => $branding['hero_subtitle'],
        );
    }
}

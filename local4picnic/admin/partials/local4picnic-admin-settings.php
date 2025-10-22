<?php
/**
 * Settings page view.
 *
 * @var array $options Current options.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div class="wrap local4picnic-settings">
    <h1><?php esc_html_e( 'Local 4 Picnic Settings', 'local4picnic' ); ?></h1>
    <p class="description"><?php esc_html_e( 'Configure organization details, funding preferences, and notification defaults for the dashboard shortcode.', 'local4picnic' ); ?></p>

    <form action="options.php" method="post" class="local4picnic-settings__form">
        <?php
        settings_fields( 'local4picnic_options_group' );
        do_settings_sections( Local4Picnic_Settings::OPTION_NAME );
        submit_button();
        ?>
    </form>

    <section class="local4picnic-settings__roles">
        <h2><?php esc_html_e( 'Role overview', 'local4picnic' ); ?></h2>
        <p><?php esc_html_e( 'Volunteers can view dashboard data while coordinators can create and manage tasks, funding, crew, and feed content. Administrators inherit all capabilities automatically.', 'local4picnic' ); ?></p>
    </section>
</div>

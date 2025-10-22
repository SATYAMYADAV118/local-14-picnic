<?php
/**
 * Settings page markup for Local4Picnic.
 *
 * @var array $options Current plugin options.
 * @var array $roles   Plugin role map.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}
?>
<div class="wrap local4picnic-settings">
    <h1><?php esc_html_e( 'Local 4 Picnic Settings', 'local4picnic' ); ?></h1>
    <form method="post" action="options.php">
        <?php
        settings_fields( 'local4picnic_options_group' );
        do_settings_sections( Local4Picnic_Settings::OPTION_NAME );
        submit_button();
        ?>
    </form>

    <h2><?php esc_html_e( 'Role Capabilities', 'local4picnic' ); ?></h2>
    <p><?php esc_html_e( 'Review the capabilities assigned to each Local 4 Picnic role.', 'local4picnic' ); ?></p>
    <table class="widefat striped">
        <thead>
            <tr>
                <th><?php esc_html_e( 'Role', 'local4picnic' ); ?></th>
                <th><?php esc_html_e( 'Capabilities', 'local4picnic' ); ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ( $roles as $role_key => $role_data ) : ?>
                <tr>
                    <td><strong><?php echo esc_html( $role_data['name'] ); ?></strong><br /><code><?php echo esc_html( $role_key ); ?></code></td>
                    <td>
                        <ul>
                            <?php foreach ( $role_data['capabilities'] as $capability => $granted ) : ?>
                                <li>
                                    <?php echo esc_html( $capability ); ?>
                                    <?php if ( $granted ) : ?>
                                        <span class="local4picnic-cap granted"><?php esc_html_e( 'granted', 'local4picnic' ); ?></span>
                                    <?php else : ?>
                                        <span class="local4picnic-cap denied"><?php esc_html_e( 'denied', 'local4picnic' ); ?></span>
                                    <?php endif; ?>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

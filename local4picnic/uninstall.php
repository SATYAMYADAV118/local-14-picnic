<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

$options = get_option( 'local4picnic_options', array() );

if ( empty( $options['uninstall_purge'] ) ) {
    return;
}

require_once plugin_dir_path( __FILE__ ) . 'includes/class-local4picnic-roles.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-local4picnic-data.php';
require_once plugin_dir_path( __FILE__ ) . 'includes/class-local4picnic-install.php';

Local4Picnic_Roles::remove_caps();
Local4Picnic_Roles::remove_roles();
Local4Picnic_Data::delete_all_data();

delete_option( 'local4picnic_options' );
delete_option( Local4Picnic_Install::OPTION_DB_KEY );

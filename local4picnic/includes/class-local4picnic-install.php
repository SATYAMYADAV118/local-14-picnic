<?php
/**
 * Handle database installation and upgrades for Local4Picnic.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Install {

    /**
     * Option key used to track the installed database version.
     */
    const VERSION_OPTION = 'local4picnic_db_version';

    /**
     * Current database schema version.
     */
    const DB_VERSION = '1.2.0';

    /**
     * Run on plugin activation.
     */
    public static function activate() {
        self::create_tables();
        update_option( self::VERSION_OPTION, self::DB_VERSION );
    }

    /**
     * Check for schema updates on load.
     */
    public static function maybe_upgrade() {
        $installed = get_option( self::VERSION_OPTION );

        if ( version_compare( $installed, self::DB_VERSION, '<' ) ) {
            self::create_tables();
            update_option( self::VERSION_OPTION, self::DB_VERSION );
        }
    }

    /**
     * Create the custom tables required by the plugin.
     */
    protected static function create_tables() {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $schemas = Local4Picnic_Data::get_table_schemas();

        foreach ( $schemas as $schema ) {
            dbDelta( $schema );
        }
    }

    /**
     * Drop all plugin tables.
     */
    public static function drop_tables() {
        global $wpdb;

        $tables = Local4Picnic_Data::get_table_names();

        foreach ( $tables as $table ) {
            $wpdb->query( "DROP TABLE IF EXISTS {$table}" ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
        }

        delete_option( self::VERSION_OPTION );
    }
}

<?php
/**
 * Install and upgrade routines for Local4Picnic.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Install {

    const DB_VERSION     = '1.0.0';
    const OPTION_DB_KEY  = 'local4picnic_db_version';

    /**
     * Run install/upgrade logic.
     */
    public static function install() {
        self::create_tables();
        update_option( self::OPTION_DB_KEY, self::DB_VERSION );
    }

    /**
     * Maybe run upgrade when plugin loads.
     */
    public static function maybe_upgrade() {
        $installed = get_option( self::OPTION_DB_KEY );

        if ( version_compare( (string) $installed, self::DB_VERSION, '<' ) ) {
            self::install();
        }
    }

    /**
     * Create custom tables.
     */
    protected static function create_tables() {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $schemas = Local4Picnic_Data::get_table_schemas();

        foreach ( $schemas as $sql ) {
            dbDelta( $sql );
        }
    }
}

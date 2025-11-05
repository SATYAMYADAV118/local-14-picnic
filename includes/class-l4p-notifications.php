<?php
/**
 * Notifications service.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class L4P_Notifications {
    /**
     * Database table name helper.
     */
    public static function table_name() {
        global $wpdb;
        return $wpdb->prefix . 'l4p_notifications';
    }

    /**
     * Install notification table.
     */
    public static function activate() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $table           = self::table_name();

        $sql = "CREATE TABLE $table (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL DEFAULT 0,
            type varchar(50) NOT NULL,
            message text NOT NULL,
            related_type varchar(50) DEFAULT '' NOT NULL,
            related_id bigint(20) unsigned DEFAULT 0,
            is_read tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY related (related_type, related_id)
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta( $sql );
    }

    /**
     * Insert a notification.
     */
    public static function add_notification( $type, $message, $user_id = 0, $related_type = '', $related_id = 0 ) {
        global $wpdb;

        $wpdb->insert(
            self::table_name(),
            array(
                'user_id'      => absint( $user_id ),
                'type'         => sanitize_key( $type ),
                'message'      => wp_kses_post( $message ),
                'related_type' => sanitize_key( $related_type ),
                'related_id'   => absint( $related_id ),
                'is_read'      => 0,
                'created_at'   => current_time( 'mysql' ),
            ),
            array( '%d', '%s', '%s', '%s', '%d', '%d', '%s' )
        );
    }

    /**
     * Fetch notifications for a user.
     */
    public static function get_notifications( $user_id = 0, $limit = 20, $types = array(), $since = '' ) {
        global $wpdb;

        $table  = self::table_name();
        $user_id = absint( $user_id );
        $limit   = absint( $limit );

        $where  = array();
        $params = array();

        if ( $user_id ) {
            $where[]  = 'user_id = %d';
            $params[] = $user_id;
        }

        if ( ! empty( $types ) ) {
            $placeholders = implode( ',', array_fill( 0, count( $types ), '%s' ) );
            $where[]      = "type IN ($placeholders)";
            $params       = array_merge( $params, array_map( 'sanitize_key', $types ) );
        }

        if ( $since ) {
            $timestamp = strtotime( $since );
            if ( $timestamp ) {
                $since_time = gmdate( 'Y-m-d H:i:s', $timestamp );
                $where[]    = 'created_at >= %s';
                $params[]   = $since_time;
            }
        }

        $where_sql = $where ? 'WHERE ' . implode( ' AND ', $where ) : '';

        $params[] = $limit;

        $query = $wpdb->prepare(
            "SELECT * FROM $table $where_sql ORDER BY created_at DESC LIMIT %d",
            $params
        );

        return $wpdb->get_results( $query, ARRAY_A );
    }

    /**
     * Mark notifications as read.
     */
    public static function mark_as_read( $ids, $user_id = 0 ) {
        global $wpdb;

        if ( empty( $ids ) ) {
            return false;
        }

        $ids = array_map( 'absint', (array) $ids );
        $ids = array_filter( $ids );

        if ( empty( $ids ) ) {
            return false;
        }

        $table = self::table_name();

        $placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
        $sql          = "UPDATE $table SET is_read = 1 WHERE id IN ($placeholders)";

        $prepared = $wpdb->prepare( $sql, $ids );

        if ( $user_id ) {
            $prepared .= $wpdb->prepare( ' AND user_id = %d', absint( $user_id ) );
        }

        return (bool) $wpdb->query( $prepared );
    }
}

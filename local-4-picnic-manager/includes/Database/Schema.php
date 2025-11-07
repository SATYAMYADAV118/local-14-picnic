<?php
namespace Local4Picnic\Database;

class Schema {
    public static function migrate(): void {
        global $wpdb;
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset_collate = $wpdb->get_charset_collate();

        $tables = [];

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_tasks (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            title VARCHAR(255) NOT NULL,
            description LONGTEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'todo',
            priority VARCHAR(20) NOT NULL DEFAULT 'medium',
            due_date DATETIME NULL,
            url VARCHAR(255) NULL,
            assignee_id BIGINT UNSIGNED NULL,
            created_by BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY status (status),
            KEY due_date (due_date),
            KEY assignee_id (assignee_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_funding_tx (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            type VARCHAR(10) NOT NULL,
            amount DECIMAL(12,2) NOT NULL DEFAULT 0,
            category VARCHAR(100) NOT NULL,
            note TEXT NULL,
            tx_date DATE NOT NULL,
            created_by BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY tx_date (tx_date)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_posts (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            author_id BIGINT UNSIGNED NOT NULL,
            body LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_comments (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            post_id BIGINT UNSIGNED NOT NULL,
            author_id BIGINT UNSIGNED NOT NULL,
            body LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY post_id (post_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_notifications (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT UNSIGNED NULL,
            title VARCHAR(255) NOT NULL,
            body TEXT NOT NULL,
            type VARCHAR(20) NOT NULL DEFAULT 'info',
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user_id (user_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_crew (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            wp_user_id BIGINT UNSIGNED NULL,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(100) NULL,
            role VARCHAR(20) NOT NULL,
            skills LONGTEXT NULL,
            avatar_url VARCHAR(255) NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id)
        ) $charset_collate;";

        foreach ( $tables as $sql ) {
            dbDelta( $sql );
        }
    }
}

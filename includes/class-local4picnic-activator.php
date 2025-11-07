<?php
/**
 * Activation/deactivation handler.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Local4Picnic_Activator
 */
class Local4Picnic_Activator {

    /**
     * Roles to register with capabilities.
     *
     * @var array<string,array<string,bool>>
     */
    protected $roles = array(
        'l4p_coordinator' => array(
            'read'                     => true,
            'upload_files'             => true,
            'l4p_manage_tasks'         => true,
            'l4p_manage_funding'       => true,
            'l4p_manage_notifications' => true,
            'l4p_manage_community'     => true,
            'l4p_manage_settings'      => true,
            'l4p_manage_crew'          => true,
        ),
        'l4p_volunteer'   => array(
            'read'                     => true,
            'upload_files'             => true,
            'l4p_read_tasks'           => true,
            'l4p_write_tasks'          => true,
            'l4p_read_funding'         => true,
            'l4p_manage_notifications' => true,
            'l4p_read_community'       => true,
            'l4p_write_community'      => true,
        ),
    );

    /**
     * Run activation logic.
     */
    public function activate() {
        $this->register_roles();
        $this->create_tables();
    }

    /**
     * Ensure roles exist without touching tables.
     */
    public function ensure_roles() {
        $this->register_roles();
    }

    /**
     * Deactivation cleanup.
     */
    public function deactivate() {
        // Keep data; only remove transient capabilities if necessary.
    }

    /**
     * Register plugin roles.
     */
    protected function register_roles() {
        foreach ( $this->roles as $role => $caps ) {
            if ( get_role( $role ) ) {
                continue;
            }

            add_role( $role, ucwords( str_replace( '_', ' ', $role ) ), $caps );
        }

        $coordinator = get_role( 'administrator' );
        if ( $coordinator ) {
            foreach ( $this->roles['l4p_coordinator'] as $cap => $grant ) {
                if ( $grant ) {
                    $coordinator->add_cap( $cap );
                }
            }
        }
    }

    /**
     * Create custom tables.
     */
    protected function create_tables() {
        global $wpdb;

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $charset_collate = $wpdb->get_charset_collate();

        $tables = array();

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_tasks (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            title VARCHAR(190) NOT NULL,
            description LONGTEXT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'todo',
            priority VARCHAR(20) NULL,
            due_date DATETIME NULL,
            url VARCHAR(255) NULL,
            assignee_id BIGINT UNSIGNED NULL,
            created_by BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY status (status),
            KEY assignee (assignee_id),
            KEY due_date (due_date)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_funding_tx (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            type VARCHAR(20) NOT NULL,
            amount DECIMAL(12,2) NOT NULL,
            category VARCHAR(120) NULL,
            note TEXT NULL,
            tx_date DATE NOT NULL,
            created_by BIGINT UNSIGNED NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY type (type),
            KEY tx_date (tx_date)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_posts (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            author_id BIGINT UNSIGNED NOT NULL,
            body LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY author (author_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_comments (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            post_id BIGINT UNSIGNED NOT NULL,
            author_id BIGINT UNSIGNED NOT NULL,
            body LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY post (post_id),
            KEY author (author_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_task_comments (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            task_id BIGINT UNSIGNED NOT NULL,
            parent_id BIGINT UNSIGNED NULL,
            author_id BIGINT UNSIGNED NOT NULL,
            body LONGTEXT NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY task (task_id),
            KEY parent (parent_id),
            KEY author (author_id)
        ) $charset_collate;";

        $tables[] = "CREATE TABLE {$wpdb->prefix}l4p_notifications (
            id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
            type VARCHAR(60) NOT NULL,
            entity_type VARCHAR(60) NULL,
            entity_id BIGINT UNSIGNED NULL,
            message TEXT NOT NULL,
            user_id BIGINT UNSIGNED NULL,
            is_read TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY  (id),
            KEY user (user_id),
            KEY created_at (created_at)
        ) $charset_collate;";

        foreach ( $tables as $sql ) {
            dbDelta( $sql );
        }
    }
}

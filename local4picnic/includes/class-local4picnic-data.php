<?php
/**
 * Data helpers for Local4Picnic custom tables.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Data {

    /**
     * Return fully qualified table name for a suffix.
     *
     * @param string $suffix Table suffix.
     * @return string
     */
    public static function table_name( $suffix ) {
        global $wpdb;

        return $wpdb->prefix . 'l4p_' . $suffix;
    }

    /**
     * Retrieve CREATE TABLE statements for plugin tables.
     *
     * @return array
     */
    public static function get_table_schemas() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();
        $tables          = array();

        $tables['tasks'] = "CREATE TABLE " . self::table_name( 'tasks' ) . " (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            title varchar(255) NOT NULL,
            description longtext,
            status varchar(20) NOT NULL DEFAULT 'not_started',
            assigned_to bigint(20) unsigned DEFAULT 0,
            created_by bigint(20) unsigned NOT NULL,
            due_date datetime DEFAULT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY status (status),
            KEY assigned_to (assigned_to)
        ) {$charset_collate};";

        $tables['funding'] = "CREATE TABLE " . self::table_name( 'funding' ) . " (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            category varchar(150) NOT NULL,
            amount decimal(15,2) NOT NULL DEFAULT 0.00,
            direction varchar(20) NOT NULL DEFAULT 'income',
            source varchar(255) DEFAULT '',
            notes longtext,
            recorded_by bigint(20) unsigned NOT NULL,
            recorded_at datetime NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY direction (direction)
        ) {$charset_collate};";

        $tables['crew'] = "CREATE TABLE " . self::table_name( 'crew' ) . " (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            name varchar(190) NOT NULL,
            email varchar(190) DEFAULT '',
            phone varchar(60) DEFAULT '',
            role varchar(60) DEFAULT 'volunteer',
            notes longtext,
            created_by bigint(20) unsigned NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY role (role)
        ) {$charset_collate};";

        $tables['feed'] = "CREATE TABLE " . self::table_name( 'feed' ) . " (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            parent_id bigint(20) unsigned NOT NULL DEFAULT 0,
            content longtext NOT NULL,
            created_at datetime NOT NULL,
            updated_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY parent_id (parent_id)
        ) {$charset_collate};";

        $tables['notifications'] = "CREATE TABLE " . self::table_name( 'notifications' ) . " (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned DEFAULT 0,
            message text NOT NULL,
            type varchar(40) NOT NULL DEFAULT 'info',
            is_read tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY is_read (is_read)
        ) {$charset_collate};";

        return $tables;
    }

    /**
     * Insert a task.
     *
     * @param array $data Task data.
     * @return array|WP_Error
     */
    public static function insert_task( $data ) {
        global $wpdb;

        $table = self::table_name( 'tasks' );
        $now   = current_time( 'mysql', true );

        $defaults = array(
            'title'       => '',
            'description' => '',
            'status'      => 'not_started',
            'assigned_to' => 0,
            'created_by'  => get_current_user_id(),
            'due_date'    => null,
        );

        $data = wp_parse_args( $data, $defaults );

        $inserted = $wpdb->insert(
            $table,
            array(
                'title'       => sanitize_text_field( $data['title'] ),
                'description' => wp_kses_post( $data['description'] ),
                'status'      => sanitize_key( $data['status'] ),
                'assigned_to' => (int) $data['assigned_to'],
                'created_by'  => (int) $data['created_by'],
                'due_date'    => $data['due_date'] ? gmdate( 'Y-m-d H:i:s', strtotime( $data['due_date'] ) ) : null,
                'created_at'  => $now,
                'updated_at'  => $now,
            ),
            array( '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'db_insert_error', __( 'Unable to create task.', 'local4picnic' ) );
        }

        return self::get_task( $wpdb->insert_id );
    }

    /**
     * Update a task.
     *
     * @param int   $task_id Task ID.
     * @param array $data    Data to update.
     * @return array|WP_Error
     */
    public static function update_task( $task_id, $data ) {
        global $wpdb;

        $table = self::table_name( 'tasks' );
        $task  = self::get_task( $task_id );

        if ( ! $task ) {
            return new WP_Error( 'not_found', __( 'Task not found.', 'local4picnic' ) );
        }

        $fields = array();
        $format = array();

        if ( isset( $data['title'] ) ) {
            $fields['title'] = sanitize_text_field( $data['title'] );
            $format[]        = '%s';
        }

        if ( isset( $data['description'] ) ) {
            $fields['description'] = wp_kses_post( $data['description'] );
            $format[]              = '%s';
        }

        if ( isset( $data['status'] ) ) {
            $fields['status'] = sanitize_key( $data['status'] );
            $format[]         = '%s';
        }

        if ( isset( $data['assigned_to'] ) ) {
            $fields['assigned_to'] = (int) $data['assigned_to'];
            $format[]              = '%d';
        }

        if ( array_key_exists( 'due_date', $data ) ) {
            $fields['due_date'] = $data['due_date'] ? gmdate( 'Y-m-d H:i:s', strtotime( $data['due_date'] ) ) : null;
            $format[]           = '%s';
        }

        if ( empty( $fields ) ) {
            return $task;
        }

        $fields['updated_at'] = current_time( 'mysql', true );
        $format[]             = '%s';

        $updated = $wpdb->update( $table, $fields, array( 'id' => (int) $task_id ), $format, array( '%d' ) );

        if ( false === $updated ) {
            return new WP_Error( 'db_update_error', __( 'Unable to update task.', 'local4picnic' ) );
        }

        return self::get_task( $task_id );
    }

    /**
     * Delete a task.
     *
     * @param int $task_id Task ID.
     * @return bool
     */
    public static function delete_task( $task_id ) {
        global $wpdb;

        $table = self::table_name( 'tasks' );

        return (bool) $wpdb->delete( $table, array( 'id' => (int) $task_id ), array( '%d' ) );
    }

    /**
     * Get a single task.
     *
     * @param int $task_id Task ID.
     * @return array|null
     */
    public static function get_task( $task_id ) {
        global $wpdb;

        $table = self::table_name( 'tasks' );

        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", (int) $task_id ), ARRAY_A );

        if ( ! $row ) {
            return null;
        }

        return self::prepare_task_row( $row );
    }

    /**
     * List tasks with optional filters.
     *
     * @param array $args Filter arguments.
     * @return array
     */
    public static function get_tasks( $args = array() ) {
        global $wpdb;

        $table    = self::table_name( 'tasks' );
        $defaults = array(
            'status'      => '',
            'assigned_to' => null,
            'search'      => '',
        );

        $args = wp_parse_args( $args, $defaults );

        $where  = array();
        $params = array();

        if ( $args['status'] ) {
            $where[]  = 'status = %s';
            $params[] = sanitize_key( $args['status'] );
        }

        if ( null !== $args['assigned_to'] ) {
            $where[]  = 'assigned_to = %d';
            $params[] = (int) $args['assigned_to'];
        }

        if ( $args['search'] ) {
            $like     = '%' . $wpdb->esc_like( $args['search'] ) . '%';
            $where[]  = '(title LIKE %s OR description LIKE %s)';
            $params[] = $like;
            $params[] = $like;
        }

        $sql = "SELECT * FROM {$table}";

        if ( $where ) {
            $sql .= ' WHERE ' . implode( ' AND ', $where );
        }

        $sql .= ' ORDER BY updated_at DESC';

        if ( $params ) {
            $prepared = $wpdb->prepare( $sql, $params );
        } else {
            $prepared = $sql;
        }

        $rows = $wpdb->get_results( $prepared, ARRAY_A );

        return array_map( array( __CLASS__, 'prepare_task_row' ), $rows );
    }

    /**
     * Format task row.
     *
     * @param array $row Row.
     * @return array
     */
    protected static function prepare_task_row( $row ) {
        return array(
            'id'          => (int) $row['id'],
            'title'       => $row['title'],
            'description' => $row['description'],
            'status'      => $row['status'],
            'assigned_to' => (int) $row['assigned_to'],
            'created_by'  => (int) $row['created_by'],
            'due_date'    => $row['due_date'],
            'created_at'  => $row['created_at'],
            'updated_at'  => $row['updated_at'],
        );
    }

    /**
     * Insert a funding record.
     *
     * @param array $data Data.
     * @return array|WP_Error
     */
    public static function insert_funding( $data ) {
        global $wpdb;

        $table = self::table_name( 'funding' );
        $now   = current_time( 'mysql', true );

        $defaults = array(
            'category'    => '',
            'amount'      => 0,
            'direction'   => 'income',
            'source'      => '',
            'notes'       => '',
            'recorded_by' => get_current_user_id(),
            'recorded_at' => $now,
        );

        $data = wp_parse_args( $data, $defaults );

        $inserted = $wpdb->insert(
            $table,
            array(
                'category'    => sanitize_text_field( $data['category'] ),
                'amount'      => floatval( $data['amount'] ),
                'direction'   => in_array( $data['direction'], array( 'income', 'expense' ), true ) ? $data['direction'] : 'income',
                'source'      => sanitize_text_field( $data['source'] ),
                'notes'       => wp_kses_post( $data['notes'] ),
                'recorded_by' => (int) $data['recorded_by'],
                'recorded_at' => gmdate( 'Y-m-d H:i:s', strtotime( $data['recorded_at'] ) ),
                'created_at'  => $now,
                'updated_at'  => $now,
            ),
            array( '%s', '%f', '%s', '%s', '%s', '%d', '%s', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'db_insert_error', __( 'Unable to add funding entry.', 'local4picnic' ) );
        }

        return self::get_funding_entry( $wpdb->insert_id );
    }

    /**
     * Update funding record.
     *
     * @param int   $entry_id Entry ID.
     * @param array $data     Data.
     * @return array|WP_Error
     */
    public static function update_funding( $entry_id, $data ) {
        global $wpdb;

        $table = self::table_name( 'funding' );
        $row   = self::get_funding_entry( $entry_id );

        if ( ! $row ) {
            return new WP_Error( 'not_found', __( 'Funding entry not found.', 'local4picnic' ) );
        }

        $fields = array();
        $format = array();

        if ( isset( $data['category'] ) ) {
            $fields['category'] = sanitize_text_field( $data['category'] );
            $format[]           = '%s';
        }

        if ( isset( $data['amount'] ) ) {
            $fields['amount'] = floatval( $data['amount'] );
            $format[]         = '%f';
        }

        if ( isset( $data['direction'] ) ) {
            $fields['direction'] = in_array( $data['direction'], array( 'income', 'expense' ), true ) ? $data['direction'] : 'income';
            $format[]            = '%s';
        }

        if ( isset( $data['source'] ) ) {
            $fields['source'] = sanitize_text_field( $data['source'] );
            $format[]         = '%s';
        }

        if ( isset( $data['notes'] ) ) {
            $fields['notes'] = wp_kses_post( $data['notes'] );
            $format[]        = '%s';
        }

        if ( isset( $data['recorded_at'] ) ) {
            $fields['recorded_at'] = gmdate( 'Y-m-d H:i:s', strtotime( $data['recorded_at'] ) );
            $format[]              = '%s';
        }

        if ( empty( $fields ) ) {
            return $row;
        }

        $fields['updated_at'] = current_time( 'mysql', true );
        $format[]             = '%s';

        $updated = $wpdb->update( $table, $fields, array( 'id' => (int) $entry_id ), $format, array( '%d' ) );

        if ( false === $updated ) {
            return new WP_Error( 'db_update_error', __( 'Unable to update funding entry.', 'local4picnic' ) );
        }

        return self::get_funding_entry( $entry_id );
    }

    /**
     * Delete funding entry.
     *
     * @param int $entry_id Entry ID.
     * @return bool
     */
    public static function delete_funding( $entry_id ) {
        global $wpdb;

        $table = self::table_name( 'funding' );

        return (bool) $wpdb->delete( $table, array( 'id' => (int) $entry_id ), array( '%d' ) );
    }

    /**
     * Get funding entry.
     *
     * @param int $entry_id Entry ID.
     * @return array|null
     */
    public static function get_funding_entry( $entry_id ) {
        global $wpdb;

        $table = self::table_name( 'funding' );

        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", (int) $entry_id ), ARRAY_A );

        if ( ! $row ) {
            return null;
        }

        return self::prepare_funding_row( $row );
    }

    /**
     * List funding entries.
     *
     * @param array $args Filter arguments.
     * @return array
     */
    public static function get_funding_entries( $args = array() ) {
        global $wpdb;

        $table    = self::table_name( 'funding' );
        $defaults = array(
            'direction' => '',
        );

        $args = wp_parse_args( $args, $defaults );

        $where  = array();
        $params = array();

        if ( $args['direction'] ) {
            $where[]  = 'direction = %s';
            $params[] = $args['direction'];
        }

        $sql = "SELECT * FROM {$table}";

        if ( $where ) {
            $sql .= ' WHERE ' . implode( ' AND ', $where );
        }

        $sql .= ' ORDER BY recorded_at DESC';

        $prepared = $params ? $wpdb->prepare( $sql, $params ) : $sql;

        $rows = $wpdb->get_results( $prepared, ARRAY_A );

        return array_map( array( __CLASS__, 'prepare_funding_row' ), $rows );
    }

    /**
     * Prepare funding row.
     *
     * @param array $row Row.
     * @return array
     */
    protected static function prepare_funding_row( $row ) {
        return array(
            'id'          => (int) $row['id'],
            'category'    => $row['category'],
            'amount'      => (float) $row['amount'],
            'direction'   => $row['direction'],
            'source'      => $row['source'],
            'notes'       => $row['notes'],
            'recorded_by' => (int) $row['recorded_by'],
            'recorded_at' => $row['recorded_at'],
            'created_at'  => $row['created_at'],
            'updated_at'  => $row['updated_at'],
        );
    }

    /**
     * Insert crew member.
     *
     * @param array $data Data.
     * @return array|WP_Error
     */
    public static function insert_crew( $data ) {
        global $wpdb;

        $table = self::table_name( 'crew' );
        $now   = current_time( 'mysql', true );

        $defaults = array(
            'name'       => '',
            'email'      => '',
            'phone'      => '',
            'role'       => 'volunteer',
            'notes'      => '',
            'created_by' => get_current_user_id(),
        );

        $data = wp_parse_args( $data, $defaults );

        $inserted = $wpdb->insert(
            $table,
            array(
                'name'       => sanitize_text_field( $data['name'] ),
                'email'      => sanitize_email( $data['email'] ),
                'phone'      => sanitize_text_field( $data['phone'] ),
                'role'       => sanitize_key( $data['role'] ),
                'notes'      => wp_kses_post( $data['notes'] ),
                'created_by' => (int) $data['created_by'],
                'created_at' => $now,
                'updated_at' => $now,
            ),
            array( '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'db_insert_error', __( 'Unable to add crew member.', 'local4picnic' ) );
        }

        return self::get_crew_member( $wpdb->insert_id );
    }

    /**
     * Update crew member.
     *
     * @param int   $member_id Member ID.
     * @param array $data      Data.
     * @return array|WP_Error
     */
    public static function update_crew( $member_id, $data ) {
        global $wpdb;

        $table = self::table_name( 'crew' );
        $row   = self::get_crew_member( $member_id );

        if ( ! $row ) {
            return new WP_Error( 'not_found', __( 'Crew member not found.', 'local4picnic' ) );
        }

        $fields = array();
        $format = array();

        if ( isset( $data['name'] ) ) {
            $fields['name'] = sanitize_text_field( $data['name'] );
            $format[]       = '%s';
        }

        if ( isset( $data['email'] ) ) {
            $fields['email'] = sanitize_email( $data['email'] );
            $format[]        = '%s';
        }

        if ( isset( $data['phone'] ) ) {
            $fields['phone'] = sanitize_text_field( $data['phone'] );
            $format[]        = '%s';
        }

        if ( isset( $data['role'] ) ) {
            $fields['role'] = sanitize_key( $data['role'] );
            $format[]       = '%s';
        }

        if ( isset( $data['notes'] ) ) {
            $fields['notes'] = wp_kses_post( $data['notes'] );
            $format[]        = '%s';
        }

        if ( empty( $fields ) ) {
            return $row;
        }

        $fields['updated_at'] = current_time( 'mysql', true );
        $format[]             = '%s';

        $updated = $wpdb->update( $table, $fields, array( 'id' => (int) $member_id ), $format, array( '%d' ) );

        if ( false === $updated ) {
            return new WP_Error( 'db_update_error', __( 'Unable to update crew member.', 'local4picnic' ) );
        }

        return self::get_crew_member( $member_id );
    }

    /**
     * Delete crew member.
     *
     * @param int $member_id Member ID.
     * @return bool
     */
    public static function delete_crew( $member_id ) {
        global $wpdb;

        $table = self::table_name( 'crew' );

        return (bool) $wpdb->delete( $table, array( 'id' => (int) $member_id ), array( '%d' ) );
    }

    /**
     * Get crew member.
     *
     * @param int $member_id Member ID.
     * @return array|null
     */
    public static function get_crew_member( $member_id ) {
        global $wpdb;

        $table = self::table_name( 'crew' );

        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", (int) $member_id ), ARRAY_A );

        if ( ! $row ) {
            return null;
        }

        return self::prepare_crew_row( $row );
    }

    /**
     * List crew members.
     *
     * @return array
     */
    public static function get_crew() {
        global $wpdb;

        $table = self::table_name( 'crew' );

        $rows = $wpdb->get_results( "SELECT * FROM {$table} ORDER BY name ASC", ARRAY_A );

        return array_map( array( __CLASS__, 'prepare_crew_row' ), $rows );
    }

    /**
     * Prepare crew row.
     *
     * @param array $row Row.
     * @return array
     */
    protected static function prepare_crew_row( $row ) {
        return array(
            'id'         => (int) $row['id'],
            'name'       => $row['name'],
            'email'      => $row['email'],
            'phone'      => $row['phone'],
            'role'       => $row['role'],
            'notes'      => $row['notes'],
            'created_by' => (int) $row['created_by'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        );
    }

    /**
     * Insert feed post.
     *
     * @param array $data Data.
     * @return array|WP_Error
     */
    public static function insert_feed_post( $data ) {
        global $wpdb;

        $table = self::table_name( 'feed' );
        $now   = current_time( 'mysql', true );

        $defaults = array(
            'user_id'   => get_current_user_id(),
            'parent_id' => 0,
            'content'   => '',
        );

        $data = wp_parse_args( $data, $defaults );

        $inserted = $wpdb->insert(
            $table,
            array(
                'user_id'   => (int) $data['user_id'],
                'parent_id' => (int) $data['parent_id'],
                'content'   => wp_kses_post( $data['content'] ),
                'created_at' => $now,
                'updated_at' => $now,
            ),
            array( '%d', '%d', '%s', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'db_insert_error', __( 'Unable to add feed post.', 'local4picnic' ) );
        }

        return self::get_feed_post( $wpdb->insert_id );
    }

    /**
     * Update feed post.
     *
     * @param int   $post_id Post ID.
     * @param array $data    Data.
     * @return array|WP_Error
     */
    public static function update_feed_post( $post_id, $data ) {
        global $wpdb;

        $table = self::table_name( 'feed' );
        $row   = self::get_feed_post( $post_id );

        if ( ! $row ) {
            return new WP_Error( 'not_found', __( 'Feed post not found.', 'local4picnic' ) );
        }

        $fields = array();
        $format = array();

        if ( isset( $data['content'] ) ) {
            $fields['content'] = wp_kses_post( $data['content'] );
            $format[]          = '%s';
        }

        if ( isset( $data['parent_id'] ) ) {
            $fields['parent_id'] = (int) $data['parent_id'];
            $format[]            = '%d';
        }

        if ( empty( $fields ) ) {
            return $row;
        }

        $fields['updated_at'] = current_time( 'mysql', true );
        $format[]             = '%s';

        $updated = $wpdb->update( $table, $fields, array( 'id' => (int) $post_id ), $format, array( '%d' ) );

        if ( false === $updated ) {
            return new WP_Error( 'db_update_error', __( 'Unable to update feed post.', 'local4picnic' ) );
        }

        return self::get_feed_post( $post_id );
    }

    /**
     * Delete feed post.
     *
     * @param int $post_id Post ID.
     * @return bool
     */
    public static function delete_feed_post( $post_id ) {
        global $wpdb;

        $table = self::table_name( 'feed' );

        return (bool) $wpdb->delete( $table, array( 'id' => (int) $post_id ), array( '%d' ) );
    }

    /**
     * Get feed post.
     *
     * @param int $post_id Post ID.
     * @return array|null
     */
    public static function get_feed_post( $post_id ) {
        global $wpdb;

        $table = self::table_name( 'feed' );

        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", (int) $post_id ), ARRAY_A );

        if ( ! $row ) {
            return null;
        }

        return self::prepare_feed_row( $row );
    }

    /**
     * Fetch feed posts.
     *
     * @param int $parent_id Parent ID.
     * @return array
     */
    public static function get_feed_posts( $parent_id = 0 ) {
        global $wpdb;

        $table = self::table_name( 'feed' );

        $rows = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$table} WHERE parent_id = %d ORDER BY created_at DESC", (int) $parent_id ), ARRAY_A );

        return array_map( array( __CLASS__, 'prepare_feed_row' ), $rows );
    }

    /**
     * Prepare feed row.
     *
     * @param array $row Row.
     * @return array
     */
    protected static function prepare_feed_row( $row ) {
        return array(
            'id'         => (int) $row['id'],
            'user_id'    => (int) $row['user_id'],
            'parent_id'  => (int) $row['parent_id'],
            'content'    => $row['content'],
            'created_at' => $row['created_at'],
            'updated_at' => $row['updated_at'],
        );
    }

    /**
     * Insert notification.
     *
     * @param array $data Data.
     * @return array|WP_Error
     */
    public static function insert_notification( $data ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );
        $now   = current_time( 'mysql', true );

        $defaults = array(
            'user_id'  => 0,
            'message'  => '',
            'type'     => 'info',
            'is_read'  => 0,
        );

        $data = wp_parse_args( $data, $defaults );

        $inserted = $wpdb->insert(
            $table,
            array(
                'user_id'   => (int) $data['user_id'],
                'message'   => wp_strip_all_tags( $data['message'] ),
                'type'      => sanitize_key( $data['type'] ),
                'is_read'   => empty( $data['is_read'] ) ? 0 : 1,
                'created_at'=> $now,
            ),
            array( '%d', '%s', '%s', '%d', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'db_insert_error', __( 'Unable to add notification.', 'local4picnic' ) );
        }

        return self::get_notification( $wpdb->insert_id );
    }

    /**
     * Update notification.
     *
     * @param int   $notification_id Notification ID.
     * @param array $data            Data.
     * @return array|WP_Error
     */
    public static function update_notification( $notification_id, $data ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );
        $row   = self::get_notification( $notification_id );

        if ( ! $row ) {
            return new WP_Error( 'not_found', __( 'Notification not found.', 'local4picnic' ) );
        }

        $fields = array();
        $format = array();

        if ( isset( $data['is_read'] ) ) {
            $fields['is_read'] = empty( $data['is_read'] ) ? 0 : 1;
            $format[]          = '%d';
        }

        if ( empty( $fields ) ) {
            return $row;
        }

        $updated = $wpdb->update( $table, $fields, array( 'id' => (int) $notification_id ), $format, array( '%d' ) );

        if ( false === $updated ) {
            return new WP_Error( 'db_update_error', __( 'Unable to update notification.', 'local4picnic' ) );
        }

        return self::get_notification( $notification_id );
    }

    /**
     * Delete notification.
     *
     * @param int $notification_id Notification ID.
     * @return bool
     */
    public static function delete_notification( $notification_id ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );

        return (bool) $wpdb->delete( $table, array( 'id' => (int) $notification_id ), array( '%d' ) );
    }

    /**
     * Get notification.
     *
     * @param int $notification_id Notification ID.
     * @return array|null
     */
    public static function get_notification( $notification_id ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );

        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", (int) $notification_id ), ARRAY_A );

        if ( ! $row ) {
            return null;
        }

        return self::prepare_notification_row( $row );
    }

    /**
     * List notifications.
     *
     * @param array $args Args.
     * @return array
     */
    public static function get_notifications( $args = array() ) {
        global $wpdb;

        $table    = self::table_name( 'notifications' );
        $defaults = array(
            'user_id' => 0,
            'unread'  => false,
            'limit'   => 20,
        );

        $args = wp_parse_args( $args, $defaults );

        $where  = array();
        $params = array();

        if ( $args['user_id'] ) {
            $where[]  = '(user_id = %d OR user_id = 0)';
            $params[] = (int) $args['user_id'];
        }

        if ( $args['unread'] ) {
            $where[] = 'is_read = 0';
        }

        $sql = "SELECT * FROM {$table}";

        if ( $where ) {
            $sql .= ' WHERE ' . implode( ' AND ', $where );
        }

        $sql .= ' ORDER BY created_at DESC';

        if ( $args['limit'] ) {
            $sql .= $wpdb->prepare( ' LIMIT %d', (int) $args['limit'] );
        }

        $prepared = $params ? $wpdb->prepare( $sql, $params ) : $sql;

        $rows = $wpdb->get_results( $prepared, ARRAY_A );

        return array_map( array( __CLASS__, 'prepare_notification_row' ), $rows );
    }

    /**
     * Prepare notification row.
     *
     * @param array $row Row.
     * @return array
     */
    protected static function prepare_notification_row( $row ) {
        return array(
            'id'        => (int) $row['id'],
            'user_id'   => (int) $row['user_id'],
            'message'   => $row['message'],
            'type'      => $row['type'],
            'is_read'   => (bool) $row['is_read'],
            'created_at'=> $row['created_at'],
        );
    }

    /**
     * Delete all plugin data.
     */
    public static function delete_all_data() {
        global $wpdb;

        foreach ( array_keys( self::get_table_schemas() ) as $table ) {
            $wpdb->query( 'DROP TABLE IF EXISTS ' . self::table_name( $table ) );
        }
    }
}

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
     * Retrieve an array of CREATE TABLE statements.
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
            PRIMARY KEY  (id),
            KEY direction (direction),
            KEY category (category)
        ) {$charset_collate};";

        $tables['notifications'] = "CREATE TABLE " . self::table_name( 'notifications' ) . " (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned DEFAULT 0,
            message text NOT NULL,
            type varchar(50) NOT NULL DEFAULT 'info',
            is_read tinyint(1) NOT NULL DEFAULT 0,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY user_id (user_id),
            KEY is_read (is_read)
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
            PRIMARY KEY  (id),
            KEY role (role)
        ) {$charset_collate};";

        $tables['feed'] = "CREATE TABLE " . self::table_name( 'feed' ) . " (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            user_id bigint(20) unsigned NOT NULL,
            parent_id bigint(20) unsigned NOT NULL DEFAULT 0,
            content longtext NOT NULL,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY parent_id (parent_id)
        ) {$charset_collate};";

        return $tables;
    }

    /**
     * Retrieve the list of table names without schema.
     *
     * @return array
     */
    public static function get_table_names() {
        $tables = array();

        foreach ( array_keys( self::get_table_schemas() ) as $key ) {
            $tables[] = self::table_name( $key );
        }

        return $tables;
    }

    /**
     * Fetch tasks relevant for the current user.
     *
     * @param int  $user_id     Current user ID.
     * @param bool $can_manage  Whether the user can manage all tasks.
     *
     * @return array
     */
    public static function get_tasks_for_user( $user_id, $can_manage = false ) {
        global $wpdb;

        $table  = self::table_name( 'tasks' );
        $users  = $wpdb->users;
        $status = array();

        if ( $can_manage ) {
            $query = "SELECT t.*, u.display_name AS assigned_name
                FROM {$table} t
                LEFT JOIN {$users} u ON t.assigned_to = u.ID
                ORDER BY t.created_at DESC";
        } else {
            $query = $wpdb->prepare(
                "SELECT t.*, u.display_name AS assigned_name
                FROM {$table} t
                LEFT JOIN {$users} u ON t.assigned_to = u.ID
                WHERE t.assigned_to = %d OR t.assigned_to = 0
                ORDER BY t.created_at DESC",
                $user_id
            );
        }

        $results = $wpdb->get_results( $query, ARRAY_A );

        foreach ( $results as &$row ) {
            $row['id']          = (int) $row['id'];
            $row['assigned_to'] = (int) $row['assigned_to'];
            $row['created_by']  = (int) $row['created_by'];
        }

        return $results;
    }

    /**
     * Retrieve a single task.
     *
     * @param int $task_id Task ID.
     *
     * @return array|null
     */
    public static function get_task( $task_id ) {
        global $wpdb;

        $table = self::table_name( 'tasks' );
        $users = $wpdb->users;

        $query = $wpdb->prepare(
            "SELECT t.*, u.display_name AS assigned_name
            FROM {$table} t
            LEFT JOIN {$users} u ON t.assigned_to = u.ID
            WHERE t.id = %d",
            $task_id
        );

        $task = $wpdb->get_row( $query, ARRAY_A );

        if ( $task ) {
            $task['id']          = (int) $task['id'];
            $task['assigned_to'] = (int) $task['assigned_to'];
            $task['created_by']  = (int) $task['created_by'];
        }

        return $task;
    }

    /**
     * Create a task record.
     *
     * @param array $data Task data.
     *
     * @return array|WP_Error
     */
    public static function create_task( $data ) {
        global $wpdb;

        $table = self::table_name( 'tasks' );

        $inserted = $wpdb->insert(
            $table,
            array(
                'title'       => $data['title'],
                'description' => $data['description'],
                'status'      => $data['status'],
                'assigned_to' => $data['assigned_to'],
                'created_by'  => $data['created_by'],
                'due_date'    => $data['due_date'],
                'created_at'  => $data['created_at'],
                'updated_at'  => $data['updated_at'],
            ),
            array( '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'local4picnic_task_error', __( 'Unable to create task.', 'local4picnic' ) );
        }

        return self::get_task( (int) $wpdb->insert_id );
    }

    /**
     * Update a task record.
     *
     * @param int   $task_id Task ID.
     * @param array $data    Task data to update.
     *
     * @return array|WP_Error
     */
    public static function update_task( $task_id, $data ) {
        global $wpdb;

        $table = self::table_name( 'tasks' );

        $fields = array();
        $format = array();

        $allowed = array( 'title', 'description', 'status', 'assigned_to', 'due_date', 'updated_at' );

        foreach ( $allowed as $key ) {
            if ( array_key_exists( $key, $data ) ) {
                $fields[ $key ] = $data[ $key ];
            }
        }

        if ( empty( $fields ) ) {
            return self::get_task( $task_id );
        }

        if ( ! isset( $fields['updated_at'] ) ) {
            $fields['updated_at'] = current_time( 'mysql', true );
        }

        $format_map = array(
            'title'       => '%s',
            'description' => '%s',
            'status'      => '%s',
            'assigned_to' => '%d',
            'due_date'    => '%s',
            'updated_at'  => '%s',
        );

        foreach ( $fields as $key => $value ) {
            $format[] = $format_map[ $key ];
        }

        $updated = $wpdb->update(
            $table,
            $fields,
            array( 'id' => $task_id ),
            $format,
            array( '%d' )
        );

        if ( false === $updated ) {
            return new WP_Error( 'local4picnic_task_error', __( 'Unable to update task.', 'local4picnic' ) );
        }

        return self::get_task( $task_id );
    }

    /**
     * Delete a task.
     *
     * @param int $task_id Task ID.
     */
    public static function delete_task( $task_id ) {
        global $wpdb;

        $table = self::table_name( 'tasks' );
        $wpdb->delete( $table, array( 'id' => $task_id ), array( '%d' ) );
    }

    /**
     * Fetch all funding entries.
     *
     * @return array
     */
    public static function get_funding_entries() {
        global $wpdb;

        $table = self::table_name( 'funding' );

        $results = $wpdb->get_results(
            "SELECT * FROM {$table} ORDER BY recorded_at DESC",
            ARRAY_A
        );

        foreach ( $results as &$row ) {
            $row['id']          = (int) $row['id'];
            $row['recorded_by'] = (int) $row['recorded_by'];
            $row['amount']      = (float) $row['amount'];
        }

        return $results;
    }

    /**
     * Return funding totals grouped by category/direction.
     *
     * @return array
     */
    public static function get_funding_summary() {
        global $wpdb;

        $table = self::table_name( 'funding' );

        $summary = $wpdb->get_results(
            "SELECT category, direction, SUM(amount) as total
            FROM {$table}
            GROUP BY category, direction",
            ARRAY_A
        );

        foreach ( $summary as &$row ) {
            $row['total'] = (float) $row['total'];
        }

        return $summary;
    }

    /**
     * Insert a funding entry.
     *
     * @param array $data Funding data.
     *
     * @return array|WP_Error
     */
    public static function create_funding_entry( $data ) {
        global $wpdb;

        $table = self::table_name( 'funding' );

        $inserted = $wpdb->insert(
            $table,
            array(
                'category'    => $data['category'],
                'amount'      => $data['amount'],
                'direction'   => $data['direction'],
                'source'      => $data['source'],
                'notes'       => $data['notes'],
                'recorded_by' => $data['recorded_by'],
                'recorded_at' => $data['recorded_at'],
                'created_at'  => $data['created_at'],
            ),
            array( '%s', '%f', '%s', '%s', '%s', '%d', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'local4picnic_funding_error', __( 'Unable to save funding entry.', 'local4picnic' ) );
        }

        return self::get_funding_entry( (int) $wpdb->insert_id );
    }

    /**
     * Retrieve a single funding entry.
     *
     * @param int $entry_id Entry ID.
     *
     * @return array|null
     */
    public static function get_funding_entry( $entry_id ) {
        global $wpdb;

        $table = self::table_name( 'funding' );

        $entry = $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $entry_id ),
            ARRAY_A
        );

        if ( $entry ) {
            $entry['id']          = (int) $entry['id'];
            $entry['recorded_by'] = (int) $entry['recorded_by'];
            $entry['amount']      = (float) $entry['amount'];
        }

        return $entry;
    }

    /**
     * Update a funding entry.
     *
     * @param int   $entry_id Entry ID.
     * @param array $data     Data to update.
     *
     * @return array|WP_Error
     */
    public static function update_funding_entry( $entry_id, $data ) {
        global $wpdb;

        $table = self::table_name( 'funding' );

        $fields = array();
        $format = array();

        $map = array(
            'category'    => '%s',
            'amount'      => '%f',
            'direction'   => '%s',
            'source'      => '%s',
            'notes'       => '%s',
            'recorded_at' => '%s',
        );

        foreach ( $map as $key => $value ) {
            if ( array_key_exists( $key, $data ) ) {
                $fields[ $key ] = $data[ $key ];
                $format[]       = $value;
            }
        }

        if ( empty( $fields ) ) {
            return self::get_funding_entry( $entry_id );
        }

        $updated = $wpdb->update(
            $table,
            $fields,
            array( 'id' => $entry_id ),
            $format,
            array( '%d' )
        );

        if ( false === $updated ) {
            return new WP_Error( 'local4picnic_funding_error', __( 'Unable to update funding entry.', 'local4picnic' ) );
        }

        return self::get_funding_entry( $entry_id );
    }

    /**
     * Delete a funding entry.
     *
     * @param int $entry_id Entry ID.
     */
    public static function delete_funding_entry( $entry_id ) {
        global $wpdb;

        $table = self::table_name( 'funding' );
        $wpdb->delete( $table, array( 'id' => $entry_id ), array( '%d' ) );
    }

    /**
     * Fetch crew members.
     *
     * @return array
     */
    public static function get_crew_members() {
        global $wpdb;

        $table = self::table_name( 'crew' );

        $results = $wpdb->get_results(
            "SELECT * FROM {$table} ORDER BY created_at DESC",
            ARRAY_A
        );

        foreach ( $results as &$row ) {
            $row['id']         = (int) $row['id'];
            $row['created_by'] = (int) $row['created_by'];
        }

        return $results;
    }

    /**
     * Create a crew member.
     *
     * @param array $data Crew data.
     *
     * @return array|WP_Error
     */
    public static function create_crew_member( $data ) {
        global $wpdb;

        $table = self::table_name( 'crew' );

        $inserted = $wpdb->insert(
            $table,
            array(
                'name'       => $data['name'],
                'email'      => $data['email'],
                'phone'      => $data['phone'],
                'role'       => $data['role'],
                'notes'      => $data['notes'],
                'created_by' => $data['created_by'],
                'created_at' => $data['created_at'],
            ),
            array( '%s', '%s', '%s', '%s', '%s', '%d', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'local4picnic_crew_error', __( 'Unable to save crew member.', 'local4picnic' ) );
        }

        return self::get_crew_member( (int) $wpdb->insert_id );
    }

    /**
     * Retrieve a crew member.
     *
     * @param int $crew_id Crew ID.
     *
     * @return array|null
     */
    public static function get_crew_member( $crew_id ) {
        global $wpdb;

        $table = self::table_name( 'crew' );

        $member = $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $crew_id ),
            ARRAY_A
        );

        if ( $member ) {
            $member['id']         = (int) $member['id'];
            $member['created_by'] = (int) $member['created_by'];
        }

        return $member;
    }

    /**
     * Update a crew member.
     *
     * @param int   $crew_id Crew ID.
     * @param array $data    Crew data.
     *
     * @return array|WP_Error
     */
    public static function update_crew_member( $crew_id, $data ) {
        global $wpdb;

        $table = self::table_name( 'crew' );

        $fields = array();
        $format = array();

        $map = array(
            'name'  => '%s',
            'email' => '%s',
            'phone' => '%s',
            'role'  => '%s',
            'notes' => '%s',
        );

        foreach ( $map as $key => $value ) {
            if ( array_key_exists( $key, $data ) ) {
                $fields[ $key ] = $data[ $key ];
                $format[]       = $value;
            }
        }

        if ( empty( $fields ) ) {
            return self::get_crew_member( $crew_id );
        }

        $updated = $wpdb->update(
            $table,
            $fields,
            array( 'id' => $crew_id ),
            $format,
            array( '%d' )
        );

        if ( false === $updated ) {
            return new WP_Error( 'local4picnic_crew_error', __( 'Unable to update crew member.', 'local4picnic' ) );
        }

        return self::get_crew_member( $crew_id );
    }

    /**
     * Delete a crew member.
     *
     * @param int $crew_id Crew ID.
     */
    public static function delete_crew_member( $crew_id ) {
        global $wpdb;

        $table = self::table_name( 'crew' );
        $wpdb->delete( $table, array( 'id' => $crew_id ), array( '%d' ) );
    }

    /**
     * Fetch threads for the community feed.
     *
     * @param int $limit Number of threads.
     *
     * @return array
     */
    public static function get_feed_threads( $limit = 20 ) {
        global $wpdb;

        $table = self::table_name( 'feed' );
        $users = $wpdb->users;

        $threads = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT f.*, u.display_name AS author
                FROM {$table} f
                INNER JOIN {$users} u ON f.user_id = u.ID
                WHERE f.parent_id = 0
                ORDER BY f.created_at DESC
                LIMIT %d",
                $limit
            ),
            ARRAY_A
        );

        $ids = wp_list_pluck( $threads, 'id' );

        $replies = array();

        if ( ! empty( $ids ) ) {
            $placeholders = implode( ',', array_fill( 0, count( $ids ), '%d' ) );
            $query        = $wpdb->prepare(
                "SELECT f.*, u.display_name AS author
                FROM {$table} f
                INNER JOIN {$users} u ON f.user_id = u.ID
                WHERE f.parent_id IN ({$placeholders})
                ORDER BY f.created_at ASC",
                $ids
            );

            $replies = $wpdb->get_results( $query, ARRAY_A );
        }

        $grouped = array();

        foreach ( $threads as $thread ) {
            $thread['id']        = (int) $thread['id'];
            $thread['user_id']   = (int) $thread['user_id'];
            $thread['parent_id'] = (int) $thread['parent_id'];
            $grouped[ $thread['id'] ] = $thread;
            $grouped[ $thread['id'] ]['replies'] = array();
        }

        foreach ( $replies as $reply ) {
            $reply['id']        = (int) $reply['id'];
            $reply['user_id']   = (int) $reply['user_id'];
            $reply['parent_id'] = (int) $reply['parent_id'];

            if ( isset( $grouped[ $reply['parent_id'] ] ) ) {
                $grouped[ $reply['parent_id'] ]['replies'][] = $reply;
            }
        }

        return array_values( $grouped );
    }

    /**
     * Insert a feed post or reply.
     *
     * @param array $data Feed data.
     *
     * @return array|WP_Error
     */
    public static function create_feed_entry( $data ) {
        global $wpdb;

        $table = self::table_name( 'feed' );

        $inserted = $wpdb->insert(
            $table,
            array(
                'user_id'   => $data['user_id'],
                'parent_id' => $data['parent_id'],
                'content'   => $data['content'],
                'created_at'=> $data['created_at'],
            ),
            array( '%d', '%d', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'local4picnic_feed_error', __( 'Unable to publish to the feed.', 'local4picnic' ) );
        }

        return self::get_feed_item( (int) $wpdb->insert_id );
    }

    /**
     * Retrieve a feed entry.
     *
     * @param int $entry_id Entry ID.
     *
     * @return array|null
     */
    public static function get_feed_item( $entry_id ) {
        global $wpdb;

        $table = self::table_name( 'feed' );
        $users = $wpdb->users;

        $query = $wpdb->prepare(
            "SELECT f.*, u.display_name AS author
            FROM {$table} f
            INNER JOIN {$users} u ON f.user_id = u.ID
            WHERE f.id = %d",
            $entry_id
        );

        $item = $wpdb->get_row( $query, ARRAY_A );

        if ( $item ) {
            $item['id']        = (int) $item['id'];
            $item['user_id']   = (int) $item['user_id'];
            $item['parent_id'] = (int) $item['parent_id'];
        }

        return $item;
    }

    /**
     * Store a notification.
     *
     * @param array $data Notification data.
     *
     * @return array|WP_Error
     */
    public static function create_notification( $data ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );

        $inserted = $wpdb->insert(
            $table,
            array(
                'user_id'   => $data['user_id'],
                'message'   => $data['message'],
                'type'      => $data['type'],
                'is_read'   => $data['is_read'],
                'created_at'=> $data['created_at'],
            ),
            array( '%d', '%s', '%s', '%d', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'local4picnic_notification_error', __( 'Unable to create notification.', 'local4picnic' ) );
        }

        return self::get_notification( (int) $wpdb->insert_id );
    }

    /**
     * Fetch notifications for a user.
     *
     * @param int $user_id User ID.
     *
     * @return array
     */
    public static function get_notifications_for_user( $user_id ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );

        $query = $wpdb->prepare(
            "SELECT * FROM {$table}
            WHERE user_id = %d OR user_id = 0
            ORDER BY created_at DESC
            LIMIT 50",
            $user_id
        );

        $items = $wpdb->get_results( $query, ARRAY_A );

        foreach ( $items as &$item ) {
            $item['id']      = (int) $item['id'];
            $item['user_id'] = (int) $item['user_id'];
            $item['is_read'] = (int) $item['is_read'];
        }

        return $items;
    }

    /**
     * Retrieve a single notification.
     *
     * @param int $notification_id Notification ID.
     *
     * @return array|null
     */
    public static function get_notification( $notification_id ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );

        $item = $wpdb->get_row(
            $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $notification_id ),
            ARRAY_A
        );

        if ( $item ) {
            $item['id']      = (int) $item['id'];
            $item['user_id'] = (int) $item['user_id'];
            $item['is_read'] = (int) $item['is_read'];
        }

        return $item;
    }

    /**
     * Mark a notification as read.
     *
     * @param int $notification_id Notification ID.
     */
    public static function mark_notification_read( $notification_id ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );

        $wpdb->update(
            $table,
            array(
                'is_read' => 1,
            ),
            array( 'id' => $notification_id ),
            array( '%d' ),
            array( '%d' )
        );
    }
}

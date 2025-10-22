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
            updated_at datetime NOT NULL,
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

        $tables['events'] = "CREATE TABLE " . self::table_name( 'events' ) . " (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            category varchar(60) NOT NULL,
            action varchar(60) NOT NULL,
            entity_id bigint(20) unsigned NOT NULL DEFAULT 0,
            user_id bigint(20) unsigned NOT NULL DEFAULT 0,
            payload longtext,
            created_at datetime NOT NULL,
            PRIMARY KEY  (id),
            KEY category (category),
            KEY created_at (created_at)
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
     * Record a dashboard event so clients can react in real time.
     *
     * @param string $category Event category (tasks, funding, crew, feed, notifications).
     * @param string $action   Action keyword (created, updated, deleted, posted, etc.).
     * @param int    $entity_id Related entity identifier.
     * @param array  $payload  Optional payload to deliver to subscribers.
     * @param int    $user_id  Associated user ID if applicable.
     */
    public static function record_event( $category, $action, $entity_id = 0, $payload = array(), $user_id = 0 ) {
        global $wpdb;

        $table = self::table_name( 'events' );

        $inserted = $wpdb->insert(
            $table,
            array(
                'category'  => sanitize_key( $category ),
                'action'    => sanitize_key( $action ),
                'entity_id' => (int) $entity_id,
                'user_id'   => (int) $user_id,
                'payload'   => wp_json_encode( $payload ),
                'created_at'=> current_time( 'mysql', true ),
            ),
            array( '%s', '%s', '%d', '%d', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return;
        }

        self::maybe_purge_events();
    }

    /**
     * Fetch events after a given cursor.
     *
     * @param int $cursor Last seen event ID.
     * @param int $limit  Max number of events.
     *
     * @return array
     */
    public static function get_events_since( $cursor = 0, $limit = 50 ) {
        global $wpdb;

        $table  = self::table_name( 'events' );
        $cursor = absint( $cursor );
        $limit  = max( 1, min( (int) $limit, 100 ) );

        if ( $cursor > 0 ) {
            $sql = $wpdb->prepare(
                "SELECT * FROM {$table} WHERE id > %d ORDER BY id ASC LIMIT %d",
                $cursor,
                $limit
            );
        } else {
            $sql = $wpdb->prepare(
                "SELECT * FROM {$table} ORDER BY id ASC LIMIT %d",
                $limit
            );
        }

        $rows = $wpdb->get_results( $sql, ARRAY_A );

        foreach ( $rows as &$row ) {
            $row['id']        = (int) $row['id'];
            $row['entity_id'] = (int) $row['entity_id'];
            $row['user_id']   = (int) $row['user_id'];

            $payload = array();

            if ( ! empty( $row['payload'] ) ) {
                $decoded = json_decode( $row['payload'], true );

                if ( is_array( $decoded ) ) {
                    $payload = $decoded;
                }
            }

            $row['payload'] = $payload;
        }

        return $rows;
    }

    /**
     * Periodically trim stale events.
     */
    protected static function maybe_purge_events() {
        $should_purge = function_exists( 'wp_rand' ) ? ( wp_rand( 1, 40 ) === 1 ) : ( mt_rand( 1, 40 ) === 1 );

        if ( ! $should_purge ) {
            return;
        }

        global $wpdb;

        $table     = self::table_name( 'events' );
        $threshold = gmdate( 'Y-m-d H:i:s', current_time( 'timestamp', true ) - WEEK_IN_SECONDS );

        $wpdb->query( $wpdb->prepare( "DELETE FROM {$table} WHERE created_at < %s", $threshold ) ); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
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

        $table = self::table_name( 'tasks' );
        $users = $wpdb->users;

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
                'updated_at'  => isset( $data['updated_at'] ) ? $data['updated_at'] : $data['created_at'],
            ),
            array( '%s', '%s', '%s', '%d', '%d', '%s', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'local4picnic_task_error', __( 'Unable to create task.', 'local4picnic' ) );
        }

        $task = self::get_task( (int) $wpdb->insert_id );

        if ( $task ) {
            self::record_event( 'tasks', 'created', $task['id'], $task, (int) $task['assigned_to'] );
        }

        return $task;
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

        $task = self::get_task( $task_id );

        if ( $task ) {
            self::record_event( 'tasks', 'updated', $task['id'], $task, (int) $task['assigned_to'] );
        }

        return $task;
    }

    /**
     * Delete a task.
     *
     * @param int $task_id Task ID.
     */
    public static function delete_task( $task_id ) {
        global $wpdb;

        $table = self::table_name( 'tasks' );
        $task  = self::get_task( $task_id );

        $wpdb->delete( $table, array( 'id' => $task_id ), array( '%d' ) );

        $payload = array( 'id' => (int) $task_id );
        $user_id = 0;

        if ( $task ) {
            $payload['title'] = isset( $task['title'] ) ? $task['title'] : '';
            $user_id          = isset( $task['assigned_to'] ) ? (int) $task['assigned_to'] : 0;
        }

        self::record_event( 'tasks', 'deleted', (int) $task_id, $payload, $user_id );
    }

    /**
     * Retrieve users that can be assigned to tasks or crew records.
     *
     * @param string $search Optional search term.
     *
     * @return array
     */
    public static function get_assignable_users( $search = '' ) {
        $args = array(
            'number'  => 100,
            'orderby' => 'display_name',
            'order'   => 'ASC',
            'fields'  => array( 'ID', 'display_name', 'user_email', 'roles' ),
        );

        if ( ! empty( $search ) ) {
            $args['search']         = '*' . esc_attr( $search ) . '*';
            $args['search_columns'] = array( 'user_login', 'user_nicename', 'display_name', 'user_email' );
        }

        $query = new WP_User_Query( $args );
        $users = array();

        foreach ( $query->get_results() as $user ) {
            $phone = get_user_meta( $user->ID, 'local4picnic_phone', true );

            if ( empty( $phone ) && ! empty( $user->user_email ) ) {
                global $wpdb;

                $crew_table = self::table_name( 'crew' );
                $phone      = $wpdb->get_var( $wpdb->prepare( "SELECT phone FROM {$crew_table} WHERE email = %s ORDER BY updated_at DESC LIMIT 1", $user->user_email ) );
            }

            $users[] = array(
                'id'    => (int) $user->ID,
                'name'  => $user->display_name,
                'email' => $user->user_email,
                'roles' => array_values( $user->roles ),
                'phone' => $phone ? self::normalize_phone_number( $phone ) : '',
            );
        }

        return $users;
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
            $row['updated_at']  = ! empty( $row['updated_at'] ) ? $row['updated_at'] : $row['created_at'];
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
                'updated_at'  => $data['updated_at'],
            ),
            array( '%s', '%f', '%s', '%s', '%s', '%d', '%s', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'local4picnic_funding_error', __( 'Unable to save funding entry.', 'local4picnic' ) );
        }

        $entry = self::get_funding_entry( (int) $wpdb->insert_id );

        if ( $entry ) {
            self::record_event( 'funding', 'created', $entry['id'], $entry, (int) $entry['recorded_by'] );
        }

        return $entry;
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
            $entry['updated_at']  = ! empty( $entry['updated_at'] ) ? $entry['updated_at'] : $entry['created_at'];
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

        $fields['updated_at'] = current_time( 'mysql', true );
        $format[]             = '%s';

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

        $entry = self::get_funding_entry( $entry_id );

        if ( $entry ) {
            self::record_event( 'funding', 'updated', $entry['id'], $entry, (int) $entry['recorded_by'] );
        }

        return $entry;
    }

    /**
     * Delete a funding entry.
     *
     * @param int $entry_id Entry ID.
     */
    public static function delete_funding_entry( $entry_id ) {
        global $wpdb;

        $table = self::table_name( 'funding' );
        $entry = self::get_funding_entry( $entry_id );

        $wpdb->delete( $table, array( 'id' => $entry_id ), array( '%d' ) );

        $payload = array( 'id' => (int) $entry_id );
        $user_id = 0;

        if ( $entry ) {
            $payload['category']  = isset( $entry['category'] ) ? $entry['category'] : '';
            $payload['direction'] = isset( $entry['direction'] ) ? $entry['direction'] : '';
            $user_id              = isset( $entry['recorded_by'] ) ? (int) $entry['recorded_by'] : 0;
        }

        self::record_event( 'funding', 'deleted', (int) $entry_id, $payload, $user_id );
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
            $row['updated_at'] = ! empty( $row['updated_at'] ) ? $row['updated_at'] : $row['created_at'];
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
                'updated_at' => isset( $data['updated_at'] ) ? $data['updated_at'] : $data['created_at'],
            ),
            array( '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'local4picnic_crew_error', __( 'Unable to save crew member.', 'local4picnic' ) );
        }

        $member = self::get_crew_member( (int) $wpdb->insert_id );

        if ( $member ) {
            self::record_event( 'crew', 'created', $member['id'], $member, (int) $member['created_by'] );
        }

        return $member;
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
            $member['updated_at'] = ! empty( $member['updated_at'] ) ? $member['updated_at'] : $member['created_at'];
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

        $fields['updated_at'] = current_time( 'mysql', true );
        $format[]             = '%s';

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

        $member = self::get_crew_member( $crew_id );

        if ( $member ) {
            self::record_event( 'crew', 'updated', $member['id'], $member, (int) $member['created_by'] );
        }

        return $member;
    }

    /**
     * Delete a crew member.
     *
     * @param int $crew_id Crew ID.
     */
    public static function delete_crew_member( $crew_id ) {
        global $wpdb;

        $table  = self::table_name( 'crew' );
        $member = self::get_crew_member( $crew_id );

        $wpdb->delete( $table, array( 'id' => $crew_id ), array( '%d' ) );

        $payload = array( 'id' => (int) $crew_id );
        $user_id = 0;

        if ( $member ) {
            $payload['name']  = isset( $member['name'] ) ? $member['name'] : '';
            $payload['role']  = isset( $member['role'] ) ? $member['role'] : '';
            $payload['email'] = isset( $member['email'] ) ? $member['email'] : '';
            $user_id          = isset( $member['created_by'] ) ? (int) $member['created_by'] : 0;
        }

        self::record_event( 'crew', 'deleted', (int) $crew_id, $payload, $user_id );
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
            $thread['updated_at']= ! empty( $thread['updated_at'] ) ? $thread['updated_at'] : $thread['created_at'];
            $grouped[ $thread['id'] ] = $thread;
            $grouped[ $thread['id'] ]['replies'] = array();
        }

        foreach ( $replies as $reply ) {
            $reply['id']        = (int) $reply['id'];
            $reply['user_id']   = (int) $reply['user_id'];
            $reply['parent_id'] = (int) $reply['parent_id'];
            $reply['updated_at']= ! empty( $reply['updated_at'] ) ? $reply['updated_at'] : $reply['created_at'];

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
                'updated_at'=> isset( $data['updated_at'] ) ? $data['updated_at'] : $data['created_at'],
            ),
            array( '%d', '%d', '%s', '%s', '%s' )
        );

        if ( false === $inserted ) {
            return new WP_Error( 'local4picnic_feed_error', __( 'Unable to publish to the feed.', 'local4picnic' ) );
        }

        $item = self::get_feed_item( (int) $wpdb->insert_id );

        if ( $item ) {
            $action = ! empty( $item['parent_id'] ) ? 'replied' : 'posted';

            self::record_event( 'feed', $action, $item['id'], $item, (int) $item['user_id'] );
        }

        return $item;
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
            $item['updated_at']= ! empty( $item['updated_at'] ) ? $item['updated_at'] : $item['created_at'];
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

        $notification = self::get_notification( (int) $wpdb->insert_id );

        if ( $notification ) {
            self::record_event( 'notifications', 'created', $notification['id'], $notification, (int) $notification['user_id'] );
            self::maybe_email_notification( $notification );
            self::maybe_sms_notification( $notification );
        }

        return $notification;
    }

    /**
     * Fetch notifications for a user.
     *
     * @param int $user_id User ID.
     *
     * @return array
     */
    public static function get_notifications_for_user( $user_id, $since = null ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );

        if ( $since ) {
            $timestamp = strtotime( $since );

            if ( false === $timestamp ) {
                $timestamp = current_time( 'timestamp', true ) - DAY_IN_SECONDS;
            }

            $query = $wpdb->prepare(
                "SELECT * FROM {$table}
                WHERE ( user_id = %d OR user_id = 0 )
                AND created_at >= %s
                ORDER BY created_at DESC
                LIMIT 50",
                $user_id,
                gmdate( 'Y-m-d H:i:s', $timestamp )
            );
        } else {
            $query = $wpdb->prepare(
                "SELECT * FROM {$table}
                WHERE user_id = %d OR user_id = 0
                ORDER BY created_at DESC
                LIMIT 50",
                $user_id
            );
        }

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
     * Optionally email notifications depending on settings.
     *
     * @param array $notification Notification payload.
     */
    protected static function maybe_email_notification( $notification ) {
        $options = Local4Picnic_Settings::get_options();

        if ( empty( $options['notify_email'] ) ) {
            return;
        }

        $recipient = '';

        if ( $notification['user_id'] > 0 ) {
            $user = get_user_by( 'id', $notification['user_id'] );

            if ( ! $user || empty( $user->user_email ) ) {
                return;
            }

            $recipient = $user->user_email;
        } else {
            $recipient = get_option( 'admin_email' );
        }

        if ( empty( $recipient ) ) {
            return;
        }

        $subject = __( 'Local 4 Picnic Update', 'local4picnic' );
        $message = wp_strip_all_tags( $notification['message'] );

        wp_mail( $recipient, $subject, $message );
    }

    /**
     * Optionally dispatch SMS notifications.
     *
     * @param array $notification Notification payload.
     */
    protected static function maybe_sms_notification( $notification ) {
        $options = Local4Picnic_Settings::get_options();

        if ( empty( $options['notify_sms'] ) ) {
            return;
        }

        $provider = isset( $options['sms_provider'] ) ? $options['sms_provider'] : '';

        if ( empty( $provider ) ) {
            return;
        }

        $recipients = array();

        if ( ! empty( $notification['user_id'] ) ) {
            $phone = self::get_user_phone_number( (int) $notification['user_id'] );

            if ( ! empty( $phone ) ) {
                $recipients[] = $phone;
            }
        } elseif ( ! empty( $options['sms_admin_number'] ) ) {
            $admin_number = self::normalize_phone_number( $options['sms_admin_number'] );

            if ( ! empty( $admin_number ) ) {
                $recipients[] = $admin_number;
            }
        }

        $recipients = apply_filters( 'local4picnic_sms_recipients', array_unique( array_filter( $recipients ) ), $notification, $options );

        if ( empty( $recipients ) ) {
            return;
        }

        foreach ( $recipients as $recipient ) {
            self::dispatch_sms_notification( $provider, $recipient, $notification, $options );
        }
    }

    /**
     * Send SMS via configured provider or custom hooks.
     *
     * @param string $provider     Provider slug.
     * @param string $recipient    Normalised phone number.
     * @param array  $notification Notification payload.
     * @param array  $options      Plugin options.
     */
    protected static function dispatch_sms_notification( $provider, $recipient, $notification, $options ) {
        $message = wp_strip_all_tags( $notification['message'] );

        if ( 'twilio' !== $provider ) {
            /**
             * Allow developers to wire up their own SMS provider.
             */
            do_action( 'local4picnic_send_sms', $provider, $recipient, $message, $notification, $options );

            return;
        }

        $sid   = isset( $options['sms_twilio_sid'] ) ? trim( $options['sms_twilio_sid'] ) : '';
        $token = isset( $options['sms_twilio_token'] ) ? trim( $options['sms_twilio_token'] ) : '';
        $from  = isset( $options['sms_twilio_from'] ) ? self::normalize_phone_number( $options['sms_twilio_from'] ) : '';

        if ( empty( $sid ) || empty( $token ) || empty( $from ) || empty( $recipient ) ) {
            return;
        }

        $endpoint = sprintf( 'https://api.twilio.com/2010-04-01/Accounts/%s/Messages.json', rawurlencode( $sid ) );

        $response = wp_remote_post(
            $endpoint,
            array(
                'body'    => array(
                    'To'   => $recipient,
                    'From' => $from,
                    'Body' => $message,
                ),
                'headers' => array(
                    'Authorization' => 'Basic ' . base64_encode( $sid . ':' . $token ),
                ),
                'timeout' => 15,
            )
        );

        if ( is_wp_error( $response ) ) {
            do_action( 'local4picnic_sms_failed', $provider, $recipient, $message, $response );
        } else {
            do_action( 'local4picnic_sms_sent', $provider, $recipient, $message, $response );
        }
    }

    /**
     * Attempt to resolve a phone number for a WordPress user.
     *
     * @param int $user_id User ID.
     *
     * @return string
     */
    protected static function get_user_phone_number( $user_id ) {
        $phone = get_user_meta( $user_id, 'local4picnic_phone', true );

        if ( $phone ) {
            $normalized = self::normalize_phone_number( $phone );

            if ( ! empty( $normalized ) ) {
                return $normalized;
            }
        }

        $user = get_user_by( 'id', $user_id );

        if ( ! $user || empty( $user->user_email ) ) {
            return '';
        }

        global $wpdb;

        $table = self::table_name( 'crew' );
        $phone = $wpdb->get_var( $wpdb->prepare( "SELECT phone FROM {$table} WHERE email = %s ORDER BY updated_at DESC LIMIT 1", $user->user_email ) );

        if ( empty( $phone ) ) {
            return '';
        }

        return self::normalize_phone_number( $phone );
    }

    /**
     * Normalise phone numbers to E.164 friendly format.
     *
     * @param string $value Raw phone value.
     *
     * @return string
     */
    protected static function normalize_phone_number( $value ) {
        $value = trim( (string) $value );

        if ( '' === $value ) {
            return '';
        }

        $digits = preg_replace( '/[^0-9+]/', '', $value );

        if ( '' === $digits ) {
            return '';
        }

        if ( strpos( $digits, '+' ) !== 0 ) {
            $digits = '+' . ltrim( $digits, '+' );
        }

        return $digits;
    }

    /**
     * Count unread notifications for a user.
     *
     * @param int $user_id User ID.
     *
     * @return int
     */
    public static function count_unread_notifications( $user_id ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );

        $query = $wpdb->prepare(
            "SELECT COUNT(*) FROM {$table} WHERE ( user_id = %d OR user_id = 0 ) AND is_read = 0",
            $user_id
        );

        return (int) $wpdb->get_var( $query );
    }

    /**
     * Mark a notification as read.
     *
     * @param int $notification_id Notification ID.
     */
    public static function mark_notification_read( $notification_id ) {
        global $wpdb;

        $table = self::table_name( 'notifications' );

        $updated = $wpdb->update(
            $table,
            array(
                'is_read' => 1,
            ),
            array( 'id' => $notification_id ),
            array( '%d' ),
            array( '%d' )
        );

        if ( false !== $updated ) {
            $notification = self::get_notification( $notification_id );

            if ( $notification ) {
                self::record_event( 'notifications', 'updated', $notification['id'], $notification, (int) $notification['user_id'] );
            }
        }
    }
}

<?php
namespace Local4Picnic\Services\Repositories;

use wpdb;

class TasksRepository {
    private wpdb $db;
    private string $table;
    private string $users_table;

    public function __construct( wpdb $db ) {
        $this->db         = $db;
        $this->table      = $db->prefix . 'l4p_tasks';
        $this->users_table = $db->users;
    }

    public function list( array $args ): array {
        $status   = $args['status'] ?? null;
        $assignee = $args['assignee'] ?? null;
        $current  = get_current_user_id();

        $where  = [];
        $params = [];

        if ( $status ) {
            $where[]  = 't.status = %s';
            $params[] = $status;
        }

        if ( $assignee ) {
            $where[]  = 't.assignee_id = %d';
            $params[] = (int) $assignee;
        }

        $where_sql = $where ? 'WHERE ' . implode( ' AND ', $where ) : '';
        $order_sql = $this->db->prepare( 'FIELD(t.assignee_id, %d) DESC, t.due_date ASC, t.priority DESC, t.id DESC', $current );

        $sql = "SELECT t.*, assignee.display_name AS assignee_name, assignee.user_email AS assignee_email, assigner.display_name AS created_by_name, assigner.user_email AS created_by_email
            FROM {$this->table} t
            LEFT JOIN {$this->users_table} assignee ON assignee.ID = t.assignee_id
            LEFT JOIN {$this->users_table} assigner ON assigner.ID = t.created_by
            {$where_sql}
            ORDER BY {$order_sql}";

        if ( $params ) {
            array_unshift( $params, $sql );
            $sql = call_user_func_array( [ $this->db, 'prepare' ], $params );
        }

        $rows = $this->db->get_results( $sql, ARRAY_A ) ?: [];

        return array_map( [ $this, 'format_task' ], $rows );
    }

    public function find( int $id ): ?array {
        $sql = $this->db->prepare(
            "SELECT t.*, assignee.display_name AS assignee_name, assignee.user_email AS assignee_email, assigner.display_name AS created_by_name, assigner.user_email AS created_by_email
            FROM {$this->table} t
            LEFT JOIN {$this->users_table} assignee ON assignee.ID = t.assignee_id
            LEFT JOIN {$this->users_table} assigner ON assigner.ID = t.created_by
            WHERE t.id = %d",
            $id
        );

        $row = $this->db->get_row( $sql, ARRAY_A );
        return $row ? $this->format_task( $row ) : null;
    }

    public function create( array $data ): array {
        $payload = [
            'title'       => sanitize_text_field( $data['title'] ),
            'description' => wp_kses_post( $data['description'] ?? '' ),
            'status'      => sanitize_text_field( $data['status'] ?? 'todo' ),
            'priority'    => sanitize_text_field( $data['priority'] ?? 'medium' ),
            'due_date'    => $data['due_date'] ?? null,
            'url'         => esc_url_raw( $data['url'] ?? '' ),
            'assignee_id' => (int) ( $data['assignee_id'] ?? 0 ) ?: null,
            'created_by'  => get_current_user_id(),
            'created_at'  => current_time( 'mysql' ),
            'updated_at'  => current_time( 'mysql' ),
        ];

        $this->db->insert(
            $this->table,
            $payload,
            [ '%s', '%s', '%s', '%s', '%s', '%s', '%d', '%d', '%s', '%s' ]
        );

        return $this->find( (int) $this->db->insert_id );
    }

    public function update_status( int $id, string $status ): bool {
        return (bool) $this->db->update(
            $this->table,
            [
                'status'     => sanitize_text_field( $status ),
                'updated_at' => current_time( 'mysql' ),
            ],
            [ 'id' => $id ],
            [ '%s', '%s' ],
            [ '%d' ]
        );
    }

    private function format_task( array $task ): array {
        if ( ! empty( $task['assignee_id'] ) ) {
            $task['assignee_avatar'] = get_avatar_url( (int) $task['assignee_id'] );
        }

        if ( ! empty( $task['created_by'] ) ) {
            $task['created_by_avatar'] = get_avatar_url( (int) $task['created_by'] );
        }

        return $task;
    }
}

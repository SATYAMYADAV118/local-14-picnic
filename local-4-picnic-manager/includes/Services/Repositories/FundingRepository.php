<?php
namespace Local4Picnic\Services\Repositories;

use wpdb;

class FundingRepository {
    private wpdb $db;
    private string $table;

    public function __construct( wpdb $db ) {
        $this->db    = $db;
        $this->table = $db->prefix . 'l4p_funding_tx';
    }

    public function list( array $filters ): array {
        $where  = [];
        $params = [];

        if ( ! empty( $filters['type'] ) ) {
            $where[]  = 'type = %s';
            $params[] = $filters['type'];
        }

        if ( ! empty( $filters['category'] ) ) {
            $where[]  = 'category = %s';
            $params[] = $filters['category'];
        }

        if ( ! empty( $filters['from'] ) ) {
            $where[]  = 'tx_date >= %s';
            $params[] = $filters['from'];
        }

        if ( ! empty( $filters['to'] ) ) {
            $where[]  = 'tx_date <= %s';
            $params[] = $filters['to'];
        }

        $where_sql = $where ? 'WHERE ' . implode( ' AND ', $where ) : '';
        $sql       = "SELECT * FROM {$this->table} {$where_sql} ORDER BY tx_date DESC, id DESC";

        if ( $params ) {
            array_unshift( $params, $sql );
            $sql = call_user_func_array( [ $this->db, 'prepare' ], $params );
        }

        return $this->db->get_results( $sql, ARRAY_A ) ?: [];
    }

    public function create( array $data ): array {
        $this->db->insert(
            $this->table,
            [
                'type'       => sanitize_text_field( $data['type'] ),
                'amount'     => (float) $data['amount'],
                'category'   => sanitize_text_field( $data['category'] ),
                'note'       => sanitize_textarea_field( $data['note'] ?? '' ),
                'tx_date'    => $data['tx_date'],
                'created_by' => get_current_user_id(),
                'created_at' => current_time( 'mysql' ),
            ],
            [ '%s', '%f', '%s', '%s', '%s', '%d', '%s' ]
        );

        return $this->find( (int) $this->db->insert_id );
    }

    public function update( int $id, array $data ): ?array {
        $this->db->update(
            $this->table,
            [
                'type'     => sanitize_text_field( $data['type'] ),
                'amount'   => (float) $data['amount'],
                'category' => sanitize_text_field( $data['category'] ),
                'note'     => sanitize_textarea_field( $data['note'] ?? '' ),
                'tx_date'  => $data['tx_date'],
            ],
            [ 'id' => $id ],
            [ '%s', '%f', '%s', '%s', '%s' ],
            [ '%d' ]
        );

        return $this->find( $id );
    }

    public function delete( int $id ): bool {
        return (bool) $this->db->delete( $this->table, [ 'id' => $id ], [ '%d' ] );
    }

    public function find( int $id ): ?array {
        $sql = $this->db->prepare( "SELECT * FROM {$this->table} WHERE id = %d", $id );
        $row = $this->db->get_row( $sql, ARRAY_A );
        return $row ?: null;
    }
}

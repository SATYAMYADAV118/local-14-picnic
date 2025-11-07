<?php
namespace Local4Picnic\Services\Repositories;

use Local4Picnic\Utils\Settings;
use wpdb;
use WP_User;

class CrewRepository {
    private wpdb $db;
    private string $table;

    public function __construct( wpdb $db ) {
        $this->db    = $db;
        $this->table = $db->prefix . 'l4p_crew';
    }

    public function list(): array {
        $sql   = "SELECT * FROM {$this->table} ORDER BY name ASC";
        $rows  = $this->db->get_results( $sql, ARRAY_A ) ?: [];

        return array_map( [ $this, 'enrich_member' ], $rows );
    }

    public function find( int $id ): ?array {
        $sql = $this->db->prepare( "SELECT * FROM {$this->table} WHERE id = %d", $id );
        $row = $this->db->get_row( $sql, ARRAY_A );
        return $row ? $this->enrich_member( $row ) : null;
    }

    public function create_or_update_from_user( int $user_id ): void {
        $user = get_user_by( 'id', $user_id );
        if ( ! $user ) {
            return;
        }

        $existing = $this->db->get_var( $this->db->prepare( "SELECT id FROM {$this->table} WHERE wp_user_id = %d", $user_id ) );

        $data = [
            'wp_user_id' => $user_id,
            'name'       => sanitize_text_field( $user->display_name ),
            'email'      => sanitize_email( $user->user_email ),
            'role'       => $this->determine_role( $user ),
        ];

        if ( $existing ) {
            $this->db->update( $this->table, $data, [ 'id' => $existing ], [ '%d', '%s', '%s', '%s' ], [ '%d' ] );
        } else {
            $data['created_at'] = current_time( 'mysql' );
            $this->db->insert( $this->table, $data, [ '%d', '%s', '%s', '%s', '%s' ] );
        }
    }

    public function save_avatar( int $id, string $url ): void {
        $this->db->update( $this->table, [ 'avatar_url' => esc_url_raw( $url ) ], [ 'id' => $id ], [ '%s' ], [ '%d' ] );
    }

    public function delete_by_user_id( int $user_id ): void {
        $this->db->delete( $this->table, [ 'wp_user_id' => $user_id ], [ '%d' ] );
    }

    private function determine_role( WP_User $user ): string {
        $settings          = Settings::get();
        $coordinator_roles = array_filter( array_map( 'sanitize_key', (array) ( $settings['coordinator_roles'] ?? [] ) ) );
        $volunteer_roles   = array_filter( array_map( 'sanitize_key', (array) ( $settings['volunteer_roles'] ?? [] ) ) );

        if ( array_intersect( $coordinator_roles, $user->roles ) ) {
            return 'coordinator';
        }

        if ( array_intersect( $volunteer_roles, $user->roles ) ) {
            return 'volunteer';
        }

        return array_intersect( [ 'administrator' ], $user->roles ) ? 'coordinator' : 'volunteer';
    }

    private function enrich_member( array $member ): array {
        if ( empty( $member['wp_user_id'] ) ) {
            $member['role_key']       = $member['role'] ?? '';
            $member['role']           = ucfirst( $member['role'] ?? '' );
            $member['wp_roles']       = [];
            $member['wp_role_labels'] = [];
            $member['profile_url']    = '';
            return $member;
        }

        $user = get_user_by( 'id', (int) $member['wp_user_id'] );
        if ( ! $user ) {
            $member['role_key']       = $member['role'] ?? '';
            $member['role']           = ucfirst( $member['role'] ?? '' );
            $member['wp_roles']       = [];
            $member['wp_role_labels'] = [];
            $member['profile_url']    = '';
            return $member;
        }

        $roles_object = wp_roles();
        $labels       = [];

        foreach ( $user->roles as $role ) {
            $labels[] = $roles_object->roles[ $role ]['name'] ?? ucfirst( str_replace( '_', ' ', $role ) );
        }

        $member['role_key']       = $member['role'] ?? '';
        $member['role']           = ucfirst( $member['role'] ?? '' );
        $member['wp_roles']       = array_values( $user->roles );
        $member['wp_role_labels'] = $labels;
        $member['profile_url']    = get_edit_user_link( $user->ID );
        if ( empty( $member['avatar_url'] ) ) {
            $member['avatar_url'] = get_avatar_url( $user->ID );
        }

        return $member;
    }
}

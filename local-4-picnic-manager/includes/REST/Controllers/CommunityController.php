<?php
namespace Local4Picnic\REST\Controllers;

use Local4Picnic\Services\Capabilities;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

class CommunityController extends BaseController {
    public function register_routes(): void {
        register_rest_route(
            self::NAMESPACE,
            '/community',
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'list_threads' ],
                    'permission_callback' => [ $this, 'can_view' ],
                ],
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'create_post' ],
                    'permission_callback' => [ $this, 'can_post' ],
                ],
            ]
        );

        register_rest_route(
            self::NAMESPACE,
            '/community/(?P<id>\d+)/reply',
            [
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'create_reply' ],
                    'permission_callback' => [ $this, 'can_post' ],
                ],
            ]
        );

        register_rest_route(
            self::NAMESPACE,
            '/community/(?P<id>\d+)',
            [
                [
                    'methods'             => 'DELETE',
                    'callback'            => [ $this, 'delete_post' ],
                    'permission_callback' => [ $this, 'can_delete' ],
                ],
            ]
        );
    }

    public function can_view( WP_REST_Request $request ): bool|WP_Error {
        return $this->permissions_check( $request, 'manage_l4p_tasks' );
    }

    public function can_post( WP_REST_Request $request ): bool|WP_Error {
        $permission = $this->permissions_check( $request, 'manage_l4p_posts' );
        if ( is_wp_error( $permission ) ) {
            return $permission;
        }

        if ( Capabilities::is_coordinator() || Capabilities::volunteer_post_chat_enabled() ) {
            return true;
        }

        return new WP_Error( 'rest_forbidden', __( 'Posting disabled for volunteers.', 'local-4-picnic-manager' ), [ 'status' => 403 ] );
    }

    public function can_delete( WP_REST_Request $request ): bool|WP_Error {
        return $this->permissions_check( $request, 'manage_l4p_posts' );
    }

    public function list_threads( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $posts_table    = $wpdb->prefix . 'l4p_posts';
        $comments_table = $wpdb->prefix . 'l4p_comments';

        $posts = $wpdb->get_results( "SELECT * FROM {$posts_table} ORDER BY created_at DESC LIMIT 50", ARRAY_A ) ?: [];

        foreach ( $posts as &$post ) {
            $post['author']  = $this->user_summary( (int) $post['author_id'] );
            $post['comments'] = $wpdb->get_results( $wpdb->prepare( "SELECT * FROM {$comments_table} WHERE post_id = %d ORDER BY created_at ASC", $post['id'] ), ARRAY_A ) ?: [];
            foreach ( $post['comments'] as &$comment ) {
                $comment['author'] = $this->user_summary( (int) $comment['author_id'] );
            }
        }

        return new WP_REST_Response( [ 'data' => $posts ] );
    }

    public function create_post( WP_REST_Request $request ): WP_REST_Response {
        $body = wp_kses_post( $request->get_param( 'body' ) );
        if ( empty( trim( $body ) ) ) {
            return new WP_REST_Response( [ 'error' => 'Body is required' ], 400 );
        }

        global $wpdb;
        $table = $wpdb->prefix . 'l4p_posts';
        $wpdb->insert(
            $table,
            [
                'author_id'  => get_current_user_id(),
                'body'       => $body,
                'created_at' => current_time( 'mysql' ),
            ],
            [ '%d', '%s', '%s' ]
        );
        $post_id = (int) $wpdb->insert_id;

        $post = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $post_id ), ARRAY_A );
        $post['author'] = $this->user_summary( (int) $post['author_id'] );
        $post['comments'] = [];

        do_action( 'l4p_post_created', $post, $post['author'] );

        return new WP_REST_Response( $post, 201 );
    }

    public function create_reply( WP_REST_Request $request ): WP_REST_Response {
        $post_id = (int) $request->get_param( 'id' );
        $body    = wp_kses_post( $request->get_param( 'body' ) );
        if ( empty( trim( $body ) ) ) {
            return new WP_REST_Response( [ 'error' => 'Body is required' ], 400 );
        }

        global $wpdb;
        $comments_table = $wpdb->prefix . 'l4p_comments';
        $wpdb->insert(
            $comments_table,
            [
                'post_id'    => $post_id,
                'author_id'  => get_current_user_id(),
                'body'       => $body,
                'created_at' => current_time( 'mysql' ),
            ],
            [ '%d', '%d', '%s', '%s' ]
        );

        $comment = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$comments_table} WHERE id = %d", $wpdb->insert_id ), ARRAY_A );
        $comment['author'] = $this->user_summary( (int) $comment['author_id'] );

        do_action( 'l4p_comment_created', $comment, $comment['author'] );

        return new WP_REST_Response( $comment, 201 );
    }

    public function delete_post( WP_REST_Request $request ): WP_REST_Response {
        $id = (int) $request->get_param( 'id' );
        global $wpdb;
        $table   = $wpdb->prefix . 'l4p_posts';
        $comment_table = $wpdb->prefix . 'l4p_comments';
        $post    = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM {$table} WHERE id = %d", $id ), ARRAY_A );

        if ( ! $post ) {
            return new WP_REST_Response( [ 'error' => 'Not found' ], 404 );
        }

        $current = get_current_user_id();
        $created  = strtotime( $post['created_at'] );
        $now      = current_time( 'timestamp', true );

        if ( ! Capabilities::is_coordinator() ) {
            if ( (int) $post['author_id'] !== $current ) {
                return new WP_REST_Response( [ 'error' => 'Cannot delete other members\' posts.' ], 403 );
            }
            if ( $now - $created > 15 * MINUTE_IN_SECONDS ) {
                do_action( 'l4p_moderation_request', [
                    'type' => 'delete_post',
                    'post' => $post,
                    'requester' => $this->user_summary( $current ),
                ] );
                return new WP_REST_Response( [ 'moderation' => true ], 202 );
            }
        }

        $wpdb->delete( $comment_table, [ 'post_id' => $id ], [ '%d' ] );
        $wpdb->delete( $table, [ 'id' => $id ], [ '%d' ] );

        return new WP_REST_Response( [ 'deleted' => true ] );
    }

    private function user_summary( int $user_id ): array {
        $user = get_user_by( 'id', $user_id );
        if ( ! $user ) {
            return [];
        }

        return [
            'id'    => $user->ID,
            'name'  => $user->display_name,
            'email' => $user->user_email,
            'avatar'=> get_avatar_url( $user->ID ),
        ];
    }
}

<?php
namespace Local4Picnic\Services;

class Notifications {
    public static function boot(): void {
        add_action( 'l4p_task_created', [ static::class, 'task_created' ], 10, 2 );
        add_action( 'l4p_task_status_changed', [ static::class, 'task_status_changed' ], 10, 3 );
        add_action( 'l4p_funding_created', [ static::class, 'funding_event' ], 10, 2 );
        add_action( 'l4p_funding_updated', [ static::class, 'funding_event' ], 10, 2 );
        add_action( 'l4p_funding_deleted', [ static::class, 'funding_deleted' ], 10, 2 );
        add_action( 'l4p_post_created', [ static::class, 'post_created' ], 10, 2 );
        add_action( 'l4p_comment_created', [ static::class, 'comment_created' ], 10, 2 );
        add_action( 'l4p_moderation_request', [ static::class, 'moderation_request' ] );
    }

    private static function insert( array $data ): void {
        global $wpdb;
        $payload = [
            'title'      => sanitize_text_field( $data['title'] ?? '' ),
            'body'       => sanitize_textarea_field( $data['body'] ?? '' ),
            'type'       => sanitize_text_field( $data['type'] ?? 'info' ),
            'is_read'    => 0,
            'created_at' => current_time( 'mysql' ),
        ];

        $formats = [ '%s', '%s', '%s', '%d', '%s' ];

        if ( isset( $data['user_id'] ) && $data['user_id'] ) {
            $payload = array_merge( [ 'user_id' => (int) $data['user_id'] ], $payload );
            array_unshift( $formats, '%d' );
        }

        $wpdb->insert( $wpdb->prefix . 'l4p_notifications', $payload, $formats );
    }

    public static function task_created( array $task, int $creator_id = 0 ): void {
        $assignee_name = $task['assignee_name'] ?? self::user_display_name( (int) ( $task['assignee_id'] ?? 0 ) );
        $assigner_name = $task['created_by_name'] ?? self::user_display_name( $creator_id ?: (int) ( $task['created_by'] ?? 0 ) );

        self::insert(
            [
                'user_id' => $task['assignee_id'] ?? null,
                'title'   => __( 'New Task Assigned', 'local-4-picnic-manager' ),
                'body'    => sprintf(
                    __( '%1$s assigned "%2$s" to %3$s.', 'local-4-picnic-manager' ),
                    $assigner_name ?: __( 'A coordinator', 'local-4-picnic-manager' ),
                    $task['title'] ?? '',
                    $assignee_name ?: __( 'you', 'local-4-picnic-manager' )
                ),
                'type'    => 'success',
            ]
        );
    }

    public static function task_status_changed( array $task, int $actor_id = 0, string $status = '' ): void {
        $actor_name    = self::user_display_name( $actor_id );
        $assignee_name = $task['assignee_name'] ?? self::user_display_name( (int) ( $task['assignee_id'] ?? 0 ) );
        $status_label  = $status ?: ( $task['status'] ?? '' );

        self::insert(
            [
                'user_id' => $task['assignee_id'] ?? null,
                'title'   => __( 'Task Status Updated', 'local-4-picnic-manager' ),
                'body'    => sprintf(
                    __( '%1$s marked "%2$s" as %3$s for %4$s.', 'local-4-picnic-manager' ),
                    $actor_name ?: __( 'A teammate', 'local-4-picnic-manager' ),
                    $task['title'] ?? '',
                    $status_label,
                    $assignee_name ?: __( 'the assignee', 'local-4-picnic-manager' )
                ),
                'type'    => 'info',
            ]
        );
    }

    public static function funding_event( array $tx, string $action ): void {
        self::insert(
            [
                'title' => __( 'Funding Update', 'local-4-picnic-manager' ),
                'body'  => sprintf( __( 'Funding transaction %s: %s %s', 'local-4-picnic-manager' ), $action, $tx['type'], $tx['amount'] ),
                'type'  => 'warning',
            ]
        );
    }

    public static function funding_deleted( int $id, array $tx ): void {
        self::insert(
            [
                'title' => __( 'Funding Removed', 'local-4-picnic-manager' ),
                'body'  => sprintf( __( 'Transaction #%d has been deleted.', 'local-4-picnic-manager' ), $id ),
                'type'  => 'error',
            ]
        );
    }

    public static function post_created( array $post, array $author ): void {
        self::insert(
            [
                'title' => __( 'New Community Post', 'local-4-picnic-manager' ),
                'body'  => sprintf( __( '%s posted a new message.', 'local-4-picnic-manager' ), $author['display_name'] ?? '' ),
                'type'  => 'success',
            ]
        );
    }

    public static function comment_created( array $comment, array $author ): void {
        self::insert(
            [
                'title' => __( 'New Reply', 'local-4-picnic-manager' ),
                'body'  => sprintf( __( '%s replied in the community feed.', 'local-4-picnic-manager' ), $author['display_name'] ?? '' ),
                'type'  => 'info',
            ]
        );
    }

    public static function moderation_request( array $payload ): void {
        self::insert(
            [
                'title' => __( 'Moderation Request', 'local-4-picnic-manager' ),
                'body'  => sprintf( __( 'Moderation requested by %s for %s', 'local-4-picnic-manager' ), $payload['requester']['name'] ?? __( 'Unknown', 'local-4-picnic-manager' ), $payload['type'] ?? 'action' ),
                'type'  => 'warning',
            ]
        );
    }

    private static function user_display_name( int $user_id ): string {
        if ( ! $user_id ) {
            return '';
        }

        $user = get_user_by( 'id', $user_id );
        return $user ? $user->display_name : '';
    }
}

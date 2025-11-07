<?php
/**
 * Notifications manager.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Local4Picnic_Notifications
 */
class Local4Picnic_Notifications {

    /**
     * Settings handler.
     *
     * @var Local4Picnic_Settings
     */
    protected $settings;

    /**
     * Constructor.
     */
    public function __construct( Local4Picnic_Settings $settings ) {
        $this->settings = $settings;
    }

    /**
     * Create notification record.
     */
    public function create( $type, $message, $user_id = null, $entity_type = null, $entity_id = null ) {
        global $wpdb;

        $wpdb->insert(
            $wpdb->prefix . 'l4p_notifications',
            array(
                'type'        => sanitize_key( $type ),
                'message'     => wp_strip_all_tags( $message ),
                'user_id'     => $user_id ? (int) $user_id : null,
                'entity_type' => $entity_type ? sanitize_key( $entity_type ) : null,
                'entity_id'   => $entity_id ? (int) $entity_id : null,
            ),
            array( '%s', '%s', '%d', '%s', '%d' )
        );

        $this->maybe_send_email( $type, $message, $user_id );
    }

    /**
     * Notifications list.
     */
    public function get_notifications( $user_id, $limit = 20 ) {
        global $wpdb;

        $query = $wpdb->prepare(
            "SELECT * FROM {$wpdb->prefix}l4p_notifications WHERE user_id IS NULL OR user_id = %d ORDER BY created_at DESC LIMIT %d",
            $user_id,
            $limit
        );

        $items = $wpdb->get_results( $query, ARRAY_A );

        foreach ( $items as &$item ) {
            $item['id']      = (int) $item['id'];
            $item['user_id'] = $item['user_id'] ? (int) $item['user_id'] : null;
            $item['is_read'] = (bool) $item['is_read'];
        }

        return $items;
    }

    /**
     * Mark notification read.
     */
    public function mark_read( $id, $user_id ) {
        global $wpdb;

        $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$wpdb->prefix}l4p_notifications SET is_read = 1 WHERE id = %d AND ( user_id IS NULL OR user_id = %d )",
                (int) $id,
                (int) $user_id
            )
        );
    }

    /**
     * Mark all notifications read for a user.
     */
    public function mark_all_read( $user_id ) {
        global $wpdb;

        $wpdb->query(
            $wpdb->prepare(
                "UPDATE {$wpdb->prefix}l4p_notifications SET is_read = 1 WHERE user_id IS NULL OR user_id = %d",
                (int) $user_id
            )
        );
    }

    /**
     * Count unread notifications.
     */
    public function count_unread( $user_id ) {
        global $wpdb;

        $query = $wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->prefix}l4p_notifications WHERE is_read = 0 AND ( user_id IS NULL OR user_id = %d )",
            (int) $user_id
        );

        return (int) $wpdb->get_var( $query );
    }

    /**
     * Notify new member.
     */
    public function notify_new_member( $user_id ) {
        $user = get_user_by( 'id', $user_id );

        $message = sprintf( __( 'New member %s joined the crew.', 'local4picnic' ), $user->display_name );

        $this->create( 'new_member', $message );
    }

    /**
     * Task events.
     */
    public function notify_task_event( $action, array $task ) {
        $message = sprintf(
            __( 'Task "%1$s" was %2$s.', 'local4picnic' ),
            $task['title'],
            $action
        );

        $this->create( 'task_' . $action, $message, $task['assignee_id'], 'task', $task['id'] );

        if ( ! empty( $task['assignee_id'] ) ) {
            $assignee = get_user_by( 'id', $task['assignee_id'] );
            if ( $assignee ) {
                $this->create( 'task_assigned', $message, $assignee->ID, 'task', $task['id'] );
            }
        }
    }

    public function notify_task_deleted( $task_id ) {
        $this->create( 'task_deleted', __( 'A task was removed.', 'local4picnic' ), null, 'task', $task_id );
    }

    /**
     * Funding events.
     */
    public function notify_funding_event( array $record ) {
        $message = sprintf(
            __( 'Funding %1$s of %2$s recorded.', 'local4picnic' ),
            $record['type'],
            $record['amount']
        );

        $this->create( 'funding', $message );
    }

    /**
     * Community events.
     */
    public function notify_community_event( $type, array $record ) {
        $message = 'post' === $type ? __( 'New community post created.', 'local4picnic' ) : __( 'New comment added.', 'local4picnic' );

        $this->create( 'community_' . $type, $message );

        if ( 'comment' === $type && ! empty( $record['post_id'] ) ) {
            $post_author = $this->get_post_author( (int) $record['post_id'] );
            if ( $post_author ) {
                $this->create( 'post_reply', __( 'Someone replied to your post.', 'local4picnic' ), $post_author, 'post', (int) $record['post_id'] );
            }
        }
    }

    /**
     * Build latest notifications for dashboard.
     */
    public function latest( $limit = 10 ) {
        return $this->get_notifications( get_current_user_id(), $limit );
    }

    /**
     * Send email if enabled.
     */
    protected function maybe_send_email( $type, $message, $user_id = null ) {
        $settings = $this->settings->get_settings();
        $emails   = isset( $settings['notifications_email'] ) ? $settings['notifications_email'] : array();

        if ( empty( $emails['enabled'] ) ) {
            return;
        }

        if ( empty( $emails['events'][ $type ]['enabled'] ) ) {
            return;
        }

        $event_subject = ! empty( $emails['events'][ $type ]['subject'] ) ? $emails['events'][ $type ]['subject'] : $message;
        $event_body    = ! empty( $emails['events'][ $type ]['body'] ) ? $emails['events'][ $type ]['body'] : $message;

        $subject = sprintf( '[Local Picnic] %s', $event_subject );
        $body    = $event_body;

        if ( $user_id ) {
            $user = get_user_by( 'id', $user_id );
            if ( $user ) {
                wp_mail( $user->user_email, $subject, $body );
            }
        } else {
            $admins = get_users( array( 'role' => 'l4p_coordinator' ) );
            foreach ( $admins as $admin ) {
                wp_mail( $admin->user_email, $subject, $body );
            }
        }
    }

    protected function get_post_author( $post_id ) {
        global $wpdb;

        return (int) $wpdb->get_var( $wpdb->prepare( "SELECT author_id FROM {$wpdb->prefix}l4p_posts WHERE id = %d", $post_id ) );
    }
}

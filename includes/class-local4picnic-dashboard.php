<?php
/**
 * Dashboard aggregate data.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Local4Picnic_Dashboard
 */
class Local4Picnic_Dashboard {

    /**
     * Notifications handler.
     *
     * @var Local4Picnic_Notifications
     */
    protected $notifications;

    /**
     * Constructor.
     */
    public function __construct( Local4Picnic_Notifications $notifications ) {
        $this->notifications = $notifications;
    }

    /**
     * Build dashboard snapshot.
     */
    public function build_snapshot() {
        return array(
            'myTasks'         => $this->get_my_tasks(),
            'fundingSnapshot' => $this->get_funding_snapshot(),
            'notifications'   => $this->notifications->latest( 10 ),
            'community'       => $this->get_recent_posts(),
        );
    }

    protected function get_my_tasks() {
        global $wpdb;

        $user_id = get_current_user_id();

        $tasks = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}l4p_tasks WHERE assignee_id = %d ORDER BY due_date ASC LIMIT 3",
                $user_id
            ),
            ARRAY_A
        );

        return array_map(
            static function ( $task ) {
                $task['id']         = (int) $task['id'];
                $task['assignee_id'] = $task['assignee_id'] ? (int) $task['assignee_id'] : null;
                $task['created_by'] = (int) $task['created_by'];

                return $task;
            },
            $tasks
        );
    }

    protected function get_funding_snapshot() {
        global $wpdb;

        $today = gmdate( 'Y-m-d' );

        $ranges = array(
            'today' => 1,
            '7d'    => 7,
            '30d'   => 30,
        );

        $snapshot = array();

        foreach ( $ranges as $label => $days ) {
            $from = gmdate( 'Y-m-d', strtotime( '-' . ( $days - 1 ) . ' days', strtotime( $today ) ) );

            $income = (float) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COALESCE(SUM(amount),0) FROM {$wpdb->prefix}l4p_funding_tx WHERE type = 'income' AND tx_date BETWEEN %s AND %s",
                    $from,
                    $today
                )
            );

            $expense = (float) $wpdb->get_var(
                $wpdb->prepare(
                    "SELECT COALESCE(SUM(amount),0) FROM {$wpdb->prefix}l4p_funding_tx WHERE type = 'expense' AND tx_date BETWEEN %s AND %s",
                    $from,
                    $today
                )
            );

            $snapshot[ $label ] = array(
                'income'  => $income,
                'expense' => $expense,
            );
        }

        return $snapshot;
    }

    protected function get_recent_posts() {
        global $wpdb;

        $posts = $wpdb->get_results( "SELECT * FROM {$wpdb->prefix}l4p_posts ORDER BY created_at DESC LIMIT 3", ARRAY_A );

        return array_map(
            static function ( $post ) {
                $post['id']        = (int) $post['id'];
                $post['author_id'] = (int) $post['author_id'];

                return $post;
            },
            $posts
        );
    }
}

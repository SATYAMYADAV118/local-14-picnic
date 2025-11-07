<?php
/**
 * WP-CLI commands.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Local4Picnic_CLI
 */
class Local4Picnic_CLI {

    /**
     * Register commands.
     */
    public function register() {
        \WP_CLI::add_command( 'l4p seed', array( $this, 'seed' ) );
    }

    /**
     * Seed demo data.
     */
    public function seed() {
        $this->seed_users();
        $this->seed_tasks();
        $this->seed_funding();
        $this->seed_community();

        \WP_CLI::success( 'Local 4 Picnic demo data created.' );
    }

    protected function seed_users() {
        $users = array(
            array( 'email' => 'coordinator@example.com', 'role' => 'l4p_coordinator', 'name' => 'Picnic Coordinator' ),
            array( 'email' => 'volunteer@example.com', 'role' => 'l4p_volunteer', 'name' => 'Helpful Volunteer' ),
        );

        foreach ( $users as $data ) {
            $user_id = email_exists( $data['email'] );

            if ( ! $user_id ) {
                $user_id = wp_create_user( $data['email'], wp_generate_password( 12, false ), $data['email'] );
            }

            wp_update_user(
                array(
                    'ID'           => $user_id,
                    'display_name' => $data['name'],
                )
            );

            $user = get_user_by( 'id', $user_id );
            $user->set_role( $data['role'] );
        }
    }

    protected function seed_tasks() {
        global $wpdb;

        $wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}l4p_tasks" );

        $coordinator = get_user_by( 'email', 'coordinator@example.com' );
        $volunteer   = get_user_by( 'email', 'volunteer@example.com' );

        if ( ! $coordinator || ! $volunteer ) {
            return;
        }

        $tasks = array(
            array(
                'title'       => 'Set up tables',
                'description' => 'Arrange tables at the park pavilion.',
                'status'      => 'todo',
                'priority'    => 'high',
                'due_date'    => gmdate( 'Y-m-d H:i:s', strtotime( '+1 day' ) ),
                'assignee_id' => $volunteer->ID,
                'created_by'  => $coordinator->ID,
            ),
            array(
                'title'       => 'Confirm catering',
                'description' => 'Call the catering vendor to confirm menu.',
                'status'      => 'doing',
                'priority'    => 'medium',
                'due_date'    => gmdate( 'Y-m-d H:i:s', strtotime( '+2 days' ) ),
                'assignee_id' => $coordinator->ID,
                'created_by'  => $coordinator->ID,
            ),
        );

        foreach ( $tasks as $task ) {
            $wpdb->insert( $wpdb->prefix . 'l4p_tasks', $task, array( '%s', '%s', '%s', '%s', '%s', '%d', '%d' ) );
        }
    }

    protected function seed_funding() {
        global $wpdb;

        $wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}l4p_funding_tx" );

        $coordinator = get_user_by( 'email', 'coordinator@example.com' );

        if ( ! $coordinator ) {
            return;
        }

        $funding = array(
            array(
                'type'       => 'income',
                'amount'     => 1200.00,
                'category'   => 'Sponsorship',
                'note'       => 'Community sponsor',
                'tx_date'    => gmdate( 'Y-m-d', strtotime( '-3 days' ) ),
                'created_by' => $coordinator->ID,
            ),
            array(
                'type'       => 'expense',
                'amount'     => 450.00,
                'category'   => 'Catering',
                'note'       => 'Deposit paid',
                'tx_date'    => gmdate( 'Y-m-d', strtotime( '-1 day' ) ),
                'created_by' => $coordinator->ID,
            ),
        );

        foreach ( $funding as $record ) {
            $wpdb->insert( $wpdb->prefix . 'l4p_funding_tx', $record, array( '%s', '%f', '%s', '%s', '%s', '%d' ) );
        }
    }

    protected function seed_community() {
        global $wpdb;

        $wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}l4p_posts" );
        $wpdb->query( "TRUNCATE TABLE {$wpdb->prefix}l4p_comments" );

        $coordinator = get_user_by( 'email', 'coordinator@example.com' );
        $volunteer   = get_user_by( 'email', 'volunteer@example.com' );

        if ( ! $coordinator || ! $volunteer ) {
            return;
        }

        $wpdb->insert(
            $wpdb->prefix . 'l4p_posts',
            array(
                'author_id' => $coordinator->ID,
                'body'      => 'Welcome to the picnic community feed! Share updates here.',
            ),
            array( '%d', '%s' )
        );

        $post_id = $wpdb->insert_id;

        $wpdb->insert(
            $wpdb->prefix . 'l4p_comments',
            array(
                'post_id'   => $post_id,
                'author_id' => $volunteer->ID,
                'body'      => 'Thanks! I can help with setup on Saturday.',
            ),
            array( '%d', '%d', '%s' )
        );
    }
}

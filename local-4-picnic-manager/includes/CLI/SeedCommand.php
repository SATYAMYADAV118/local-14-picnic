<?php
namespace Local4Picnic\Services;

use WP_CLI;
use WP_CLI_Command;

class SeedCommand {
    public static function init(): void {
        if ( defined( 'WP_CLI' ) && WP_CLI ) {
            WP_CLI::add_command( 'l4p seed', [ static::class, 'handle' ] );
        }
    }

    public static function handle( array $args, array $assoc_args ): void {
        $force  = isset( $assoc_args['force'] );
        $seeder = new SeedRunner();
        $seeder->run( $force );
    }
}

class SeedRunner extends WP_CLI_Command {
    public function run( bool $force = false ): void {
        global $wpdb;

        WP_CLI::line( 'Seeding Local 4 Picnic data...' );

        $coordinator = $this->ensure_user( 'l4p_coordinator', 'Coordinator Carla', 'coordinator@local4picnic.test', 'coordinator123', 'l4p_coordinator' );
        $vol1        = $this->ensure_user( 'l4p_volunteer_1', 'Volunteer Victor', 'victor@local4picnic.test', 'volunteer123', 'l4p_volunteer' );
        $vol2        = $this->ensure_user( 'l4p_volunteer_2', 'Volunteer Violet', 'violet@local4picnic.test', 'volunteer123', 'l4p_volunteer' );

        $tasks_table = $wpdb->prefix . 'l4p_tasks';
        if ( $this->table_has_data( $tasks_table ) && ! $force ) {
            WP_CLI::warning( 'Tasks table already contains data. Skipping task seed (use --force to reset).' );
        } else {
            $this->reset_table( $tasks_table, $force );
            $tasks = [
                [ 'Community Outreach', 'Coordinate outreach emails', 'progress', 'high', gmdate( 'Y-m-d H:i:s', strtotime( '+2 days' ) ), '', $vol1 ],
                [ 'Venue Setup', 'Confirm tents and seating', 'todo', 'medium', gmdate( 'Y-m-d H:i:s', strtotime( '+5 days' ) ), '', $vol2 ],
                [ 'Sponsorship Follow-up', 'Call potential sponsors', 'done', 'low', gmdate( 'Y-m-d H:i:s', strtotime( '-1 days' ) ), '', $coordinator ],
            ];
            foreach ( $tasks as $task ) {
                $wpdb->insert(
                    $tasks_table,
                    [
                        'title'       => $task[0],
                        'description' => $task[1],
                        'status'      => $task[2],
                        'priority'    => $task[3],
                        'due_date'    => $task[4],
                        'url'         => $task[5],
                        'assignee_id' => $task[6],
                        'created_by'  => $coordinator,
                        'created_at'  => current_time( 'mysql' ),
                    ]
                );
            }
        }

        $funding_table = $wpdb->prefix . 'l4p_funding_tx';
        if ( $this->table_has_data( $funding_table ) && ! $force ) {
            WP_CLI::warning( 'Funding table already contains data. Skipping funding seed (use --force to reset).' );
        } else {
            $this->reset_table( $funding_table, $force );
            $funds = [
                [ 'income', 2500.00, 'Donations', 'Community donors', gmdate( 'Y-m-d', strtotime( '-3 days' ) ), $coordinator ],
                [ 'expense', 450.00, 'Supplies', 'Picnic supplies', gmdate( 'Y-m-d', strtotime( '-2 days' ) ), $coordinator ],
                [ 'expense', 125.00, 'Marketing', 'Flyers', gmdate( 'Y-m-d', strtotime( '-1 day' ) ), $coordinator ],
            ];
            foreach ( $funds as $fund ) {
                $wpdb->insert(
                    $funding_table,
                    [
                        'type'       => $fund[0],
                        'amount'     => $fund[1],
                        'category'   => $fund[2],
                        'note'       => $fund[3],
                        'tx_date'    => $fund[4],
                        'created_by' => $fund[5],
                        'created_at' => current_time( 'mysql' ),
                    ]
                );
            }
        }

        $posts_table = $wpdb->prefix . 'l4p_posts';
        $comments_table = $wpdb->prefix . 'l4p_comments';
        if ( $this->table_has_data( $posts_table ) && ! $force ) {
            WP_CLI::warning( 'Community tables already contain data. Skipping community seed (use --force to reset).' );
        } else {
            $this->reset_table( $posts_table, $force );
            $this->reset_table( $comments_table, $force );
            $wpdb->insert(
                $posts_table,
                [
                    'author_id'  => $vol1,
                    'body'       => 'Excited for the picnic! Let\'s coordinate shifts.',
                    'created_at' => current_time( 'mysql' ),
                ]
            );
            $post_id = $wpdb->insert_id;
            $wpdb->insert(
                $comments_table,
                [
                    'post_id'    => $post_id,
                    'author_id'  => $vol2,
                    'body'       => 'I can cover the welcome table in the morning.',
                    'created_at' => current_time( 'mysql' ),
                ]
            );
        }

        CrewSync::force_resync();

        WP_CLI::success( 'Seed data created. Users: coordinator@local4picnic.test / coordinator123' );
    }

    private function ensure_user( string $username, string $name, string $email, string $password, string $role ): int {
        $user = get_user_by( 'login', $username );
        if ( $user ) {
            wp_update_user(
                [
                    'ID'           => $user->ID,
                    'display_name' => $name,
                    'user_email'   => $email,
                    'role'         => $role,
                ]
            );
            return (int) $user->ID;
        }

        return wp_insert_user(
            [
                'user_login'   => $username,
                'user_pass'    => $password,
                'display_name' => $name,
                'user_email'   => $email,
                'role'         => $role,
            ]
        );
    }

    private function table_has_data( string $table ): bool {
        global $wpdb;
        return (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" ) > 0;
    }

    private function reset_table( string $table, bool $force ): void {
        global $wpdb;
        if ( $force ) {
            $wpdb->query( "TRUNCATE TABLE {$table}" );
        } else {
            $wpdb->query( "DELETE FROM {$table}" );
        }
    }
}

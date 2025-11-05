<?php
/**
 * Plugin roles and capabilities.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class L4P_Roles {
    const COORDINATOR = 'local4_coordinator';
    const VOLUNTEER   = 'local4_volunteer';

    /**
     * Activation callback.
     */
    public static function activate() {
        self::add_roles();
        self::add_capabilities();
    }

    /**
     * Deactivation callback.
     */
    public static function deactivate() {
        self::remove_capabilities();
        // Intentionally keep roles so assignments are preserved.
    }

    /**
     * Add custom roles.
     */
    protected static function add_roles() {
        add_role(
            self::COORDINATOR,
            __( 'Picnic Coordinator', 'local4-picnic' ),
            array(
                'read'                   => true,
                'upload_files'           => true,
                'edit_posts'             => false,
                'manage_options'         => false,
            )
        );

        add_role(
            self::VOLUNTEER,
            __( 'Picnic Volunteer', 'local4-picnic' ),
            array(
                'read'         => true,
                'edit_posts'   => false,
                'upload_files' => false,
            )
        );
    }

    /**
     * Add capabilities to roles and administrators.
     */
    protected static function add_capabilities() {
        $caps = self::all_capabilities();

        $coordinator_caps = array_fill_keys( $caps, true );

        $coordinator_caps['assign_l4p_tasks'] = true;

        $volunteer_caps = array(
            'read_l4p_task'             => true,
            'read_l4p_tasks'            => true,
            'read_private_l4p_tasks'    => true,
            'edit_l4p_task'             => true,
            'edit_published_l4p_tasks'  => true,
            'read_l4p_funding'          => true,
            'read_l4p_fundings'         => true,
            'read_l4p_crew'             => true,
            'read_l4p_crews'            => true,
            'read_l4p_feed'             => true,
            'read_l4p_feeds'            => true,
            'edit_l4p_feed'             => true,
            'edit_published_l4p_feeds'  => true,
            'publish_l4p_feeds'         => true,
        );

        $administrator = get_role( 'administrator' );
        if ( $administrator ) {
            foreach ( $caps as $cap ) {
                $administrator->add_cap( $cap );
            }
        }

        $coordinator = get_role( self::COORDINATOR );
        if ( $coordinator ) {
            foreach ( $coordinator_caps as $cap => $grant ) {
                if ( $grant ) {
                    $coordinator->add_cap( $cap );
                }
            }
        }

        $volunteer = get_role( self::VOLUNTEER );
        if ( $volunteer ) {
            foreach ( $volunteer_caps as $cap => $grant ) {
                if ( $grant ) {
                    $volunteer->add_cap( $cap );
                }
            }
        }
    }

    /**
     * Remove custom capabilities on deactivation.
     */
    protected static function remove_capabilities() {
        $roles = array( 'administrator', self::COORDINATOR, self::VOLUNTEER );
        $caps  = self::all_capabilities();

        foreach ( $roles as $role_name ) {
            $role = get_role( $role_name );
            if ( ! $role ) {
                continue;
            }

            foreach ( $caps as $cap ) {
                $role->remove_cap( $cap );
            }
        }
    }

    /**
     * Master list of custom capabilities.
     */
    protected static function all_capabilities() {
        return array(
            // Task capabilities.
            'read_l4p_task',
            'read_l4p_tasks',
            'read_private_l4p_tasks',
            'edit_l4p_task',
            'edit_l4p_tasks',
            'edit_others_l4p_tasks',
            'edit_published_l4p_tasks',
            'edit_private_l4p_tasks',
            'publish_l4p_tasks',
            'delete_l4p_task',
            'delete_l4p_tasks',
            'delete_others_l4p_tasks',
            'delete_published_l4p_tasks',
            'delete_private_l4p_tasks',
            'assign_l4p_tasks',
            // Funding capabilities.
            'read_l4p_funding',
            'read_l4p_fundings',
            'edit_l4p_funding',
            'edit_l4p_fundings',
            'edit_others_l4p_fundings',
            'edit_published_l4p_fundings',
            'edit_private_l4p_fundings',
            'publish_l4p_fundings',
            'delete_l4p_funding',
            'delete_l4p_fundings',
            'delete_others_l4p_fundings',
            'delete_published_l4p_fundings',
            'delete_private_l4p_fundings',
            // Crew capabilities.
            'read_l4p_crew',
            'read_l4p_crews',
            'edit_l4p_crew',
            'edit_l4p_crews',
            'edit_others_l4p_crews',
            'edit_published_l4p_crews',
            'edit_private_l4p_crews',
            'publish_l4p_crews',
            'delete_l4p_crew',
            'delete_l4p_crews',
            'delete_others_l4p_crews',
            'delete_published_l4p_crews',
            'delete_private_l4p_crews',
            // Feed capabilities.
            'read_l4p_feed',
            'read_l4p_feeds',
            'edit_l4p_feed',
            'edit_l4p_feeds',
            'edit_others_l4p_feeds',
            'edit_published_l4p_feeds',
            'edit_private_l4p_feeds',
            'publish_l4p_feeds',
            'delete_l4p_feed',
            'delete_l4p_feeds',
            'delete_others_l4p_feeds',
            'delete_published_l4p_feeds',
            'delete_private_l4p_feeds',
        );
    }
}

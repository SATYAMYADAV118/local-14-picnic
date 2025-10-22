<?php
/**
 * Handle Local4Picnic roles and capabilities.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Roles {

    /**
     * Role map.
     *
     * @var array
     */
    protected static $roles = array(
        'local4picnic_volunteer' => array(
            'name'         => 'Volunteer',
            'capabilities' => array(
                'read'                 => true,
                'l4p_view_dashboard'   => true,
                'l4p_view_tasks'       => true,
                'l4p_view_feed'        => true,
                'l4p_view_funding'     => true,
            ),
        ),
        'local4picnic_coordinator' => array(
            'name'         => 'Coordinator',
            'capabilities' => array(
                'read'                   => true,
                'l4p_view_dashboard'     => true,
                'l4p_view_tasks'         => true,
                'l4p_manage_tasks'       => true,
                'l4p_view_feed'          => true,
                'l4p_manage_feed'        => true,
                'l4p_view_funding'       => true,
                'l4p_manage_funding'     => true,
                'l4p_view_crew'          => true,
                'l4p_manage_crew'        => true,
                'l4p_manage_notifications' => true,
            ),
        ),
    );

    /**
     * Add custom roles.
     */
    public static function add_roles() {
        foreach ( self::$roles as $key => $role ) {
            add_role( $key, $role['name'], $role['capabilities'] );
        }
    }

    /**
     * Ensure administrators receive plugin capabilities.
     */
    public static function add_caps() {
        $administrator = get_role( 'administrator' );

        if ( ! $administrator instanceof WP_Role ) {
            return;
        }

        foreach ( self::get_all_caps() as $cap ) {
            if ( 'read' === $cap ) {
                continue;
            }

            $administrator->add_cap( $cap );
        }
    }

    /**
     * Remove plugin capabilities from administrator.
     */
    public static function remove_caps() {
        $administrator = get_role( 'administrator' );

        if ( ! $administrator instanceof WP_Role ) {
            return;
        }

        foreach ( self::get_all_caps() as $cap ) {
            if ( 'read' === $cap ) {
                continue;
            }

            $administrator->remove_cap( $cap );
        }
    }

    /**
     * Remove custom roles.
     */
    public static function remove_roles() {
        foreach ( array_keys( self::$roles ) as $key ) {
            remove_role( $key );
        }
    }

    /**
     * Return all defined capabilities.
     *
     * @return array
     */
    protected static function get_all_caps() {
        $caps = array();

        foreach ( self::$roles as $role ) {
            $caps = array_merge( $caps, array_keys( $role['capabilities'] ) );
        }

        return array_unique( $caps );
    }
}

<?php
/**
 * Manage Local4Picnic user roles and capabilities.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Roles {

    /**
     * Custom roles configuration.
     *
     * @var array
     */
    protected static $roles = array(
        'local4picnic_volunteer'   => array(
            'name'         => 'Volunteer',
            'capabilities' => array(
                'read'                 => true,
                'l4p_view_funding'     => true,
                'l4p_view_feed'        => true,
                'upload_files'         => false,
                'edit_posts'           => false,
            ),
        ),
        'local4picnic_coordinator' => array(
            'name'         => 'Coordinator',
            'capabilities' => array(
                'read'                     => true,
                'l4p_view_funding'         => true,
                'l4p_view_feed'            => true,
                'l4p_manage_funding'       => true,
                'l4p_manage_volunteers'    => true,
                'l4p_manage_notifications' => true,
                'edit_posts'               => true,
                'publish_posts'            => true,
            ),
        ),
    );

    /**
     * Return all custom capability keys for the plugin.
     *
     * @return array
     */
    protected static function get_cap_keys() {
        $caps = array();

        foreach ( self::$roles as $role ) {
            $caps = array_merge( $caps, array_keys( $role['capabilities'] ) );
        }

        return array_unique( $caps );
    }

    /**
     * Register custom roles.
     */
    public static function add_roles() {
        foreach ( self::$roles as $role_key => $role ) {
            add_role( $role_key, $role['name'], $role['capabilities'] );
        }
    }

    /**
     * Ensure administrators retain plugin capabilities.
     */
    public static function add_caps() {
        $administrator = get_role( 'administrator' );

        if ( ! $administrator instanceof WP_Role ) {
            return;
        }

        foreach ( self::get_cap_keys() as $capability ) {
            if ( 'read' === $capability ) {
                continue;
            }

            $administrator->add_cap( $capability );
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

        foreach ( self::get_cap_keys() as $capability ) {
            if ( 'read' === $capability ) {
                continue;
            }

            $administrator->remove_cap( $capability );
        }
    }

    /**
     * Remove custom roles.
     */
    public static function remove_roles() {
        foreach ( array_keys( self::$roles ) as $role_key ) {
            remove_role( $role_key );
        }
    }

    /**
     * Retrieve the role configuration.
     *
     * @return array
     */
    public static function get_roles() {
        return self::$roles;
    }
}

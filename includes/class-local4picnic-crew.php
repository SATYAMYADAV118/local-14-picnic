<?php
/**
 * Crew management.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * Class Local4Picnic_Crew
 */
class Local4Picnic_Crew {

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
     * Ensure roles exist when admin loads.
     */
    public function maybe_sync_roles() {
        $activator = new Local4Picnic_Activator();
        $activator->ensure_roles();
    }

    /**
     * Register custom image size for avatars.
     */
    public function register_media_sizes() {
        add_image_size( 'l4p-avatar', 160, 160, true );
    }

    /**
     * List crew members.
     */
    public function list_members() {
        $roles = array( 'l4p_coordinator', 'l4p_volunteer' );

        $users = get_users(
            array(
                'role__in' => $roles,
                'orderby'  => 'display_name',
                'order'    => 'ASC',
            )
        );

        $members = array();
        foreach ( $users as $user ) {
            $avatar = get_user_meta( $user->ID, 'l4p_avatar_url', true );
            if ( empty( $avatar ) ) {
                $avatar = get_avatar_url( $user->ID, array( 'size' => 160 ) );
            }

            $members[] = array(
                'id'       => $user->ID,
                'name'     => $user->display_name,
                'email'    => $user->user_email,
                'phone'    => get_user_meta( $user->ID, 'l4p_phone', true ),
                'role'     => $this->get_role_slug( $user ),
                'role_label' => $this->get_role_label( $user ),
                'skills'   => $this->get_skills( $user->ID ),
                'avatar'   => $avatar,
                'disabled' => (bool) get_user_meta( $user->ID, 'l4p_disabled', true ),
            );
        }

        return $members;
    }

    /**
     * Create member.
     */
    public function create_member( array $params ) {
        $email = sanitize_email( $params['email'] );
        $name  = sanitize_text_field( $params['name'] );
        $phone = isset( $params['phone'] ) ? sanitize_text_field( $params['phone'] ) : '';
        $role  = in_array( $params['role'], array( 'l4p_coordinator', 'l4p_volunteer' ), true ) ? $params['role'] : 'l4p_volunteer';
        $skills = isset( $params['skills'] ) ? array_map( 'sanitize_text_field', (array) $params['skills'] ) : array();

        if ( empty( $email ) ) {
            return new WP_Error( 'l4p_invalid_email', __( 'A valid email address is required.', 'local4picnic' ), array( 'status' => 400 ) );
        }

        $user_id = email_exists( $email );

        if ( $user_id ) {
            $user = get_user_by( 'id', $user_id );
            if ( $user && $name ) {
                wp_update_user(
                    array(
                        'ID'           => $user_id,
                        'display_name' => $name,
                        'nickname'     => $name,
                    )
                );
            }
        } else {
            $password = wp_generate_password( 12, true );
            $user_id  = wp_create_user( $email, $password, $email );

            if ( is_wp_error( $user_id ) ) {
                return $user_id;
            }

            wp_update_user(
                array(
                    'ID'           => $user_id,
                    'display_name' => $name,
                    'nickname'     => $name,
                )
            );

            $user = get_user_by( 'id', $user_id );
        }

        $user->set_role( $role );

        update_user_meta( $user_id, 'l4p_phone', $phone );
        update_user_meta( $user_id, 'l4p_skills', $skills );
        update_user_meta( $user_id, 'l4p_disabled', ! empty( $params['disabled'] ) ? 1 : 0 );

        if ( isset( $params['avatar_url'] ) ) {
            if ( $params['avatar_url'] ) {
                update_user_meta( $user_id, 'l4p_avatar_url', esc_url_raw( $params['avatar_url'] ) );
            } else {
                delete_user_meta( $user_id, 'l4p_avatar_url' );
            }
        }

        return $this->get_member( $user_id );
    }

    /**
     * Update member information.
     */
    public function update_member( array $params ) {
        if ( empty( $params['id'] ) ) {
            return new WP_Error( 'l4p_member_id_missing', __( 'Member ID is required.', 'local4picnic' ) );
        }

        $user_id = (int) $params['id'];
        $user    = get_user_by( 'id', $user_id );

        if ( ! $user ) {
            return new WP_Error( 'l4p_member_not_found', __( 'Member not found.', 'local4picnic' ), array( 'status' => 404 ) );
        }

        if ( isset( $params['role'] ) ) {
            $role = sanitize_text_field( $params['role'] );
            if ( in_array( $role, array( 'l4p_coordinator', 'l4p_volunteer' ), true ) ) {
                $user->set_role( $role );
            }
        }

        if ( array_key_exists( 'disabled', $params ) ) {
            update_user_meta( $user_id, 'l4p_disabled', $params['disabled'] ? 1 : 0 );
        }

        if ( isset( $params['skills'] ) ) {
            update_user_meta( $user_id, 'l4p_skills', array_map( 'sanitize_text_field', (array) $params['skills'] ) );
        }

        if ( isset( $params['phone'] ) ) {
            update_user_meta( $user_id, 'l4p_phone', sanitize_text_field( $params['phone'] ) );
        }

        if ( array_key_exists( 'avatar_url', $params ) ) {
            if ( $params['avatar_url'] ) {
                update_user_meta( $user_id, 'l4p_avatar_url', esc_url_raw( $params['avatar_url'] ) );
            } else {
                delete_user_meta( $user_id, 'l4p_avatar_url' );
            }
        }

        return $this->get_member( $user_id );
    }

    /**
     * Fetch single member.
     */
    public function get_member( $user_id ) {
        $user = get_user_by( 'id', $user_id );

        if ( ! $user ) {
            return null;
        }

        return array(
            'id'       => $user->ID,
            'name'     => $user->display_name,
            'email'    => $user->user_email,
            'phone'    => get_user_meta( $user->ID, 'l4p_phone', true ),
            'role'     => $this->get_role_slug( $user ),
            'role_label' => $this->get_role_label( $user ),
            'skills'   => $this->get_skills( $user->ID ),
            'avatar'   => get_user_meta( $user->ID, 'l4p_avatar_url', true ) ? get_user_meta( $user->ID, 'l4p_avatar_url', true ) : get_avatar_url( $user->ID, array( 'size' => 160 ) ),
            'disabled' => (bool) get_user_meta( $user->ID, 'l4p_disabled', true ),
        );
    }

    /**
     * Human readable role.
     */
    protected function get_role_label( WP_User $user ) {
        if ( in_array( 'l4p_coordinator', (array) $user->roles, true ) ) {
            return 'Coordinator';
        }

        if ( in_array( 'l4p_volunteer', (array) $user->roles, true ) ) {
            return 'Volunteer';
        }

        return ucfirst( implode( ', ', $user->roles ) );
    }

    /**
     * Machine role slug.
     */
    protected function get_role_slug( WP_User $user ) {
        if ( in_array( 'l4p_coordinator', (array) $user->roles, true ) ) {
            return 'l4p_coordinator';
        }

        if ( in_array( 'l4p_volunteer', (array) $user->roles, true ) ) {
            return 'l4p_volunteer';
        }

        return ! empty( $user->roles ) ? $user->roles[0] : '';
    }

    /**
     * Fetch skills meta.
     */
    protected function get_skills( $user_id ) {
        $skills = get_user_meta( $user_id, 'l4p_skills', true );

        if ( empty( $skills ) ) {
            return array();
        }

        return is_array( $skills ) ? $skills : array_map( 'trim', explode( ',', (string) $skills ) );
    }
}

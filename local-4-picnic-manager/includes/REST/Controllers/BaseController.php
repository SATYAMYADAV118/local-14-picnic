<?php
namespace Local4Picnic\REST\Controllers;

use WP_Error;
use WP_REST_Request;

abstract class BaseController {
    protected const NAMESPACE = 'l4p/v1';

    abstract public function register_routes(): void;

    protected function permissions_check( WP_REST_Request $request, string $cap ): bool|WP_Error {
        if ( ! wp_verify_nonce( $request->get_header( 'X-WP-Nonce' ), 'wp_rest' ) ) {
            return new WP_Error( 'rest_forbidden', __( 'Invalid nonce.', 'local-4-picnic-manager' ), [ 'status' => 403 ] );
        }

        if ( current_user_can( 'administrator' ) || current_user_can( $cap ) ) {
            return true;
        }

        return new WP_Error( 'rest_forbidden', __( 'Insufficient permissions.', 'local-4-picnic-manager' ), [ 'status' => 403 ] );
    }

    protected function sanitize_pagination( WP_REST_Request $request ): array {
        return [
            'page'     => max( 1, (int) $request->get_param( 'page' ) ?: 1 ),
            'per_page' => min( 100, max( 1, (int) $request->get_param( 'per_page' ) ?: 20 ) ),
        ];
    }
}

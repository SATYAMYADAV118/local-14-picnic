<?php
namespace Local4Picnic\REST\Controllers;

use Local4Picnic\Services\Capabilities;
use Local4Picnic\Services\Repositories\FundingRepository;
use WP_Error;
use WP_REST_Request;
use WP_REST_Response;

class FundingController extends BaseController {
    public function register_routes(): void {
        register_rest_route(
            self::NAMESPACE,
            '/funding',
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'list_transactions' ],
                    'permission_callback' => [ $this, 'can_view' ],
                ],
                [
                    'methods'             => 'POST',
                    'callback'            => [ $this, 'create_transaction' ],
                    'permission_callback' => [ $this, 'can_manage' ],
                ],
            ]
        );

        register_rest_route(
            self::NAMESPACE,
            '/funding/(?P<id>\d+)',
            [
                [
                    'methods'             => 'PUT,PATCH',
                    'callback'            => [ $this, 'update_transaction' ],
                    'permission_callback' => [ $this, 'can_manage' ],
                ],
                [
                    'methods'             => 'DELETE',
                    'callback'            => [ $this, 'delete_transaction' ],
                    'permission_callback' => [ $this, 'can_manage' ],
                ],
            ]
        );

        register_rest_route(
            self::NAMESPACE,
            '/funding/export',
            [
                [
                    'methods'             => 'GET',
                    'callback'            => [ $this, 'export_csv' ],
                    'permission_callback' => [ $this, 'can_manage' ],
                ],
            ]
        );
    }

    public function can_view( WP_REST_Request $request ): bool|WP_Error {
        return $this->permissions_check( $request, 'manage_l4p_tasks' );
    }

    public function can_manage( WP_REST_Request $request ): bool|WP_Error {
        return $this->permissions_check( $request, 'manage_l4p_funding' );
    }

    public function list_transactions( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $repo = new FundingRepository( $wpdb );
        $items = $repo->list(
            [
                'type'     => $request->get_param( 'type' ),
                'category' => $request->get_param( 'category' ),
                'from'     => $request->get_param( 'from' ),
                'to'       => $request->get_param( 'to' ),
            ]
        );

        $summary = $this->summaries( $items );

        return new WP_REST_Response(
            [
                'data'    => $items,
                'summary' => $summary,
            ]
        );
    }

    public function create_transaction( WP_REST_Request $request ): WP_REST_Response {
        $data   = $this->sanitize_payload( $request );
        $errors = $this->validate_payload( $data );
        if ( $errors ) {
            return new WP_REST_Response( [ 'errors' => $errors ], 400 );
        }

        global $wpdb;
        $repo = new FundingRepository( $wpdb );
        $tx   = $repo->create( $data );

        do_action( 'l4p_funding_created', $tx, 'created' );

        return new WP_REST_Response( $tx, 201 );
    }

    public function update_transaction( WP_REST_Request $request ): WP_REST_Response {
        $id     = (int) $request->get_param( 'id' );
        $data   = $this->sanitize_payload( $request );
        $errors = $this->validate_payload( $data );
        if ( $errors ) {
            return new WP_REST_Response( [ 'errors' => $errors ], 400 );
        }

        global $wpdb;
        $repo = new FundingRepository( $wpdb );
        $tx   = $repo->update( $id, $data );

        if ( ! $tx ) {
            return new WP_REST_Response( [ 'error' => 'Not found' ], 404 );
        }

        do_action( 'l4p_funding_updated', $tx, 'updated' );

        return new WP_REST_Response( $tx );
    }

    public function delete_transaction( WP_REST_Request $request ): WP_REST_Response {
        $id = (int) $request->get_param( 'id' );
        global $wpdb;
        $repo = new FundingRepository( $wpdb );
        $tx   = $repo->find( $id );

        if ( ! $tx ) {
            return new WP_REST_Response( [ 'error' => 'Not found' ], 404 );
        }

        $repo->delete( $id );
        do_action( 'l4p_funding_deleted', $id, $tx );

        return new WP_REST_Response( [ 'deleted' => true ] );
    }

    public function export_csv( WP_REST_Request $request ): WP_REST_Response {
        global $wpdb;
        $repo  = new FundingRepository( $wpdb );
        $items = $repo->list( [] );

        $csv   = fopen( 'php://temp', 'r+' );
        fputcsv( $csv, [ 'ID', 'Type', 'Amount', 'Category', 'Note', 'Date' ] );
        foreach ( $items as $item ) {
            fputcsv(
                $csv,
                [
                    $item['id'],
                    $item['type'],
                    $item['amount'],
                    $item['category'],
                    $item['note'],
                    $item['tx_date'],
                ]
            );
        }
        rewind( $csv );
        $contents = stream_get_contents( $csv );
        fclose( $csv );

        return new WP_REST_Response(
            $contents,
            200,
            [
                'Content-Type'        => 'text/csv',
                'Content-Disposition' => 'attachment; filename="l4p-funding.csv"',
            ]
        );
    }

    private function sanitize_payload( WP_REST_Request $request ): array {
        return [
            'type'     => sanitize_text_field( $request->get_param( 'type' ) ),
            'amount'   => $request->get_param( 'amount' ),
            'category' => sanitize_text_field( $request->get_param( 'category' ) ),
            'note'     => $request->get_param( 'note' ),
            'tx_date'  => $request->get_param( 'tx_date' ),
        ];
    }

    private function validate_payload( array $data ): array {
        $errors = [];
        if ( ! in_array( $data['type'], [ 'income', 'expense' ], true ) ) {
            $errors['type'] = __( 'Invalid type.', 'local-4-picnic-manager' );
        }

        if ( ! is_numeric( $data['amount'] ) ) {
            $errors['amount'] = __( 'Amount must be numeric.', 'local-4-picnic-manager' );
        }

        if ( empty( $data['category'] ) ) {
            $errors['category'] = __( 'Category is required.', 'local-4-picnic-manager' );
        }

        if ( empty( $data['tx_date'] ) || false === strtotime( $data['tx_date'] ) ) {
            $errors['tx_date'] = __( 'Invalid date.', 'local-4-picnic-manager' );
        }

        return $errors;
    }

    private function summaries( array $items ): array {
        $income = 0;
        $expense = 0;
        foreach ( $items as $item ) {
            if ( $item['type'] === 'income' ) {
                $income += (float) $item['amount'];
            } else {
                $expense += (float) $item['amount'];
            }
        }

        return [
            'income'  => $income,
            'expense' => $expense,
            'net'     => $income - $expense,
        ];
    }
}

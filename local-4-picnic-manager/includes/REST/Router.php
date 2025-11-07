<?php
namespace Local4Picnic\REST;

use Local4Picnic\REST\Controllers\TasksController;
use Local4Picnic\REST\Controllers\FundingController;
use Local4Picnic\REST\Controllers\CrewController;
use Local4Picnic\REST\Controllers\CommunityController;
use Local4Picnic\REST\Controllers\NotificationsController;
use Local4Picnic\REST\Controllers\SettingsController;

class Router {
    public static function init(): void {
        add_action( 'rest_api_init', [ static::class, 'register_routes' ] );
    }

    public static function register_routes(): void {
        ( new TasksController() )->register_routes();
        ( new FundingController() )->register_routes();
        ( new CrewController() )->register_routes();
        ( new CommunityController() )->register_routes();
        ( new NotificationsController() )->register_routes();
        ( new SettingsController() )->register_routes();
    }
}

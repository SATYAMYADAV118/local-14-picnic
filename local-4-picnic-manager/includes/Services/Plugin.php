<?php
namespace Local4Picnic\Services;

use Local4Picnic\Admin\AdminApp;
use Local4Picnic\REST\Router;
class Plugin {
    public static function init(): void {
        load_plugin_textdomain( 'local-4-picnic-manager', false, dirname( plugin_basename( L4P_PLUGIN_FILE ) ) . '/languages/' );

        Roles::init();
        Assets::init();
        AdminApp::init();
        Shortcodes::init();
        Router::init();
        SeedCommand::init();
        Notifications::boot();
        CrewSync::init();
    }
}

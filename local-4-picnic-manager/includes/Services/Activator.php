<?php
namespace Local4Picnic\Services;

use Local4Picnic\Database\Schema;
use Local4Picnic\Services\Roles;

class Activator {
    public static function activate(): void {
        Roles::register_roles();
        Schema::migrate();
        flush_rewrite_rules();
    }

    public static function deactivate(): void {
        flush_rewrite_rules();
    }
}

<?php
namespace Local4Picnic\Services;

use Local4Picnic\Utils\Settings;

class Capabilities {
    public static function can_manage_tasks(): bool {
        return current_user_can( 'manage_l4p_tasks' );
    }

    public static function can_manage_funding(): bool {
        return current_user_can( 'manage_l4p_funding' );
    }

    public static function can_manage_crew(): bool {
        return current_user_can( 'manage_l4p_crew' );
    }

    public static function can_manage_posts(): bool {
        return current_user_can( 'manage_l4p_posts' );
    }

    public static function can_manage_settings(): bool {
        return current_user_can( 'manage_l4p_settings' );
    }

    public static function volunteer_create_tasks_enabled(): bool {
        $settings = Settings::get();
        return (bool) ( $settings['volunteer_create_tasks'] ?? false );
    }

    public static function volunteer_post_chat_enabled(): bool {
        $settings = Settings::get();
        return (bool) ( $settings['volunteer_post_chat'] ?? false );
    }

    public static function is_coordinator(): bool {
        return current_user_can( 'manage_l4p_funding' );
    }
}

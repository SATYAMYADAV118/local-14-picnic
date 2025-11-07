<?php
namespace Local4Picnic\Services;

class Shortcodes {
    public static function init(): void {
        add_shortcode( 'l4p_dashboard', [ static::class, 'render_dashboard' ] );
    }

    public static function render_dashboard( $atts = [], $content = '' ): string {
        if ( ! is_user_logged_in() ) {
            $login_url = home_url( '/login/' );

            if ( empty( $login_url ) ) {
                $login_url = wp_login_url( get_permalink() );
            }

            ob_start();
            ?>
            <div class="l4p-login-gate">
                <div class="l4p-login-card">
                    <div class="l4p-login-heading">
                        <span class="l4p-login-badge">Local 4 Picnic Manager</span>
                        <h2><?php echo esc_html__( 'You need to sign in', 'local-4-picnic-manager' ); ?></h2>
                        <p><?php echo esc_html__( 'Access the crew dashboard, track funding, and collaborate with your team by signing in to your account.', 'local-4-picnic-manager' ); ?></p>
                    </div>
                    <a class="l4p-login-button" href="<?php echo esc_url( $login_url ); ?>">
                        <?php echo esc_html__( 'Go to login', 'local-4-picnic-manager' ); ?>
                    </a>
                </div>
            </div>
            <style>
                .l4p-login-gate {
                    min-height: 60vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, rgba(11,92,214,0.08), rgba(6,182,212,0.14));
                    padding: 48px 16px;
                }
                .l4p-login-card {
                    max-width: 480px;
                    width: 100%;
                    background: #ffffff;
                    border-radius: 20px;
                    padding: 32px;
                    box-shadow: 0 24px 60px rgba(15,23,42,0.16);
                    display: grid;
                    gap: 24px;
                    font-family: 'Inter var', 'Inter', 'Plus Jakarta Sans', 'Segoe UI', sans-serif;
                }
                .l4p-login-heading {
                    display: grid;
                    gap: 12px;
                }
                .l4p-login-heading h2 {
                    margin: 0;
                    font-size: clamp(1.5rem, 2vw, 1.9rem);
                    color: #0f172a;
                }
                .l4p-login-heading p {
                    margin: 0;
                    color: #475569;
                    font-size: 0.95rem;
                }
                .l4p-login-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #0B5CD6;
                    font-weight: 700;
                    background: rgba(11,92,214,0.12);
                    border-radius: 999px;
                    padding: 6px 12px;
                }
                .l4p-login-button {
                    display: inline-flex;
                    justify-content: center;
                    align-items: center;
                    background: linear-gradient(135deg, #0B5CD6, #06B6D4);
                    color: #ffffff;
                    text-decoration: none;
                    font-weight: 600;
                    border-radius: 999px;
                    padding: 12px 24px;
                    font-size: 1rem;
                    box-shadow: 0 14px 30px rgba(11,92,214,0.25);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .l4p-login-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 16px 36px rgba(11,92,214,0.3);
                }
                @media (max-width: 640px) {
                    .l4p-login-card {
                        padding: 28px 24px;
                    }
                }
            </style>
            <?php
            return ob_get_clean();
        }

        Assets::enqueue_for_shortcode();

        return '<div id="l4p-dashboard-root" class="l4p-viewport"></div>';
    }
}

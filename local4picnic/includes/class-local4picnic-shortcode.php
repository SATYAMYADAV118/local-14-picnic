<?php
/**
 * Shortcode renderer for the Local4Picnic dashboard.
 *
 * @package Local4Picnic
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Local4Picnic_Shortcode {

    /**
     * Public handler instance.
     *
     * @var Local4Picnic_Public
     */
    protected $public;

    /**
     * Constructor.
     *
     * @param Local4Picnic_Public $public Public handler.
     */
    public function __construct( Local4Picnic_Public $public ) {
        $this->public = $public;
    }

    /**
     * Register shortcode.
     */
    public function register() {
        add_shortcode( 'local4picnic_dashboard', array( $this, 'render' ) );
    }

    /**
     * Render shortcode output.
     *
     * @return string
     */
    public function render() {
        if ( ! is_user_logged_in() ) {
            if ( is_admin() ) {
                return '';
            }

            return sprintf(
                '<div class="local4picnic-dashboard-login">%s</div>',
                esc_html__( 'Please sign in to access the Local 4 Picnic dashboard.', 'local4picnic' )
            );
        }

        $this->enqueue_assets();

        ob_start();
        ?>
        <div class="local4picnic-dashboard" id="local4picnic-dashboard" data-view="overview">
            <header class="local4picnic-dashboard__header">
                <div class="local4picnic-dashboard__brand">
                    <span class="local4picnic-dashboard__logo" aria-hidden="true">🥕</span>
                    <div>
                        <h2><?php esc_html_e( 'Local 4 Picnic Manager', 'local4picnic' ); ?></h2>
                        <p><?php esc_html_e( 'Coordinate volunteers, funding, and community updates from one place.', 'local4picnic' ); ?></p>
                    </div>
                </div>
                <nav class="local4picnic-dashboard__nav" aria-label="<?php esc_attr_e( 'Dashboard navigation', 'local4picnic' ); ?>">
                    <button class="is-active" data-target="overview">
                        <span class="local4picnic-tab__label"><?php esc_html_e( 'Dashboard', 'local4picnic' ); ?></span>
                    </button>
                    <button data-target="tasks">
                        <span class="local4picnic-tab__label"><?php esc_html_e( 'Tasks', 'local4picnic' ); ?></span>
                        <span class="local4picnic-tab__badge" data-badge="tasks" aria-hidden="true"></span>
                    </button>
                    <button data-target="funding">
                        <span class="local4picnic-tab__label"><?php esc_html_e( 'Funding', 'local4picnic' ); ?></span>
                    </button>
                    <button data-target="crew">
                        <span class="local4picnic-tab__label"><?php esc_html_e( 'Crew', 'local4picnic' ); ?></span>
                    </button>
                    <button data-target="notifications">
                        <span class="local4picnic-tab__label"><?php esc_html_e( 'Notifications', 'local4picnic' ); ?></span>
                        <span class="local4picnic-tab__badge" data-badge="notifications" aria-hidden="true"></span>
                    </button>
                    <button data-target="community">
                        <span class="local4picnic-tab__label"><?php esc_html_e( 'Community', 'local4picnic' ); ?></span>
                        <span class="local4picnic-tab__badge" data-badge="community" aria-hidden="true"></span>
                    </button>
                </nav>
            </header>
            <section class="local4picnic-dashboard__panels">
                <div class="local4picnic-panel is-active" data-panel="overview">
                    <div class="local4picnic-grid">
                        <div class="local4picnic-card" data-component="tasks-summary">
                            <header>
                                <h3><?php esc_html_e( 'My Tasks', 'local4picnic' ); ?></h3>
                                <p><?php esc_html_e( 'Keep an eye on what needs your attention next.', 'local4picnic' ); ?></p>
                            </header>
                            <ul class="local4picnic-tasklist" id="l4p-overview-tasks"></ul>
                        </div>
                        <div class="local4picnic-card" data-component="funding-summary">
                            <header>
                                <h3><?php esc_html_e( 'Funding Snapshot', 'local4picnic' ); ?></h3>
                                <p><?php esc_html_e( 'Track inflow vs. expenses at a glance.', 'local4picnic' ); ?></p>
                            </header>
                            <div class="local4picnic-pie" id="l4p-funding-chart">
                                <span><?php esc_html_e( 'No data yet', 'local4picnic' ); ?></span>
                            </div>
                            <ul class="local4picnic-legend" id="l4p-funding-legend"></ul>
                            <div class="local4picnic-progress" id="l4p-funding-progress" aria-live="polite">
                                <div class="local4picnic-progress__track" role="presentation">
                                    <div class="local4picnic-progress__fill"></div>
                                </div>
                                <p class="local4picnic-progress__text"></p>
                            </div>
                        </div>
                        <div class="local4picnic-card" data-component="notifications">
                            <header>
                                <h3><?php esc_html_e( 'Latest Notifications', 'local4picnic' ); ?></h3>
                                <p><?php esc_html_e( 'Recent updates from across the picnic team.', 'local4picnic' ); ?></p>
                            </header>
                            <ul class="local4picnic-notificationlist" id="l4p-overview-notifications"></ul>
                        </div>
                        <div class="local4picnic-card" data-component="community">
                            <header>
                                <h3><?php esc_html_e( 'Community Feed', 'local4picnic' ); ?></h3>
                                <p><?php esc_html_e( 'Share updates and celebrate wins together.', 'local4picnic' ); ?></p>
                            </header>
                            <div class="local4picnic-feed" id="l4p-overview-feed"></div>
                        </div>
                    </div>
                </div>
                <div class="local4picnic-panel" data-panel="tasks">
                    <header class="local4picnic-panel__header">
                        <div>
                            <h3><?php esc_html_e( 'Task Board', 'local4picnic' ); ?></h3>
                            <p><?php esc_html_e( 'Assign, update, and complete volunteer tasks.', 'local4picnic' ); ?></p>
                        </div>
                        <button class="local4picnic-button" data-action="open-task-modal">
                            <?php esc_html_e( 'New Task', 'local4picnic' ); ?>
                        </button>
                    </header>
                    <div class="local4picnic-taskmetrics" id="l4p-task-metrics" aria-live="polite"></div>
                    <div class="local4picnic-taskboard" id="l4p-taskboard">
                        <div class="local4picnic-taskcolumn" data-status="not_started">
                            <h4><?php esc_html_e( 'To Do', 'local4picnic' ); ?></h4>
                            <ul></ul>
                        </div>
                        <div class="local4picnic-taskcolumn" data-status="in_progress">
                            <h4><?php esc_html_e( 'In Progress', 'local4picnic' ); ?></h4>
                            <ul></ul>
                        </div>
                        <div class="local4picnic-taskcolumn" data-status="completed">
                            <h4><?php esc_html_e( 'Completed', 'local4picnic' ); ?></h4>
                            <ul></ul>
                        </div>
                    </div>
                </div>
                <div class="local4picnic-panel" data-panel="funding">
                    <header class="local4picnic-panel__header">
                        <div>
                            <h3><?php esc_html_e( 'Funding Tracker', 'local4picnic' ); ?></h3>
                            <p><?php esc_html_e( 'Log sponsorships and expenses with rich detail.', 'local4picnic' ); ?></p>
                        </div>
                        <button class="local4picnic-button" data-action="open-funding-modal">
                            <?php esc_html_e( 'Add Entry', 'local4picnic' ); ?>
                        </button>
                    </header>
                    <div class="local4picnic-ledger" id="l4p-funding-ledger"></div>
                </div>
                <div class="local4picnic-panel" data-panel="crew">
                    <header class="local4picnic-panel__header">
                        <div>
                            <h3><?php esc_html_e( 'Crew & Volunteers', 'local4picnic' ); ?></h3>
                            <p><?php esc_html_e( 'See everyone supporting the picnic and how to reach them.', 'local4picnic' ); ?></p>
                        </div>
                        <button class="local4picnic-button" data-action="open-crew-modal">
                            <?php esc_html_e( 'Add Crew Member', 'local4picnic' ); ?>
                        </button>
                    </header>
                    <div class="local4picnic-crew" id="l4p-crew-list"></div>
                </div>
                <div class="local4picnic-panel" data-panel="notifications">
                    <header class="local4picnic-panel__header">
                        <div>
                            <h3><?php esc_html_e( 'Notifications Center', 'local4picnic' ); ?></h3>
                            <p><?php esc_html_e( 'Mark updates as read and revisit important alerts.', 'local4picnic' ); ?></p>
                        </div>
                    </header>
                    <div class="local4picnic-notifications" id="l4p-notifications"></div>
                </div>
                <div class="local4picnic-panel" data-panel="community">
                    <header class="local4picnic-panel__header">
                        <div>
                            <h3><?php esc_html_e( 'Community Feed', 'local4picnic' ); ?></h3>
                            <p><?php esc_html_e( 'Celebrate progress and coordinate in real time.', 'local4picnic' ); ?></p>
                        </div>
                        <button class="local4picnic-button" data-action="open-feed-modal">
                            <?php esc_html_e( 'New Post', 'local4picnic' ); ?>
                        </button>
                    </header>
                    <div class="local4picnic-feed" id="l4p-feed"></div>
                </div>
            </section>
        </div>

        <div class="local4picnic-modal" id="l4p-task-modal" role="dialog" aria-modal="true" aria-hidden="true">
            <div class="local4picnic-modal__content">
                <header>
                    <h3><?php esc_html_e( 'Create Task', 'local4picnic' ); ?></h3>
                    <button type="button" class="local4picnic-modal__close" data-action="close-modal" aria-label="<?php esc_attr_e( 'Close', 'local4picnic' ); ?>">&times;</button>
                </header>
                <form id="l4p-task-form">
                    <label>
                        <span><?php esc_html_e( 'Title', 'local4picnic' ); ?></span>
                        <input type="text" name="title" required />
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Description', 'local4picnic' ); ?></span>
                        <textarea name="description" rows="4"></textarea>
                    </label>
                    <label class="local4picnic-field local4picnic-field--combobox">
                        <span><?php esc_html_e( 'Assign To', 'local4picnic' ); ?></span>
                        <div class="local4picnic-combobox" data-component="assignee">
                            <input type="hidden" name="assigned_to" value="0" />
                            <input type="search" class="local4picnic-combobox__search" placeholder="<?php esc_attr_e( 'Search team members…', 'local4picnic' ); ?>" aria-expanded="false" aria-controls="l4p-assignee-list" autocomplete="off" />
                            <button type="button" class="local4picnic-combobox__clear" aria-label="<?php esc_attr_e( 'Clear selection', 'local4picnic' ); ?>">&times;</button>
                            <ul class="local4picnic-combobox__list" id="l4p-assignee-list" role="listbox"></ul>
                        </div>
                        <small><?php esc_html_e( 'Leave blank to keep this task unassigned.', 'local4picnic' ); ?></small>
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Due Date', 'local4picnic' ); ?></span>
                        <input type="date" name="due_date" />
                    </label>
                    <footer>
                        <button type="submit" class="local4picnic-button">
                            <?php esc_html_e( 'Save Task', 'local4picnic' ); ?>
                        </button>
                    </footer>
                </form>
            </div>
        </div>

        <div class="local4picnic-modal" id="l4p-funding-modal" role="dialog" aria-modal="true" aria-hidden="true">
            <div class="local4picnic-modal__content">
                <header>
                    <h3><?php esc_html_e( 'Add Funding Entry', 'local4picnic' ); ?></h3>
                    <button type="button" class="local4picnic-modal__close" data-action="close-modal" aria-label="<?php esc_attr_e( 'Close', 'local4picnic' ); ?>">&times;</button>
                </header>
                <form id="l4p-funding-form">
                    <label>
                        <span><?php esc_html_e( 'Category', 'local4picnic' ); ?></span>
                        <input type="text" name="category" required />
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Amount', 'local4picnic' ); ?></span>
                        <input type="number" step="0.01" name="amount" required />
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Direction', 'local4picnic' ); ?></span>
                        <select name="direction">
                            <option value="income"><?php esc_html_e( 'Income', 'local4picnic' ); ?></option>
                            <option value="expense"><?php esc_html_e( 'Expense', 'local4picnic' ); ?></option>
                        </select>
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Source', 'local4picnic' ); ?></span>
                        <input type="text" name="source" />
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Notes', 'local4picnic' ); ?></span>
                        <textarea name="notes" rows="4"></textarea>
                    </label>
                    <footer>
                        <button type="submit" class="local4picnic-button">
                            <?php esc_html_e( 'Save Entry', 'local4picnic' ); ?>
                        </button>
                    </footer>
                </form>
            </div>
        </div>

        <div class="local4picnic-modal" id="l4p-crew-modal" role="dialog" aria-modal="true" aria-hidden="true">
            <div class="local4picnic-modal__content">
                <header>
                    <h3><?php esc_html_e( 'Add Crew Member', 'local4picnic' ); ?></h3>
                    <button type="button" class="local4picnic-modal__close" data-action="close-modal" aria-label="<?php esc_attr_e( 'Close', 'local4picnic' ); ?>">&times;</button>
                </header>
                <form id="l4p-crew-form">
                    <label>
                        <span><?php esc_html_e( 'Name', 'local4picnic' ); ?></span>
                        <input type="text" name="name" required />
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Email', 'local4picnic' ); ?></span>
                        <input type="email" name="email" />
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Phone', 'local4picnic' ); ?></span>
                        <input type="text" name="phone" />
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Role', 'local4picnic' ); ?></span>
                        <select name="role">
                            <option value="volunteer"><?php esc_html_e( 'Volunteer', 'local4picnic' ); ?></option>
                            <option value="coordinator"><?php esc_html_e( 'Coordinator', 'local4picnic' ); ?></option>
                            <option value="vendor"><?php esc_html_e( 'Vendor', 'local4picnic' ); ?></option>
                            <option value="sponsor"><?php esc_html_e( 'Sponsor', 'local4picnic' ); ?></option>
                        </select>
                    </label>
                    <label>
                        <span><?php esc_html_e( 'Notes', 'local4picnic' ); ?></span>
                        <textarea name="notes" rows="3"></textarea>
                    </label>
                    <footer>
                        <button type="submit" class="local4picnic-button">
                            <?php esc_html_e( 'Save Member', 'local4picnic' ); ?>
                        </button>
                    </footer>
                </form>
            </div>
        </div>

        <div class="local4picnic-modal" id="l4p-feed-modal" role="dialog" aria-modal="true" aria-hidden="true">
            <div class="local4picnic-modal__content">
                <header>
                    <h3><?php esc_html_e( 'Share an Update', 'local4picnic' ); ?></h3>
                    <button type="button" class="local4picnic-modal__close" data-action="close-modal" aria-label="<?php esc_attr_e( 'Close', 'local4picnic' ); ?>">&times;</button>
                </header>
                <form id="l4p-feed-form">
                    <label>
                        <span><?php esc_html_e( 'Message', 'local4picnic' ); ?></span>
                        <textarea name="content" rows="4" required></textarea>
                    </label>
                    <footer>
                        <button type="submit" class="local4picnic-button">
                            <?php esc_html_e( 'Post Update', 'local4picnic' ); ?>
                        </button>
                    </footer>
                </form>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * Enqueue shortcode assets.
     */
    protected function enqueue_assets() {
        $options = Local4Picnic_Settings::get_options();
        $user    = wp_get_current_user();

        wp_enqueue_style( 'local4picnic-public' );
        wp_enqueue_style( 'local4picnic-dashboard' );
        wp_enqueue_script( 'local4picnic-public' );
        wp_enqueue_script( 'local4picnic-dashboard' );

        wp_localize_script(
            'local4picnic-dashboard',
            'local4picnicDashboard',
            array(
                'restUrl' => esc_url_raw( rest_url( 'local4picnic/v1/' ) ),
                'nonce'   => wp_create_nonce( 'wp_rest' ),
                'user'    => array(
                    'id'   => $user->ID,
                    'name' => $user->display_name,
                    'caps' => array(
                        'manageTasks'      => current_user_can( 'l4p_manage_volunteers' ),
                        'manageFunding'    => current_user_can( 'l4p_manage_funding' ),
                        'viewFunding'      => current_user_can( 'l4p_view_funding' ) || current_user_can( 'l4p_manage_funding' ),
                        'manageCrew'       => current_user_can( 'l4p_manage_volunteers' ),
                        'manageFeed'       => true,
                        'manageNotifications' => current_user_can( 'l4p_manage_notifications' ),
                    ),
                ),
                'settings' => array(
                    'currency' => isset( $options['currency'] ) ? $options['currency'] : 'USD',
                    'fundingGoal' => isset( $options['funding_goal'] ) ? (float) $options['funding_goal'] : 0,
                    'fundingVisibility' => isset( $options['funding_visibility'] ) ? $options['funding_visibility'] : 'public',
                    'feedComments' => ! empty( $options['feed_comments'] ),
                    'notifyEmail' => ! empty( $options['notify_email'] ),
                    'notifySms'   => ! empty( $options['notify_sms'] ),
                    'smsProvider'=> isset( $options['sms_provider'] ) ? $options['sms_provider'] : '',
                ),
                'stream'   => array(
                    'enabled' => true,
                    'timeout' => 25,
                ),
                'strings'  => array(
                    'noTasks'        => __( 'No tasks yet. Enjoy the calm before the picnic!', 'local4picnic' ),
                    'noFunding'      => __( 'No funding entries recorded.', 'local4picnic' ),
                    'noCrew'         => __( 'Crew list is empty. Add your first volunteer!', 'local4picnic' ),
                    'noNotifications'=> __( 'You are all caught up!', 'local4picnic' ),
                    'noFeed'         => __( 'Start the conversation by posting an update.', 'local4picnic' ),
                    'saving'         => __( 'Saving…', 'local4picnic' ),
                    'error'          => __( 'Something went wrong. Please try again.', 'local4picnic' ),
                    'save'           => __( 'Save', 'local4picnic' ),
                    'cancel'         => __( 'Cancel', 'local4picnic' ),
                    'edit'           => __( 'Edit', 'local4picnic' ),
                    'delete'         => __( 'Delete', 'local4picnic' ),
                    'deleteTaskLabel'=> __( 'Delete task', 'local4picnic' ),
                    'claimTask'      => __( 'Claim Task', 'local4picnic' ),
                    'claimedTask'    => __( 'Assigned to you', 'local4picnic' ),
                    'unassigned'     => __( 'Unassigned', 'local4picnic' ),
                    'categoryLabel'  => __( 'Category', 'local4picnic' ),
                    'directionLabel' => __( 'Direction', 'local4picnic' ),
                    'amountLabel'    => __( 'Amount', 'local4picnic' ),
                    'sourceLabel'    => __( 'Source', 'local4picnic' ),
                    'recordedLabel'  => __( 'Recorded', 'local4picnic' ),
                    'notesLabel'     => __( 'Notes', 'local4picnic' ),
                    'actionsLabel'   => __( 'Actions', 'local4picnic' ),
                    'nameLabel'      => __( 'Name', 'local4picnic' ),
                    'emailLabel'     => __( 'Email', 'local4picnic' ),
                    'phoneLabel'     => __( 'Phone', 'local4picnic' ),
                    'roleLabel'      => __( 'Role', 'local4picnic' ),
                    'incomeLabel'    => __( 'Income', 'local4picnic' ),
                    'expenseLabel'   => __( 'Expense', 'local4picnic' ),
                    'noFundingPermission' => __( 'Funding data is hidden for your role.', 'local4picnic' ),
                    'goalProgress'   => __( '%1$s of %2$s raised', 'local4picnic' ),
                    'goalRemaining'  => __( '%1$s remaining to reach your goal', 'local4picnic' ),
                    'goalComplete'   => __( 'Funding goal reached! 🎉', 'local4picnic' ),
                    'replyDisabled'  => __( 'Replies are disabled for this feed.', 'local4picnic' ),
                    'noMatches'      => __( 'No matches found.', 'local4picnic' ),
                    'replyPlaceholder' => __( 'Reply to this update…', 'local4picnic' ),
                    'replyAction'   => __( 'Reply', 'local4picnic' ),
                    'markRead'      => __( 'Mark read', 'local4picnic' ),
                    'confirmDeleteFunding' => __( 'Delete this funding entry?', 'local4picnic' ),
                    'confirmDeleteTask' => __( 'Delete this task?', 'local4picnic' ),
                    'confirmDeleteCrew' => __( 'Remove this crew member?', 'local4picnic' ),
                    'statuses'       => array(
                        'not_started' => __( 'To Do', 'local4picnic' ),
                        'in_progress' => __( 'In Progress', 'local4picnic' ),
                        'completed'   => __( 'Completed', 'local4picnic' ),
                    ),
                ),
            )
        );
    }
}

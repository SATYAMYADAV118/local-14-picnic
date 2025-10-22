(function () {
    const config = window.local4picnicDashboard || null;

    if (!config) {
        return;
    }

    const dashboardEl = document.getElementById('local4picnic-dashboard');

    if (!dashboardEl) {
        return;
    }

    const state = {
        tasks: [],
        funding: { entries: [], summary: { income: 0, expense: 0 } },
        crew: [],
        notifications: [],
        feed: [],
        loading: false,
    };

    const headers = {
        'Content-Type': 'application/json',
        'X-WP-Nonce': config.nonce,
    };

    function restFetch(path, options) {
        const opts = Object.assign({ headers }, options || {});

        return fetch(config.restUrl + path, opts).then(function (response) {
            if (!response.ok) {
                return response.json().then(function (error) {
                    const message = error && error.message ? error.message : response.statusText;
                    throw new Error(message);
                });
            }

            if (response.status === 204) {
                return null;
            }

            return response.json();
        });
    }

    function setLoading(isLoading) {
        state.loading = isLoading;
        dashboardEl.classList.toggle('is-loading', isLoading);
    }

    function initTabs() {
        const tabButtons = dashboardEl.querySelectorAll('.local4picnic-dashboard__tabs button');
        const panels = dashboardEl.querySelectorAll('.local4picnic-dashboard__panel');

        tabButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                const tab = button.getAttribute('data-tab');

                tabButtons.forEach(function (btn) {
                    const isActive = btn === button;
                    btn.classList.toggle('is-active', isActive);
                    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
                });

                panels.forEach(function (panel) {
                    const isMatch = panel.getAttribute('data-panel') === tab;
                    panel.hidden = !isMatch;
                });

                renderPanel(tab);
            });
        });
    }

    function renderPanel(panel) {
        switch (panel) {
            case 'overview':
                renderOverview();
                break;
            case 'tasks':
                renderTasks();
                break;
            case 'funding':
                renderFunding();
                break;
            case 'crew':
                renderCrew();
                break;
            case 'notifications':
                renderNotifications();
                break;
            case 'community':
                renderCommunity();
                break;
            default:
                break;
        }
    }

    function formatCurrency(value) {
        const amount = Number(value || 0);
        return new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: config.options.currency || 'USD',
        }).format(amount);
    }

    function avatarFor(name) {
        if (!name) {
            return '?';
        }

        return name.trim().charAt(0).toUpperCase();
    }

    function renderOverview() {
        const panel = dashboardEl.querySelector('[data-panel="overview"]');
        const totalTasks = state.tasks.length;
        const completedTasks = state.tasks.filter(function (task) {
            return task.status === 'completed';
        }).length;
        const totalCrew = state.crew.length;
        const unreadNotifications = state.notifications.filter(function (notification) {
            return !notification.is_read;
        }).length;

        const fundingBalance = state.funding.summary.income - state.funding.summary.expense;

        panel.innerHTML = '
            <div class="local4picnic-cards">
                <div class="local4picnic-card">
                    <h3>' + config.strings.tasks + '</h3>
                    <strong>' + completedTasks + ' / ' + totalTasks + '</strong>
                    <p>' + (totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0) + '% ' + 'completed</p>
                </div>
                <div class="local4picnic-card">
                    <h3>' + config.strings.funding + '</h3>
                    <strong>' + formatCurrency(fundingBalance) + '</strong>
                    <p>' + formatCurrency(state.funding.summary.income) + ' ' + 'raised</p>
                </div>
                <div class="local4picnic-card">
                    <h3>' + config.strings.crew + '</h3>
                    <strong>' + totalCrew + '</strong>
                    <p>active members</p>
                </div>
                <div class="local4picnic-card">
                    <h3>' + config.strings.notifications + '</h3>
                    <strong>' + unreadNotifications + '</strong>
                    <p>alerts waiting</p>
                </div>
            </div>';
    }

    function renderTasks() {
        const panel = dashboardEl.querySelector('[data-panel="tasks"]');
        const statuses = {
            not_started: { label: 'To do', items: [] },
            in_progress: { label: 'In progress', items: [] },
            completed: { label: 'Completed', items: [] },
        };

        state.tasks.forEach(function (task) {
            if (statuses[task.status]) {
                statuses[task.status].items.push(task);
            } else {
                statuses.not_started.items.push(task);
            }
        });

        let html = '';

        if (config.capabilities.manageTasks) {
            html += '
            <form class="local4picnic-form" id="local4picnic-task-form">
                <div>
                    <label for="l4p-task-title">' + 'Title' + '</label>
                    <input type="text" id="l4p-task-title" name="title" required />
                </div>
                <div>
                    <label for="l4p-task-desc">' + 'Description' + '</label>
                    <textarea id="l4p-task-desc" name="description"></textarea>
                </div>
                <div class="local4picnic-form--inline">
                    <div>
                        <label for="l4p-task-status">' + 'Status' + '</label>
                        <select id="l4p-task-status" name="status">
                            <option value="not_started">To do</option>
                            <option value="in_progress">In progress</option>
                            <option value="completed">Completed</option>
                        </select>
                    </div>
                    <div>
                        <label for="l4p-task-assigned">' + 'Assigned user ID' + '</label>
                        <input type="number" id="l4p-task-assigned" name="assigned_to" min="0" />
                    </div>
                    <div>
                        <label for="l4p-task-due">' + 'Due date' + '</label>
                        <input type="date" id="l4p-task-due" name="due_date" />
                    </div>
                </div>
                <button type="submit">' + config.strings.save + '</button>
            </form>';
        }

        html += '<div class="local4picnic-task-columns">';

        Object.keys(statuses).forEach(function (key) {
            const column = statuses[key];
            html += '<div class="local4picnic-task-column">';
            html += '<h3>' + column.label + '</h3>';

            if (!column.items.length) {
                html += '<div class="local4picnic-empty">No tasks yet.</div>';
            } else {
                column.items.forEach(function (task) {
                    html += renderTaskCard(task);
                });
            }

            html += '</div>';
        });

        html += '</div>';

        panel.innerHTML = html;

        if (config.capabilities.manageTasks) {
            const form = panel.querySelector('#local4picnic-task-form');
            if (form) {
                form.addEventListener('submit', handleTaskFormSubmit);
            }
        }

        panel.querySelectorAll('[data-action="task-status"]').forEach(function (button) {
            button.addEventListener('click', function () {
                const id = button.getAttribute('data-id');
                const status = button.getAttribute('data-status');
                updateTaskStatus(id, status);
            });
        });

        panel.querySelectorAll('[data-action="task-delete"]').forEach(function (button) {
            button.addEventListener('click', function () {
                const id = button.getAttribute('data-id');
                if (confirm('Delete this task?')) {
                    deleteTask(id);
                }
            });
        });
    }

    function renderTaskCard(task) {
        const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
        let actions = '';

        if (config.capabilities.manageTasks) {
            actions += '<div class="local4picnic-actions">';
            if (task.status !== 'not_started') {
                actions += '<button data-action="task-status" data-status="not_started" data-id="' + task.id + '" class="is-outline">Reset</button>';
            }
            if (task.status !== 'in_progress') {
                actions += '<button data-action="task-status" data-status="in_progress" data-id="' + task.id + '" class="is-outline">In progress</button>';
            }
            if (task.status !== 'completed') {
                actions += '<button data-action="task-status" data-status="completed" data-id="' + task.id + '" class="is-outline">Complete</button>';
            }
            actions += '<button data-action="task-delete" data-id="' + task.id + '" class="is-danger">' + config.strings.delete + '</button>';
            actions += '</div>';
        }

        return '
            <article class="local4picnic-task">
                <h4>' + task.title + '</h4>
                <div class="local4picnic-task__meta">Due: ' + dueDate + '</div>
                <p>' + (task.description || '') + '</p>
                ' + actions + '
            </article>';
    }

    function handleTaskFormSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const payload = {};

        formData.forEach(function (value, key) {
            payload[key] = value;
        });

        restFetch('tasks', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
            .then(function () {
                form.reset();
                refreshTasks();
                refreshNotifications();
            })
            .catch(displayError);
    }

    function updateTaskStatus(id, status) {
        restFetch('tasks/' + id, {
            method: 'POST',
            body: JSON.stringify({ status: status }),
        })
            .then(function () {
                refreshTasks();
            })
            .catch(displayError);
    }

    function deleteTask(id) {
        restFetch('tasks/' + id, {
            method: 'DELETE',
        })
            .then(function () {
                refreshTasks();
            })
            .catch(displayError);
    }

    function renderFunding() {
        const panel = dashboardEl.querySelector('[data-panel="funding"]');

        let html = '';

        if (config.capabilities.manageFunding) {
            html += '
            <form class="local4picnic-form" id="local4picnic-funding-form">
                <div class="local4picnic-form--inline">
                    <div>
                        <label for="l4p-funding-category">Category</label>
                        <input type="text" id="l4p-funding-category" name="category" required />
                    </div>
                    <div>
                        <label for="l4p-funding-amount">Amount</label>
                        <input type="number" step="0.01" id="l4p-funding-amount" name="amount" required />
                    </div>
                    <div>
                        <label for="l4p-funding-direction">Type</label>
                        <select id="l4p-funding-direction" name="direction">
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                </div>
                <div class="local4picnic-form--inline">
                    <div>
                        <label for="l4p-funding-source">Source</label>
                        <input type="text" id="l4p-funding-source" name="source" />
                    </div>
                    <div>
                        <label for="l4p-funding-date">Recorded date</label>
                        <input type="date" id="l4p-funding-date" name="recorded_at" value="' + new Date().toISOString().slice(0, 10) + '" />
                    </div>
                </div>
                <div>
                    <label for="l4p-funding-notes">Notes</label>
                    <textarea id="l4p-funding-notes" name="notes"></textarea>
                </div>
                <button type="submit">' + config.strings.save + '</button>
            </form>';
        }

        const balance = state.funding.summary.income - state.funding.summary.expense;

        html += '<div class="local4picnic-card" style="margin-bottom:16px;">'
            + '<h3>Balance</h3>'
            + '<strong>' + formatCurrency(balance) + '</strong>'
            + '<p>' + formatCurrency(state.funding.summary.income) + ' income · ' + formatCurrency(state.funding.summary.expense) + ' expenses</p>'
            + '</div>';

        if (!state.funding.entries.length) {
            html += '<div class="local4picnic-empty">No funding entries yet.</div>';
        } else {
            html += '<table class="local4picnic-table"><thead><tr>'
                + '<th>Date</th><th>Category</th><th>Source</th><th>Amount</th><th>Type</th>'
                + (config.capabilities.manageFunding ? '<th></th>' : '')
                + '</tr></thead><tbody>';

            state.funding.entries.forEach(function (entry) {
                html += '<tr>'
                    + '<td>' + new Date(entry.recorded_at).toLocaleDateString() + '</td>'
                    + '<td>' + entry.category + '</td>'
                    + '<td>' + (entry.source || '—') + '</td>'
                    + '<td>' + formatCurrency(entry.amount) + '</td>'
                    + '<td>' + entry.direction + '</td>'
                    + (config.capabilities.manageFunding ? '<td><button data-action="funding-delete" data-id="' + entry.id + '" class="is-danger">' + config.strings.delete + '</button></td>' : '')
                    + '</tr>';
            });

            html += '</tbody></table>';
        }

        panel.innerHTML = html;

        if (config.capabilities.manageFunding) {
            const form = panel.querySelector('#local4picnic-funding-form');
            if (form) {
                form.addEventListener('submit', handleFundingFormSubmit);
            }

            panel.querySelectorAll('[data-action="funding-delete"]').forEach(function (button) {
                button.addEventListener('click', function () {
                    const id = button.getAttribute('data-id');
                    if (confirm('Delete this entry?')) {
                        deleteFunding(id);
                    }
                });
            });
        }
    }

    function handleFundingFormSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const payload = {};

        formData.forEach(function (value, key) {
            payload[key] = value;
        });

        restFetch('funding', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
            .then(function () {
                form.reset();
                refreshFunding();
                refreshNotifications();
            })
            .catch(displayError);
    }

    function deleteFunding(id) {
        restFetch('funding/' + id, {
            method: 'DELETE',
        })
            .then(function () {
                refreshFunding();
            })
            .catch(displayError);
    }

    function renderCrew() {
        const panel = dashboardEl.querySelector('[data-panel="crew"]');

        let html = '';

        if (config.capabilities.manageCrew) {
            html += '
            <form class="local4picnic-form" id="local4picnic-crew-form">
                <div class="local4picnic-form--inline">
                    <div>
                        <label for="l4p-crew-name">Name</label>
                        <input type="text" id="l4p-crew-name" name="name" required />
                    </div>
                    <div>
                        <label for="l4p-crew-role">Role</label>
                        <select id="l4p-crew-role" name="role">
                            <option value="volunteer">Volunteer</option>
                            <option value="coordinator">Coordinator</option>
                            <option value="vendor">Vendor</option>
                            <option value="sponsor">Sponsor</option>
                        </select>
                    </div>
                </div>
                <div class="local4picnic-form--inline">
                    <div>
                        <label for="l4p-crew-email">Email</label>
                        <input type="email" id="l4p-crew-email" name="email" />
                    </div>
                    <div>
                        <label for="l4p-crew-phone">Phone</label>
                        <input type="text" id="l4p-crew-phone" name="phone" />
                    </div>
                </div>
                <div>
                    <label for="l4p-crew-notes">Notes</label>
                    <textarea id="l4p-crew-notes" name="notes"></textarea>
                </div>
                <button type="submit">' + config.strings.save + '</button>
            </form>';
        }

        if (!state.crew.length) {
            html += '<div class="local4picnic-empty">No crew members added yet.</div>';
        } else {
            html += '<div class="local4picnic-crew-list">';
            state.crew.forEach(function (member) {
                html += '
                <article class="local4picnic-task">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <span class="local4picnic-avatar">' + avatarFor(member.name) + '</span>
                        <div>
                            <h4 style="margin:0;">' + member.name + '</h4>
                            <div class="local4picnic-task__meta">' + (member.email || '—') + ' · ' + (member.phone || '—') + '</div>
                            <span class="local4picnic-badge">' + member.role + '</span>
                        </div>
                    </div>
                </article>';
            });
            html += '</div>';
        }

        panel.innerHTML = html;

        if (config.capabilities.manageCrew) {
            const form = panel.querySelector('#local4picnic-crew-form');
            if (form) {
                form.addEventListener('submit', handleCrewFormSubmit);
            }
        }
    }

    function handleCrewFormSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const payload = {};

        formData.forEach(function (value, key) {
            payload[key] = value;
        });

        restFetch('crew', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
            .then(function () {
                form.reset();
                refreshCrew();
                refreshNotifications();
            })
            .catch(displayError);
    }

    function renderNotifications() {
        const panel = dashboardEl.querySelector('[data-panel="notifications"]');

        if (!state.notifications.length) {
            panel.innerHTML = '<div class="local4picnic-empty">No notifications yet.</div>';
            return;
        }

        let html = '';

        state.notifications.forEach(function (notification) {
            html += '
            <div class="local4picnic-notification' + (notification.is_read ? '' : ' is-unread') + '">
                <div>
                    <strong>' + notification.message + '</strong>
                    <div class="local4picnic-task__meta">' + new Date(notification.created_at).toLocaleString() + '</div>
                </div>
                <div class="local4picnic-actions">
                    <button data-action="notification-toggle" data-id="' + notification.id + '" class="is-outline">' + (notification.is_read ? 'Mark unread' : 'Mark read') + '</button>'
                    + (config.capabilities.manageNotifications ? '<button data-action="notification-delete" data-id="' + notification.id + '" class="is-danger">' + config.strings.delete + '</button>' : '') + '
                </div>
            </div>';
        });

        panel.innerHTML = html;

        panel.querySelectorAll('[data-action="notification-toggle"]').forEach(function (button) {
            button.addEventListener('click', function () {
                const id = button.getAttribute('data-id');
                const notification = state.notifications.find(function (item) { return String(item.id) === String(id); });

                if (!notification) {
                    return;
                }

                restFetch('notifications/' + id, {
                    method: 'POST',
                    body: JSON.stringify({ is_read: notification.is_read ? 0 : 1 }),
                })
                    .then(refreshNotifications)
                    .catch(displayError);
            });
        });

        if (config.capabilities.manageNotifications) {
            panel.querySelectorAll('[data-action="notification-delete"]').forEach(function (button) {
                button.addEventListener('click', function () {
                    const id = button.getAttribute('data-id');
                    restFetch('notifications/' + id, {
                        method: 'DELETE',
                    })
                        .then(refreshNotifications)
                        .catch(displayError);
                });
            });
        }
    }

    function renderCommunity() {
        const panel = dashboardEl.querySelector('[data-panel="community"]');

        let html = '';

        if (config.capabilities.manageFeed) {
            html += '
            <form class="local4picnic-form" id="local4picnic-feed-form">
                <div>
                    <label for="l4p-feed-content">Share an update</label>
                    <textarea id="l4p-feed-content" name="content" required></textarea>
                </div>
                <button type="submit">' + config.strings.save + '</button>
            </form>';
        }

        if (!state.feed.length) {
            html += '<div class="local4picnic-empty">No posts yet.</div>';
        } else {
            html += '<div class="local4picnic-feed">';
            state.feed.forEach(function (post) {
                html += renderFeedItem(post);
            });
            html += '</div>';
        }

        panel.innerHTML = html;

        if (config.capabilities.manageFeed) {
            const form = panel.querySelector('#local4picnic-feed-form');
            if (form) {
                form.addEventListener('submit', handleFeedFormSubmit);
            }
        }

        panel.querySelectorAll('[data-action="feed-reply"]').forEach(function (button) {
            button.addEventListener('click', function () {
                const id = button.getAttribute('data-id');
                const textarea = panel.querySelector('#local4picnic-reply-' + id);
                const content = textarea ? textarea.value : '';

                if (!content) {
                    return;
                }

                restFetch('feed', {
                    method: 'POST',
                    body: JSON.stringify({ parent_id: id, content: content }),
                })
                    .then(function () {
                        refreshFeed();
                    })
                    .catch(displayError);
            });
        });
    }

    function renderFeedItem(post) {
        let repliesHtml = '';

        if (post.replies && post.replies.length) {
            repliesHtml += '<div class="local4picnic-feed-replies">';
            post.replies.forEach(function (reply) {
                repliesHtml += '
                <div class="local4picnic-feed-item" style="padding-left:24px;">
                    <strong>' + reply.user_id + '</strong>
                    <p>' + reply.content + '</p>
                    <div class="local4picnic-task__meta">' + new Date(reply.created_at).toLocaleString() + '</div>
                </div>';
            });
            repliesHtml += '</div>';
        }

        let replyForm = '';

        if (config.options.feedComments && config.capabilities.manageFeed) {
            replyForm = '
                <div class="local4picnic-form local4picnic-form--inline" style="margin-top:12px;">
                    <textarea id="local4picnic-reply-' + post.id + '" placeholder="Reply..." rows="2"></textarea>
                    <button type="button" data-action="feed-reply" data-id="' + post.id + '">Reply</button>
                </div>';
        }

        return '
            <article class="local4picnic-feed-item">
                <strong>Posted by #' + post.user_id + '</strong>
                <p>' + post.content + '</p>
                <div class="local4picnic-task__meta">' + new Date(post.created_at).toLocaleString() + '</div>
                ' + replyForm + '
                ' + repliesHtml + '
            </article>';
    }

    function handleFeedFormSubmit(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);
        const payload = {};

        formData.forEach(function (value, key) {
            payload[key] = value;
        });

        restFetch('feed', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
            .then(function () {
                form.reset();
                refreshFeed();
                refreshNotifications();
            })
            .catch(displayError);
    }

    function displayError(error) {
        console.error(error);
        alert(error.message || 'Something went wrong.');
    }

    function refreshTasks() {
        return restFetch('tasks')
            .then(function (tasks) {
                state.tasks = Array.isArray(tasks) ? tasks : [];
                renderPanel('overview');
                if (!dashboardEl.querySelector('[data-panel="tasks"]').hidden) {
                    renderTasks();
                }
            });
    }

    function refreshFunding() {
        return restFetch('funding')
            .then(function (data) {
                state.funding = data || { entries: [], summary: { income: 0, expense: 0 } };
                renderPanel('overview');
                if (!dashboardEl.querySelector('[data-panel="funding"]').hidden) {
                    renderFunding();
                }
            });
    }

    function refreshCrew() {
        return restFetch('crew')
            .then(function (crew) {
                state.crew = Array.isArray(crew) ? crew : [];
                renderPanel('overview');
                if (!dashboardEl.querySelector('[data-panel="crew"]').hidden) {
                    renderCrew();
                }
            });
    }

    function refreshNotifications() {
        return restFetch('notifications')
            .then(function (notifications) {
                state.notifications = Array.isArray(notifications) ? notifications : [];
                renderPanel('overview');
                if (!dashboardEl.querySelector('[data-panel="notifications"]').hidden) {
                    renderNotifications();
                }
            });
    }

    function refreshFeed() {
        return restFetch('feed')
            .then(function (feed) {
                state.feed = Array.isArray(feed) ? feed : [];
                if (!dashboardEl.querySelector('[data-panel="community"]').hidden) {
                    renderCommunity();
                }
            });
    }

    function initialLoad() {
        setLoading(true);
        Promise.all([
            refreshTasks(),
            refreshFunding(),
            refreshCrew(),
            refreshNotifications(),
            refreshFeed(),
        ])
            .catch(function (error) {
                displayError(error);
            })
            .finally(function () {
                setLoading(false);
                renderOverview();
            });
    }

    initTabs();
    renderOverview();
    initialLoad();
})();

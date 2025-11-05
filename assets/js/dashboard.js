(function () {
    const settings = window.l4pDashboard || {};
    const restUrl = settings.restUrl;
    const nonce = settings.nonce;
    const root = document.querySelector('.l4p-dashboard');
    const branding = settings.branding || {};

    if (!restUrl || !nonce || !root) {
        return;
    }

    const panels = {
        dashboard: root.querySelector('[data-panel="dashboard"]'),
        tasks: root.querySelector('[data-panel="tasks"]'),
        funding: root.querySelector('[data-panel="funding"]'),
        crew: root.querySelector('[data-panel="crew"]'),
        notifications: root.querySelector('[data-panel="notifications"]'),
        community: root.querySelector('[data-panel="community"]'),
    };

    const state = {
        currentView: 'dashboard',
        dashboard: null,
        tasks: [],
        funding: { entries: [], totals: { income: 0, expense: 0, net: 0 }, distribution: {} },
        crew: [],
        notifications: [],
        notificationsSince: '',
        community: [],
        communitySince: '',
        users: [],
        selectedCrew: null,
    };

    const STATUS_OPTIONS = [
        { value: 'todo', label: 'To Do' },
        { value: 'in_progress', label: 'In Progress' },
        { value: 'complete', label: 'Complete' },
    ];

    const heroElement = root.querySelector('[data-hero]');
    const heroTitle = heroElement ? heroElement.querySelector('h1') : null;
    const heroSubtitle = heroElement ? heroElement.querySelector('p') : null;
    const heroMap = {
        dashboard: {
            title: branding.heroTitle || 'Dashboard overview',
            subtitle: branding.heroSubtitle || 'Monitor everything happening across your picnic operations.',
        },
        tasks: {
            title: 'Task board',
            subtitle: 'Assign work, monitor progress, and celebrate completions.',
        },
        funding: {
            title: 'Funding tracker',
            subtitle: 'Log inflows and expenses to keep the picnic budget balanced.',
        },
        crew: {
            title: 'Crew roster',
            subtitle: 'Review contact info, availability, and assignments at a glance.',
        },
        notifications: {
            title: 'Notifications',
            subtitle: 'Recent alerts from tasks, funding, and the community feed.',
        },
        community: {
            title: 'Community feed',
            subtitle: 'Share quick updates and stay in sync with your volunteers.',
        },
    };
    const chartPalette = [
        branding.primaryColor || '#0b4aa2',
        branding.accentColor || '#ff784f',
        '#2ecc71',
        '#f5a623',
        '#8e44ad',
    ];

    const isCoordinator = hasRole('administrator') || hasRole('local4_coordinator');
    const isVolunteer = hasRole('local4_volunteer');

    function hasRole(role) {
        const roles = settings.currentUser ? settings.currentUser.roles || [] : [];
        return roles.indexOf(role) !== -1;
    }

    function api(path, options = {}) {
        const headers = options.headers || {};
        headers['X-WP-Nonce'] = nonce;
        if (!(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }
        options.headers = headers;

        return fetch(restUrl + path, options).then((response) => {
            if (!response.ok) {
                return response.json().catch(() => ({})).then((error) => {
                    throw error;
                });
            }
            return response.json();
        });
    }

    function formatCurrency(value) {
        const number = Number(value || 0);
        return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(number);
    }

    function timeAgo(dateString) {
        if (!dateString) {
            return '';
        }
        const date = new Date(dateString);
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
        ];
        for (const interval of intervals) {
            const value = Math.floor(seconds / interval.seconds);
            if (value >= 1) {
                return `${value} ${interval.label}${value > 1 ? 's' : ''} ago`;
            }
        }
        return 'just now';
    }

    function stripHTML(value) {
        return (value || '').replace(/<[^>]+>/g, '');
    }

    function setView(view) {
        state.currentView = view;
        Object.keys(panels).forEach((key) => {
            if (!panels[key]) {
                return;
            }
            if (key === view) {
                panels[key].hidden = false;
            } else {
                panels[key].hidden = true;
            }
        });

        const navLinks = root.querySelectorAll('.l4p-dashboard__nav-link');
        navLinks.forEach((link) => {
            if (link.dataset.target === view) {
                link.classList.add('is-active');
            } else {
                link.classList.remove('is-active');
            }
        });

        updateHero(view);

        switch (view) {
            case 'dashboard':
                loadDashboard();
                break;
            case 'tasks':
                loadTasks();
                break;
            case 'funding':
                loadFunding();
                break;
            case 'crew':
                loadCrew();
                break;
            case 'notifications':
                loadNotifications();
                break;
            case 'community':
                loadCommunity();
                break;
        }
    }

    function updateHero(view) {
        if (!heroTitle || !heroSubtitle) {
            return;
        }
        const data = heroMap[view] || heroMap.dashboard;
        heroTitle.textContent = data.title;
        heroSubtitle.textContent = data.subtitle;
    }

    function drawPie(canvas, totals) {
        if (!canvas) {
            return;
        }
        const ctx = canvas.getContext('2d');
        const values = Object.values(totals);
        const labels = Object.keys(totals);
        const total = values.reduce((sum, value) => sum + value, 0);
        const colors = chartPalette;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (total === 0) {
            ctx.fillStyle = '#dfe6f3';
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2 - 4, 0, Math.PI * 2);
            ctx.fill();
            return;
        }

        let startAngle = -Math.PI / 2;
        values.forEach((value, index) => {
            const sliceAngle = (value / total) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(canvas.width / 2, canvas.height / 2);
            ctx.arc(canvas.width / 2, canvas.height / 2, canvas.height / 2 - 4, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index % colors.length];
            ctx.fill();
            startAngle += sliceAngle;
        });

        const legend = document.createElement('div');
        legend.className = 'l4p-funding-totals';
        labels.forEach((label, index) => {
            const line = document.createElement('div');
            line.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;"><span style="width:12px;height:12px;background:${colors[index % colors.length]};border-radius:50%;display:inline-block;"></span>${label}</span> <strong>${formatCurrency(values[index])}</strong>`;
            legend.appendChild(line);
        });
        canvas.parentNode.querySelector('.l4p-funding-totals')?.remove();
        canvas.parentNode.appendChild(legend);
    }

    function loadDashboard() {
        api('dashboard')
            .then((data) => {
                state.dashboard = data;
                renderDashboard();
            })
            .catch((error) => {
                renderError(panels.dashboard, error.message || 'Unable to load dashboard.');
            });
    }

    function renderDashboard() {
        const panel = panels.dashboard;
        if (!panel || !state.dashboard) {
            return;
        }

        const { tasks, notifications, funding, community, crew } = state.dashboard;
        const fundingTotals = funding || {};
        const crewData = crew || { members: [], total: 0 };
        panel.innerHTML = `
            <div class="l4p-card-grid">
                <section class="l4p-card" aria-labelledby="l4p-card-tasks">
                    <header class="l4p-card__header">
                        <h3 id="l4p-card-tasks" class="l4p-card__title">Tasks</h3>
                        <button class="l4p-card__action" data-link="tasks">View all</button>
                    </header>
                    <div class="l4p-task-list">
                        ${tasks.items.map(renderTaskItem).join('') || '<p>No tasks yet.</p>'}
                    </div>
                    <div class="l4p-task-stats">
                        ${STATUS_OPTIONS.map((option) => `<span class="l4p-status-pill" data-status="${option.value}">${option.label}: ${tasks.counts[option.value] || 0}</span>`).join(' ')}
                    </div>
                </section>
                <section class="l4p-card" aria-labelledby="l4p-card-funding">
                    <header class="l4p-card__header">
                        <h3 id="l4p-card-funding" class="l4p-card__title">Funding Snapshot</h3>
                        <button class="l4p-card__action" data-link="funding">Manage</button>
                    </header>
                    <div class="l4p-funding-chart">
                        <canvas id="l4p-funding-chart" width="220" height="220" aria-label="Funding distribution" role="img"></canvas>
                        <div class="l4p-funding-stats">
                            <div class="l4p-funding-stats__item"><span>Income</span><strong>${formatCurrency(fundingTotals.income_total)}</strong></div>
                            <div class="l4p-funding-stats__item"><span>Expenses</span><strong>${formatCurrency(fundingTotals.expense_total)}</strong></div>
                            <div class="l4p-funding-stats__item"><span>Net</span><strong>${formatCurrency(fundingTotals.net_total)}</strong></div>
                        </div>
                    </div>
                    <div class="l4p-task-list">
                        ${(fundingTotals.latest || []).slice(0, 3).map(renderFundingPreview).join('') || '<p>No funding activity yet.</p>'}
                    </div>
                </section>
                <section class="l4p-card" aria-labelledby="l4p-card-notifications">
                    <header class="l4p-card__header">
                        <h3 id="l4p-card-notifications" class="l4p-card__title">Latest Notifications</h3>
                        <button class="l4p-card__action" data-link="notifications">Open center</button>
                    </header>
                    <div class="l4p-notification-list">
                        ${notifications.map(renderNotificationItem).join('') || '<p>All caught up!</p>'}
                    </div>
                </section>
                <section class="l4p-card" aria-labelledby="l4p-card-crew">
                    <header class="l4p-card__header">
                        <h3 id="l4p-card-crew" class="l4p-card__title">Crew</h3>
                        <button class="l4p-card__action" data-link="crew">Open roster</button>
                    </header>
                    <div class="l4p-crew-preview">
                        ${crewData.members.map(renderCrewPreview).join('') || '<p>No crew members yet.</p>'}
                    </div>
                    <div class="l4p-total">Total crew: <strong>${crewData.total || 0}</strong></div>
                </section>
                <section class="l4p-card" aria-labelledby="l4p-card-community">
                    <header class="l4p-card__header">
                        <h3 id="l4p-card-community" class="l4p-card__title">Community Feed</h3>
                        <button class="l4p-card__action" data-link="community">Jump in</button>
                    </header>
                    <div class="l4p-feed">
                        ${community.map(renderCommunityPreview).join('') || '<p>No posts yet.</p>'}
                    </div>
                </section>
            </div>
        `;

        const canvas = panel.querySelector('#l4p-funding-chart');
        drawPie(canvas, fundingTotals.distribution || {});

        panel.querySelectorAll('[data-link]').forEach((button) => {
            button.addEventListener('click', (event) => {
                setView(event.currentTarget.dataset.link);
            });
        });
    }

    function renderTaskItem(task) {
        return `
            <article class="l4p-task">
                <h4 class="l4p-task__title">${task.title}</h4>
                <p class="l4p-task__excerpt">${task.excerpt || ''}</p>
                <div class="l4p-task__meta">
                    <span class="l4p-status-pill" data-status="${task.status}">${task.status.replace('_', ' ')}</span>
                    <span>${task.assignee_name || 'Unassigned'}</span>
                </div>
            </article>
        `;
    }

    function renderFundingPreview(entry) {
        const typeLabel = entry.entry_type === 'expense' ? 'Expense' : 'Income';
        const sources = (entry.source_types || []).join(', ') || 'General';
        return `
            <article class="l4p-task">
                <h4 class="l4p-task__title">${entry.title}</h4>
                <div class="l4p-task__meta">
                    <span class="l4p-status-pill" data-status="${entry.entry_type}">${typeLabel}</span>
                    <span>${formatCurrency(entry.amount)}</span>
                </div>
                <div class="l4p-task__meta">
                    <span>${entry.received_date || '—'}</span>
                    <span>${sources}</span>
                </div>
            </article>
        `;
    }

    function renderCrewPreview(member) {
        const avatar = member.avatar && member.avatar.url ? `<img src="${member.avatar.url}" alt="${member.name}" />` : (member.avatar && member.avatar.initials ? member.avatar.initials : (member.name || '').slice(0, 2).toUpperCase());
        const isImage = member.avatar && member.avatar.url;
        return `
            <div class="l4p-crew-preview__card">
                <div class="l4p-crew-preview__avatar">${isImage ? avatar : `<span>${avatar}</span>`}</div>
                <div class="l4p-crew-preview__name">${member.name}</div>
                <div class="l4p-crew-preview__role">${member.role || ''}</div>
            </div>
        `;
    }

    function renderNotificationItem(notification) {
        return `
            <div class="l4p-notification">
                <div>${notification.message}</div>
                <div class="l4p-notification__meta">${timeAgo(notification.created_at)}</div>
            </div>
        `;
    }

    function renderCommunityPreview(item) {
        return `
            <article class="l4p-feed__item">
                <div class="l4p-feed__author">${item.author}</div>
                <div class="l4p-feed__content">${item.excerpt}</div>
                <div class="l4p-feed__meta">${timeAgo(item.date)}</div>
            </article>
        `;
    }

    function loadTasks() {
        Promise.all([
            api('tasks'),
            state.users.length ? Promise.resolve(state.users) : api('users'),
        ])
            .then(([tasks, users]) => {
                state.tasks = tasks;
                state.users = users;
                renderTasks();
            })
            .catch((error) => {
                renderError(panels.tasks, error.message || 'Unable to load tasks.');
            });
    }

    function renderTasks() {
        const panel = panels.tasks;
        if (!panel) {
            return;
        }

        const grouped = STATUS_OPTIONS.reduce((acc, option) => {
            acc[option.value] = [];
            return acc;
        }, {});

        state.tasks.forEach((task) => {
            if (!grouped[task.status]) {
                grouped[task.status] = [];
            }
            grouped[task.status].push(task);
        });

        const canCreate = isCoordinator;

        panel.innerHTML = `
            <div class="l4p-card-grid">
                <section class="l4p-card l4p-card--wide">
                    <header class="l4p-card__header">
                        <h3 class="l4p-card__title">Task Board</h3>
                        <div class="l4p-task-stats">
                            ${STATUS_OPTIONS.map((option) => `<span class="l4p-status-pill" data-status="${option.value}">${option.label}: ${(grouped[option.value] || []).length}</span>`).join(' ')}
                        </div>
                    </header>
                    <div class="l4p-task-board">
                        ${STATUS_OPTIONS.map((option) => `
                            <div class="l4p-task-column" data-status="${option.value}">
                                <h4>${option.label}</h4>
                                <div class="l4p-task-list">
                                    ${(grouped[option.value] || []).map((task) => renderTaskCard(task)).join('') || '<p class="l4p-empty">No tasks</p>'}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </section>
                ${canCreate ? renderTaskForm() : ''}
            </div>
        `;

        if (canCreate) {
            const form = panel.querySelector('#l4p-task-form');
            form?.addEventListener('submit', handleTaskCreate);
        }

        panel.querySelectorAll('.l4p-task-update').forEach((select) => {
            select.addEventListener('change', (event) => {
                const target = event.currentTarget;
                const taskId = target.dataset.task;
                const field = target.name;
                const value = target.value;
                updateTask(taskId, { [field]: value });
            });
        });

        panel.querySelectorAll('.l4p-task-complete').forEach((button) => {
            button.addEventListener('click', (event) => {
                const taskId = event.currentTarget.dataset.task;
                updateTask(taskId, { status: 'complete' });
            });
        });
    }

    function renderTaskForm() {
        return `
            <section class="l4p-card" aria-labelledby="l4p-card-create-task">
                <header class="l4p-card__header">
                    <h3 id="l4p-card-create-task" class="l4p-card__title">Create Task</h3>
                </header>
                <form id="l4p-task-form" class="l4p-form">
                    <label>
                        Title
                        <input type="text" name="title" required />
                    </label>
                    <label>
                        Description
                        <textarea name="content" rows="4"></textarea>
                    </label>
                    <label>
                        Due date
                        <input type="date" name="due_date" />
                    </label>
                    <label>
                        Status
                        <select name="status">
                            ${STATUS_OPTIONS.map((option) => `<option value="${option.value}">${option.label}</option>`).join('')}
                        </select>
                    </label>
                    <label>
                        Assign to
                        <select name="assignee">
                            <option value="">Unassigned</option>
                            ${state.users.map((user) => `<option value="${user.id}">${user.name}</option>`).join('')}
                        </select>
                    </label>
                    <button type="submit" class="l4p-button">Save Task</button>
                </form>
            </section>
        `;
    }

    function renderTaskCard(task) {
        const canUpdate = isCoordinator || (isVolunteer && Number(task.assignee) === Number(settings.currentUser.id));
        const content = (task.content || '').replace(/<[^>]+>/g, '');
        return `
            <article class="l4p-task" data-task="${task.id}">
                <h4 class="l4p-task__title">${task.title}</h4>
                <p class="l4p-task__excerpt">${content.slice(0, 160)}${content.length > 160 ? '…' : ''}</p>
                <div class="l4p-task__meta">
                    <span class="l4p-status-pill" data-status="${task.status}">${task.status.replace('_', ' ')}</span>
                    <span>${task.assignee_name || 'Unassigned'}</span>
                </div>
                <div class="l4p-task__meta">
                    <span>Due: ${task.due_date || 'n/a'}</span>
                </div>
                ${canUpdate ? `
                    <div class="l4p-task__actions">
                        <label>
                            Status
                            <select class="l4p-task-update" name="status" data-task="${task.id}">
                                ${STATUS_OPTIONS.map((option) => `<option value="${option.value}" ${task.status === option.value ? 'selected' : ''}>${option.label}</option>`).join('')}
                            </select>
                        </label>
                        ${isCoordinator ? `
                        <label>
                            Assignee
                            <select class="l4p-task-update" name="assignee" data-task="${task.id}">
                                <option value="">Unassigned</option>
                                ${state.users.map((user) => `<option value="${user.id}" ${Number(task.assignee) === Number(user.id) ? 'selected' : ''}>${user.name}</option>`).join('')}
                            </select>
                        </label>
                        ` : ''}
                        <button type="button" class="l4p-button l4p-task-complete" data-task="${task.id}">Mark Complete</button>
                    </div>
                ` : ''}
            </article>
        `;
    }

    function handleTaskCreate(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form).entries());
        if (data.assignee === '') {
            delete data.assignee;
        }
        api('tasks', {
            method: 'POST',
            body: JSON.stringify(data),
        })
            .then((task) => {
                form.reset();
                state.tasks.push(task);
                renderTasks();
            })
            .catch((error) => {
                alert(error.message || 'Unable to create task.');
            });
    }

    function updateTask(id, updates) {
        api(`tasks/${id}`, {
            method: 'POST',
            body: JSON.stringify(updates),
        })
            .then((task) => {
                state.tasks = state.tasks.map((item) => (Number(item.id) === Number(task.id) ? task : item));
                renderTasks();
            })
            .catch((error) => {
                alert(error.message || 'Unable to update task.');
                loadTasks();
            });
    }

    function loadFunding() {
        api('funding')
            .then((data) => {
                state.funding = data;
                renderFunding();
            })
            .catch((error) => {
                renderError(panels.funding, error.message || 'Unable to load funding.');
            });
    }

    function renderFunding() {
        const panel = panels.funding;
        if (!panel) {
            return;
        }

        const totals = (state.funding && state.funding.totals) || { income: 0, expense: 0, net: 0 };
        const entries = (state.funding && state.funding.entries) || [];
        const distribution = (state.funding && state.funding.distribution) || {};

        const tableRows = entries.length
            ? entries.map((entry) => `
                <tr>
                    <td>${entry.title}</td>
                    <td>${formatCurrency(entry.amount)}</td>
                    <td>${(entry.source_types || []).join(', ') || '—'}</td>
                    <td>${entry.entry_type === 'expense' ? 'Expense' : 'Income'}</td>
                    <td>${entry.received_date || '—'}</td>
                    <td>${stripHTML(entry.notes) || '—'}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="6">No funding entries logged yet.</td></tr>';

        panel.innerHTML = `
            <section class="l4p-card" aria-labelledby="l4p-funding-title">
                <header class="l4p-card__header">
                    <h3 id="l4p-funding-title" class="l4p-card__title">Funding Tracker</h3>
                    <div class="l4p-funding-toolbar">
                        <div>
                            <strong>${formatCurrency(totals.net)}</strong> net • ${formatCurrency(totals.income)} in / ${formatCurrency(totals.expense)} out
                        </div>
                        ${isCoordinator ? '<button type="button" id="l4p-funding-export">Export CSV</button>' : ''}
                    </div>
                </header>
                <div class="l4p-funding-chart">
                    <canvas id="l4p-funding-detail-chart" width="240" height="240" aria-label="Funding breakdown" role="img"></canvas>
                </div>
                <div class="l4p-table-wrapper">
                    <table class="l4p-table">
                        <thead>
                            <tr>
                                <th>Source</th>
                                <th>Amount</th>
                                <th>Category</th>
                                <th>Entry Type</th>
                                <th>Date</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </section>
            ${isCoordinator ? renderFundingForm() : ''}
        `;

        if (isCoordinator) {
            const form = panel.querySelector('#l4p-funding-form');
            form?.addEventListener('submit', handleFundingCreate);
            const exportButton = panel.querySelector('#l4p-funding-export');
            exportButton?.addEventListener('click', handleFundingExport);
        }

        const chartCanvas = panel.querySelector('#l4p-funding-detail-chart');
        drawPie(chartCanvas, distribution);
    }

    function renderFundingForm() {
        return `
            <section class="l4p-card" aria-labelledby="l4p-funding-create">
                <header class="l4p-card__header">
                    <h3 id="l4p-funding-create" class="l4p-card__title">Add Funding Entry</h3>
                </header>
                <form id="l4p-funding-form" class="l4p-form">
                    <label>Source name<input type="text" name="title" required /></label>
                    <label>Amount<input type="number" min="0" step="0.01" name="amount" required /></label>
                    <label>Entry type<select name="entry_type"><option value="income">Income</option><option value="expense">Expense</option></select></label>
                    <label>Source type<input type="text" name="source_type" placeholder="e.g. Corporate Sponsor" /></label>
                    <label>Received date<input type="date" name="received_date" /></label>
                    <label>Notes<textarea name="notes" rows="3"></textarea></label>
                    <button type="submit" class="l4p-button">Record funding</button>
                </form>
            </section>
        `;
    }

    function handleFundingCreate(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form).entries());
        api('funding', {
            method: 'POST',
            body: JSON.stringify(data),
        })
            .then(() => {
                form.reset();
                loadFunding();
                loadDashboard();
            })
            .catch((error) => alert(error.message || 'Unable to record funding.'));
    }

    function handleFundingExport(event) {
        event.preventDefault();
        const url = `${restUrl}funding/export`;
        fetch(url, {
            headers: { 'X-WP-Nonce': nonce },
        })
            .then((response) => {
                if (!response.ok) {
                    return response.json().then((payload) => {
                        throw new Error(payload.message || 'Unable to export funding.');
                    }).catch(() => {
                        throw new Error('Unable to export funding.');
                    });
                }
                return response.text();
            })
            .then((csv) => {
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const downloadUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `funding-export-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(downloadUrl);
            })
            .catch((error) => alert(error.message || 'Unable to export funding.'));
    }

    function loadCrew() {
        api('crew')
            .then((crew) => {
                state.crew = crew;
                if (!state.selectedCrew && crew.length) {
                    state.selectedCrew = crew[0].id;
                }
                renderCrew();
            })
            .catch((error) => {
                renderError(panels.crew, error.message || 'Unable to load crew.');
            });
    }

    function renderCrew() {
        const panel = panels.crew;
        if (!panel) {
            return;
        }

        const selected = state.crew.find((item) => Number(item.id) === Number(state.selectedCrew));

        panel.innerHTML = `
            <div class="l4p-card-grid">
                <section class="l4p-card">
                    <h3 class="l4p-card__title">Crew Roster</h3>
                    <div class="l4p-crew-list">
                        ${state.crew.map((member) => `
                            <button type="button" class="l4p-crew-item ${Number(member.id) === Number(state.selectedCrew) ? 'is-active' : ''}" data-crew="${member.id}">
                                <strong>${member.name}</strong>
                                <span>${member.role || ''}</span>
                            </button>
                        `).join('') || '<p>No crew members yet.</p>'}
                    </div>
                </section>
                ${selected ? renderCrewDetail(selected) : ''}
                ${isCoordinator ? renderCrewForm() : ''}
            </div>
        `;

        panel.querySelectorAll('.l4p-crew-item').forEach((button) => {
            button.addEventListener('click', (event) => {
                state.selectedCrew = event.currentTarget.dataset.crew;
                renderCrew();
            });
        });

        if (isCoordinator) {
            const form = panel.querySelector('#l4p-crew-form');
            form?.addEventListener('submit', handleCrewCreate);
        }
    }

    function renderCrewDetail(member) {
        const hasAvatar = member.avatar && member.avatar.url;
        const avatarContent = hasAvatar ? `<img src="${member.avatar.url}" alt="${member.name}" />` : `<span>${(member.avatar && member.avatar.initials) || (member.name || '').slice(0, 2).toUpperCase()}</span>`;
        return `
            <section class="l4p-card l4p-crew-detail" aria-labelledby="l4p-crew-${member.id}">
                <header class="l4p-card__header">
                    <h3 id="l4p-crew-${member.id}" class="l4p-card__title">${member.name}</h3>
                    <span>${member.role || ''}</span>
                </header>
                <div class="l4p-crew-preview__avatar">${avatarContent}</div>
                <div class="l4p-crew-meta">
                    <p><strong>Email:</strong> <a href="mailto:${member.email || ''}">${member.email || 'N/A'}</a></p>
                    <p><strong>Phone:</strong> <a href="tel:${member.phone || ''}">${member.phone || 'N/A'}</a></p>
                    <p><strong>Availability:</strong> ${member.availability || 'Not set'}</p>
                </div>
                <div class="l4p-crew-tasks">
                    <h4>Assigned Tasks</h4>
                    <ul>
                        ${(member.tasks || []).map((task) => `<li>${task.title} — ${task.status.replace('_', ' ')}</li>`).join('') || '<li>No tasks assigned.</li>'}
                    </ul>
                </div>
                <div class="l4p-crew-notes">${member.content}</div>
            </section>
        `;
    }

    function renderCrewForm() {
        return `
            <section class="l4p-card" aria-labelledby="l4p-crew-create">
                <header class="l4p-card__header">
                    <h3 id="l4p-crew-create" class="l4p-card__title">Add Crew Member</h3>
                </header>
                <form id="l4p-crew-form" class="l4p-form">
                    <label>Name<input type="text" name="name" required /></label>
                    <label>Email<input type="email" name="email" /></label>
                    <label>Phone<input type="text" name="phone" /></label>
                    <label>Role<input type="text" name="role" /></label>
                    <label>Availability<textarea name="availability" rows="3"></textarea></label>
                    <label>Profile image URL<input type="url" name="avatar_url" placeholder="https://" /></label>
                    <label>Link to WordPress User<select name="user_id"><option value="">—</option>${state.users.map((user) => `<option value="${user.id}">${user.name}</option>`).join('')}</select></label>
                    <label>Notes<textarea name="content" rows="4"></textarea></label>
                    <button type="submit" class="l4p-button">Add crew member</button>
                </form>
            </section>
        `;
    }

    function handleCrewCreate(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const entries = new FormData(form);
        const data = Object.fromEntries(entries.entries());
        if (!data.user_id) {
            delete data.user_id;
        }
        api('crew', {
            method: 'POST',
            body: JSON.stringify(data),
        })
            .then((member) => {
                form.reset();
                state.crew.push(member);
                state.selectedCrew = member.id;
                renderCrew();
            })
            .catch((error) => alert(error.message || 'Unable to add crew member.'));
    }

    function loadNotifications(options = {}) {
        const { incremental = false } = options;
        const params = new URLSearchParams();

        if (incremental && state.notificationsSince) {
            params.append('since', state.notificationsSince);
        }

        const path = params.toString() ? `notifications?${params.toString()}` : 'notifications';

        api(path)
            .then((items) => {
                const list = Array.isArray(items) ? items : [];

                if (incremental && state.notifications.length) {
                    const existingIds = new Set(state.notifications.map((item) => item.id));
                    const newItems = list.filter((item) => !existingIds.has(item.id));
                    if (newItems.length) {
                        state.notifications = [...newItems, ...state.notifications];
                    }
                } else {
                    state.notifications = list;
                }

                updateNotificationSince();
                renderNotifications();
            })
            .catch((error) => {
                renderError(panels.notifications, error.message || 'Unable to load notifications.');
            });
    }

    function updateNotificationSince() {
        if (!state.notifications.length) {
            state.notificationsSince = '';
            return;
        }

        const latest = state.notifications.reduce((max, item) => {
            const value = new Date(item.created_at).getTime();
            return Number.isNaN(value) ? max : Math.max(max, value);
        }, 0);

        state.notificationsSince = latest ? new Date(latest).toISOString() : '';
    }

    function renderNotifications() {
        const panel = panels.notifications;
        if (!panel) {
            return;
        }

        panel.innerHTML = `
            <section class="l4p-card" aria-labelledby="l4p-notifications-title">
                <header class="l4p-card__header">
                    <h3 id="l4p-notifications-title" class="l4p-card__title">Notifications Center</h3>
                    <button class="l4p-button" type="button" id="l4p-notifications-read">Mark all read</button>
                </header>
                <div class="l4p-notification-list">
                    ${state.notifications.map((item) => `
                        <article class="l4p-notification ${item.is_read ? 'is-read' : ''}">
                            <div>${item.message}</div>
                            <div class="l4p-notification__meta">${timeAgo(item.created_at)}</div>
                        </article>
                    `).join('') || '<p>Nothing to show.</p>'}
                </div>
            </section>
        `;

        panel.querySelector('#l4p-notifications-read')?.addEventListener('click', () => {
            const ids = state.notifications.filter((item) => !item.is_read).map((item) => item.id);
            if (!ids.length) {
                return;
            }
            api('notifications/read', {
                method: 'POST',
                body: JSON.stringify({ ids }),
            }).then(() => loadNotifications());
        });
    }

    function loadCommunity(options = {}) {
        const { incremental = false } = options;
        const params = new URLSearchParams();

        if (incremental && state.communitySince) {
            params.append('since', state.communitySince);
        }

        const path = params.toString() ? `community?${params.toString()}` : 'community';

        api(path)
            .then((items) => {
                const list = Array.isArray(items) ? items : [];

                if (incremental && state.community.length) {
                    const existingIds = new Set(state.community.map((item) => item.id));
                    const newItems = list.filter((item) => !existingIds.has(item.id));
                    if (newItems.length) {
                        state.community = [...newItems, ...state.community];
                    }
                } else {
                    state.community = list;
                }

                updateCommunitySince();
                renderCommunity();
            })
            .catch((error) => {
                renderError(panels.community, error.message || 'Unable to load community feed.');
            });
    }

    function updateCommunitySince() {
        if (!state.community.length) {
            state.communitySince = '';
            return;
        }

        const latest = state.community.reduce((max, item) => {
            const value = new Date(item.date).getTime();
            return Number.isNaN(value) ? max : Math.max(max, value);
        }, 0);

        state.communitySince = latest ? new Date(latest).toISOString() : '';
    }

    function renderCommunity() {
        const panel = panels.community;
        if (!panel) {
            return;
        }

        panel.innerHTML = `
            <div class="l4p-card-grid">
                <section class="l4p-card" aria-labelledby="l4p-community-title">
                    <header class="l4p-card__header">
                        <h3 id="l4p-community-title" class="l4p-card__title">Community Feed</h3>
                    </header>
                    <div class="l4p-feed">
                        ${state.community.map((item) => renderCommunityItem(item)).join('') || '<p>No posts yet.</p>'}
                    </div>
                </section>
                <section class="l4p-card">
                    <h3 class="l4p-card__title">Share an update</h3>
                    <form id="l4p-community-form" class="l4p-form">
                        <label>Headline<input type="text" name="title" placeholder="Optional headline" /></label>
                        <label>Message<textarea name="message" rows="4" required></textarea></label>
                        <button type="submit" class="l4p-button">Post</button>
                    </form>
                </section>
            </div>
        `;

        panel.querySelector('#l4p-community-form')?.addEventListener('submit', handleCommunityPost);
        panel.querySelectorAll('.l4p-reply-form').forEach((form) => {
            form.addEventListener('submit', handleCommunityReply);
        });
    }

    function renderCommunityItem(item) {
        return `
            <article class="l4p-feed__item" data-feed="${item.id}">
                <div class="l4p-feed__author">${item.author}</div>
                <div class="l4p-feed__meta">${timeAgo(item.date)}</div>
                <div class="l4p-feed__content">${item.content}</div>
                <div class="l4p-feed__replies">
                    <h4>Replies</h4>
                    <div class="l4p-feed__reply-list">
                        ${(item.replies || []).map((reply) => `
                            <div class="l4p-feed__reply">
                                <strong>${reply.author}</strong>
                                <div>${reply.content}</div>
                                <span class="l4p-feed__meta">${timeAgo(reply.date)}</span>
                            </div>
                        `).join('') || '<p>No replies yet.</p>'}
                    </div>
                    <form class="l4p-form l4p-reply-form" data-feed="${item.id}">
                        <label>Add reply<textarea name="message" rows="2" required></textarea></label>
                        <button type="submit" class="l4p-button">Send reply</button>
                    </form>
                </div>
            </article>
        `;
    }

    function handleCommunityPost(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const data = Object.fromEntries(new FormData(form).entries());
        api('community', {
            method: 'POST',
            body: JSON.stringify(data),
        })
            .then((item) => {
                form.reset();
                state.community.unshift(item);
                renderCommunity();
            })
            .catch((error) => alert(error.message || 'Unable to share update.'));
    }

    function handleCommunityReply(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const feedId = form.dataset.feed;
        const data = Object.fromEntries(new FormData(form).entries());
        api(`community/${feedId}/reply`, {
            method: 'POST',
            body: JSON.stringify(data),
        })
            .then(() => loadCommunity())
            .catch((error) => alert(error.message || 'Unable to send reply.'));
    }

    function renderError(panel, message) {
        if (!panel) {
            return;
        }
        panel.innerHTML = `<div class="l4p-card"><p>${message}</p></div>`;
    }

    function scheduleRefresh() {
        setInterval(() => {
            if (state.currentView === 'dashboard') {
                loadDashboard();
            }
            if (state.currentView === 'notifications') {
                loadNotifications({ incremental: true });
            }
            if (state.currentView === 'community') {
                loadCommunity({ incremental: true });
            }
        }, 5000);
    }

    root.querySelectorAll('.l4p-dashboard__nav-link').forEach((link) => {
        link.addEventListener('click', (event) => {
            setView(event.currentTarget.dataset.target);
        });
    });

    Promise.all([
        api('dashboard'),
        api('users').catch(() => []),
    ]).then(([dashboard, users]) => {
        state.dashboard = dashboard;
        state.users = users;
        renderDashboard();
        scheduleRefresh();
    }).catch((error) => {
        renderError(panels.dashboard, error.message || 'Unable to load dashboard.');
    });
})();

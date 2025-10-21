(function () {
    'use strict';

    const config = window.local4picnicDashboard || null;

    function ready(fn) {
        if (document.readyState !== 'loading') {
            fn();
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    function apiRequest(endpoint, method = 'GET', payload) {
        if (!config) {
            return Promise.reject(new Error('Missing configuration.'));
        }

        const options = {
            method,
            headers: {
                'X-WP-Nonce': config.nonce,
                'Content-Type': 'application/json'
            }
        };

        if (payload) {
            options.body = JSON.stringify(payload);
        }

        return fetch(config.restUrl + endpoint, options).then((response) => {
            if (!response.ok) {
                return response.json().then((data) => {
                    const error = new Error(data.message || 'Request failed');
                    error.data = data;
                    throw error;
                }).catch(() => {
                    throw new Error('Request failed');
                });
            }

            return response.json();
        });
    }

    function createElement(tag, className, text) {
        const el = document.createElement(tag);
        if (className) {
            el.className = className;
        }
        if (text) {
            el.textContent = text;
        }
        return el;
    }

    ready(function () {
        const root = document.getElementById('local4picnic-dashboard');

        if (!root || !config) {
            return;
        }

        const state = {
            tasks: [],
            funding: {
                entries: [],
                summary: []
            },
            crew: [],
            notifications: [],
            threads: []
        };

        const elements = {
            navButtons: root.querySelectorAll('.local4picnic-dashboard__nav button'),
            panels: root.querySelectorAll('.local4picnic-panel'),
            overviewTasks: document.getElementById('l4p-overview-tasks'),
            overviewNotifications: document.getElementById('l4p-overview-notifications'),
            overviewFeed: document.getElementById('l4p-overview-feed'),
            fundingChart: document.getElementById('l4p-funding-chart'),
            fundingLegend: document.getElementById('l4p-funding-legend'),
            taskboard: document.getElementById('l4p-taskboard'),
            fundingLedger: document.getElementById('l4p-funding-ledger'),
            crewList: document.getElementById('l4p-crew-list'),
            notifications: document.getElementById('l4p-notifications'),
            feed: document.getElementById('l4p-feed'),
            taskModal: document.getElementById('l4p-task-modal'),
            taskForm: document.getElementById('l4p-task-form'),
            fundingModal: document.getElementById('l4p-funding-modal'),
            fundingForm: document.getElementById('l4p-funding-form'),
            crewModal: document.getElementById('l4p-crew-modal'),
            crewForm: document.getElementById('l4p-crew-form'),
            feedModal: document.getElementById('l4p-feed-modal'),
            feedForm: document.getElementById('l4p-feed-form'),
            taskButton: root.querySelector('[data-action="open-task-modal"]'),
            fundingButton: root.querySelector('[data-action="open-funding-modal"]'),
            crewButton: root.querySelector('[data-action="open-crew-modal"]'),
            feedButton: root.querySelector('[data-action="open-feed-modal"]'),
            modals: root.parentNode.querySelectorAll('.local4picnic-modal')
        };

        const colors = ['#f97316', '#6366f1', '#14b8a6', '#ec4899', '#facc15', '#0ea5e9'];

        function setPanel(target) {
            elements.navButtons.forEach((button) => {
                const isActive = button.getAttribute('data-target') === target;
                button.classList.toggle('is-active', isActive);
            });

            elements.panels.forEach((panel) => {
                panel.classList.toggle('is-active', panel.getAttribute('data-panel') === target);
            });
        }

        elements.navButtons.forEach((button) => {
            button.addEventListener('click', () => {
                setPanel(button.getAttribute('data-target'));
            });
        });

        function setButtonVisibility() {
            if (!config.user.caps.manageTasks && elements.taskButton) {
                elements.taskButton.style.display = 'none';
            }
            if (!config.user.caps.manageFunding && elements.fundingButton) {
                elements.fundingButton.style.display = 'none';
            }
            if (!config.user.caps.manageCrew && elements.crewButton) {
                elements.crewButton.style.display = 'none';
            }
        }

        setButtonVisibility();

        function openModal(modal) {
            if (!modal) {
                return;
            }
            modal.classList.add('is-active');
        }

        function closeModal(modal) {
            if (!modal) {
                return;
            }
            modal.classList.remove('is-active');
        }

        elements.modals.forEach((modal) => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) {
                    closeModal(modal);
                }
            });
            modal.querySelectorAll('[data-action="close-modal"]').forEach((button) => {
                button.addEventListener('click', () => closeModal(modal));
            });
        });

        if (elements.taskButton) {
            elements.taskButton.addEventListener('click', () => openModal(elements.taskModal));
        }
        if (elements.fundingButton) {
            elements.fundingButton.addEventListener('click', () => openModal(elements.fundingModal));
        }
        if (elements.crewButton) {
            elements.crewButton.addEventListener('click', () => openModal(elements.crewModal));
        }
        if (elements.feedButton) {
            elements.feedButton.addEventListener('click', () => openModal(elements.feedModal));
        }

        function serializeForm(form) {
            const data = new FormData(form);
            const result = {};

            data.forEach((value, key) => {
                if (value === '') {
                    result[key] = '';
                } else {
                    result[key] = value;
                }
            });

            return result;
        }

        function resetForm(form) {
            if (form) {
                form.reset();
            }
        }

        function handleFormSubmission(form, callback) {
            if (!form) {
                return;
            }

            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const submitButton = form.querySelector('button[type="submit"]');
                const originalText = submitButton ? submitButton.textContent : '';

                if (submitButton) {
                    submitButton.disabled = true;
                    submitButton.textContent = config.strings.saving;
                }

                const payload = serializeForm(form);

                try {
                    await callback(payload);
                    resetForm(form);
                    elements.modals.forEach((modal) => closeModal(modal));
                } catch (error) {
                    // eslint-disable-next-line no-alert
                    alert(config.strings.error);
                    // eslint-disable-next-line no-console
                    console.error(error);
                } finally {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.textContent = originalText;
                    }
                }
            });
        }

        handleFormSubmission(elements.taskForm, async (payload) => {
            if (!config.user.caps.manageTasks) {
                return;
            }

            payload.assigned_to = payload.assigned_to ? parseInt(payload.assigned_to, 10) : 0;
            await apiRequest('tasks', 'POST', payload);
            await loadTasks();
        });

        handleFormSubmission(elements.fundingForm, async (payload) => {
            if (!config.user.caps.manageFunding) {
                return;
            }

            payload.amount = parseFloat(payload.amount || 0);
            await apiRequest('funding', 'POST', payload);
            await loadFunding();
        });

        handleFormSubmission(elements.crewForm, async (payload) => {
            if (!config.user.caps.manageCrew) {
                return;
            }

            await apiRequest('crew', 'POST', payload);
            await loadCrew();
        });

        handleFormSubmission(elements.feedForm, async (payload) => {
            await apiRequest('feed', 'POST', payload);
            await loadFeed();
        });

        function renderEmpty(container, message) {
            container.innerHTML = '';
            const empty = createElement('div', 'local4picnic-empty', message);
            container.appendChild(empty);
        }

        function renderOverviewTasks() {
            const container = elements.overviewTasks;

            if (!container) {
                return;
            }

            container.innerHTML = '';
            const myTasks = state.tasks.filter((task) => task.assigned_to === config.user.id || config.user.caps.manageTasks).slice(0, 4);

            if (!myTasks.length) {
                renderEmpty(container, config.strings.noTasks);
                return;
            }

            myTasks.forEach((task) => {
                const item = createElement('li');
                const title = createElement('strong', null, task.title);
                const status = createElement('span', 'local4picnic-task-status', config.strings.statuses[task.status] || task.status);
                status.dataset.status = task.status;
                const due = task.due_date ? new Date(task.due_date + 'Z').toLocaleDateString() : null;

                item.appendChild(title);
                if (task.assigned_name) {
                    item.appendChild(createElement('span', null, task.assigned_name));
                }
                item.appendChild(status);

                if (due) {
                    item.appendChild(createElement('small', null, 'Due ' + due));
                }

                container.appendChild(item);
            });
        }

        function renderFundingSummary() {
            const chart = elements.fundingChart;
            const legend = elements.fundingLegend;

            if (!chart || !legend) {
                return;
            }

            const summary = state.funding.summary;
            const total = summary.reduce((sum, item) => sum + Math.abs(item.total), 0);

            if (!total) {
                chart.innerHTML = '';
                chart.appendChild(createElement('span', null, config.strings.noFunding));
                legend.innerHTML = '';
                return;
            }

            let currentAngle = 0;
            const parts = [];

            legend.innerHTML = '';

            summary.forEach((item, index) => {
                const value = Math.abs(item.total);
                const fraction = value / total;
                const startAngle = currentAngle;
                currentAngle += fraction * 360;
                const color = colors[index % colors.length];
                parts.push(`${color} ${startAngle}deg ${currentAngle}deg`);

                const legendItem = createElement('li');
                const swatch = createElement('span');
                swatch.style.background = color;
                const label = `${item.category} (${item.direction})`;
                const amount = new Intl.NumberFormat(undefined, { style: 'currency', currency: config.settings.currency || 'USD', minimumFractionDigits: 2 }).format(item.total);
                legendItem.appendChild(swatch);
                legendItem.appendChild(createElement('span', null, `${label} – ${amount}`));
                legend.appendChild(legendItem);
            });

            chart.style.background = `conic-gradient(${parts.join(', ')})`;
            chart.textContent = '';
        }

        function renderTaskBoard() {
            const columns = elements.taskboard ? elements.taskboard.querySelectorAll('.local4picnic-taskcolumn') : [];

            if (!columns.length) {
                return;
            }

            columns.forEach((column) => {
                const list = column.querySelector('ul');
                if (list) {
                    list.innerHTML = '';
                }
            });

            state.tasks.forEach((task) => {
                const column = Array.from(columns).find((col) => col.dataset.status === task.status);
                if (!column) {
                    return;
                }

                const list = column.querySelector('ul');
                const card = createElement('li', 'local4picnic-taskcard');
                card.appendChild(createElement('strong', null, task.title));

                if (task.description) {
                    const description = createElement('p');
                    description.innerHTML = task.description;
                    card.appendChild(description);
                }

                const footer = createElement('footer');
                const metaParts = [];

                if (task.assigned_name) {
                    metaParts.push(task.assigned_name);
                }

                if (task.due_date) {
                    const due = new Date(task.due_date + 'Z').toLocaleDateString();
                    metaParts.push('Due ' + due);
                }

                footer.appendChild(createElement('span', null, metaParts.join(' • ')));

                if (canUpdateTask(task)) {
                    const nextStatus = getNextStatus(task.status);
                    if (nextStatus) {
                        const button = createElement('button', null, config.strings.statuses[nextStatus] || nextStatus);
                        button.addEventListener('click', async () => {
                            await apiRequest(`tasks/${task.id}`, 'POST', { status: nextStatus });
                            await loadTasks();
                        });
                        footer.appendChild(button);
                    }
                }

                if (config.user.caps.manageTasks) {
                    const remove = createElement('button', null, '✕');
                    remove.setAttribute('aria-label', 'Delete task');
                    remove.addEventListener('click', async () => {
                        if (confirm('Delete this task?')) { // eslint-disable-line no-alert
                            await apiRequest(`tasks/${task.id}`, 'DELETE');
                            await loadTasks();
                        }
                    });
                    footer.appendChild(remove);
                }

                card.appendChild(footer);
                list.appendChild(card);
            });
        }

        function getNextStatus(status) {
            if (status === 'not_started') {
                return 'in_progress';
            }
            if (status === 'in_progress') {
                return 'completed';
            }
            return null;
        }

        function canUpdateTask(task) {
            return config.user.caps.manageTasks || task.assigned_to === config.user.id;
        }

        function renderFundingLedger() {
            const container = elements.fundingLedger;

            if (!container) {
                return;
            }

            container.innerHTML = '';

            if (!state.funding.entries.length) {
                renderEmpty(container, config.strings.noFunding);
                return;
            }

            const table = createElement('table');
            const thead = createElement('thead');
            const headerRow = createElement('tr');
            ['Category', 'Direction', 'Amount', 'Source', 'Recorded', 'Notes'].forEach((label) => {
                headerRow.appendChild(createElement('th', null, label));
            });
            if (config.user.caps.manageFunding) {
                headerRow.appendChild(createElement('th', null, 'Actions'));
            }
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = createElement('tbody');
            state.funding.entries.forEach((entry) => {
                const row = createElement('tr');
                row.appendChild(createElement('td', null, entry.category));
                const directionLabel = entry.direction === 'income' ? 'Income' : 'Expense';
                row.appendChild(createElement('td', null, directionLabel));
                const amount = new Intl.NumberFormat(undefined, { style: 'currency', currency: config.settings.currency || 'USD', minimumFractionDigits: 2 }).format(entry.amount);
                row.appendChild(createElement('td', entry.direction === 'income' ? 'income' : 'expense', amount));
                row.appendChild(createElement('td', null, entry.source || '—'));
                const recorded = new Date(entry.recorded_at + 'Z').toLocaleString();
                row.appendChild(createElement('td', null, recorded));
                const notesCell = createElement('td');
                notesCell.innerHTML = entry.notes || '—';
                row.appendChild(notesCell);

                if (config.user.caps.manageFunding) {
                    const removeCell = createElement('td');
                    const removeButton = createElement('button', null, 'Delete');
                    removeButton.addEventListener('click', async () => {
                        if (confirm('Delete this funding entry?')) { // eslint-disable-line no-alert
                            await apiRequest(`funding/${entry.id}`, 'DELETE');
                            await loadFunding();
                        }
                    });
                    removeCell.appendChild(removeButton);
                    row.appendChild(removeCell);
                }

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            container.appendChild(table);
        }

        function renderCrew() {
            const container = elements.crewList;

            if (!container) {
                return;
            }

            container.innerHTML = '';

            if (!state.crew.length) {
                renderEmpty(container, config.strings.noCrew);
                return;
            }

            const table = createElement('table');
            const thead = createElement('thead');
            const headerRow = createElement('tr');
            ['Name', 'Email', 'Phone', 'Role'].forEach((label) => headerRow.appendChild(createElement('th', null, label)));
            if (config.user.caps.manageCrew) {
                headerRow.appendChild(createElement('th', null, 'Actions'));
            }
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = createElement('tbody');
            state.crew.forEach((member) => {
                const row = createElement('tr');
                row.appendChild(createElement('td', null, member.name));
                row.appendChild(createElement('td', null, member.email || '—'));
                row.appendChild(createElement('td', null, member.phone || '—'));
                row.appendChild(createElement('td', null, member.role));

                if (config.user.caps.manageCrew) {
                    const actions = createElement('td');
                    const remove = createElement('button', null, 'Delete');
                    remove.addEventListener('click', async () => {
                        if (confirm('Remove this crew member?')) { // eslint-disable-line no-alert
                            await apiRequest(`crew/${member.id}`, 'DELETE');
                            await loadCrew();
                        }
                    });
                    actions.appendChild(remove);
                    row.appendChild(actions);
                }

                tbody.appendChild(row);
            });

            table.appendChild(tbody);
            container.appendChild(table);
        }

        function renderNotifications() {
            const overview = elements.overviewNotifications;
            const center = elements.notifications;

            if (overview) {
                overview.innerHTML = '';
            }
            if (center) {
                center.innerHTML = '';
            }

            if (!state.notifications.length) {
                if (overview) {
                    renderEmpty(overview, config.strings.noNotifications);
                }
                if (center) {
                    renderEmpty(center, config.strings.noNotifications);
                }
                return;
            }

            const latest = state.notifications.slice(0, 4);

            latest.forEach((notification) => {
                if (overview) {
                    const item = createElement('li');
                    const message = createElement('strong', null, notification.message);
                    const time = new Date(notification.created_at + 'Z').toLocaleString();
                    item.appendChild(message);
                    item.appendChild(createElement('small', null, time));
                    overview.appendChild(item);
                }
            });

            if (center) {
                state.notifications.forEach((notification) => {
                    const item = createElement('div', 'local4picnic-notification');
                    const meta = createElement('div', 'local4picnic-notification__meta');
                    meta.appendChild(createElement('span', 'local4picnic-notification__badge', notification.type.substring(0, 2).toUpperCase()));
                    meta.appendChild(createElement('strong', null, notification.message));
                    meta.appendChild(createElement('small', null, new Date(notification.created_at + 'Z').toLocaleString()));
                    item.appendChild(meta);

                    if (!notification.is_read) {
                        const button = createElement('button', null, 'Mark read');
                        button.addEventListener('click', async () => {
                            await apiRequest(`notifications/${notification.id}/read`, 'POST');
                            await loadNotifications();
                        });
                        item.appendChild(button);
                    }

                    center.appendChild(item);
                });
            }
        }

        function renderFeed() {
            const overview = elements.overviewFeed;
            const full = elements.feed;

            if (overview) {
                overview.innerHTML = '';
            }
            if (full) {
                full.innerHTML = '';
            }

            if (!state.threads.length) {
                if (overview) {
                    renderEmpty(overview, config.strings.noFeed);
                }
                if (full) {
                    renderEmpty(full, config.strings.noFeed);
                }
                return;
            }

            const recent = state.threads.slice(0, 3);
            recent.forEach((thread) => {
                if (overview) {
                    const card = createElement('div', 'local4picnic-feed__thread');
                    card.appendChild(createElement('strong', null, thread.author));
                    const body = createElement('p');
                    body.innerHTML = thread.content;
                    card.appendChild(body);
                    overview.appendChild(card);
                }
            });

            if (full) {
                state.threads.forEach((thread) => {
                    const card = createElement('div', 'local4picnic-feed__thread');
                    const header = createElement('div', 'local4picnic-feed__meta');
                    header.appendChild(createElement('strong', null, thread.author));
                    header.appendChild(createElement('span', null, new Date(thread.created_at + 'Z').toLocaleString()));
                    card.appendChild(header);

                    const body = createElement('p');
                    body.innerHTML = thread.content;
                    card.appendChild(body);

                    if (thread.replies && thread.replies.length) {
                        const replies = createElement('div', 'local4picnic-feed__replies');
                        thread.replies.forEach((reply) => {
                            const replyCard = createElement('div', 'local4picnic-feed__reply');
                            replyCard.appendChild(createElement('strong', null, reply.author));
                            const replyBody = createElement('p');
                            replyBody.innerHTML = reply.content;
                            replyCard.appendChild(replyBody);
                            replyCard.appendChild(createElement('small', null, new Date(reply.created_at + 'Z').toLocaleString()));
                            replies.appendChild(replyCard);
                        });
                        card.appendChild(replies);
                    }

                    const replyForm = createElement('form');
                    replyForm.className = 'local4picnic-feed__reply-form';
                    const textarea = createElement('textarea');
                    textarea.required = true;
                    textarea.rows = 2;
                    textarea.placeholder = 'Reply to this update…';
                    replyForm.appendChild(textarea);
                    const submit = createElement('button', 'local4picnic-button', 'Reply');
                    submit.type = 'submit';
                    replyForm.appendChild(submit);

                    replyForm.addEventListener('submit', async (event) => {
                        event.preventDefault();
                        if (!textarea.value.trim()) {
                            return;
                        }
                        submit.disabled = true;
                        try {
                            await apiRequest('feed', 'POST', { content: textarea.value, parent_id: thread.id });
                            textarea.value = '';
                            await loadFeed();
                        } catch (error) {
                            // eslint-disable-next-line no-alert
                            alert(config.strings.error);
                            // eslint-disable-next-line no-console
                            console.error(error);
                        } finally {
                            submit.disabled = false;
                        }
                    });

                    card.appendChild(replyForm);
                    full.appendChild(card);
                });
            }
        }

        async function loadTasks() {
            try {
                const response = await apiRequest('tasks');
                state.tasks = response.tasks || [];
                renderOverviewTasks();
                renderTaskBoard();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }

        async function loadFunding() {
            try {
                const response = await apiRequest('funding');
                state.funding = response;
                renderFundingSummary();
                renderFundingLedger();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }

        async function loadCrew() {
            try {
                const response = await apiRequest('crew');
                state.crew = response.crew || [];
                renderCrew();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }

        async function loadNotifications() {
            try {
                const response = await apiRequest('notifications');
                state.notifications = response.notifications || [];
                renderNotifications();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }

        async function loadFeed() {
            try {
                const response = await apiRequest('feed');
                state.threads = response.threads || [];
                renderFeed();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }

        function initializePolling() {
            setInterval(loadFeed, 15000);
            setInterval(loadNotifications, 20000);
        }

        loadTasks();
        loadFunding();
        loadCrew();
        loadNotifications();
        loadFeed();
        initializePolling();
    });
})();

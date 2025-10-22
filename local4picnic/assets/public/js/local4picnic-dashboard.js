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

    function delay(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
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
                summary: [],
                goal: config.settings.fundingGoal || 0,
                visibility: config.settings.fundingVisibility || 'public'
            },
            crew: [],
            notifications: [],
            threads: [],
            feedComments: !!config.settings.feedComments,
            users: [],
            unread: 0,
            notificationCursor: null,
            editingFunding: null
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
            taskMetrics: document.getElementById('l4p-task-metrics'),
            fundingLedger: document.getElementById('l4p-funding-ledger'),
            fundingProgress: document.getElementById('l4p-funding-progress'),
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
            modals: root.parentNode.querySelectorAll('.local4picnic-modal'),
            navBadgeTasks: root.querySelector('[data-badge="tasks"]'),
            navBadgeNotifications: root.querySelector('[data-badge="notifications"]'),
            navBadgeCommunity: root.querySelector('[data-badge="community"]'),
            assigneeCombobox: root.querySelector('[data-component="assignee"]')
        };

        const colors = ['#f97316', '#6366f1', '#14b8a6', '#ec4899', '#facc15', '#0ea5e9'];
        const streamConfig = config.stream || {};

        const currencyFormatter = new Intl.NumberFormat(undefined, {
            style: 'currency',
            currency: config.settings.currency || 'USD',
            minimumFractionDigits: 2
        });

        function formatCurrency(value) {
            return currencyFormatter.format(Number.isFinite(value) ? value : 0);
        }

        function updateNavBadge(element, value) {
            if (!element) {
                return;
            }

            if (!value) {
                element.textContent = '';
                element.classList.remove('is-visible');
                return;
            }

            element.textContent = value;
            element.classList.add('is-visible');
        }

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

        function renderAssigneeOptions(filterText) {
            const combo = elements.assigneeCombobox;

            if (!combo) {
                return;
            }

            const list = combo.querySelector('.local4picnic-combobox__list');
            const hiddenInput = combo.querySelector('input[type="hidden"]');

            if (!list) {
                return;
            }

            list.innerHTML = '';

            const query = (filterText || '').toLowerCase();
            const matches = state.users.filter((user) => {
                if (!query) {
                    return true;
                }

                return (
                    user.name.toLowerCase().includes(query) ||
                    (user.email && user.email.toLowerCase().includes(query))
                );
            });

            const options = [{ id: 0, name: config.strings.unassigned, email: '' }].concat(matches);
            const selectedValue = hiddenInput ? hiddenInput.value : '0';

            options.forEach((user) => {
                const item = createElement('li');
                const button = createElement('button', 'local4picnic-combobox__option');
                button.type = 'button';
                button.dataset.value = String(user.id);
                button.setAttribute('role', 'option');

                const isSelected = String(user.id) === selectedValue;
                button.setAttribute('aria-selected', isSelected ? 'true' : 'false');

                if (isSelected) {
                    button.classList.add('is-selected');
                }

                const title = createElement('strong', null, user.name);
                button.appendChild(title);

                if (user.email) {
                    button.appendChild(createElement('span', null, user.email));
                }

                item.appendChild(button);
                list.appendChild(item);
            });

            if (!matches.length) {
                const emptyItem = createElement('li', 'local4picnic-combobox__empty', config.strings.noMatches);
                emptyItem.setAttribute('role', 'note');
                list.appendChild(emptyItem);
            }
        }

        function setupAssigneeCombobox() {
            const combo = elements.assigneeCombobox;

            if (!combo) {
                return;
            }

            const hiddenInput = combo.querySelector('input[type="hidden"]');
            const searchInput = combo.querySelector('.local4picnic-combobox__search');
            const list = combo.querySelector('.local4picnic-combobox__list');
            const clearButton = combo.querySelector('.local4picnic-combobox__clear');

            if (!hiddenInput || !searchInput || !list || !clearButton) {
                return;
            }

            function updateClearButton() {
                if (!clearButton) {
                    return;
                }

                clearButton.style.visibility = hiddenInput.value && hiddenInput.value !== '0' ? 'visible' : 'hidden';
            }

            function closeList() {
                combo.classList.remove('is-open');
                searchInput.setAttribute('aria-expanded', 'false');
            }

            function openList() {
                combo.classList.add('is-open');
                searchInput.setAttribute('aria-expanded', 'true');
            }

            function selectAssignee(user) {
                if (!user || user.id === 0) {
                    hiddenInput.value = '0';
                    searchInput.value = '';
                    combo.dataset.selected = '';
                } else {
                    hiddenInput.value = String(user.id);
                    searchInput.value = user.name;
                    combo.dataset.selected = user.name;
                }

                updateClearButton();
                closeList();
            }

            searchInput.addEventListener('focus', () => {
                renderAssigneeOptions(searchInput.value);
                openList();
            });

            searchInput.addEventListener('input', () => {
                renderAssigneeOptions(searchInput.value);
                openList();
            });

            searchInput.addEventListener('keydown', (event) => {
                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    const first = list.querySelector('button');
                    if (first) {
                        first.focus();
                    }
                } else if (event.key === 'Escape') {
                    closeList();
                }
            });

            list.addEventListener('click', (event) => {
                const button = event.target.closest('button');
                if (!button) {
                    return;
                }

                const userId = parseInt(button.dataset.value, 10);
                const user = userId ? state.users.find((item) => item.id === userId) : null;
                selectAssignee(user || { id: 0, name: config.strings.unassigned });
            });

            list.addEventListener('keydown', (event) => {
                const button = event.target.closest('button');
                if (!button) {
                    return;
                }

                if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    const next = button.closest('li').nextElementSibling;
                    if (next) {
                        const nextButton = next.querySelector('button');
                        if (nextButton) {
                            nextButton.focus();
                        }
                    }
                } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    const previous = button.closest('li').previousElementSibling;
                    if (previous) {
                        const prevButton = previous.querySelector('button');
                        if (prevButton) {
                            prevButton.focus();
                        }
                    } else {
                        searchInput.focus();
                    }
                } else if (event.key === 'Escape') {
                    searchInput.focus();
                    closeList();
                } else if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    button.click();
                }
            });

            clearButton.addEventListener('click', () => {
                selectAssignee({ id: 0, name: config.strings.unassigned });
                searchInput.focus();
            });

            updateClearButton();

            document.addEventListener('click', (event) => {
                if (!combo.contains(event.target)) {
                    closeList();
                }
            });
        }

        setupAssigneeCombobox();

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

            if (!config.user.caps.viewFunding) {
                chart.innerHTML = '';
                chart.appendChild(createElement('span', null, config.strings.noFundingPermission));
                legend.innerHTML = '';
                renderFundingProgress();
                return;
            }

            const summary = state.funding.summary;
            const total = summary.reduce((sum, item) => sum + Math.abs(item.total), 0);

            if (!total) {
                chart.innerHTML = '';
                chart.appendChild(createElement('span', null, config.strings.noFunding));
                legend.innerHTML = '';
                renderFundingProgress();
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
                const directionLabel = item.direction === 'income'
                    ? (config.strings.incomeLabel || 'Income')
                    : (config.strings.expenseLabel || 'Expense');
                const label = `${item.category} (${directionLabel})`;
                const amount = formatCurrency(item.total);
                legendItem.appendChild(swatch);
                legendItem.appendChild(createElement('span', null, `${label} – ${amount}`));
                legend.appendChild(legendItem);
            });

            chart.style.background = `conic-gradient(${parts.join(', ')})`;
            chart.textContent = '';

            renderFundingProgress();
        }

        function renderFundingProgress() {
            const container = elements.fundingProgress;

            if (!container) {
                return;
            }

            if (!config.user.caps.viewFunding) {
                container.classList.add('is-muted');
                container.querySelector('.local4picnic-progress__fill').style.width = '0%';
                container.querySelector('.local4picnic-progress__text').textContent = config.strings.noFundingPermission;
                return;
            }

            container.classList.remove('is-muted');

            const fill = container.querySelector('.local4picnic-progress__fill');
            const text = container.querySelector('.local4picnic-progress__text');
            const goal = state.funding.goal || config.settings.fundingGoal || 0;

            const totals = state.funding.summary.reduce(
                (acc, item) => {
                    if (item.direction === 'income') {
                        acc.income += Math.abs(item.total);
                    } else {
                        acc.expense += Math.abs(item.total);
                    }

                    return acc;
                },
                { income: 0, expense: 0 }
            );

            const raised = totals.income - totals.expense;

            if (!goal) {
                fill.style.width = '0%';
                text.textContent = config.strings.noFunding;
                return;
            }

            const ratio = Math.max(0, Math.min(raised / goal, 1));
            fill.style.width = `${(ratio * 100).toFixed(1)}%`;

            if (ratio >= 1) {
                text.textContent = config.strings.goalComplete;
            } else {
                const progressText = config.strings.goalProgress
                    .replace('%1$s', formatCurrency(raised))
                    .replace('%2$s', formatCurrency(goal));
                const remaining = config.strings.goalRemaining.replace('%1$s', formatCurrency(goal - raised));
                text.textContent = `${progressText} · ${remaining}`;
            }
        }

        function renderTaskMetrics() {
            const container = elements.taskMetrics;

            if (!container) {
                return;
            }

            container.innerHTML = '';

            if (!state.tasks.length) {
                updateNavBadge(elements.navBadgeTasks, '');
                return;
            }

            const totals = {
                not_started: 0,
                in_progress: 0,
                completed: 0
            };

            let mine = 0;

            state.tasks.forEach((task) => {
                if (totals[task.status] !== undefined) {
                    totals[task.status] += 1;
                }

                if (task.assigned_to === config.user.id && task.status !== 'completed') {
                    mine += 1;
                }
            });

            const open = totals.not_started + totals.in_progress;

            const list = createElement('ul', 'local4picnic-metricchips');

            Object.keys(totals).forEach((statusKey) => {
                const label = config.strings.statuses[statusKey] || statusKey;
                const item = createElement('li');
                item.appendChild(createElement('span', null, label));
                item.appendChild(createElement('strong', null, String(totals[statusKey])));
                list.appendChild(item);
            });

            container.appendChild(list);

            const mineChip = createElement('div', 'local4picnic-metricchips__focus');
            mineChip.appendChild(createElement('span', null, config.strings.claimedTask));
            mineChip.appendChild(createElement('strong', null, String(mine)));
            container.appendChild(mineChip);

            updateNavBadge(elements.navBadgeTasks, open);
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

                if (!config.user.caps.manageTasks && task.assigned_to === 0) {
                    const claimButton = createElement('button', 'local4picnic-button local4picnic-button--ghost', config.strings.claimTask);
                    claimButton.addEventListener('click', async () => {
                        try {
                            await apiRequest(`tasks/${task.id}`, 'POST', { assigned_to: config.user.id });
                            await Promise.all([loadTasks(), loadNotifications()]);
                        } catch (error) {
                            // eslint-disable-next-line no-console
                            console.error(error);
                        }
                    });
                    footer.appendChild(claimButton);
                }

                if (config.user.caps.manageTasks) {
                    const remove = createElement('button', 'local4picnic-button local4picnic-button--danger', config.strings.delete);
                    remove.setAttribute('aria-label', config.strings.deleteTaskLabel || config.strings.delete);
                    remove.addEventListener('click', async () => {
                        if (confirm(config.strings.confirmDeleteTask || 'Delete this task?')) { // eslint-disable-line no-alert
                            await apiRequest(`tasks/${task.id}`, 'DELETE');
                            await loadTasks();
                        }
                    });
                    footer.appendChild(remove);
                }

                card.appendChild(footer);
                list.appendChild(card);
            });

            renderTaskMetrics();
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

            if (!config.user.caps.viewFunding) {
                renderEmpty(container, config.strings.noFundingPermission);
                return;
            }

            if (!state.funding.entries.length) {
                renderEmpty(container, config.strings.noFunding);
                return;
            }

            const table = createElement('table', 'local4picnic-table');
            const thead = createElement('thead');
            const headerRow = createElement('tr');
            const headers = [
                config.strings.categoryLabel || 'Category',
                config.strings.directionLabel || 'Direction',
                config.strings.amountLabel || 'Amount',
                config.strings.sourceLabel || 'Source',
                config.strings.recordedLabel || 'Recorded',
                config.strings.notesLabel || 'Notes'
            ];
            headers.forEach((label) => {
                headerRow.appendChild(createElement('th', null, label));
            });
            if (config.user.caps.manageFunding) {
                headerRow.appendChild(createElement('th', null, config.strings.actionsLabel || 'Actions'));
            }
            thead.appendChild(headerRow);
            table.appendChild(thead);

            const tbody = createElement('tbody');

            state.funding.entries.forEach((entry) => {
                const isEditing = state.editingFunding === entry.id;
                const row = createElement('tr', isEditing ? 'is-editing' : '');

                if (isEditing && config.user.caps.manageFunding) {
                    const categoryInput = createElement('input');
                    categoryInput.type = 'text';
                    categoryInput.value = entry.category;
                    const directionSelect = createElement('select');
                    ['income', 'expense'].forEach((direction) => {
                        const option = createElement('option', null, direction === 'income' ? (config.strings.incomeLabel || 'Income') : (config.strings.expenseLabel || 'Expense'));
                        option.value = direction;
                        if (direction === entry.direction) {
                            option.selected = true;
                        }
                        directionSelect.appendChild(option);
                    });
                    const amountInput = createElement('input');
                    amountInput.type = 'number';
                    amountInput.step = '0.01';
                    amountInput.value = entry.amount;
                    const sourceInput = createElement('input');
                    sourceInput.type = 'text';
                    sourceInput.value = entry.source || '';
                    const recordedInput = createElement('input');
                    recordedInput.type = 'datetime-local';
                    recordedInput.value = entry.recorded_at ? new Date(entry.recorded_at + 'Z').toISOString().slice(0, 16) : '';
                    const notesInput = createElement('textarea');
                    notesInput.rows = 2;
                    notesInput.value = entry.notes ? entry.notes.replace(/<[^>]+>/g, '') : '';

                    [categoryInput, directionSelect, amountInput, sourceInput, recordedInput, notesInput].forEach((field) => {
                        const cell = createElement('td');
                        cell.appendChild(field);
                        row.appendChild(cell);
                    });

                    const actions = createElement('td');
                    const saveButton = createElement('button', 'local4picnic-button', config.strings.save);
                    const cancelButton = createElement('button', 'local4picnic-button local4picnic-button--ghost', config.strings.cancel);

                    saveButton.addEventListener('click', async () => {
                        const payload = {
                            category: categoryInput.value,
                            direction: directionSelect.value,
                            amount: parseFloat(amountInput.value || 0),
                            source: sourceInput.value,
                            notes: notesInput.value,
                            recorded_at: recordedInput.value
                        };

                        try {
                            await apiRequest(`funding/${entry.id}`, 'POST', payload);
                            state.editingFunding = null;
                            await loadFunding();
                        } catch (error) {
                            // eslint-disable-next-line no-console
                            console.error(error);
                        }
                    });

                    cancelButton.addEventListener('click', () => {
                        state.editingFunding = null;
                        renderFundingLedger();
                    });

                    actions.appendChild(saveButton);
                    actions.appendChild(cancelButton);
                    row.appendChild(actions);
                } else {
                    row.appendChild(createElement('td', null, entry.category));
                    const directionLabel = entry.direction === 'income' ? (config.strings.incomeLabel || 'Income') : (config.strings.expenseLabel || 'Expense');
                    row.appendChild(createElement('td', null, directionLabel));
                    row.appendChild(createElement('td', entry.direction === 'income' ? 'income' : 'expense', formatCurrency(entry.amount)));
                    row.appendChild(createElement('td', null, entry.source || '—'));
                    const recorded = entry.recorded_at ? new Date(entry.recorded_at + 'Z').toLocaleString() : '—';
                    row.appendChild(createElement('td', null, recorded));
                    const notesCell = createElement('td');
                    notesCell.innerHTML = entry.notes || '—';
                    row.appendChild(notesCell);

                    if (config.user.caps.manageFunding) {
                        const actions = createElement('td');
                        const editButton = createElement('button', 'local4picnic-button local4picnic-button--ghost', config.strings.edit);
                        editButton.addEventListener('click', () => {
                            state.editingFunding = entry.id;
                            renderFundingLedger();
                        });

                        const removeButton = createElement('button', 'local4picnic-button local4picnic-button--danger', config.strings.delete);
                        removeButton.addEventListener('click', async () => {
                            if (confirm(config.strings.confirmDeleteFunding || 'Delete this funding entry?')) { // eslint-disable-line no-alert
                                await apiRequest(`funding/${entry.id}`, 'DELETE');
                                await loadFunding();
                            }
                        });

                        actions.appendChild(editButton);
                        actions.appendChild(removeButton);
                        row.appendChild(actions);
                    }
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

            const table = createElement('table', 'local4picnic-table');
            const thead = createElement('thead');
            const headerRow = createElement('tr');
            [
                config.strings.nameLabel || 'Name',
                config.strings.emailLabel || 'Email',
                config.strings.phoneLabel || 'Phone',
                config.strings.roleLabel || 'Role'
            ].forEach((label) => headerRow.appendChild(createElement('th', null, label)));
            if (config.user.caps.manageCrew) {
                headerRow.appendChild(createElement('th', null, config.strings.actionsLabel || 'Actions'));
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
                    const remove = createElement('button', 'local4picnic-button local4picnic-button--danger', config.strings.delete);
                    remove.addEventListener('click', async () => {
                        if (confirm(config.strings.confirmDeleteCrew || 'Remove this crew member?')) { // eslint-disable-line no-alert
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

            updateNavBadge(elements.navBadgeNotifications, state.unread);

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
                    if (!notification.is_read) {
                        item.classList.add('is-unread');
                    }
                    const meta = createElement('div', 'local4picnic-notification__meta');
                    meta.appendChild(createElement('span', 'local4picnic-notification__badge', notification.type.substring(0, 2).toUpperCase()));
                    meta.appendChild(createElement('strong', null, notification.message));
                    meta.appendChild(createElement('small', null, new Date(notification.created_at + 'Z').toLocaleString()));
                    item.appendChild(meta);

                    if (!notification.is_read) {
                        const button = createElement('button', 'local4picnic-button local4picnic-button--ghost', config.strings.markRead || 'Mark read');
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

            const now = Date.now();
            const activeThreads = state.threads.filter((thread) => {
                const updatedAt = thread.updated_at || thread.created_at;
                return updatedAt && now - Date.parse(updatedAt) < 86400000;
            }).length;

            updateNavBadge(elements.navBadgeCommunity, activeThreads);

            if (!state.threads.length) {
                if (overview) {
                    renderEmpty(overview, config.strings.noFeed);
                }
                if (full) {
                    renderEmpty(full, config.strings.noFeed);
                    if (!state.feedComments) {
                        const locked = createElement('p', 'local4picnic-feed__locked', config.strings.replyDisabled);
                        full.appendChild(locked);
                    }
                }
                updateNavBadge(elements.navBadgeCommunity, '');
                return;
            }

            const recent = state.threads.slice(0, 3);
            recent.forEach((thread) => {
                if (!overview) {
                    return;
                }
                const card = createElement('div', 'local4picnic-feed__thread');
                card.appendChild(createElement('strong', null, thread.author));
                const body = createElement('p');
                body.innerHTML = thread.content;
                card.appendChild(body);
                overview.appendChild(card);
            });

            if (!full) {
                return;
            }

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

                if (state.feedComments) {
                    const replyForm = createElement('form');
                    replyForm.className = 'local4picnic-feed__reply-form';
                    const textarea = createElement('textarea');
                    textarea.required = true;
                    textarea.rows = 2;
                    textarea.placeholder = config.strings.replyPlaceholder || 'Reply to this update…';
                    replyForm.appendChild(textarea);
                    const submit = createElement('button', 'local4picnic-button', config.strings.replyAction || 'Reply');
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
                } else {
                    const locked = createElement('p', 'local4picnic-feed__locked', config.strings.replyDisabled);
                    card.appendChild(locked);
                }

                full.appendChild(card);
            });
        }

        async function loadUsers() {
            if (!elements.assigneeCombobox || !config.user.caps.manageTasks) {
                return;
            }

            try {
                const response = await apiRequest('users');
                state.users = response.users || [];
                const searchField = elements.assigneeCombobox.querySelector('.local4picnic-combobox__search');
                renderAssigneeOptions(searchField ? searchField.value : '');
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
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
                state.funding.entries = response.entries || [];
                state.funding.summary = response.summary || [];
                state.funding.goal = response.goal || config.settings.fundingGoal || 0;
                state.funding.visibility = response.visibility || config.settings.fundingVisibility || 'public';
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
                const since = state.notificationCursor ? `?since=${encodeURIComponent(state.notificationCursor)}` : '';
                const response = await apiRequest(`notifications${since}`);
                const incoming = response.notifications || [];

                if (state.notificationCursor && incoming.length) {
                    const existing = state.notifications.filter((item) => !incoming.find((incomingItem) => incomingItem.id === item.id));
                    state.notifications = incoming.concat(existing).slice(0, 50);
                } else if (!state.notificationCursor) {
                    state.notifications = incoming;
                }

                state.unread = response.unread || 0;
                state.notificationCursor = response.refreshed_at || new Date().toISOString();
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
                if (Object.prototype.hasOwnProperty.call(response, 'allow_comments')) {
                    state.feedComments = !!response.allow_comments;
                }
                renderFeed();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error(error);
            }
        }

        const refreshHandlers = {
            tasks: loadTasks,
            funding: loadFunding,
            crew: loadCrew,
            notifications: loadNotifications,
            feed: loadFeed,
        };

        const pollers = {};
        const inFlightRefresh = {};
        let streamController = null;
        let streamActive = false;
        let streamCursor = null;
        let streamBackoff = 1000;
        let streamErrorCount = 0;

        function schedulePoll(key, callback, interval) {
            if (pollers[key]) {
                clearTimeout(pollers[key]);
            }

            const tick = async () => {
                if (document.hidden) {
                    pollers[key] = setTimeout(tick, interval);
                    return;
                }

                try {
                    await callback();
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error(error);
                } finally {
                    pollers[key] = setTimeout(tick, interval);
                }
            };

            pollers[key] = setTimeout(tick, interval);
        }

        function initializePolling() {
            schedulePoll('feed', loadFeed, 5000);
            schedulePoll('notifications', loadNotifications, 6000);
            schedulePoll('tasks', loadTasks, 12000);
            schedulePoll('funding', loadFunding, 20000);
            schedulePoll('crew', loadCrew, 25000);
        }

        async function runRefresh(category) {
            if (!refreshHandlers[category]) {
                return;
            }

            if (inFlightRefresh[category]) {
                await inFlightRefresh[category];
                return;
            }

            const job = (async () => {
                try {
                    await refreshHandlers[category]();
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error(error);
                } finally {
                    inFlightRefresh[category] = null;
                }
            })();

            inFlightRefresh[category] = job;

            await job;
        }

        async function handleStreamEvents(events) {
            if (!Array.isArray(events) || !events.length) {
                return;
            }

            const queue = new Set();

            events.forEach((event) => {
                if (event && event.category && refreshHandlers[event.category]) {
                    queue.add(event.category);
                }
            });

            for (const category of queue) {
                // eslint-disable-next-line no-await-in-loop
                await runRefresh(category);
            }
        }

        async function openStreamLoop() {
            const configuredTimeout = Number(streamConfig.timeout);
            const timeout = Number.isFinite(configuredTimeout) && configuredTimeout > 0 ? configuredTimeout : 25;

            while (streamActive) {
                try {
                    streamController = new AbortController();

                    const params = new URLSearchParams();
                    params.append('timeout', timeout);

                    if (streamCursor) {
                        params.append('since', streamCursor);
                    }

                    const response = await fetch(`${config.restUrl}stream?${params.toString()}`, {
                        method: 'GET',
                        headers: {
                            'X-WP-Nonce': config.nonce,
                        },
                        credentials: 'same-origin',
                        signal: streamController.signal,
                    });

                    if (!response.ok) {
                        throw new Error(`Stream request failed with status ${response.status}`);
                    }

                    const payload = await response.json();

                    if (payload.cursor) {
                        streamCursor = payload.cursor;
                    }

                    if (Array.isArray(payload.events) && payload.events.length) {
                        streamErrorCount = 0;
                        streamBackoff = 1000;
                        await handleStreamEvents(payload.events);
                    } else {
                        streamErrorCount = 0;
                        streamBackoff = 1000;
                    }
                } catch (error) {
                    if (error.name === 'AbortError') {
                        return;
                    }

                    // eslint-disable-next-line no-console
                    console.error(error);

                    streamErrorCount += 1;

                    if (!streamActive) {
                        return;
                    }

                    if (streamErrorCount >= 5) {
                        streamActive = false;
                        if (streamController) {
                            try {
                                streamController.abort();
                            } catch (abortError) {
                                // eslint-disable-next-line no-console
                                console.warn(abortError);
                            }
                            streamController = null;
                        }
                        initializePolling();
                        return;
                    }

                    await delay(streamBackoff);
                    streamBackoff = Math.min(streamBackoff * 2, 15000);
                }
            }
        }

        function stopStream() {
            streamActive = false;

            if (streamController) {
                streamController.abort();
                streamController = null;
            }
        }

        function initializeRealtime() {
            if (!streamConfig.enabled || typeof fetch === 'undefined' || typeof AbortController === 'undefined' || typeof URLSearchParams === 'undefined') {
                initializePolling();
                return;
            }

            streamActive = true;
            streamCursor = null;
            streamBackoff = 1000;
            streamErrorCount = 0;

            openStreamLoop();
        }

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                runRefresh('feed');
                runRefresh('notifications');
            }
        });

        window.addEventListener('beforeunload', () => {
            stopStream();
        });

        loadTasks();
        loadFunding();
        loadCrew();
        loadUsers();
        loadNotifications();
        loadFeed();
        initializeRealtime();
    });
})();

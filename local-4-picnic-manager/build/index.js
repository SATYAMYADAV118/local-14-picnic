(function () {
  const root = document.getElementById('l4p-dashboard-root');
  if (!root) {
    return;
  }

  const boot = window.l4pDashboard || {};
  if (!boot.restUrl || !boot.nonce) {
    renderError('Dashboard bootstrap data missing.');
    return;
  }

  const state = {
    activeView: 'dashboard',
    tasks: [],
    tasksFilter: 'all',
    crew: [],
    funding: { data: [], summary: { income: 0, expense: 0, net: 0 } },
    notifications: { data: [], badge: 0 },
    community: [],
    settings: boot.settings || {},
    loading: new Set(),
    modals: {
      taskForm: false,
      fundingForm: false,
      crewProfile: null,
    },
    taskFormState: {
      id: null,
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      url: '',
      assignee_id: boot.currentUser ? boot.currentUser.id : null,
    },
    fundingFormState: {
      id: null,
      type: 'income',
      amount: '',
      category: '',
      note: '',
      tx_date: new Date().toISOString().slice(0, 10),
    },
    toasts: [],
  };

  const caps = new Set((boot.currentUser && boot.currentUser.caps) || []);
  const isCoordinator = Boolean(caps.has('manage_l4p_funding'));

  applyTheme(state.settings);
  injectStyles();

  root.innerHTML = '';
  const app = el('div', 'l4p-app');
  const sidebar = el('aside', 'l4p-sidebar');
  const header = el('header', 'l4p-header');
  const content = el('main', 'l4p-content');
  const toastHost = el('div', 'l4p-toast-host');
  root.appendChild(app);
  app.append(sidebar, el('div', 'l4p-main', [header, content]), toastHost);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'funding', label: 'Funding', icon: '💰', cap: 'manage_l4p_tasks' },
    { id: 'crew', label: 'Crew', icon: '🧑‍🤝‍🧑' },
    { id: 'community', label: 'Community', icon: '💬' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'settings', label: 'Settings', icon: '⚙️', cap: 'manage_l4p_settings' },
  ].filter((item) => {
    if (!item.cap) {
      return true;
    }
    return caps.has(item.cap);
  });

  const logo = el('div', 'l4p-logo');
  function renderBranding() {
    logo.innerHTML = '';
    if (state.settings.dashboard_icon) {
      logo.appendChild(
        el('img', 'l4p-logo-img', null, {
          src: state.settings.dashboard_icon,
          alt: state.settings.dashboard_title || 'Local Picnic',
        })
      );
    } else {
      logo.appendChild(
        el(
          'span',
          'l4p-logo-fallback',
          (state.settings.dashboard_title || 'Local Picnic').slice(0, 2).toUpperCase()
        )
      );
    }
    logo.appendChild(
      el('div', 'l4p-logo-text', [
        el('strong', null, state.settings.dashboard_title || 'Local Picnic'),
        el('span', 'l4p-logo-sub', 'Crew Operations'),
      ])
    );
  }
  renderBranding();
  sidebar.appendChild(logo);

  const nav = el('nav', 'l4p-nav');
  navItems.forEach((item) => {
    const button = el('button', 'l4p-nav-item', [el('span', 'l4p-nav-icon', item.icon), document.createTextNode(item.label)]);
    button.dataset.view = item.id;
    button.addEventListener('click', () => {
      if (state.activeView !== item.id) {
        state.activeView = item.id;
        updateNavigation();
        renderView();
      }
    });
    nav.appendChild(button);
  });
  sidebar.appendChild(nav);

  updateNavigation();
  renderHeader();
  renderView();
  hydrateInitialData();

  function renderError(message) {
    root.innerHTML = '';
    const panel = document.createElement('div');
    panel.style.padding = '32px';
    panel.style.maxWidth = '600px';
    panel.style.margin = '40px auto';
    panel.style.background = '#fff';
    panel.style.borderRadius = '16px';
    panel.style.boxShadow = '0 10px 40px rgba(15,23,42,0.12)';
    const title = document.createElement('h2');
    title.textContent = 'Local 4 Picnic Manager';
    panel.appendChild(title);
    const text = document.createElement('p');
    text.textContent = message;
    panel.appendChild(text);
    root.appendChild(panel);
  }

  function hydrateInitialData() {
    loadTasks();
    loadCrew();
    loadFunding();
    loadNotifications();
    loadCommunity();
    loadSettings();
  }

  function applyTheme(settings) {
    if (!settings) {
      return;
    }
    const primary = settings.theme_primary || '#0B5CD6';
    const accent = settings.theme_accent || '#06B6D4';
    const style = document.documentElement.style;
    style.setProperty('--l4p-primary', primary);
    style.setProperty('--l4p-accent', accent);
  }

  function injectStyles() {
    if (document.getElementById('l4p-dashboard-styles')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'l4p-dashboard-styles';
    style.textContent = `
      :root {
        --l4p-primary: #0B5CD6;
        --l4p-accent: #06B6D4;
        --l4p-bg: #F6F8FB;
        --l4p-card: #ffffff;
        --l4p-success: #22C55E;
        --l4p-warning: #F59E0B;
        --l4p-danger: #EF4444;
        --l4p-text: #0f172a;
        font-family: 'Inter', 'Segoe UI', sans-serif;
      }
      .l4p-viewport, .l4p-wrap {
        width: 100%;
        min-height: 100vh;
        margin: 0;
        padding: 0;
        background: var(--l4p-bg);
      }
      .l4p-app {
        display: grid;
        grid-template-columns: 260px 1fr;
        min-height: 100vh;
        background: var(--l4p-bg);
      }
      .l4p-sidebar {
        background: linear-gradient(180deg, rgba(11,92,214,0.95), rgba(6,182,212,0.85));
        color: #fff;
        padding: 32px 20px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 24px;
        position: sticky;
        top: 0;
        align-self: start;
        min-height: 100vh;
      }
      .l4p-main {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }
      .l4p-header {
        background: var(--l4p-card);
        padding: 20px 32px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 8px 20px rgba(15,23,42,0.06);
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .l4p-user-pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(15,23,42,0.06);
        font-weight: 600;
      }
      .l4p-content {
        padding: 24px 32px 40px;
        overflow-y: auto;
        height: calc(100vh - 96px);
      }
      .l4p-logo {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .l4p-logo-img {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        object-fit: cover;
      }
      .l4p-logo-fallback {
        display: inline-flex;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        background: rgba(255,255,255,0.18);
        align-items: center;
        justify-content: center;
        font-weight: 700;
      }
      .l4p-logo-text strong {
        display: block;
        font-size: 1.05rem;
      }
      .l4p-logo-sub {
        font-size: 0.75rem;
        opacity: 0.85;
      }
      .l4p-nav {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .l4p-nav-item {
        all: unset;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        border-radius: 12px;
        cursor: pointer;
        transition: background 0.2s ease;
      }
      .l4p-nav-item:hover {
        background: rgba(255,255,255,0.12);
      }
      .l4p-nav-item[data-active="true"] {
        background: rgba(255,255,255,0.22);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.25);
      }
      .l4p-nav-icon {
        font-size: 1.1rem;
      }
      .l4p-cards {
        display: grid;
        gap: 20px;
      }
      .l4p-stack {
        display: grid;
        gap: 24px;
      }
      .l4p-row {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .l4p-row-end {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
      }
      .l4p-row-gap {
        display: flex;
        gap: 10px;
      }
      @media (min-width: 1024px) {
        .l4p-cards.two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .l4p-cards.three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      .l4p-card {
        background: var(--l4p-card);
        border-radius: 18px;
        padding: 24px;
        box-shadow: 0 12px 30px rgba(15,23,42,0.08);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .l4p-card-title {
        font-size: 1.05rem;
        font-weight: 600;
        margin: 0;
      }
      .l4p-task {
        display: grid;
        gap: 8px;
        padding: 12px;
        border-radius: 14px;
        background: rgba(15,23,42,0.03);
      }
      .l4p-task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .l4p-task-actions button {
        margin-left: 6px;
      }
      .l4p-btn {
        background: var(--l4p-primary);
        color: #fff;
        border: none;
        border-radius: 12px;
        padding: 10px 16px;
        cursor: pointer;
        font-weight: 600;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .l4p-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(11,92,214,0.25);
      }
      .l4p-btn.secondary {
        background: rgba(15,23,42,0.08);
        color: var(--l4p-text);
      }
      .l4p-btn.danger {
        background: #EF4444;
      }
      .l4p-empty {
        padding: 20px;
        background: rgba(15,23,42,0.04);
        border-radius: 12px;
        text-align: center;
      }
      .l4p-table {
        width: 100%;
        border-collapse: collapse;
      }
      .l4p-table th, .l4p-table td {
        padding: 12px 10px;
        text-align: left;
        border-bottom: 1px solid rgba(15,23,42,0.08);
      }
      .l4p-grid {
        display: grid;
        gap: 16px;
      }
      @media (min-width: 768px) {
        .l4p-grid.cols-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      .l4p-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        background: rgba(11,92,214,0.12);
        color: var(--l4p-primary);
      }
      .l4p-tabs {
        display: inline-flex;
        background: rgba(15,23,42,0.06);
        padding: 4px;
        border-radius: 12px;
        gap: 4px;
      }
      .l4p-tab {
        border: none;
        background: transparent;
        padding: 8px 14px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 600;
      }
      .l4p-tab[data-active="true"] {
        background: #fff;
        color: var(--l4p-primary);
        box-shadow: 0 6px 12px rgba(15,23,42,0.08);
      }
      .l4p-modal-backdrop {
        position: fixed;
        inset: 0;
        background: rgba(15,23,42,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 20;
      }
      .l4p-modal {
        background: #fff;
        border-radius: 18px;
        padding: 24px;
        width: min(520px, calc(100% - 40px));
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 60px rgba(15,23,42,0.18);
      }
      .l4p-form {
        display: grid;
        gap: 16px;
      }
      .l4p-field label {
        display: block;
        font-weight: 600;
        margin-bottom: 6px;
      }
      .l4p-field input,
      .l4p-field textarea,
      .l4p-field select {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid rgba(15,23,42,0.12);
        background: rgba(255,255,255,0.9);
      }
      .l4p-toast-host {
        position: fixed;
        right: 24px;
        bottom: 24px;
        display: grid;
        gap: 12px;
        z-index: 50;
      }
      .l4p-toast {
        background: #fff;
        border-left: 4px solid var(--l4p-primary);
        padding: 14px 18px;
        border-radius: 14px;
        box-shadow: 0 18px 40px rgba(15,23,42,0.16);
        min-width: 220px;
      }
      .l4p-badge {
        display: inline-flex;
        background: var(--l4p-danger);
        color: #fff;
        border-radius: 999px;
        font-size: 0.72rem;
        padding: 4px 8px;
        margin-left: 8px;
      }
      .l4p-notification {
        border-bottom: 1px solid rgba(15,23,42,0.08);
        padding: 12px 0;
      }
      .l4p-community-post {
        border-radius: 16px;
        padding: 16px;
        background: rgba(255,255,255,0.9);
        box-shadow: inset 0 0 0 1px rgba(15,23,42,0.06);
        display: grid;
        gap: 12px;
      }
      .l4p-community-replies {
        padding-left: 16px;
        border-left: 2px solid rgba(15,23,42,0.08);
        display: grid;
        gap: 10px;
      }
      @media (max-width: 1023px) {
        .l4p-app {
          grid-template-columns: 1fr;
        }
        .l4p-sidebar {
          flex-direction: row;
          align-items: center;
          justify-content: space-between;
          padding: 18px 22px;
          position: sticky;
          top: 0;
          z-index: 6;
        }
        .l4p-nav {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px,1fr));
          gap: 6px;
        }
        .l4p-main {
          min-height: calc(100vh - 120px);
        }
        .l4p-header {
          position: static;
        }
        .l4p-content {
          height: auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function el(tag, className, children, attrs) {
    const element = document.createElement(tag);
    if (className) {
      element.className = className;
    }
    if (attrs) {
      Object.entries(attrs).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          element.setAttribute(key, value);
        }
      });
    }
    if (Array.isArray(children)) {
      children.forEach((child) => {
        if (child === null || child === undefined) {
          return;
        }
        element.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
      });
    } else if (children !== null && children !== undefined) {
      element.appendChild(typeof children === 'string' ? document.createTextNode(children) : children);
    }
    return element;
  }

  function updateNavigation() {
    nav.querySelectorAll('.l4p-nav-item').forEach((button) => {
      button.dataset.active = button.dataset.view === state.activeView ? 'true' : 'false';
      if (button.dataset.view === 'notifications') {
        const existing = button.querySelector('.l4p-badge');
        if (existing) existing.remove();
        if (state.notifications.badge) {
          button.appendChild(el('span', 'l4p-badge', String(state.notifications.badge)));
        }
      }
    });
  }

  function renderHeader() {
    header.innerHTML = '';
    const title = navItems.find((item) => item.id === state.activeView)?.label || 'Dashboard';
    header.appendChild(el('h1', null, title));
    if (boot.currentUser && boot.currentUser.name) {
      const user = el('div', 'l4p-user-pill', [
        el('span', null, boot.currentUser.name),
      ]);
      if (boot.currentUser.avatar) {
        const avatar = el('img', null, null, { src: boot.currentUser.avatar, alt: boot.currentUser.name });
        avatar.style.width = '36px';
        avatar.style.height = '36px';
        avatar.style.borderRadius = '50%';
        avatar.style.marginRight = '10px';
        user.prepend(avatar);
      }
      header.appendChild(user);
    }
  }

  function renderView() {
    renderHeader();
    updateNavigation();
    content.innerHTML = '';
    switch (state.activeView) {
      case 'dashboard':
        renderDashboard();
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
      case 'community':
        renderCommunity();
        break;
      case 'notifications':
        renderNotifications();
        break;
      case 'settings':
        renderSettings();
        break;
      default:
        content.appendChild(el('p', null, 'View not available.'));
    }
  }

  function renderDashboard() {
    const grid = el('div', 'l4p-cards two');
    grid.appendChild(dashboardTasksCard());
    grid.appendChild(fundingSnapshotCard());
    grid.appendChild(notificationsCard());
    grid.appendChild(communityCard());
    content.appendChild(grid);
  }

  function dashboardTasksCard() {
    const card = cardShell('My Tasks');
    const myTasks = state.tasks.filter((task) => task.assignee_id === (boot.currentUser?.id || null)).slice(0, 3);
    if (!myTasks.length) {
      card.appendChild(el('div', 'l4p-empty', 'No tasks assigned to you yet.'));
      return card;
    }
    myTasks.forEach((task) => {
      card.appendChild(taskSummary(task));
    });
    return card;
  }

  function fundingSnapshotCard() {
    const card = cardShell('Funding Snapshot');
    const { income = 0, expense = 0, net = 0 } = state.funding.summary || {};
    card.appendChild(el('p', null, `Income: $${income.toFixed(2)} | Expense: $${expense.toFixed(2)} | Net: $${net.toFixed(2)}`));
    const list = el('ul', null);
    state.funding.data.slice(0, 5).forEach((item) => {
      list.appendChild(el('li', null, `${formatDate(item.tx_date)} • ${item.category} • ${item.type === 'income' ? '+' : '-'}$${Number(item.amount).toFixed(2)}`));
    });
    card.appendChild(list);
    return card;
  }

  function notificationsCard() {
    const card = cardShell('Latest Notifications');
    state.notifications.data.slice(0, 5).forEach((note) => {
      const div = el('div', null, [
        el('strong', null, note.title),
        el('div', null, note.body),
        el('small', null, formatDateTime(note.created_at)),
      ]);
      card.appendChild(div);
    });
    if (!state.notifications.data.length) {
      card.appendChild(el('div', 'l4p-empty', 'No notifications yet.'));
    }
    return card;
  }

  function communityCard() {
    const card = cardShell('Community');
    state.community.slice(0, 3).forEach((post) => {
      const block = el('div', null, [
        el('strong', null, post.author?.name || 'Member'),
        el('div', null, truncate(post.body, 120)),
        el('small', null, formatDateTime(post.created_at)),
      ]);
      card.appendChild(block);
    });
    if (!state.community.length) {
      card.appendChild(el('div', 'l4p-empty', 'No community posts yet.'));
    }
    return card;
  }

  function renderTasks() {
    const container = el('div', 'l4p-stack');
    const headerRow = el('div', 'l4p-row');
    const tabs = el('div', 'l4p-tabs');
    [
      { id: 'all', label: 'All' },
      { id: 'todo', label: 'To-Do' },
      { id: 'progress', label: 'In Progress' },
      { id: 'done', label: 'Completed' },
    ].forEach((tab) => {
      const button = el('button', 'l4p-tab', tab.label);
      button.dataset.active = state.tasksFilter === tab.id ? 'true' : 'false';
      button.addEventListener('click', () => {
        if (state.tasksFilter !== tab.id) {
          state.tasksFilter = tab.id;
          loadTasks();
        }
      });
      tabs.appendChild(button);
    });
    headerRow.appendChild(tabs);
    if (canCreateTasks()) {
      const add = el('button', 'l4p-btn', 'Add Task');
      add.style.marginLeft = 'auto';
      add.addEventListener('click', () => {
        openTaskForm();
      });
      headerRow.appendChild(add);
    }
    container.appendChild(headerRow);

    const list = el('div', 'l4p-cards');
    const myTasks = state.tasks.filter((task) => task.assignee_id === (boot.currentUser?.id || null));
    const otherTasks = state.tasks.filter((task) => task.assignee_id !== (boot.currentUser?.id || null));

    list.appendChild(tasksGroup('My Tasks', myTasks));
    list.appendChild(tasksGroup('Other Tasks', otherTasks));
    container.appendChild(list);

    content.appendChild(container);
    renderTaskModal();
  }

  function canCreateTasks() {
    return caps.has('manage_l4p_tasks') && (isCoordinator || state.settings.volunteer_create_tasks || caps.has('manage_l4p_funding'));
  }

  function tasksGroup(title, tasks) {
    const card = cardShell(title);
    if (!tasks.length) {
      card.appendChild(el('div', 'l4p-empty', 'Nothing to show.'));
      return card;
    }
    tasks.forEach((task) => {
      card.appendChild(renderTask(task));
    });
    return card;
  }

  function renderTask(task) {
    const container = el('div', 'l4p-task');
    container.appendChild(el('div', 'l4p-task-header', [
      el('strong', null, task.title),
      el('span', 'l4p-chip', statusLabel(task.status)),
    ]));
    if (task.description) {
      container.appendChild(el('div', null, task.description));
    }
    const meta = [];
    if (task.assignee_name) {
      meta.push(`Assigned to ${task.assignee_name}`);
    }
    if (task.created_by_name) {
      meta.push(`by ${task.created_by_name}`);
    }
    container.appendChild(el('small', null, meta.join(' • ')));
    const actions = el('div', 'l4p-task-actions');
    ['todo', 'progress', 'done'].forEach((status) => {
      const btn = el('button', 'l4p-btn secondary', statusLabel(status));
      btn.disabled = task.status === status;
      btn.addEventListener('click', () => updateTaskStatus(task, status));
      actions.appendChild(btn);
    });
    container.appendChild(actions);
    return container;
  }

  function renderTaskModal() {
    const existing = document.querySelector('.l4p-task-modal');
    if (existing) existing.remove();
    if (!state.modals.taskForm) {
      return;
    }
    const backdrop = el('div', 'l4p-modal-backdrop l4p-task-modal');
    const modal = el('div', 'l4p-modal');
    modal.appendChild(el('h2', null, state.taskFormState.id ? 'Edit Task' : 'New Task'));
    const form = el('form', 'l4p-form');
    form.appendChild(field('Title', input('text', 'title', state.taskFormState.title, true)));
    form.appendChild(field('Description', textarea('description', state.taskFormState.description)));
    form.appendChild(field('Priority', select('priority', state.taskFormState.priority, [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ])));
    form.appendChild(field('Due Date', input('date', 'due_date', state.taskFormState.due_date)));
    form.appendChild(field('Reference URL', input('url', 'url', state.taskFormState.url)));
    form.appendChild(field('Assign To', select('assignee_id', String(state.taskFormState.assignee_id || ''), crewOptions())));
    if (state.taskFormState.id) {
      form.appendChild(field('Status', select('status', state.taskFormState.status, [
        { value: 'todo', label: 'To-Do' },
        { value: 'progress', label: 'In Progress' },
        { value: 'done', label: 'Completed' },
      ])));
    }
    const actions = el('div', 'l4p-row-end');
    const cancel = el('button', 'l4p-btn secondary', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', closeTaskForm);
    const submit = el('button', 'l4p-btn', state.taskFormState.id ? 'Save Changes' : 'Create Task');
    submit.type = 'submit';
    actions.append(cancel, submit);
    form.appendChild(actions);
    form.addEventListener('submit', submitTaskForm);
    modal.appendChild(form);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
  }

  function field(labelText, control) {
    const wrapper = el('div', 'l4p-field');
    wrapper.appendChild(el('label', null, labelText));
    wrapper.appendChild(control);
    return wrapper;
  }

  function input(type, name, value, required) {
    const elInput = document.createElement('input');
    elInput.type = type;
    elInput.name = name;
    elInput.value = value || '';
    if (required) {
      elInput.required = true;
    }
    elInput.addEventListener('input', (event) => {
      state.taskFormState[event.target.name] = event.target.value;
    });
    return elInput;
  }

  function textarea(name, value) {
    const elTextarea = document.createElement('textarea');
    elTextarea.name = name;
    elTextarea.rows = 4;
    elTextarea.value = value || '';
    elTextarea.addEventListener('input', (event) => {
      state.taskFormState[event.target.name] = event.target.value;
    });
    return elTextarea;
  }

  function select(name, value, options) {
    const elSelect = document.createElement('select');
    elSelect.name = name;
    options.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      if (String(option.value) === String(value || '')) {
        opt.selected = true;
      }
      elSelect.appendChild(opt);
    });
    elSelect.addEventListener('change', (event) => {
      const selected = event.target.value;
      if (name === 'assignee_id') {
        state.taskFormState[name] = selected ? Number(selected) : null;
      } else {
        state.taskFormState[name] = selected;
      }
    });
    return elSelect;
  }

  function crewOptions() {
    const options = [{ value: '', label: 'Unassigned' }];
    state.crew.forEach((member) => {
      options.push({ value: String(member.wp_user_id || ''), label: `${member.name} (${member.role})` });
    });
    return options;
  }

  function openTaskForm(task) {
    state.modals.taskForm = true;
    if (task) {
      state.taskFormState = { ...task };
    } else {
      state.taskFormState = {
        id: null,
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        due_date: '',
        url: '',
        assignee_id: boot.currentUser ? boot.currentUser.id : null,
      };
    }
    renderTaskModal();
  }

  function closeTaskForm() {
    state.modals.taskForm = false;
    renderTaskModal();
  }

  async function submitTaskForm(event) {
    event.preventDefault();
    const payload = {
      title: state.taskFormState.title,
      description: state.taskFormState.description,
      status: state.taskFormState.status,
      priority: state.taskFormState.priority,
      due_date: state.taskFormState.due_date,
      url: state.taskFormState.url,
      assignee_id: state.taskFormState.assignee_id,
    };
    try {
      if (state.taskFormState.id) {
        await apiFetch(`/tasks/${state.taskFormState.id}/status`, {
          method: 'POST',
          body: JSON.stringify({ status: payload.status }),
        });
      } else {
        await apiFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      closeTaskForm();
      showToast('Task saved successfully');
      await loadTasks();
    } catch (error) {
      showToast(error.message || 'Failed to save task', true);
    }
  }

  async function updateTaskStatus(task, status) {
    if (!isCoordinator && task.assignee_id !== (boot.currentUser?.id || null)) {
      showToast('You can only update your own tasks', true);
      return;
    }
    try {
      const optimistic = { ...task, status };
      state.tasks = state.tasks.map((t) => (t.id === task.id ? optimistic : t));
      renderView();
      const updated = await apiFetch(`/tasks/${task.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      state.tasks = state.tasks.map((t) => (t.id === task.id ? updated : t));
      renderView();
    } catch (error) {
      showToast(error.message || 'Unable to update status', true);
      await loadTasks();
    }
  }

  function renderFunding() {
    const container = el('div', 'l4p-stack');
    const summaryCard = cardShell('Funding Summary');
    const summary = state.funding.summary || { income: 0, expense: 0, net: 0 };
    summaryCard.appendChild(el('p', null, `Income: $${Number(summary.income || 0).toFixed(2)} | Expense: $${Number(summary.expense || 0).toFixed(2)} | Net: $${Number(summary.net || 0).toFixed(2)}`));
    if (isCoordinator) {
      const actions = el('div', 'l4p-row-gap');
      const add = el('button', 'l4p-btn', 'Add Transaction');
      add.addEventListener('click', () => openFundingForm());
      const exportBtn = el('button', 'l4p-btn secondary', 'Export CSV');
      exportBtn.addEventListener('click', exportFunding);
      actions.append(add, exportBtn);
      summaryCard.appendChild(actions);
    }
    container.appendChild(summaryCard);

    const tableCard = cardShell('Ledger');
    if (!state.funding.data.length) {
      tableCard.appendChild(el('div', 'l4p-empty', 'No funding transactions yet.'));
    } else {
      const table = el('table', 'l4p-table');
      table.appendChild(el('thead', null, el('tr', null, [
        el('th', null, 'Date'),
        el('th', null, 'Type'),
        el('th', null, 'Category'),
        el('th', null, 'Amount'),
        el('th', null, 'Note'),
        isCoordinator ? el('th', null, 'Actions') : null,
      ].filter(Boolean))));
      const tbody = el('tbody');
      state.funding.data.forEach((item) => {
        const row = el('tr', null, [
          el('td', null, formatDate(item.tx_date)),
          el('td', null, item.type === 'income' ? 'Income' : 'Expense'),
          el('td', null, item.category),
          el('td', null, `$${Number(item.amount).toFixed(2)}`),
          el('td', null, item.note || '—'),
        ]);
        if (isCoordinator) {
          const actions = el('td');
          const edit = el('button', 'l4p-btn secondary', 'Edit');
          edit.addEventListener('click', () => openFundingForm(item));
          const del = el('button', 'l4p-btn danger', 'Delete');
          del.addEventListener('click', () => deleteFunding(item));
          actions.append(edit, del);
          row.appendChild(actions);
        }
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      tableCard.appendChild(table);
    }
    container.appendChild(tableCard);
    content.appendChild(container);
    renderFundingModal();
  }

  function openFundingForm(item) {
    state.modals.fundingForm = true;
    if (item) {
      state.fundingFormState = { ...item };
    } else {
      state.fundingFormState = {
        id: null,
        type: 'income',
        amount: '',
        category: '',
        note: '',
        tx_date: new Date().toISOString().slice(0, 10),
      };
    }
    renderFundingModal();
  }

  function closeFundingForm() {
    state.modals.fundingForm = false;
    renderFundingModal();
  }

  function renderFundingModal() {
    const existing = document.querySelector('.l4p-funding-modal');
    if (existing) existing.remove();
    if (!state.modals.fundingForm) {
      return;
    }
    const backdrop = el('div', 'l4p-modal-backdrop l4p-funding-modal');
    const modal = el('div', 'l4p-modal');
    modal.appendChild(el('h2', null, state.fundingFormState.id ? 'Edit Transaction' : 'Add Transaction'));
    const form = el('form', 'l4p-form');
    form.appendChild(field('Type', selectFunding('type', state.fundingFormState.type)));
    form.appendChild(field('Amount', fundingInput('number', 'amount', state.fundingFormState.amount, true)));
    form.appendChild(field('Category', fundingInput('text', 'category', state.fundingFormState.category, true)));
    form.appendChild(field('Date', fundingInput('date', 'tx_date', state.fundingFormState.tx_date, true)));
    form.appendChild(field('Note', fundingTextarea('note', state.fundingFormState.note)));
    const actions = el('div', 'l4p-row-end');
    const cancel = el('button', 'l4p-btn secondary', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', closeFundingForm);
    const submit = el('button', 'l4p-btn', state.fundingFormState.id ? 'Save' : 'Add');
    submit.type = 'submit';
    actions.append(cancel, submit);
    form.appendChild(actions);
    form.addEventListener('submit', submitFundingForm);
    modal.appendChild(form);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
  }

  function selectFunding(name, value) {
    return selectGeneric(name, value, [
      { value: 'income', label: 'Income' },
      { value: 'expense', label: 'Expense' },
    ], (selected) => {
      state.fundingFormState[name] = selected;
    });
  }

  function selectGeneric(name, value, options, handler) {
    const sel = document.createElement('select');
    sel.name = name;
    options.forEach((option) => {
      const opt = document.createElement('option');
      opt.value = option.value;
      opt.textContent = option.label;
      if (String(option.value) === String(value || '')) {
        opt.selected = true;
      }
      sel.appendChild(opt);
    });
    sel.addEventListener('change', (event) => handler(event.target.value));
    return sel;
  }

  function fundingInput(type, name, value, required) {
    const input = document.createElement('input');
    input.type = type;
    input.name = name;
    input.value = value || '';
    if (required) input.required = true;
    input.addEventListener('input', (event) => {
      state.fundingFormState[event.target.name] = event.target.value;
    });
    return input;
  }

  function fundingTextarea(name, value) {
    const textarea = document.createElement('textarea');
    textarea.name = name;
    textarea.rows = 3;
    textarea.value = value || '';
    textarea.addEventListener('input', (event) => {
      state.fundingFormState[event.target.name] = event.target.value;
    });
    return textarea;
  }

  async function submitFundingForm(event) {
    event.preventDefault();
    try {
      const payload = {
        type: state.fundingFormState.type,
        amount: state.fundingFormState.amount,
        category: state.fundingFormState.category,
        note: state.fundingFormState.note,
        tx_date: state.fundingFormState.tx_date,
      };
      if (state.fundingFormState.id) {
        await apiFetch(`/funding/${state.fundingFormState.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/funding', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      closeFundingForm();
      showToast('Funding saved');
      await loadFunding();
      renderView();
    } catch (error) {
      showToast(error.message || 'Unable to save funding', true);
    }
  }

  async function deleteFunding(item) {
    if (!confirm('Delete this transaction?')) {
      return;
    }
    try {
      await apiFetch(`/funding/${item.id}`, { method: 'DELETE' });
      showToast('Transaction deleted');
      await loadFunding();
      renderView();
    } catch (error) {
      showToast(error.message || 'Unable to delete', true);
    }
  }

  async function exportFunding() {
    try {
      const csv = await apiFetch('/funding/export', { method: 'GET', raw: true });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'l4p-funding.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      showToast(error.message || 'Export failed', true);
    }
  }

  function renderCrew() {
    const card = cardShell('Crew Directory');
    const grid = el('div', 'l4p-grid cols-3');
    state.crew.forEach((member) => {
      const block = el('div', 'l4p-task');
      block.appendChild(el('strong', null, member.name));
      block.appendChild(el('small', null, `${member.role} • ${member.email}`));
      if (member.avatar_url) {
        const img = el('img', null, null, { src: member.avatar_url, alt: member.name });
        img.style.width = '48px';
        img.style.height = '48px';
        img.style.borderRadius = '50%';
        block.appendChild(img);
      }
      const view = el('button', 'l4p-btn secondary', 'View Profile');
      view.addEventListener('click', () => openCrewProfile(member));
      block.appendChild(view);
      grid.appendChild(block);
    });
    if (!state.crew.length) {
      card.appendChild(el('div', 'l4p-empty', 'No crew members found.'));
    } else {
      card.appendChild(grid);
    }
    content.appendChild(card);
    renderCrewModal();
  }

  async function openCrewProfile(member) {
    state.modals.crewProfile = { loading: true, memberId: member.id, data: null };
    renderCrewModal();
    try {
      const detail = await apiFetch(`/crew/${member.id}`);
      state.modals.crewProfile = { loading: false, memberId: member.id, data: detail };
      renderCrewModal();
    } catch (error) {
      showToast(error.message || 'Failed to load profile', true);
      state.modals.crewProfile = null;
    }
  }

  function renderCrewModal() {
    const existing = document.querySelector('.l4p-crew-modal');
    if (existing) existing.remove();
    if (!state.modals.crewProfile) {
      return;
    }
    const backdrop = el('div', 'l4p-modal-backdrop l4p-crew-modal');
    const modal = el('div', 'l4p-modal');
    const data = state.modals.crewProfile.data;
    if (state.modals.crewProfile.loading || !data) {
      modal.appendChild(el('p', null, 'Loading profile...'));
    } else {
      const member = data.member;
      modal.appendChild(el('h2', null, member.name));
      modal.appendChild(el('p', null, `${member.email} • ${member.role}`));
      modal.appendChild(el('h3', null, 'Assigned Tasks'));
      if (!data.tasks.length) {
        modal.appendChild(el('div', 'l4p-empty', 'No tasks assigned.'));
      } else {
        data.tasks.forEach((task) => {
          modal.appendChild(taskSummary(task));
        });
      }
    }
    const close = el('button', 'l4p-btn secondary', 'Close');
    close.addEventListener('click', () => {
      state.modals.crewProfile = null;
      renderCrewModal();
    });
    modal.appendChild(close);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
  }

  function renderCommunity() {
    const card = cardShell('Community Threads');
    if (canPostCommunity()) {
      const form = el('form', 'l4p-form');
      const textareaField = field('Share an update', communityTextarea());
      form.appendChild(textareaField);
      const submit = el('button', 'l4p-btn', 'Post');
      submit.type = 'submit';
      form.appendChild(submit);
      form.addEventListener('submit', submitCommunityPost);
      card.appendChild(form);
    }
    if (!state.community.length) {
      card.appendChild(el('div', 'l4p-empty', 'Start the conversation!'));
    } else {
      state.community.forEach((post) => {
        card.appendChild(renderCommunityPost(post));
      });
    }
    content.appendChild(card);
  }

  function canPostCommunity() {
    return caps.has('manage_l4p_posts') && (isCoordinator || state.settings.volunteer_post_chat || caps.has('manage_l4p_funding'));
  }

  function communityTextarea() {
    const textarea = document.createElement('textarea');
    textarea.rows = 3;
    textarea.required = true;
    textarea.placeholder = 'Write a message for the crew…';
    textarea.name = 'body';
    return textarea;
  }

  async function submitCommunityPost(event) {
    event.preventDefault();
    const textarea = event.target.querySelector('textarea[name="body"]');
    const body = textarea.value.trim();
    if (!body) {
      return;
    }
    textarea.disabled = true;
    try {
      const post = await apiFetch('/community', {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      textarea.value = '';
      state.community = [post, ...state.community];
      renderView();
    } catch (error) {
      showToast(error.message || 'Unable to post', true);
    } finally {
      textarea.disabled = false;
    }
  }

  function renderCommunityPost(post) {
    const wrapper = el('div', 'l4p-community-post');
    wrapper.appendChild(el('div', null, [
      el('strong', null, post.author?.name || 'Member'),
      el('span', null, formatDateTime(post.created_at)),
    ]));
    wrapper.appendChild(el('p', null, post.body));
    if (canPostCommunity()) {
      const form = el('form', 'l4p-form');
      const input = document.createElement('textarea');
      input.rows = 2;
      input.placeholder = 'Reply…';
      form.appendChild(input);
      const submit = el('button', 'l4p-btn secondary', 'Reply');
      submit.type = 'submit';
      form.appendChild(submit);
      form.addEventListener('submit', (event) => submitCommunityReply(event, post.id, input));
      wrapper.appendChild(form);
    }
    const replies = el('div', 'l4p-community-replies');
    (post.comments || []).forEach((comment) => {
      replies.appendChild(el('div', null, [
        el('strong', null, comment.author?.name || 'Member'),
        el('div', null, comment.body),
        el('small', null, formatDateTime(comment.created_at)),
      ]));
    });
    wrapper.appendChild(replies);
    return wrapper;
  }

  async function submitCommunityReply(event, postId, input) {
    event.preventDefault();
    const body = input.value.trim();
    if (!body) return;
    input.disabled = true;
    try {
      const reply = await apiFetch(`/community/${postId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      });
      input.value = '';
      state.community = state.community.map((post) => {
        if (post.id === postId) {
          const existing = Array.isArray(post.comments) ? post.comments : [];
          return { ...post, comments: [...existing, reply] };
        }
        return post;
      });
      renderView();
    } catch (error) {
      showToast(error.message || 'Unable to reply', true);
    } finally {
      input.disabled = false;
    }
  }

  function renderNotifications() {
    const card = cardShell('Notifications');
    if (state.notifications.badge) {
      const markAll = el('button', 'l4p-btn secondary', 'Mark all as read');
      markAll.addEventListener('click', markAllNotifications);
      card.appendChild(markAll);
    }
    if (!state.notifications.data.length) {
      card.appendChild(el('div', 'l4p-empty', 'No notifications at this time.'));
    } else {
      state.notifications.data.forEach((note) => {
        const item = el('div', 'l4p-notification', [
          el('strong', null, note.title),
          el('div', null, note.body),
          el('small', null, formatDateTime(note.created_at)),
        ]);
        if (!Number(note.is_read)) {
          const btn = el('button', 'l4p-btn secondary', 'Mark as read');
          btn.addEventListener('click', () => markNotification(note.id));
          item.appendChild(btn);
        }
        card.appendChild(item);
      });
    }
    content.appendChild(card);
  }

  async function markNotification(id) {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'POST' });
      await loadNotifications();
      renderView();
    } catch (error) {
      showToast(error.message || 'Unable to update notification', true);
    }
  }

  async function markAllNotifications() {
    try {
      await apiFetch('/notifications/read-all', { method: 'POST' });
      await loadNotifications();
      renderView();
    } catch (error) {
      showToast(error.message || 'Unable to mark all', true);
    }
  }

  function renderSettings() {
    const card = cardShell('Dashboard Settings');
    const form = el('form', 'l4p-form');
    const config = {
      dashboard_title: state.settings.dashboard_title || '',
      dashboard_icon: state.settings.dashboard_icon || '',
      theme_primary: state.settings.theme_primary || '#0B5CD6',
      theme_accent: state.settings.theme_accent || '#06B6D4',
      timezone: state.settings.timezone || '',
      currency: state.settings.currency || 'USD',
      volunteer_create_tasks: Boolean(state.settings.volunteer_create_tasks),
      volunteer_post_chat: Boolean(state.settings.volunteer_post_chat),
      auto_sync_users: state.settings.auto_sync_users !== false,
      coordinator_roles: (state.settings.coordinator_roles || []).join(', '),
      volunteer_roles: (state.settings.volunteer_roles || []).join(', '),
    };

    form.appendChild(field('Dashboard Title', settingsInput('text', 'dashboard_title', config.dashboard_title)));
    form.appendChild(field('Dashboard Icon URL', settingsInput('url', 'dashboard_icon', config.dashboard_icon)));
    form.appendChild(field('Primary Color', settingsInput('color', 'theme_primary', config.theme_primary)));
    form.appendChild(field('Accent Color', settingsInput('color', 'theme_accent', config.theme_accent)));
    form.appendChild(field('Timezone', settingsInput('text', 'timezone', config.timezone)));
    form.appendChild(field('Currency', settingsInput('text', 'currency', config.currency)));
    form.appendChild(field('Coordinator Roles (comma separated)', settingsInput('text', 'coordinator_roles', config.coordinator_roles)));
    form.appendChild(field('Volunteer Roles (comma separated)', settingsInput('text', 'volunteer_roles', config.volunteer_roles)));
    form.appendChild(toggleField('Allow volunteers to create tasks', 'volunteer_create_tasks', config.volunteer_create_tasks));
    form.appendChild(toggleField('Allow volunteers to post in community', 'volunteer_post_chat', config.volunteer_post_chat));
    form.appendChild(toggleField('Auto-sync WordPress users', 'auto_sync_users', config.auto_sync_users));

    const submit = el('button', 'l4p-btn', 'Save Settings');
    submit.type = 'submit';
    form.appendChild(submit);
    form.addEventListener('submit', submitSettings);
    card.appendChild(form);
    content.appendChild(card);
  }

  function settingsInput(type, name, value) {
    const input = document.createElement('input');
    input.type = type;
    input.name = name;
    input.value = value || '';
    return input;
  }

  function toggleField(label, name, checked) {
    const wrapper = el('div', 'l4p-field');
    const labelEl = el('label', null, label);
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = name;
    input.checked = checked;
    wrapper.append(labelEl, input);
    return wrapper;
  }

  async function submitSettings(event) {
    event.preventDefault();
    const data = new FormData(event.target);
    const payload = {
      dashboard_title: data.get('dashboard_title'),
      dashboard_icon: data.get('dashboard_icon'),
      theme_primary: data.get('theme_primary'),
      theme_accent: data.get('theme_accent'),
      timezone: data.get('timezone'),
      currency: data.get('currency'),
      coordinator_roles: (data.get('coordinator_roles') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      volunteer_roles: (data.get('volunteer_roles') || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      volunteer_create_tasks: data.get('volunteer_create_tasks') === 'on',
      volunteer_post_chat: data.get('volunteer_post_chat') === 'on',
      auto_sync_users: data.get('auto_sync_users') === 'on',
    };
    try {
      const updated = await apiFetch('/settings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      state.settings = updated;
      applyTheme(updated);
      renderBranding();
      showToast('Settings updated');
      renderView();
    } catch (error) {
      showToast(error.message || 'Unable to save settings', true);
    }
  }

  function cardShell(title) {
    const card = el('section', 'l4p-card');
    card.appendChild(el('h2', 'l4p-card-title', title));
    return card;
  }

  function taskSummary(task) {
    const block = el('div', 'l4p-task');
    block.appendChild(el('strong', null, task.title));
    if (task.description) {
      block.appendChild(el('p', null, truncate(task.description, 140)));
    }
    block.appendChild(el('small', null, `${statusLabel(task.status)} • Assigned to ${task.assignee_name || 'Unassigned'}`));
    return block;
  }

  function truncate(text, length) {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.slice(0, length) + '…';
  }

  function formatDate(input) {
    if (!input) return '';
    const date = new Date(input);
    return date.toLocaleDateString();
  }

  function formatDateTime(input) {
    if (!input) return '';
    const date = new Date(input);
    return date.toLocaleString();
  }

  function statusLabel(status) {
    switch (status) {
      case 'todo':
        return 'To-Do';
      case 'progress':
        return 'In Progress';
      case 'done':
        return 'Completed';
      default:
        return status;
    }
  }

  async function loadTasks() {
    try {
      const params = new URLSearchParams();
      if (state.tasksFilter && state.tasksFilter !== 'all') {
        params.append('status', state.tasksFilter);
      }
      const res = await apiFetch(`/tasks${params.toString() ? `?${params.toString()}` : ''}`);
      state.tasks = res.data || res;
      if (state.activeView === 'tasks' || state.activeView === 'dashboard') {
        renderView();
      }
    } catch (error) {
      showToast(error.message || 'Unable to load tasks', true);
    }
  }

  async function loadCrew() {
    try {
      const res = await apiFetch('/crew');
      state.crew = res.data || [];
      if (state.activeView === 'crew') {
        renderView();
      }
    } catch (error) {
      showToast('Unable to load crew', true);
    }
  }

  async function loadFunding() {
    try {
      const res = await apiFetch('/funding');
      state.funding = res;
      if (state.activeView === 'funding' || state.activeView === 'dashboard') {
        renderView();
      }
    } catch (error) {
      showToast('Unable to load funding', true);
    }
  }

  async function loadNotifications() {
    try {
      const res = await apiFetch('/notifications');
      state.notifications = res;
      updateNavigation();
      if (state.activeView === 'dashboard' || state.activeView === 'notifications') {
        renderView();
      }
    } catch (error) {
      // ignore for now
    }
  }

  async function loadCommunity() {
    try {
      const res = await apiFetch('/community');
      state.community = res.data || res;
      if (state.activeView === 'dashboard' || state.activeView === 'community') {
        renderView();
      }
    } catch (error) {
      state.community = [];
    }
  }

  async function loadSettings() {
    try {
      const res = await apiFetch('/settings');
      state.settings = res;
      applyTheme(res);
      renderBranding();
    } catch (error) {
      // ignore
    }
  }

  async function apiFetch(path, options = {}) {
    const url = `${boot.restUrl.replace(/\/$/, '')}${path}`;
    const headers = {
      'X-WP-Nonce': boot.nonce,
    };
    const init = {
      method: options.method || 'GET',
      headers,
    };
    if (options.body) {
      headers['Content-Type'] = 'application/json';
      init.body = options.body;
    }
    const response = await fetch(url, init);
    if (!response.ok) {
      let errorText = 'Request failed';
      try {
        const err = await response.json();
        errorText = err.message || err.error || JSON.stringify(err);
      } catch (err) {
        errorText = response.statusText;
      }
      throw new Error(errorText);
    }
    if (options.raw) {
      return await response.text();
    }
    const data = await response.json();
    return data;
  }

  function showToast(message, isError) {
    const toast = { id: Date.now(), message, isError };
    state.toasts.push(toast);
    renderToasts();
    setTimeout(() => {
      state.toasts = state.toasts.filter((item) => item.id !== toast.id);
      renderToasts();
    }, 4000);
  }

  function renderToasts() {
    toastHost.innerHTML = '';
    state.toasts.forEach((toast) => {
      const node = el('div', 'l4p-toast', toast.message);
      if (toast.isError) {
        node.style.borderLeftColor = '#EF4444';
      }
      toastHost.appendChild(node);
    });
  }
})();

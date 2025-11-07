(function () {
  if (typeof window !== 'undefined' && !window.Chart) {
    class L4PChart {
      constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.type = (config && config.type) || 'line';
        this.config = JSON.parse(JSON.stringify(config || {}));
        this.draw();
      }

      update(nextConfig) {
        const merged = { ...this.config, ...(nextConfig || {}) };
        this.config = JSON.parse(JSON.stringify(merged));
        this.draw();
      }

      destroy() {
        if (this.ctx) {
          this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        }
      }

      draw() {
        if (!this.ctx) {
          return;
        }

        const canvas = this.ctx.canvas;
        const width = canvas.width || canvas.clientWidth || 320;
        const height = canvas.height || canvas.clientHeight || 240;
        if (!canvas.width) {
          canvas.width = width;
        }
        if (!canvas.height) {
          canvas.height = height;
        }

        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (this.type === 'doughnut') {
          drawDonutChart(this.ctx, this.config);
        } else {
          drawLineChart(this.ctx, this.config);
        }
      }
    }

    function drawDonutChart(ctx, config) {
      const dataset = (config && config.data && config.data.datasets && config.data.datasets[0]) || { data: [] };
      const values = (dataset.data || []).map((value) => Math.max(0, Number(value) || 0));
      const total = values.reduce((sum, value) => sum + value, 0) || 1;
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const radius = Math.min(width, height) / 2 - 12;
      const centerX = width / 2;
      const centerY = height / 2;
      let startAngle = -Math.PI / 2;

      values.forEach((value, index) => {
        const slice = (value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + slice);
        ctx.closePath();
        const colors = (dataset && dataset.backgroundColor) || [];
        ctx.fillStyle = colors[index] || '#0B5CD6';
        ctx.fill();
        startAngle += slice;
      });

      const innerRadius = radius * 0.65;
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }

    function drawLineChart(ctx, config) {
      const dataset = (config && config.data && config.data.datasets && config.data.datasets[0]) || { data: [] };
      const values = (dataset.data || []).map((value) => Number(value) || 0);
      const width = ctx.canvas.width;
      const height = ctx.canvas.height;
      const padding = 32;
      const usableWidth = Math.max(1, width - padding * 2);
      const usableHeight = Math.max(1, height - padding * 2);
      const maxValue = Math.max(0, ...values);
      const minValue = Math.min(0, ...values);
      const range = Math.max(1, maxValue - minValue);

      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= 4; i += 1) {
        const y = padding + (usableHeight / 4) * i;
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
      }
      ctx.stroke();

      ctx.beginPath();
      values.forEach((value, index) => {
        const x = padding + (usableWidth / Math.max(1, values.length - 1)) * index;
        const normalized = (value - minValue) / range;
        const y = padding + usableHeight - normalized * usableHeight;
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = dataset.borderColor || '#0B5CD6';
      ctx.lineWidth = 2;
      ctx.stroke();

      if (dataset.fill) {
        ctx.lineTo(padding + usableWidth, padding + usableHeight);
        ctx.lineTo(padding, padding + usableHeight);
        ctx.closePath();
        ctx.fillStyle = dataset.backgroundColor || 'rgba(11,92,214,0.18)';
        ctx.fill();
      }

      ctx.fillStyle = dataset.borderColor || '#0B5CD6';
      values.forEach((value, index) => {
        const x = padding + (usableWidth / Math.max(1, values.length - 1)) * index;
        const normalized = (value - minValue) / range;
        const y = padding + usableHeight - normalized * usableHeight;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    window.Chart = L4PChart;
  }

  const root = document.getElementById('l4p-dashboard-root');
  if (!root) {
    return;
  }

  const boot = window.l4pDashboard || {};
  if (!boot.restUrl || !boot.nonce) {
    renderError('Dashboard bootstrap data missing.');
    return;
  }

  function currentUserId() {
    if (!boot.currentUser || boot.currentUser.id === undefined || boot.currentUser.id === null) {
      return null;
    }
    const value = Number(boot.currentUser.id);
    return Number.isNaN(value) ? null : value;
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
      crewProfile: null,
    },
    showTaskForm: false,
    showFundingForm: false,
    taskFormState: {
      id: null,
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      url: '',
      assignee_id: currentUserId(),
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
    charts: {},
    sidebarOpen: false,
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
  const main = el('div', 'l4p-main', [header, content]);
  const overlay = el('button', 'l4p-sidebar-overlay');
  overlay.type = 'button';
  overlay.tabIndex = -1;
  overlay.setAttribute('aria-label', 'Close navigation');
  const toastHost = el('div', 'l4p-toast-host');
  root.appendChild(app);
  app.append(sidebar, main, overlay, toastHost);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'tasks', label: 'Tasks', icon: '✅' },
    { id: 'funding', label: 'Sponsor', icon: '💰' },
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

  function updateSidebarVisibility() {
    const mobile = window.matchMedia('(max-width: 1023px)').matches;
    if (!mobile) {
      sidebar.dataset.open = 'true';
      overlay.dataset.open = 'false';
      document.body.classList.remove('l4p-lock');
      return;
    }
    sidebar.dataset.open = state.sidebarOpen ? 'true' : 'false';
    overlay.dataset.open = state.sidebarOpen ? 'true' : 'false';
    if (state.sidebarOpen) {
      document.body.classList.add('l4p-lock');
    } else {
      document.body.classList.remove('l4p-lock');
    }
  }

  function setSidebarOpen(open) {
    state.sidebarOpen = Boolean(open);
    updateSidebarVisibility();
    const toggleButton = header.querySelector('.l4p-nav-toggle');
    if (toggleButton) {
      toggleButton.dataset.active = window.matchMedia('(max-width: 1023px)').matches && state.sidebarOpen ? 'true' : 'false';
    }
  }

  overlay.addEventListener('click', () => setSidebarOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setSidebarOpen(false);
    }
  });

  window.addEventListener('resize', updateSidebarVisibility);
  updateSidebarVisibility();

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
      if (window.matchMedia('(max-width: 1023px)').matches) {
        setSidebarOpen(false);
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
        --l4p-font-sans: 'Inter var', 'Inter', 'Plus Jakarta Sans', 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
        font-family: var(--l4p-font-sans);
      }
      .l4p-viewport, .l4p-wrap {
        width: 100%;
        min-height: 100vh;
        margin: 0;
        padding: 0;
        background: var(--l4p-bg);
      }
      body.l4p-lock {
        overflow: hidden;
      }
      .l4p-app {
        display: grid;
        grid-template-columns: 260px 1fr;
        min-height: 100vh;
        background: var(--l4p-bg);
        font-family: var(--l4p-font-sans);
        line-height: 1.55;
        -webkit-font-smoothing: antialiased;
        color: var(--l4p-text);
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
        gap: 16px;
        box-shadow: 0 8px 20px rgba(15,23,42,0.06);
        position: sticky;
        top: 0;
        z-index: 5;
      }
      .l4p-header-left {
        display: flex;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .l4p-header-title {
        margin: 0;
        font-size: clamp(1.25rem, 1.5vw, 1.6rem);
        font-weight: 700;
        color: var(--l4p-text);
      }
      .l4p-header-controls {
        margin-left: auto;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .l4p-nav-toggle {
        display: none;
        border: none;
        background: rgba(11,92,214,0.16);
        color: var(--l4p-primary);
        font-weight: 600;
        border-radius: 12px;
        padding: 10px 16px;
        cursor: pointer;
        align-items: center;
        gap: 8px;
        box-shadow: 0 10px 22px rgba(11,92,214,0.16);
        transition: background 0.2s ease, transform 0.2s ease;
      }
      .l4p-nav-toggle:focus-visible,
      .l4p-logout-btn:focus-visible,
      .l4p-nav-item:focus-visible,
      .l4p-link-button:focus-visible,
      .l4p-status-button:focus-visible,
      .l4p-tab:focus-visible {
        outline: 2px solid var(--l4p-accent);
        outline-offset: 3px;
      }
      .l4p-nav-toggle:hover {
        background: rgba(11,92,214,0.22);
        transform: translateY(-1px);
      }
      .l4p-nav-toggle[data-active="true"] {
        background: linear-gradient(135deg, rgba(11,92,214,0.9), rgba(6,182,212,0.9));
        color: #fff;
      }
      .l4p-sidebar-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(15,23,42,0.45);
        border: none;
        z-index: 7;
      }
      .l4p-sidebar-overlay[data-open="true"] {
        display: block;
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
      .l4p-logout-btn {
        border: none;
        background: linear-gradient(135deg, rgba(11,92,214,0.92), rgba(6,182,212,0.9));
        color: #ffffff;
        padding: 10px 16px;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        box-shadow: 0 14px 30px rgba(11,92,214,0.28);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .l4p-logout-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 16px 34px rgba(11,92,214,0.32);
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
      .l4p-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 16px;
      }
      .l4p-card-heading {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .l4p-card-subtitle {
        margin: 0;
        color: #64748b;
        font-size: 0.85rem;
      }
      .l4p-card-actions {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .l4p-dashboard-grid {
        display: grid;
        gap: 24px;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .l4p-link-button {
        border: none;
        background: transparent;
        color: var(--l4p-primary);
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 0;
      }
      .l4p-link-button::after {
        content: '→';
        font-size: 0.85rem;
        transition: transform 0.2s ease;
      }
      .l4p-link-button:hover::after {
        transform: translateX(3px);
      }
      .l4p-metric-grid {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      }
      .l4p-metric {
        background: rgba(15,23,42,0.04);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .l4p-metric.tone-positive {
        background: rgba(34,197,94,0.12);
      }
      .l4p-metric.tone-negative {
        background: rgba(239,68,68,0.12);
      }
      .l4p-metric-label {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #64748b;
      }
      .l4p-metric-value {
        font-size: clamp(1.1rem, 1.2vw, 1.4rem);
        font-weight: 700;
        color: var(--l4p-text);
      }
      .l4p-charts {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .l4p-chart-card {
        background: rgba(15,23,42,0.03);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        align-items: center;
      }
      .l4p-chart-title {
        font-size: 0.75rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #475569;
      }
      .l4p-legend {
        display: grid;
        gap: 8px;
        width: 100%;
      }
      .l4p-legend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        font-size: 0.85rem;
        color: #475569;
      }
      .l4p-legend-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: rgba(148,163,184,0.6);
      }
      .l4p-legend-dot.tone-positive {
        background: #0B5CD6;
      }
      .l4p-legend-dot.tone-negative {
        background: #EF4444;
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
      .l4p-ledger-table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }
      .l4p-ledger-table th {
        text-transform: uppercase;
        font-size: 0.72rem;
        letter-spacing: 0.08em;
        color: #64748b;
        padding: 0 12px 12px 12px;
      }
      .l4p-ledger-table td {
        padding: 14px 12px;
        border-top: 1px solid rgba(15,23,42,0.08);
      }
      .l4p-ledger-table tbody tr:hover {
        background: rgba(11,92,214,0.06);
      }
      .l4p-ledger-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
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
      .l4p-inline-form {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      }
      .l4p-inline-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        grid-column: 1 / -1;
      }
      .l4p-control {
        border-radius: 12px;
        border: 1px solid rgba(15,23,42,0.12);
        background: #fff;
        padding: 10px 12px;
        font: inherit;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }
      .l4p-control:focus {
        outline: none;
        border-color: var(--l4p-primary);
        box-shadow: 0 0 0 3px rgba(11,92,214,0.18);
      }
      .l4p-tasks-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .l4p-task-grid {
        display: grid;
        gap: 24px;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .l4p-task-list {
        display: grid;
        gap: 16px;
      }
      .l4p-task-card {
        background: rgba(15,23,42,0.02);
        border-radius: 16px;
        padding: 18px;
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .l4p-task-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }
      .l4p-task-title-block {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .l4p-task-name {
        margin: 0;
        font-size: 1rem;
      }
      .l4p-task-description {
        margin: 0;
        color: #475569;
      }
      .l4p-task-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .l4p-task-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;
        flex-wrap: wrap;
      }
      .l4p-task-people {
        display: flex;
        align-items: center;
        gap: 10px;
        color: #475569;
      }
      .l4p-status-actions {
        display: flex;
        gap: 8px;
      }
      .l4p-status-button {
        border: none;
        background: rgba(11,92,214,0.1);
        color: var(--l4p-primary);
        padding: 8px 12px;
        border-radius: 10px;
        font-weight: 600;
        cursor: pointer;
      }
      .l4p-status-button[disabled] {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .l4p-status-button:not([disabled]):hover {
        background: var(--l4p-primary);
        color: #fff;
      }
      .l4p-status-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 600;
      }
      .status-todo {
        background: rgba(11,92,214,0.16);
        color: var(--l4p-primary);
      }
      .status-progress {
        background: rgba(245,158,11,0.18);
        color: #b45309;
      }
      .status-done {
        background: rgba(34,197,94,0.18);
        color: #15803d;
      }
      .l4p-link {
        color: var(--l4p-primary);
        text-decoration: none;
        font-weight: 600;
      }
      .l4p-link:hover {
        text-decoration: underline;
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
      .l4p-timeline {
        display: grid;
        gap: 14px;
      }
      .l4p-timeline-item {
        display: flex;
        gap: 14px;
        align-items: flex-start;
      }
      .l4p-timeline-body {
        display: grid;
        gap: 4px;
      }
      .l4p-timeline-body p {
        margin: 0;
        color: #475569;
      }
      .l4p-list {
        display: grid;
        gap: 12px;
      }
      .l4p-list-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid rgba(15,23,42,0.08);
      }
      .l4p-list-meta {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .l4p-amount {
        font-weight: 700;
      }
      .l4p-amount.income {
        color: #15803d;
      }
      .l4p-amount.expense {
        color: #b91c1c;
      }
      .l4p-task-summary {
        display: grid;
        gap: 6px;
        padding: 12px;
        border-radius: 14px;
        background: rgba(15,23,42,0.03);
      }
      .l4p-task-summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }
      .l4p-pill.subtle {
        background: rgba(15,23,42,0.08);
        color: #475569;
      }
      .l4p-avatar-sm {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
      }
      .l4p-community-item {
        display: grid;
        gap: 10px;
        padding: 14px;
        border-radius: 14px;
        background: rgba(15,23,42,0.03);
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
      @media (max-width: 1280px) {
        .l4p-app {
          grid-template-columns: 240px 1fr;
        }
      }
      @media (max-width: 1023px) {
        .l4p-app {
          grid-template-columns: 1fr;
        }
        .l4p-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: min(82vw, 280px);
          max-width: 320px;
          transform: translateX(-110%);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          padding: 32px 24px;
          z-index: 9;
          overflow-y: auto;
          box-shadow: 0 24px 60px rgba(15,23,42,0.28);
        }
        .l4p-sidebar[data-open="true"] {
          transform: translateX(0);
        }
        .l4p-nav-toggle {
          display: inline-flex;
        }
        .l4p-main {
          min-height: 100vh;
        }
        .l4p-header {
          position: sticky;
          top: 0;
          padding: 18px 24px;
        }
        .l4p-content {
          height: auto;
          padding: 24px 20px 36px;
        }
        .l4p-nav {
          display: grid;
          gap: 12px;
        }
      }
      @media (max-width: 767px) {
        .l4p-sidebar {
          width: min(88vw, 280px);
          padding: 28px 20px;
        }
        .l4p-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 20px;
        }
        .l4p-header-controls {
          width: 100%;
          justify-content: flex-start;
        }
        .l4p-content {
          padding: 20px 18px 32px;
        }
        .l4p-card {
          padding: 20px;
        }
        .l4p-user-pill {
          width: 100%;
          justify-content: space-between;
        }
        .l4p-logout-btn {
          width: 100%;
          justify-content: center;
        }
        .l4p-nav-item {
          padding: 10px 12px;
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
    const left = el('div', 'l4p-header-left');
    const toggle = el('button', 'l4p-nav-toggle', '☰ Menu');
    toggle.type = 'button';
    toggle.setAttribute('aria-label', 'Toggle navigation');
    toggle.addEventListener('click', () => {
      if (!window.matchMedia('(max-width: 1023px)').matches) {
        return;
      }
      setSidebarOpen(!state.sidebarOpen);
    });
    toggle.dataset.active = window.matchMedia('(max-width: 1023px)').matches && state.sidebarOpen ? 'true' : 'false';
    left.appendChild(toggle);
    left.appendChild(el('h1', 'l4p-header-title', title));
    header.appendChild(left);

    const controls = el('div', 'l4p-header-controls');
    if (boot.currentUser && boot.currentUser.name) {
      const user = el('div', 'l4p-user-pill', [el('span', null, boot.currentUser.name)]);
      if (boot.currentUser.avatar) {
        const avatar = el('img', null, null, { src: boot.currentUser.avatar, alt: boot.currentUser.name });
        avatar.style.width = '36px';
        avatar.style.height = '36px';
        avatar.style.borderRadius = '50%';
        user.prepend(avatar);
      }
      controls.appendChild(user);
    }
    if (boot.currentUser && boot.currentUser.logoutUrl) {
      const logout = el('a', 'l4p-logout-btn', 'Logout', { href: boot.currentUser.logoutUrl });
      logout.setAttribute('role', 'button');
      logout.addEventListener('click', () => {
        if (logout.href) {
          window.location.assign(logout.href);
        }
      });
      controls.appendChild(logout);
    }
    header.appendChild(controls);
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
    const grid = el('div', 'l4p-dashboard-grid');
    grid.appendChild(dashboardTasksCard());
    grid.appendChild(fundingSnapshotCard());
    grid.appendChild(notificationsCard());
    grid.appendChild(communityCard());
    content.appendChild(grid);
  }

  function dashboardTasksCard() {
    const card = cardShell('My Tasks', {
      subtitle: 'Today’s top priorities assigned to you.',
      actions: buttonLink('View all tasks', () => {
        state.activeView = 'tasks';
        renderView();
      }),
    });
    const viewerId = currentUserId();
    const myTasks = state.tasks
      .filter((task) => viewerId !== null && Number(task.assignee_id) === Number(viewerId))
      .slice(0, 3);
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
    const totals = state.funding.summary || { income: 0, expense: 0, net: 0 };
    const card = cardShell('Sponsor Snapshot', {
      subtitle: 'Live view of sponsor inflow vs. expenses and rolling net trend.',
    });

    const metrics = el('div', 'l4p-metric-grid', [
      metricBlock('Income', `$${Number(totals.income || 0).toFixed(2)}`, 'positive'),
      metricBlock('Expense', `$${Number(totals.expense || 0).toFixed(2)}`, 'negative'),
      metricBlock('Net', `$${Number(totals.net || 0).toFixed(2)}`, totals.net >= 0 ? 'positive' : 'negative'),
    ]);
    card.appendChild(metrics);

    const chartWrap = el('div', 'l4p-charts');
    const donutCanvas = document.createElement('canvas');
    donutCanvas.height = 180;
    const trendCanvas = document.createElement('canvas');
    trendCanvas.height = 160;
    chartWrap.appendChild(el('div', 'l4p-chart-card', [
      el('span', 'l4p-chart-title', 'Allocation'),
      donutCanvas,
      legendList([
        { label: 'Income', tone: 'positive', value: totals.income },
        { label: 'Expense', tone: 'negative', value: totals.expense },
      ]),
    ]));
    chartWrap.appendChild(el('div', 'l4p-chart-card', [
      el('span', 'l4p-chart-title', '7 day trend'),
      trendCanvas,
    ]));
    card.appendChild(chartWrap);

    const feed = el('div', 'l4p-list');
    state.funding.data.slice(0, 4).forEach((item) => {
      feed.appendChild(
        el('div', 'l4p-list-item', [
          el('div', 'l4p-list-meta', [
            el('strong', null, item.category || 'Untitled'),
            el('span', 'l4p-pill subtle', formatDate(item.tx_date)),
          ]),
          el(
            'span',
            item.type === 'income' ? 'l4p-amount income' : 'l4p-amount expense',
            `${item.type === 'income' ? '+' : '-'}$${Number(item.amount).toFixed(2)}`
          ),
        ])
      );
    });
    if (!state.funding.data.length) {
      feed.appendChild(el('div', 'l4p-empty', 'No transactions yet.'));
    }
    card.appendChild(feed);

    scheduleFundingCharts(donutCanvas, trendCanvas, 'dashboard');
    return card;
  }

  function notificationsCard() {
    const card = cardShell('Latest Notifications', {
      subtitle: 'Stay in sync with key crew and sponsor updates.',
      actions: buttonLink('Open notifications', () => {
        state.activeView = 'notifications';
        renderView();
      }),
    });
    const items = state.notifications.data.slice(0, 5);
    if (!items.length) {
      card.appendChild(el('div', 'l4p-empty', 'No notifications yet.'));
      return card;
    }
    const timeline = el('div', 'l4p-timeline');
    items.forEach((note) => {
      const row = el('div', 'l4p-timeline-item', [
        el('span', 'l4p-pill subtle', formatDate(note.created_at)),
        el('div', 'l4p-timeline-body', [
          el('strong', null, note.title),
          el('p', null, note.body),
        ]),
      ]);
      timeline.appendChild(row);
    });
    card.appendChild(timeline);
    return card;
  }

  function communityCard() {
    const card = cardShell('Community Feed', {
      subtitle: 'Recent posts and replies from your crew.',
      actions: buttonLink('Go to community', () => {
        state.activeView = 'community';
        renderView();
      }),
    });
    const posts = state.community.slice(0, 3);
    if (!posts.length) {
      card.appendChild(el('div', 'l4p-empty', 'No community posts yet.'));
      return card;
    }
    posts.forEach((post) => {
      const avatar = post.author?.avatar
        ? el('img', 'l4p-avatar-sm', null, { src: post.author.avatar, alt: post.author.name || 'Member' })
        : null;
      const body = el('div', 'l4p-community-item', [
        el('div', 'l4p-row', [avatar, el('div', null, [el('strong', null, post.author?.name || 'Member'), el('small', null, formatDateTime(post.created_at))])].filter(Boolean)),
        el('p', null, truncate(post.body, 160)),
      ]);
      card.appendChild(body);
    });
    return card;
  }

  function buttonLink(label, handler) {
    const button = el('button', 'l4p-link-button', label);
    button.type = 'button';
    button.addEventListener('click', handler);
    return button;
  }

  function metricBlock(label, value, tone) {
    const metric = el('div', `l4p-metric ${tone ? `tone-${tone}` : ''}`.trim());
    metric.appendChild(el('span', 'l4p-metric-label', label));
    metric.appendChild(el('span', 'l4p-metric-value', value));
    return metric;
  }

  function legendList(items) {
    const list = el('div', 'l4p-legend');
    items.forEach((item) => {
      const row = el('div', 'l4p-legend-item', [
        el('span', `l4p-legend-dot tone-${item.tone || 'neutral'}`.trim()),
        el('span', null, item.label),
        el('strong', null, `$${Number(item.value || 0).toFixed(2)}`),
      ]);
      list.appendChild(row);
    });
    return list;
  }

  let chartLibraryPromise = null;

  function ensureChartLibrary() {
    if (window.Chart) {
      return Promise.resolve(window.Chart);
    }
    if (chartLibraryPromise) {
      return chartLibraryPromise;
    }
    chartLibraryPromise = Promise.resolve(window.Chart);
    return chartLibraryPromise;
  }

  function scheduleFundingCharts(donutCanvas, trendCanvas, key) {
    ensureChartLibrary()
      .then((Chart) => {
        const totals = state.funding.summary || { income: 0, expense: 0, net: 0 };
        const donutKey = `${key}-donut`;
        const trendKey = `${key}-trend`;

        if (state.charts[donutKey]) {
          state.charts[donutKey].destroy();
        }
        state.charts[donutKey] = new Chart(donutCanvas, {
          type: 'doughnut',
          data: {
            labels: ['Income', 'Expense'],
            datasets: [
              {
                data: [Number(totals.income || 0), Number(totals.expense || 0)],
                backgroundColor: ['#0B5CD6', '#EF4444'],
                borderWidth: 0,
              },
            ],
          },
          options: {
            cutout: '68%',
            plugins: { legend: { display: false } },
          },
        });

        const trend = fundingTrendPoints();
        if (state.charts[trendKey]) {
          state.charts[trendKey].destroy();
        }
        state.charts[trendKey] = new Chart(trendCanvas, {
          type: 'line',
          data: {
            labels: trend.labels,
            datasets: [
              {
                label: 'Net',
                data: trend.net,
                borderColor: '#0B5CD6',
                backgroundColor: 'rgba(11,92,214,0.18)',
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            plugins: { legend: { display: false } },
            scales: {
              x: { display: true, ticks: { maxTicksLimit: 7 } },
              y: { display: true, beginAtZero: true },
            },
          },
        });
      })
      .catch(() => {
        donutCanvas.replaceWith(el('div', 'l4p-empty', 'Charts unavailable offline.'));
        trendCanvas.replaceWith(el('div', 'l4p-empty', 'Charts unavailable offline.'));
      });
  }

  function fundingTrendPoints() {
    const labels = [];
    const net = [];
    const today = new Date();
    const items = Array.isArray(state.funding.data) ? state.funding.data : [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      labels.push(date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      let income = 0;
      let expense = 0;
      items.forEach((item) => {
        if (!item.tx_date) {
          return;
        }
        const itemDate = String(item.tx_date).slice(0, 10);
        if (itemDate === key) {
          if (item.type === 'income') {
            income += Number(item.amount) || 0;
          } else {
            expense += Number(item.amount) || 0;
          }
        }
      });
      net.push(Number((income - expense).toFixed(2)));
    }
    return { labels, net };
  }

  function calculateFundingSummary(list) {
    const items = Array.isArray(list) ? list : [];
    return items.reduce(
      (acc, item) => {
        const amount = Number(item.amount) || 0;
        if (item.type === 'income') {
          acc.income += amount;
        } else {
          acc.expense += amount;
        }
        acc.net = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, net: 0 }
    );
  }

  function renderTasks() {
    const container = el('div', 'l4p-stack');
    const headerRow = el('div', 'l4p-tasks-header');
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
      const toggle = el('button', 'l4p-btn', state.showTaskForm ? 'Hide composer' : 'New assignment');
      toggle.addEventListener('click', () => {
        state.showTaskForm = !state.showTaskForm;
        if (state.showTaskForm && !state.taskFormState.title) {
          resetTaskForm();
        }
        renderView();
      });
      headerRow.appendChild(toggle);
    }
    container.appendChild(headerRow);

    if (canCreateTasks() && state.showTaskForm) {
      container.appendChild(taskComposerCard());
    }

    const list = el('div', 'l4p-task-grid');
    const viewerId = currentUserId();
    const myTasks = state.tasks.filter((task) => viewerId !== null && Number(task.assignee_id) === Number(viewerId));
    const otherTasks = state.tasks.filter((task) => viewerId === null || Number(task.assignee_id) !== Number(viewerId));

    list.appendChild(tasksGroup('My Tasks', myTasks));
    list.appendChild(tasksGroup('Other Tasks', otherTasks));
    container.appendChild(list);

    content.appendChild(container);
  }

  function canCreateTasks() {
    return caps.has('manage_l4p_tasks') && (isCoordinator || state.settings.volunteer_create_tasks || caps.has('manage_l4p_funding'));
  }

  function tasksGroup(title, tasks) {
    const subtitle = title === 'My Tasks' ? 'Assigned directly to you.' : 'Visible for awareness across the crew.';
    const card = cardShell(title, { subtitle });
    if (!tasks.length) {
      card.appendChild(el('div', 'l4p-empty', 'Nothing to show.'));
      return card;
    }
    const list = el('div', 'l4p-task-list');
    tasks.forEach((task) => {
      list.appendChild(renderTask(task));
    });
    card.appendChild(list);
    return card;
  }

  function renderTask(task) {
    const container = el('article', 'l4p-task-card');
    const header = el('div', 'l4p-task-card-header');
    const titleWrap = el('div', 'l4p-task-title-block', [
      el('h3', 'l4p-task-name', task.title),
      task.priority ? el('span', 'l4p-pill subtle', `Priority: ${task.priority}`) : null,
    ]);
    header.appendChild(titleWrap);
    header.appendChild(el('span', `l4p-status-chip status-${task.status}`, statusLabel(task.status)));
    container.appendChild(header);

    if (task.description) {
      container.appendChild(el('p', 'l4p-task-description', truncate(task.description, 180)));
    }

    const metaRow = el('div', 'l4p-task-meta');
    if (task.due_date) {
      metaRow.appendChild(el('span', 'l4p-pill subtle', `Due ${formatDate(task.due_date)}`));
    }
    if (task.url) {
      const link = el('a', 'l4p-link', 'Reference');
      link.href = task.url;
      link.target = '_blank';
      metaRow.appendChild(link);
    }
    container.appendChild(metaRow);

    const footer = el('div', 'l4p-task-footer');
    const avatars = el('div', 'l4p-task-people');
    if (task.assignee_avatar) {
      avatars.appendChild(el('img', 'l4p-avatar-sm', null, { src: task.assignee_avatar, alt: task.assignee_name || 'Assignee' }));
    }
    const metaDetails = [];
    if (task.assignee_name) {
      metaDetails.push(`Assigned to ${task.assignee_name}`);
    }
    if (task.created_by_name) {
      metaDetails.push(`by ${task.created_by_name}`);
    }
    avatars.appendChild(el('span', null, metaDetails.join(' • ')));
    footer.appendChild(avatars);

    const actions = el('div', 'l4p-status-actions');
    ['todo', 'progress', 'done'].forEach((status) => {
      const btn = el('button', 'l4p-status-button', statusLabel(status));
      btn.disabled = task.status === status;
      btn.addEventListener('click', () => updateTaskStatus(task, status));
      actions.appendChild(btn);
    });
    footer.appendChild(actions);
    container.appendChild(footer);
    return container;
  }

  function normalizeTask(task) {
    if (!task || typeof task !== 'object') {
      return task;
    }
    const normalized = { ...task };
    normalized.id = normalizeId(task.id);
    normalized.assignee_id = coerceNullableNumber(task.assignee_id);
    normalized.created_by = coerceNullableNumber(task.created_by);
    normalized.created_at = task.created_at || null;
    normalized.updated_at = task.updated_at || null;
    return normalized;
  }

  function normalizeId(value) {
    if (value === undefined || value === null) {
      return value;
    }
    const asNumber = Number(value);
    return Number.isNaN(asNumber) ? value : asNumber;
  }

  function coerceNullableNumber(value) {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isNaN(num) ? null : num;
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
    elInput.className = 'l4p-control';
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
    elTextarea.className = 'l4p-control';
    elTextarea.addEventListener('input', (event) => {
      state.taskFormState[event.target.name] = event.target.value;
    });
    return elTextarea;
  }

  function select(name, value, options) {
    const elSelect = document.createElement('select');
    elSelect.name = name;
    elSelect.className = 'l4p-control';
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

  function resetTaskForm() {
    state.taskFormState = {
      id: null,
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      url: '',
      assignee_id: currentUserId(),
    };
  }

  function taskComposerCard() {
    const card = cardShell('Create a task', {
      subtitle: 'Assign work, share context, and notify teammates instantly.',
    });
    const form = el('form', 'l4p-inline-form');
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

    const actions = el('div', 'l4p-inline-actions');
    const clear = el('button', 'l4p-btn secondary', 'Clear');
    clear.type = 'button';
    clear.addEventListener('click', () => {
      resetTaskForm();
      renderView();
    });
    const submit = el('button', 'l4p-btn', 'Create task');
    submit.type = 'submit';
    actions.append(clear, submit);
    form.appendChild(actions);
    form.addEventListener('submit', submitTaskForm);
    card.appendChild(form);
    return card;
  }

  async function submitTaskForm(event) {
    event.preventDefault();
    if (!state.taskFormState.title) {
      showToast('Task title is required', true);
      return;
    }
    const selectedAssignee = coerceNullableNumber(state.taskFormState.assignee_id);

    const payload = {
      title: state.taskFormState.title,
      description: state.taskFormState.description,
      status: state.taskFormState.status,
      priority: state.taskFormState.priority,
      due_date: state.taskFormState.due_date,
      url: state.taskFormState.url,
      assignee_id: selectedAssignee,
    };

    const optimisticId = `temp-${Date.now()}`;
    const assignee = state.crew.find((member) => Number(member.wp_user_id) === Number(payload.assignee_id));
    const optimisticTask = {
      id: optimisticId,
      title: payload.title,
      description: payload.description,
      status: payload.status,
      priority: payload.priority,
      due_date: payload.due_date,
      url: payload.url,
      assignee_id: selectedAssignee,
      assignee_name: assignee ? assignee.name : selectedAssignee ? 'Crew member' : 'Unassigned',
      created_by: currentUserId(),
      created_by_name: boot.currentUser?.name || 'You',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const previousTasks = [...state.tasks];
    state.tasks = [optimisticTask, ...state.tasks];
    renderView();

    try {
      const saved = await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const normalized = normalizeTask(saved);
      state.tasks = state.tasks.map((task) => (task.id === optimisticId ? normalized : task));
      showToast('Task saved successfully');
      resetTaskForm();
      await Promise.all([loadTasks(), loadNotifications()]);
      renderView();
    } catch (error) {
      state.tasks = previousTasks;
      renderView();
      showToast(error.message || 'Failed to save task', true);
    }
  }

  async function updateTaskStatus(task, status) {
    if (!isCoordinator) {
      const viewerId = currentUserId();
      const assigneeId = coerceNullableNumber(task.assignee_id);
      if (viewerId === null || assigneeId !== viewerId) {
        showToast('You can only update your own tasks', true);
        return;
      }
    }
    try {
      const optimistic = { ...task, status };
      state.tasks = state.tasks.map((t) => (t.id === task.id ? optimistic : t));
      renderView();
      const updated = await apiFetch(`/tasks/${task.id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      const normalized = normalizeTask(updated);
      state.tasks = state.tasks.map((t) => (t.id === task.id ? normalized : t));
      renderView();
    } catch (error) {
      showToast(error.message || 'Unable to update status', true);
      await loadTasks();
    }
  }

  function renderFunding() {
    const container = el('div', 'l4p-stack');
    const summaryCard = fundingSummaryCard();
    container.appendChild(summaryCard);

    if (isCoordinator && state.showFundingForm) {
      container.appendChild(fundingComposerCard());
    }

    container.appendChild(fundingLedgerCard());
    content.appendChild(container);
  }

  function fundingSummaryCard() {
    const totals = state.funding.summary || { income: 0, expense: 0, net: 0 };
    const actions = isCoordinator
      ? (() => {
          const wrap = el('div', 'l4p-row-gap');
          const toggle = el('button', 'l4p-btn', state.showFundingForm ? 'Hide form' : 'Add transaction');
          toggle.addEventListener('click', () => {
            state.showFundingForm = !state.showFundingForm;
            resetFundingForm();
            renderView();
          });
          const exportBtn = el('button', 'l4p-btn secondary', 'Export CSV');
          exportBtn.addEventListener('click', exportFunding);
          wrap.append(toggle, exportBtn);
          return wrap;
        })()
      : null;

    const card = cardShell('Sponsor overview', {
      subtitle: 'Balance income, expenses, and insights in real time.',
      actions,
    });

    const metrics = el('div', 'l4p-metric-grid', [
      metricBlock('Total income', `$${Number(totals.income || 0).toFixed(2)}`, 'positive'),
      metricBlock('Total expense', `$${Number(totals.expense || 0).toFixed(2)}`, 'negative'),
      metricBlock('Net position', `$${Number(totals.net || 0).toFixed(2)}`, totals.net >= 0 ? 'positive' : 'negative'),
    ]);
    card.appendChild(metrics);

    const chartWrap = el('div', 'l4p-charts');
    const donutCanvas = document.createElement('canvas');
    donutCanvas.height = 200;
    const trendCanvas = document.createElement('canvas');
    trendCanvas.height = 180;
    chartWrap.appendChild(el('div', 'l4p-chart-card', [
      el('span', 'l4p-chart-title', 'Allocation'),
      donutCanvas,
      legendList([
        { label: 'Income', tone: 'positive', value: totals.income },
        { label: 'Expense', tone: 'negative', value: totals.expense },
      ]),
    ]));
    chartWrap.appendChild(el('div', 'l4p-chart-card', [
      el('span', 'l4p-chart-title', '7 day trend'),
      trendCanvas,
    ]));
    card.appendChild(chartWrap);
    scheduleFundingCharts(donutCanvas, trendCanvas, 'funding');

    return card;
  }

  function fundingComposerCard() {
    const card = cardShell(state.fundingFormState.id ? 'Update transaction' : 'Add transaction', {
      subtitle: 'Capture income or expenses with contextual notes.',
    });
    const form = el('form', 'l4p-inline-form');
    form.appendChild(field('Type', selectFunding('type', state.fundingFormState.type)));
    form.appendChild(field('Amount', fundingInput('number', 'amount', state.fundingFormState.amount, true)));
    form.appendChild(field('Category', fundingInput('text', 'category', state.fundingFormState.category, true)));
    form.appendChild(field('Date', fundingInput('date', 'tx_date', state.fundingFormState.tx_date, true)));
    form.appendChild(field('Note', fundingTextarea('note', state.fundingFormState.note)));

    const actions = el('div', 'l4p-inline-actions');
    const cancel = el('button', 'l4p-btn secondary', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', () => {
      resetFundingForm();
      state.showFundingForm = false;
      renderView();
    });
    const submit = el('button', 'l4p-btn', state.fundingFormState.id ? 'Save changes' : 'Add transaction');
    submit.type = 'submit';
    actions.append(cancel, submit);
    form.appendChild(actions);
    form.addEventListener('submit', submitFundingForm);
    card.appendChild(form);
    return card;
  }

  function fundingLedgerCard() {
    const card = cardShell('Ledger', {
      subtitle: 'Granular list of every inflow and expense.',
    });
    if (!state.funding.data.length) {
      card.appendChild(el('div', 'l4p-empty', 'No sponsor transactions yet.'));
      return card;
    }

    const table = el('table', 'l4p-ledger-table');
    table.appendChild(
      el('thead', null, el('tr', null, [
        el('th', null, 'Date'),
        el('th', null, 'Category'),
        el('th', null, 'Type'),
        el('th', null, 'Amount'),
        el('th', null, 'Note'),
        isCoordinator ? el('th', null, 'Actions') : null,
      ].filter(Boolean)))
    );
    const tbody = el('tbody');
    state.funding.data.forEach((item) => {
      const row = el('tr', null);
      row.appendChild(el('td', null, formatDate(item.tx_date)));
      row.appendChild(el('td', null, item.category || '—'));
      row.appendChild(el('td', null, item.type === 'income' ? 'Income' : 'Expense'));
      row.appendChild(el('td', null, `${item.type === 'income' ? '+' : '-'}$${Number(item.amount).toFixed(2)}`));
      row.appendChild(el('td', null, item.note || '—'));
      if (isCoordinator) {
        const actionCell = el('td', 'l4p-ledger-actions');
        const edit = el('button', 'l4p-btn secondary', 'Edit');
        edit.type = 'button';
        edit.addEventListener('click', () => {
          state.showFundingForm = true;
          state.fundingFormState = { ...item };
          renderView();
        });
        const del = el('button', 'l4p-btn danger', 'Delete');
        del.type = 'button';
        del.addEventListener('click', () => deleteFunding(item));
        actionCell.append(edit, del);
        row.appendChild(actionCell);
      }
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    card.appendChild(table);
    return card;
  }

  function resetFundingForm() {
    state.fundingFormState = {
      id: null,
      type: 'income',
      amount: '',
      category: '',
      note: '',
      tx_date: new Date().toISOString().slice(0, 10),
    };
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
    sel.className = 'l4p-control';
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
    input.className = 'l4p-control';
    if (required) input.required = true;
    if (type === 'number') {
      input.step = '0.01';
      input.min = '0';
    }
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
    textarea.className = 'l4p-control';
    textarea.addEventListener('input', (event) => {
      state.fundingFormState[event.target.name] = event.target.value;
    });
    return textarea;
  }

  async function submitFundingForm(event) {
    event.preventDefault();
    const payload = {
      type: state.fundingFormState.type,
      amount: state.fundingFormState.amount,
      category: state.fundingFormState.category,
      note: state.fundingFormState.note,
      tx_date: state.fundingFormState.tx_date,
    };

    if (!payload.amount || Number.isNaN(Number(payload.amount))) {
      showToast('Amount is required', true);
      return;
    }

    payload.amount = Number(payload.amount);

    const previous = {
      data: [...state.funding.data],
      summary: { ...state.funding.summary },
    };

    const isEdit = Boolean(state.fundingFormState.id);
    const tempId = `temp-${Date.now()}`;

    if (isEdit) {
      state.funding.data = state.funding.data.map((item) =>
        item.id === state.fundingFormState.id ? { ...item, ...payload } : item
      );
    } else {
      const optimisticTx = {
        id: tempId,
        ...payload,
      };
      state.funding.data = [optimisticTx, ...state.funding.data];
    }
    state.funding.summary = calculateFundingSummary(state.funding.data);
    renderView();

    try {
      const endpoint = isEdit ? `/funding/${state.fundingFormState.id}` : '/funding';
      const method = isEdit ? 'PUT' : 'POST';
      const saved = await apiFetch(endpoint, {
        method,
        body: JSON.stringify(payload),
      });

      if (!isEdit) {
        state.funding.data = state.funding.data.map((item) => (item.id === tempId ? saved : item));
      }
      state.funding.summary = calculateFundingSummary(state.funding.data);
      showToast('Sponsor saved');
      resetFundingForm();
      state.showFundingForm = false;
      await Promise.all([loadFunding(), loadNotifications()]);
      renderView();
    } catch (error) {
      state.funding = previous;
      renderView();
      showToast(error.message || 'Unable to save sponsor record', true);
    }
  }

  async function deleteFunding(item) {
    if (!confirm('Delete this transaction?')) {
      return;
    }
    try {
      await apiFetch(`/funding/${item.id}`, { method: 'DELETE' });
      showToast('Transaction deleted');
      await Promise.all([loadFunding(), loadNotifications()]);
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
      link.download = 'l4p-sponsor.csv';
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

  function cardShell(title, options = {}) {
    const card = el('section', 'l4p-card');
    const header = el('div', 'l4p-card-header');
    const text = el('div', 'l4p-card-heading', [el('h2', 'l4p-card-title', title)]);
    if (options.subtitle) {
      text.appendChild(el('p', 'l4p-card-subtitle', options.subtitle));
    }
    header.appendChild(text);
    if (options.actions) {
      const actionsWrap = el('div', 'l4p-card-actions');
      actionsWrap.appendChild(options.actions);
      header.appendChild(actionsWrap);
    }
    card.appendChild(header);
    return card;
  }

  function taskSummary(task) {
    const block = el('div', 'l4p-task-summary');
    block.appendChild(
      el('div', 'l4p-task-summary-header', [
        el('strong', null, task.title),
        el('span', `l4p-status-chip status-${task.status}`, statusLabel(task.status)),
      ])
    );
    if (task.description) {
      block.appendChild(el('p', null, truncate(task.description, 120)));
    }
    const detail = [];
    if (task.assignee_name) {
      detail.push(`Assigned to ${task.assignee_name}`);
    }
    if (task.created_by_name) {
      detail.push(`by ${task.created_by_name}`);
    }
    block.appendChild(el('small', null, detail.join(' • ') || 'Unassigned'));
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
      const list = res.data || res || [];
      state.tasks = Array.isArray(list) ? list.map(normalizeTask) : [];
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
      showToast('Unable to load sponsor data', true);
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

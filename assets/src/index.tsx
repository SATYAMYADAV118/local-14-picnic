import './styles.css';
import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Chart, ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale } from 'chart.js';
import classNames from 'classnames';
import { DashboardView } from './views/DashboardView';
import { TasksView } from './views/TasksView';
import { FundingView } from './views/FundingView';
import { NotificationsView } from './views/NotificationsView';
import { CommunityView } from './views/CommunityView';
import { CrewView } from './views/CrewView';
import { SettingsView } from './views/SettingsView';

Chart.register(ArcElement, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale);

type ViewKey = 'dashboard' | 'tasks' | 'funding' | 'notifications' | 'community' | 'crew' | 'settings';

type Toast = { id: number; type: 'success' | 'error'; message: string };

const views: { key: ViewKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'tasks', label: 'Tasks' },
  { key: 'funding', label: 'Funding' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'community', label: 'Community' },
  { key: 'crew', label: 'Crew' },
  { key: 'settings', label: 'Settings' }
];

type AppState = {
  activeView: ViewKey;
  toasts: Toast[];
  notificationsUnread: number;
};

declare const l4pApp: {
  root: string;
  nonce: string;
  currentUser: { id: number; roles: string[] };
  settings: any;
  designTokens: Record<string, string>;
  notifications: { unread: number };
};

const initialState: AppState = {
  activeView: 'dashboard',
  toasts: [],
  notificationsUnread: (l4pApp.notifications && l4pApp.notifications.unread) || 0
};

const App = () => {
  const [state, setState] = useState<AppState>(initialState);
  const [tokens] = useState(l4pApp.designTokens);

  useEffect(() => {
    const root = document.documentElement;
    Object.entries(tokens).forEach(([key, value]) => {
      root.style.setProperty(`--l4p-${key}`, value);
    });
  }, [tokens]);

  const addToast = (toast: Omit<Toast, 'id'>) => {
    setState((prev) => ({
      ...prev,
      toasts: [...prev.toasts, { id: Date.now(), ...toast }]
    }));
  };

  const removeToast = (id: number) => {
    setState((prev) => ({
      ...prev,
      toasts: prev.toasts.filter((toast) => toast.id !== id)
    }));
  };

  const menu = useMemo(() => {
    return views.filter((item) => {
      if (item.key === 'funding') {
        return l4pApp.currentUser.roles.includes('l4p_coordinator') || l4pApp.currentUser.roles.includes('administrator');
      }

      if (item.key === 'settings') {
        return l4pApp.currentUser.roles.includes('l4p_coordinator');
      }

      return true;
    });
  }, []);

  const renderView = () => {
    switch (state.activeView) {
      case 'dashboard':
        return <DashboardView addToast={addToast} />;
      case 'tasks':
        return <TasksView addToast={addToast} />;
      case 'funding':
        return <FundingView addToast={addToast} />;
      case 'notifications':
        return <NotificationsView addToast={addToast} onUnreadChange={(count) => setState((prev) => ({ ...prev, notificationsUnread: count }))} />;
      case 'community':
        return <CommunityView addToast={addToast} />;
      case 'crew':
        return <CrewView addToast={addToast} />;
      case 'settings':
        return <SettingsView addToast={addToast} />;
      default:
        return null;
    }
  };

  return (
    <div className="l4p-app">
      <aside className="l4p-sidebar">
        <div className="l4p-branding">
          <span className="l4p-logo" aria-hidden="true">
            🎉
          </span>
          <span className="l4p-brand-text">{l4pApp.settings.brand_name}</span>
        </div>
        <nav aria-label="Local Picnic navigation" className="l4p-nav">
          {menu.map((item) => (
            <button
              key={item.key}
              className={classNames('l4p-nav-button', {
                'is-active': state.activeView === item.key
              })}
              onClick={() => setState((prev) => ({ ...prev, activeView: item.key }))}
            >
              {item.label}
              {item.key === 'notifications' && state.notificationsUnread > 0 && (
                <span className="l4p-nav-badge" aria-label={`${state.notificationsUnread} unread notifications`}>
                  {state.notificationsUnread}
                </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
      <main className="l4p-content" aria-live="polite">
        {renderView()}
      </main>
      <div className="l4p-toasts" role="status" aria-live="assertive">
        {state.toasts.map((toast) => (
          <div key={toast.id} className={classNames('l4p-toast', `is-${toast.type}`)}>
            <span>{toast.message}</span>
            <button aria-label="Dismiss notification" onClick={() => removeToast(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const root = document.getElementById('l4p-admin-app');

if (root) {
  const container = createRoot(root);
  container.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

import { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { Header } from '../components/Header';
import { Dashboard } from '../modules/Dashboard';
import { Tasks } from '../modules/Tasks';
import { Funding } from '../modules/Funding';
import { Crew } from '../modules/Crew';
import { Community } from '../modules/Community';
import { Notifications } from '../modules/Notifications';
import { Settings } from '../modules/Settings';
import { ToastProvider } from '../components/ToastContext';
import { ThemeProvider } from '../components/ThemeProvider';
import { useBoot } from '../hooks/useBoot';

export type PanelKey =
  | 'dashboard'
  | 'tasks'
  | 'funding'
  | 'crew'
  | 'community'
  | 'notifications'
  | 'settings';

const modules: Record<PanelKey, () => JSX.Element> = {
  dashboard: () => <Dashboard />,
  tasks: () => <Tasks />,
  funding: () => <Funding />,
  crew: () => <Crew />,
  community: () => <Community />,
  notifications: () => <Notifications />,
  settings: () => <Settings />
};

const navItems: { id: PanelKey; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'gauge' },
  { id: 'tasks', label: 'Tasks', icon: 'checklist' },
  { id: 'funding', label: 'Funding', icon: 'bank' },
  { id: 'crew', label: 'Crew', icon: 'users' },
  { id: 'community', label: 'Community', icon: 'chat' },
  { id: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'settings', label: 'Settings', icon: 'cog' }
];

const restrictedNav: PanelKey[] = ['funding', 'settings'];

export default function App() {
  const [active, setActive] = useState<PanelKey>('dashboard');
  const { currentUser, settings, isCoordinator } = useBoot();

  const filteredNav = navItems.filter((item) => {
    if (restrictedNav.includes(item.id) && !isCoordinator) {
      return item.id !== 'settings';
    }
    return true;
  });

  const ActiveModule = modules[active];

  return (
    <ThemeProvider value={settings}>
      <ToastProvider>
        <div className="flex h-screen w-full bg-background text-slate-900">
          <Navigation
            items={filteredNav}
            active={active}
            onChange={setActive}
            user={currentUser}
          />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header active={active} onChange={setActive} />
            <main className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-6 py-6">
                <div className="mx-auto max-w-7xl space-y-6">
                  <ActiveModule />
                </div>
              </div>
            </main>
          </div>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

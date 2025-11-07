import { Fragment, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import type { PanelKey } from '../app/App';
import { useThemeSettings } from './ThemeProvider';
import { useBoot } from '../hooks/useBoot';

const labels: Record<PanelKey, string> = {
  dashboard: 'Dashboard Overview',
  tasks: 'Tasks Pipeline',
  funding: 'Funding Snapshot',
  crew: 'Crew Directory',
  community: 'Community Feed',
  notifications: 'Notifications Center',
  settings: 'Settings'
};

const navForMobile: { id: PanelKey; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'funding', label: 'Funding' },
  { id: 'crew', label: 'Crew' },
  { id: 'community', label: 'Community' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'settings', label: 'Settings' }
];

export function Header({ active, onChange }: { active: PanelKey; onChange: (key: PanelKey) => void }) {
  const [open, setOpen] = useState(false);
  const theme = useThemeSettings();
  const { currentUser, isCoordinator } = useBoot();

  const allowedNav = useMemo(() => {
    if (isCoordinator) {
      return navForMobile;
    }
    return navForMobile.filter((item) => item.id !== 'settings');
  }, [isCoordinator]);

  return (
    <header className="flex h-20 flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur">
      <div>
        <p className="text-xs uppercase tracking-widest text-slate-500">{theme.dashboard_title ?? 'Local 4 Picnic'}</p>
        <h1 className="text-2xl font-semibold text-slate-900">{labels[active]}</h1>
      </div>
      <div className="flex items-center gap-3">
        <button
          className="inline-flex h-10 items-center rounded-full bg-[var(--l4p-primary)] px-4 text-sm font-semibold text-white shadow-soft transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          onClick={() => setOpen(true)}
        >
          Menu
        </button>
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 sm:flex">
          <span className="font-semibold text-slate-900">{currentUser?.name ?? 'Crew'}</span>
          <span className="text-xs text-slate-400">{currentUser?.email ?? ''}</span>
        </div>
      </div>
      <Transition show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/20" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-200"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-200"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-sm bg-white shadow-xl">
                    <div className="flex h-full flex-col p-6">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Navigate</h2>
                        <button onClick={() => setOpen(false)} className="text-sm text-slate-500 hover:text-slate-900">
                          Close
                        </button>
                      </div>
                      <nav className="flex-1 space-y-2 overflow-y-auto">
                        {allowedNav.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => {
                              onChange(item.id);
                              setOpen(false);
                            }}
                            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium ${
                              active === item.id ? 'bg-[var(--l4p-primary)] text-white' : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition>
    </header>
  );
}

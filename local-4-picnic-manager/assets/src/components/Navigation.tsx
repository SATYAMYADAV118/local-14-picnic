import type { PanelKey } from '../app/App';
import { useThemeSettings } from './ThemeProvider';
import { cn } from '../utils/cn';

interface NavigationProps {
  items: { id: PanelKey; label: string; icon: string }[];
  active: PanelKey;
  onChange: (key: PanelKey) => void;
  user: { name?: string; email?: string; avatar?: string } | null;
}

export function Navigation({ items, active, onChange, user }: NavigationProps) {
  const theme = useThemeSettings();
  return (
    <aside className="hidden h-full w-72 flex-col border-r border-slate-200 bg-white/90 backdrop-blur lg:flex">
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--l4p-primary)] text-white shadow-soft">
          {theme.dashboard_icon ? (
            <img src={theme.dashboard_icon} alt="Dashboard icon" className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <span className="text-xl font-bold">L4P</span>
          )}
        </div>
        <div>
          <p className="text-lg font-semibold">{theme.dashboard_title ?? 'Local 4 Picnic'}</p>
          <p className="text-xs text-slate-500">Operations Control Center</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-8">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className={cn(
              'flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
              active === item.id
                ? 'bg-[var(--l4p-primary)] text-white shadow-soft'
                : 'text-slate-600 hover:bg-slate-100'
            )}
          >
            <span>{item.label}</span>
            <span className="text-xs uppercase tracking-wide">↗</span>
          </button>
        ))}
      </nav>
      <div className="border-t border-slate-200 p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name ?? ''} className="h-10 w-10 rounded-full" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--l4p-primary)] text-white">
              {(user?.name ?? 'L4P').slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-sm">
            <p className="font-semibold">{user?.name ?? 'Team Member'}</p>
            <p className="text-xs text-slate-500">{user?.email ?? 'No email'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

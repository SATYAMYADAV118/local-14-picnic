import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { useRequest } from '../hooks/useRequest';
import { useToast } from '../components/ToastContext';
import { useBoot } from '../hooks/useBoot';

export function Settings() {
  const { call } = useRequest();
  const toast = useToast();
  const { isCoordinator } = useBoot();

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () => call('/settings')
  });

  const [form, setForm] = useState<any>({});
  const [roleInputs, setRoleInputs] = useState<{ coordinator: string; volunteer: string }>({ coordinator: '', volunteer: '' });

  useEffect(() => {
    if (settingsQuery.data) {
      setForm(settingsQuery.data);
      setRoleInputs({
        coordinator: (settingsQuery.data.coordinator_roles ?? []).join(', '),
        volunteer: (settingsQuery.data.volunteer_roles ?? []).join(', ')
      });
    }
  }, [settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: (values: any) => call('/settings', 'POST', values),
    onSuccess: () => toast('Settings saved', 'success'),
    onError: () => toast('You do not have permission to update settings', 'error')
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;
    setForm((prev: any) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  }

  function handleRoleInput(field: 'coordinator_roles' | 'volunteer_roles', value: string) {
    setRoleInputs((prev) => ({ ...prev, [field === 'coordinator_roles' ? 'coordinator' : 'volunteer']: value }));
    const roles = value
      .split(',')
      .map((role) => role.trim())
      .filter(Boolean);
    setForm((prev: any) => ({ ...prev, [field]: roles }));
  }

  if (!isCoordinator) {
    return (
      <Card title="Settings" subtitle="Coordinator access only">
        <p className="text-sm text-slate-500">Please contact a coordinator to adjust dashboard settings.</p>
      </Card>
    );
  }

  return (
    <Card title="Settings" subtitle="Branding, theme & permissions" isLoading={settingsQuery.isLoading}>
      <form
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          mutation.mutate(form);
        }}
      >
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-900">Branding</legend>
          <div>
            <label className="text-xs font-semibold text-slate-600">Dashboard title</label>
            <input name="dashboard_title" value={form.dashboard_title ?? ''} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Dashboard icon URL</label>
            <input name="dashboard_icon" value={form.dashboard_icon ?? ''} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-900">Theme</legend>
          <div>
            <label className="text-xs font-semibold text-slate-600">Primary color</label>
            <input type="color" name="theme_primary" value={form.theme_primary ?? '#0B5CD6'} onChange={handleChange} className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-slate-200" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Accent color</label>
            <input type="color" name="theme_accent" value={form.theme_accent ?? '#06B6D4'} onChange={handleChange} className="mt-1 h-10 w-full cursor-pointer rounded-xl border border-slate-200" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-900">Localization</legend>
          <div>
            <label className="text-xs font-semibold text-slate-600">Timezone</label>
            <input name="timezone" value={form.timezone ?? ''} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Currency</label>
            <input name="currency" value={form.currency ?? 'USD'} onChange={handleChange} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none" />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-900">Volunteer controls</legend>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input type="checkbox" name="volunteer_create_tasks" checked={Boolean(form.volunteer_create_tasks)} onChange={handleChange} />
            <span className="text-sm text-slate-700">Volunteers can create tasks</span>
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input type="checkbox" name="volunteer_post_chat" checked={Boolean(form.volunteer_post_chat)} onChange={handleChange} />
            <span className="text-sm text-slate-700">Volunteers can post in community</span>
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold text-slate-900">Crew sync & roles</legend>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input type="checkbox" name="auto_sync_users" checked={Boolean(form.auto_sync_users)} onChange={handleChange} />
            <span className="text-sm text-slate-700">Auto-sync WordPress users into Crew</span>
          </label>
          <div>
            <label className="text-xs font-semibold text-slate-600">Coordinator WordPress roles</label>
            <input
              value={roleInputs.coordinator}
              onChange={(event) => handleRoleInput('coordinator_roles', event.target.value)}
              placeholder="administrator, l4p_coordinator"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">Comma separated list of WordPress roles treated as coordinators.</p>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Volunteer WordPress roles</label>
            <input
              value={roleInputs.volunteer}
              onChange={(event) => handleRoleInput('volunteer_roles', event.target.value)}
              placeholder="l4p_volunteer, subscriber"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:border-[var(--l4p-primary)] focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-400">Comma separated roles synced as volunteers. Others default to volunteer.</p>
          </div>
        </fieldset>

        <div className="md:col-span-2 flex justify-end">
          <button type="submit" className="rounded-full bg-[var(--l4p-primary)] px-4 py-2 text-sm font-semibold text-white">
            Save settings
          </button>
        </div>
      </form>
    </Card>
  );
}

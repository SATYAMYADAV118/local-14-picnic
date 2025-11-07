import { useQuery } from '@tanstack/react-query';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import { Card } from '../components/ui/Card';
import { useRequest } from '../hooks/useRequest';
import { useBoot } from '../hooks/useBoot';
import { useToast } from '../components/ToastContext';

export function Crew() {
  const { call } = useRequest();
  const { isCoordinator } = useBoot();
  const toast = useToast();
  const [selected, setSelected] = useState<any | null>(null);

  const crewQuery = useQuery({
    queryKey: ['crew'],
    queryFn: () => call<{ data: any[] }>('/crew')
  });

  const members = crewQuery.data?.data ?? [];

  async function openMember(member: any) {
    const detail = await call<{ member: any; tasks: any[] }>(`/crew/${member.id}`);
    setSelected({ ...detail });
  }

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>, memberId: number) {
    if (!isCoordinator) {
      toast('Only coordinators can update avatars', 'info');
      return;
    }

    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(`${window.l4pDashboard.restUrl}/crew/${memberId}/avatar`, {
      method: 'POST',
      headers: {
        'X-WP-Nonce': window.l4pDashboard.nonce
      },
      body: formData
    });
    if (!response.ok) {
      toast('Upload failed', 'error');
      return;
    }
    toast('Avatar updated', 'success');
  }

  return (
    <Card title="Crew Roster" subtitle="Tap a member to view profile" isLoading={crewQuery.isLoading}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {members.map((member) => {
          const roleKey = member.role_key ?? member.role;
          const isCoordinator = roleKey === 'coordinator';
          return (
          <button
            key={member.id}
            onClick={() => openMember(member)}
            className="flex flex-col items-start rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-lg focus:outline-none"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src={member.avatar_url || 'https://placehold.co/64x64'} alt={member.name} className="h-14 w-14 rounded-full object-cover" />
                {isCoordinator && (
                  <label className="absolute bottom-0 right-0 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-[var(--l4p-primary)] text-white">
                    <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={(event) => handleUpload(event, member.id)} />
                    ✎
                  </label>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{member.name}</p>
                <p className="text-xs text-slate-500">{member.email}</p>
              </div>
            </div>
            <span className={`mt-4 ${isCoordinator ? 'l4p-badge-coordinator' : 'l4p-badge-volunteer'}`}>
              {member.role}
            </span>
          </button>
        );
        })}
      </div>

      <Transition show={Boolean(selected)} as={Fragment}>
        <Dialog onClose={() => setSelected(null)} className="relative z-50">
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="translate-y-6 opacity-0" enterTo="translate-y-0 opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                <Dialog.Panel className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-soft">
                  <Dialog.Title className="text-lg font-semibold text-slate-900">Crew profile</Dialog.Title>
                  {selected && (
                    <div className="mt-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <img src={selected.member.avatar_url || 'https://placehold.co/64x64'} alt={selected.member.name} className="h-16 w-16 rounded-full object-cover" />
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{selected.member.name}</p>
                          <p className="text-sm text-slate-500">{selected.member.email}</p>
                          <p className="text-xs uppercase text-slate-400">{selected.member.role}</p>
                          {selected.member.wp_role_labels?.length > 0 && (
                            <p className="text-xs text-slate-400">WordPress roles: {selected.member.wp_role_labels.join(', ')}</p>
                          )}
                          {selected.member.profile_url && (
                            <p className="mt-1">
                              <a className="l4p-inline-link" href={selected.member.profile_url}>
                                View WordPress profile
                              </a>
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 p-4">
                        <h3 className="mb-2 text-sm font-semibold text-slate-900">Assigned tasks</h3>
                        <ul className="space-y-2 text-sm text-slate-600">
                          {selected.tasks.map((task: any) => (
                            <li key={task.id} className="rounded-xl bg-slate-50 p-3">
                              <p className="font-semibold text-slate-800">{task.title}</p>
                              <p className="text-xs text-slate-500">{task.status} • {task.priority}</p>
                            </li>
                          ))}
                          {selected.tasks.length === 0 && <p className="text-xs text-slate-500">No tasks assigned.</p>}
                        </ul>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </Card>
  );
}

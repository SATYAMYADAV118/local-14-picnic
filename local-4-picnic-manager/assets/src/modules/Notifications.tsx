import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { useRequest } from '../hooks/useRequest';

export function Notifications() {
  const { call } = useRequest();
  const client = useQueryClient();

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: () => call<{ data: any[]; badge: number }>('/notifications')
  });

  const markMutation = useMutation({
    mutationFn: (id: number) => call(`/notifications/${id}/read`, 'POST'),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllMutation = useMutation({
    mutationFn: () => call('/notifications/read-all', 'POST'),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] })
  });

  return (
    <Card title="Notifications" subtitle="Mark items to keep things tidy" isLoading={notificationsQuery.isLoading}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Unread badge: {notificationsQuery.data?.badge ?? 0}</p>
        <button
          onClick={() => markAllMutation.mutate()}
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold"
        >
          Mark all as read
        </button>
      </div>
      <div className="h-[480px] space-y-4 overflow-y-auto">
        {(notificationsQuery.data?.data ?? []).map((notification) => (
          <div key={notification.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                <p className="text-xs text-slate-500">{new Date(notification.created_at).toLocaleString()}</p>
                <p className="mt-2 text-sm text-slate-600">{notification.body}</p>
              </div>
              <button
                onClick={() => markMutation.mutate(notification.id)}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold"
              >
                Mark read
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

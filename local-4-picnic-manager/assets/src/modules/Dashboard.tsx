import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { useRequest } from '../hooks/useRequest';
import { useBoot } from '../hooks/useBoot';
import { Card } from '../components/ui/Card';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Filler);

export function Dashboard() {
  const { call } = useRequest();
  const { currentUser } = useBoot();

  const tasksQuery = useQuery({
    queryKey: ['dashboard', 'tasks'],
    queryFn: () => call<{ data: any[] }>('/tasks')
  });

  const fundingQuery = useQuery({
    queryKey: ['dashboard', 'funding'],
    queryFn: () => call<{ data: any[]; summary: { income: number; expense: number; net?: number } }>('/funding')
  });

  const notificationsQuery = useQuery({
    queryKey: ['dashboard', 'notifications'],
    queryFn: () => call<{ data: any[] }>('/notifications')
  });

  const communityQuery = useQuery({
    queryKey: ['dashboard', 'community'],
    queryFn: () => call<{ data: any[] }>('/community')
  });

  const myTasks = useMemo(() => {
    if (!currentUser) return [];
    return (tasksQuery.data?.data ?? []).filter((task) => task.assignee_id === currentUser.id).slice(0, 3);
  }, [tasksQuery.data, currentUser]);

  const fundingData = useMemo(() => {
    const summary = fundingQuery.data?.summary ?? { income: 0, expense: 0, net: 0 };
    const transactions = fundingQuery.data?.data ?? [];

    const today = new Date();
    const labels: string[] = [];
    const trendValues: number[] = [];
    const dayTotals = new Map<string, number>();

    transactions.forEach((tx) => {
      if (!tx.tx_date) return;
      const dateKey = new Date(tx.tx_date).toISOString().slice(0, 10);
      const amount = Number(tx.amount) * (tx.type === 'income' ? 1 : -1);
      dayTotals.set(dateKey, (dayTotals.get(dateKey) ?? 0) + amount);
    });

    for (let index = 6; index >= 0; index -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - index);
      const key = day.toISOString().slice(0, 10);
      const label = day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      labels.push(label);
      trendValues.push(Number(dayTotals.get(key) ?? 0));
    }

    const donutData = {
      labels: ['Income', 'Expense'],
      datasets: [
        {
          label: 'Funding split',
          data: [summary.income ?? 0, summary.expense ?? 0],
          backgroundColor: ['rgba(11, 92, 214, 0.85)', 'rgba(245, 158, 11, 0.75)'],
          borderWidth: 0,
          hoverOffset: 8
        }
      ]
    };

    const lineData = {
      labels,
      datasets: [
        {
          label: 'Net change',
          data: trendValues,
          borderColor: 'rgba(6, 182, 212, 1)',
          backgroundColor: 'rgba(6, 182, 212, 0.25)',
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: '#0B5CD6'
        }
      ]
    };

    return { summary, donutData, lineData };
  }, [fundingQuery.data]);

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <Card title="My Tasks" subtitle="Top priorities assigned to you" isLoading={tasksQuery.isLoading}>
        <ul className="space-y-3" aria-live="polite">
          {myTasks.map((task) => (
            <li key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-soft" aria-label={`Task ${task.title}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">
                    Assigned by {task.created_by_name ?? 'Coordinator'} • Due {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 uppercase">
                  {task.status}
                </span>
              </div>
            </li>
          ))}
          {myTasks.length === 0 && <p className="text-sm text-slate-500">No tasks assigned to you yet.</p>}
        </ul>
      </Card>

      <Card title="Funding Snapshot" subtitle="Balance & weekly trend" isLoading={fundingQuery.isLoading}>
        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1">
            <div className="h-56" role="img" aria-label="Funding split between income and expense">
              <Doughnut
                data={fundingData.donutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        usePointStyle: true
                      }
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                ${Number(fundingData.summary.income ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500">Total income</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">
                ${Number(fundingData.summary.expense ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs text-slate-500">Total expense</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-[var(--l4p-primary)]">
                Net {(Number(fundingData.summary.income ?? 0) - Number(fundingData.summary.expense ?? 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="h-40" role="img" aria-label="Seven-day funding trend">
            <Line
              data={fundingData.lineData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    grid: {
                      display: true,
                      color: 'rgba(148, 163, 184, 0.2)'
                    },
                    ticks: {
                      callback: (value) => `$${value}`
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    }
                  }
                },
                plugins: {
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: (context) => `$${context.formattedValue}`
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </Card>

      <Card title="Latest Notifications" subtitle="Stay up to date" isLoading={notificationsQuery.isLoading}>
        <div className="space-y-4">
          {(notificationsQuery.data?.data ?? []).slice(0, 6).map((note) => (
            <div key={note.id} className="flex items-start gap-3">
              <span className="mt-1 inline-flex h-2 w-2 flex-shrink-0 rounded-full bg-[var(--l4p-primary)]" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-slate-900">{note.title}</p>
                <p className="text-xs text-slate-500">{new Date(note.created_at).toLocaleString()}</p>
                <p className="text-sm text-slate-600">{note.body}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Mini Community Feed" subtitle="Latest conversations" isLoading={communityQuery.isLoading}>
        <div className="space-y-4">
          {(communityQuery.data?.data ?? []).slice(0, 3).map((post) => (
            <div key={post.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <img src={post.author?.avatar} alt={post.author?.name} className="h-10 w-10 rounded-full object-cover" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{post.author?.name}</p>
                  <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              <p className="mt-3 text-sm text-slate-600">{post.body}</p>
              <p className="mt-2 text-xs text-slate-400">{post.comments?.length ?? 0} replies</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

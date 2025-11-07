import { useEffect, useState } from 'react';
import { FundingChart } from '../widgets/FundingChart';
import { LineTrendChart } from '../widgets/LineTrendChart';
import { Timeline } from '../widgets/Timeline';
import { CommunityMiniFeed } from '../widgets/CommunityMiniFeed';
import { fetchJSON } from '../utils/api';
import { StatChip } from '../widgets/StatChip';

interface DashboardData {
  myTasks: any[];
  fundingSnapshot: Record<string, { income: number; expense: number }>;
  notifications: any[];
  community: any[];
}

interface Props {
  addToast: (toast: { type: 'success' | 'error'; message: string }) => void;
}

export const DashboardView: React.FC<Props> = ({ addToast }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = () => {
    setLoading(true);
    fetchJSON<DashboardData>('dashboard')
      .then((response) => {
        setData(response);
      })
      .catch(() => {
        addToast({ type: 'error', message: 'Unable to load dashboard data.' });
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadDashboard();
    const handler = () => loadDashboard();
    window.addEventListener('l4p-refresh-dashboard', handler);
    return () => {
      window.removeEventListener('l4p-refresh-dashboard', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return <div className="l4p-skeleton" aria-busy="true" aria-live="polite" />;
  }

  if (!data) {
    return <div className="l4p-empty">No dashboard data yet.</div>;
  }

  return (
    <div className="l4p-grid">
      <section className="l4p-card l4p-span-2" aria-labelledby="l4p-my-tasks">
        <header className="l4p-card-header">
          <h2 id="l4p-my-tasks">My Tasks</h2>
          <StatChip label="Due Soon" value={data.myTasks.length.toString()} delta="" tone="primary" />
        </header>
        <ul className="l4p-task-list">
          {data.myTasks.map((task) => (
            <li key={task.id} className={`is-${task.status}`}>
              <div>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
              <span className="l4p-date-badge">{task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
            </li>
          ))}
          {data.myTasks.length === 0 && <li className="l4p-empty">No tasks assigned.</li>}
        </ul>
      </section>

      <section className="l4p-card" aria-labelledby="l4p-funding-donut">
        <header className="l4p-card-header">
          <h2 id="l4p-funding-donut">Funding Snapshot</h2>
          <button className="l4p-link">View All</button>
        </header>
        <FundingChart snapshot={data.fundingSnapshot} />
      </section>

      <section className="l4p-card" aria-labelledby="l4p-income-trend">
        <header className="l4p-card-header">
          <h2 id="l4p-income-trend">7-day Income vs Expense</h2>
        </header>
        <LineTrendChart snapshot={data.fundingSnapshot} />
      </section>

      <section className="l4p-card" aria-labelledby="l4p-latest-notes">
        <header className="l4p-card-header">
          <h2 id="l4p-latest-notes">Latest Notifications</h2>
        </header>
        <Timeline items={data.notifications} />
      </section>

      <section className="l4p-card" aria-labelledby="l4p-community">
        <header className="l4p-card-header">
          <h2 id="l4p-community">Community Feed</h2>
          <button className="l4p-link">View All</button>
        </header>
        <CommunityMiniFeed posts={data.community} />
      </section>
    </div>
  );
};

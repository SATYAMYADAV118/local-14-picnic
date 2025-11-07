import { useEffect, useState } from 'react';
import { fetchJSON } from '../utils/api';

interface NotificationItem {
  id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

interface Props {
  addToast: (toast: { type: 'success' | 'error'; message: string }) => void;
  onUnreadChange: (count: number) => void;
}

export const NotificationsView: React.FC<Props> = ({ addToast, onUnreadChange }) => {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);
  const [processing, setProcessing] = useState(false);

  const loadNotifications = () => {
    setLoading(true);
    fetchJSON<{ items: NotificationItem[]; unread: number }>('notifications')
      .then((response) => {
        setItems(response.items);
        setUnread(response.unread);
        onUnreadChange(response.unread);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!loading && unread > 0) {
      markAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const markAll = async () => {
    if (processing || items.length === 0) {
      return;
    }
    setProcessing(true);
    try {
      await fetchJSON('notifications/mark-all', { method: 'POST' });
      const next = items.map((item) => ({ ...item, is_read: true }));
      setItems(next);
      setUnread(0);
      onUnreadChange(0);
    } catch (error) {
      addToast({ type: 'error', message: 'Could not mark notifications as read.' });
    } finally {
      setProcessing(false);
    }
  };

  const markSingle = async (id: number) => {
    if (processing) {
      return;
    }
    setProcessing(true);
    try {
      const response = await fetchJSON<{ read: boolean; unread: number }>(`notifications/${id}/read`, {
        method: 'POST'
      });
      setItems((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
      setUnread(response.unread);
      onUnreadChange(response.unread);
    } catch (error) {
      addToast({ type: 'error', message: 'Could not mark notification as read.' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="l4p-skeleton" aria-busy="true" />;
  }

  return (
    <section className="l4p-stack">
      <header className="l4p-toolbar">
        <h1>Notifications</h1>
        <button className="l4p-button is-secondary" onClick={markAll} disabled={processing || items.length === 0}>
          Mark All
        </button>
      </header>
      <ul className="l4p-timeline">
        {items.map((item) => (
          <li key={item.id} className={!item.is_read ? 'is-unread' : ''}>
            <span className="l4p-dot" aria-hidden="true" />
            <div>
              <p>{item.message}</p>
              <time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time>
              {!item.is_read && (
                <button className="l4p-link" onClick={() => markSingle(item.id)} disabled={processing}>
                  Mark as Read
                </button>
              )}
            </div>
          </li>
        ))}
        {items.length === 0 && <li className="l4p-empty">No notifications yet.</li>}
      </ul>
    </section>
  );
};

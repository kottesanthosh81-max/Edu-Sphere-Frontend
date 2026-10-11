import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Empty, PageHead, fmt, useToast } from '../ui.jsx';

const ICON = {
  REQUEST: '📝',
  BORROW: '🔄',
  COMPLAINT: '🛠️',
};

export default function Notifications() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/notifications')
      .then((r) => setRows(r.data))
      .catch((e) => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const read = async (n) => {
    if (!n.read) {
      try {
        await api.put(`/api/notifications/${n.id}/read`);
        setRows((current) =>
          current.map((item) => (item.id === n.id ? { ...item, read: true } : item))
        );
      } catch {
        // ignore
      }
    }
  };

  const readAll = async () => {
    setMarkingAll(true);
    try {
      await api.put('/api/notifications/read-all');
      setRows((current) => current.map((n) => ({ ...n, read: true })));
      toast('All notifications marked as read');
    } catch (e) {
      toast(errMsg(e), 'error');
    } finally {
      setMarkingAll(false);
    }
  };

  const hasUnread = rows.some((n) => !n.read);

  return (
    <>
      <PageHead
        title="Notifications"
        sub="Alerts for resource requests, borrow due dates, complaint updates and system announcements"
      >
        <button
          className="btn"
          onClick={readAll}
          disabled={markingAll || !hasUnread}
        >
          {markingAll ? 'Marking…' : 'Mark all as read'}
        </button>
      </PageHead>

      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>Loading notifications…</div>
      ) : rows.length === 0 ? (
        <Empty text="No notifications" />
      ) : (
        <div className="list">
          {rows.map((n) => (
            <div
              key={n.id}
              className={`card note-row ${n.read ? '' : 'unread'}`}
              onClick={() => read(n)}
              title={n.read ? '' : 'Click to mark as read'}
            >
              <span className="n-ico">{ICON[n.type] || '🔔'}</span>
              <div style={{ flex: 1 }}>
                <b>{n.title}</b>
                <p>{n.message}</p>
                <small className="muted">{fmt(n.createdAt)}</small>
              </div>
              {!n.read && (
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--gold, #f0b429)',
                    display: 'inline-block',
                    marginTop: '6px',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

import { useEffect, useState, useMemo } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Empty, Modal, PageHead, fmtDate, useToast } from '../ui.jsx';

export default function Borrow() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [issue, setIssue] = useState(null);
  const [resources, setResources] = useState([]);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/borrow')
      .then((r) => setRows(r.data))
      .catch((e) => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openIssue = async () => {
    try {
      const [r, u] = await Promise.all([
        api.get('/api/resources'),
        api.get('/api/users'),
      ]);
      setResources(r.data.filter((x) => x.availableCopies > 0));
      setUsers(u.data);
      setIssue({ resourceId: '', userId: '', days: 14 });
    } catch (x) {
      toast(errMsg(x), 'error');
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/borrow', {
        resourceId: Number(issue.resourceId),
        userId: Number(issue.userId),
        days: Number(issue.days) || 14,
      });
      toast('Resource issued successfully');
      setIssue(null);
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setSaving(false);
    }
  };

  const giveBack = async (b) => {
    try {
      await api.put(`/api/borrow/${b.id}`);
      toast(`Marked "${b.resourceTitle}" as returned`);
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    }
  };

  const filteredRows = useMemo(() => {
    return rows.filter((b) => {
      if (statusFilter && b.status !== statusFilter) return false;
      if (q) {
        const query = q.toLowerCase();
        const text = `${b.resourceTitle} ${b.userName || ''}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }, [rows, statusFilter, q]);

  const activeCount = rows.filter((r) => r.status === 'BORROWED').length;
  const overdueCount = rows.filter((r) => r.status === 'OVERDUE').length;

  return (
    <>
      <PageHead
        title="Borrow & Circulation Management"
        sub="Monitor borrowed educational resources, active return deadlines, and overdue notices"
      >
        {isAdmin && (
          <button className="btn primary" onClick={openIssue}>
            ＋ Issue resource
          </button>
        )}
      </PageHead>

      <div className="toolbar">
        <input
          className="search"
          placeholder="🔍 Search resource or borrower name…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: '200px' }}
        >
          <option value="">All statuses ({rows.length})</option>
          <option value="BORROWED">Active Borrows ({activeCount})</option>
          <option value="OVERDUE">Overdue Notice ({overdueCount})</option>
          <option value="RETURNED">Returned Items</option>
        </select>
        <span className="muted" style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '13px' }}>
          {activeCount} active • {overdueCount > 0 ? <b style={{ color: '#d64545' }}>{overdueCount} overdue</b> : '0 overdue'}
        </span>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>Loading borrow records…</div>
      ) : filteredRows.length === 0 ? (
        <Empty text="No borrow records found matching your filters" />
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Resource Title</th>
                {isAdmin && <th>Borrower</th>}
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((b) => (
                <tr key={b.id} style={b.status === 'OVERDUE' ? { background: '#fff5f5' } : {}}>
                  <td>
                    <b>{b.resourceTitle}</b>
                    {b.status === 'OVERDUE' && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#d64545', fontWeight: 600 }}>
                        ⚠️ Past return due date!
                      </span>
                    )}
                  </td>
                  {isAdmin && <td>{b.userName}</td>}
                  <td>{fmtDate(b.borrowDate)}</td>
                  <td>{fmtDate(b.dueDate)}</td>
                  <td>{b.returnDate ? fmtDate(b.returnDate) : '—'}</td>
                  <td><Badge v={b.status} /></td>
                  <td>
                    {b.status !== 'RETURNED' && (
                      <button className="btn sm" onClick={() => giveBack(b)}>
                        Return item
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {issue && (
        <Modal title="Issue a resource to a student or faculty" onClose={() => setIssue(null)}>
          <form onSubmit={submit}>
            <label>
              Select Available Resource
              <select
                required
                value={issue.resourceId}
                onChange={(e) => setIssue({ ...issue, resourceId: e.target.value })}
              >
                <option value="">Select a resource from inventory…</option>
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title} ({r.availableCopies} available)
                  </option>
                ))}
              </select>
            </label>
            <label>
              Borrower (Student / Faculty)
              <select
                required
                value={issue.userId}
                onChange={(e) => setIssue({ ...issue, userId: e.target.value })}
              >
                <option value="">Select university member…</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.role} ({u.email})
                  </option>
                ))}
              </select>
            </label>
            <label>
              Borrow Duration (Days)
              <input
                type="number"
                min="1"
                max="60"
                value={issue.days}
                onChange={(e) => setIssue({ ...issue, days: e.target.value })}
              />
            </label>
            <button className="btn primary full" disabled={saving}>
              {saving ? 'Issuing…' : 'Issue Resource'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Empty, Modal, PageHead, fmt, useToast } from '../ui.jsx';

const CATS = ['Library', 'Resources', 'Facilities', 'Academics', 'Other'];
const STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function Complaints() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [upd, setUpd] = useState(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/complaints')
      .then((r) => setRows(r.data))
      .catch((e) => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/complaints', {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category || 'Other',
        priority: form.priority || 'MEDIUM',
      });
      toast('Complaint submitted successfully');
      setForm(null);
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/complaints/${upd.id}`, {
        status: upd.status,
        response: upd.response ? upd.response.trim() : null,
      });
      toast('Complaint updated successfully');
      setUpd(null);
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setSaving(false);
    }
  };

  const shown = rows.filter((r) => !filter || r.status === filter);

  return (
    <>
      <PageHead
        title="Complaints"
        sub={isAdmin ? 'Monitor, triage and resolve campus and resource complaints' : 'Submit and track your academic or facility complaints'}
      >
        <button
          className="btn primary"
          onClick={() =>
            setForm({
              title: '',
              description: '',
              category: 'Library',
              priority: 'MEDIUM',
            })
          }
        >
          ＋ New complaint
        </button>
      </PageHead>
      <div className="toolbar">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>Loading complaints…</div>
      ) : shown.length === 0 ? (
        <Empty text="No complaints found" />
      ) : (
        <div className="list">
          {shown.map((c) => (
            <div className="card complaint" key={c.id}>
              <div className="c-head">
                <h3>{c.title}</h3>
                <div>
                  <Badge v={c.priority} /> <Badge v={c.status} />
                </div>
              </div>
              <p>{c.description}</p>
              <small className="muted">
                Category: <b>{c.category}</b> • {isAdmin ? `Submitted by: ${c.userName} • ` : ''}
                {fmt(c.createdAt)}
              </small>
              {c.response && (
                <div className="reply">
                  <b>Official Response:</b> {c.response}
                </div>
              )}
              {isAdmin && (
                <div style={{ marginTop: '8px' }}>
                  <button
                    className="btn sm"
                    onClick={() => setUpd({ ...c, response: c.response || '' })}
                  >
                    Update status / respond
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal title="Submit a new complaint" onClose={() => setForm(null)}>
          <form onSubmit={create}>
            <label>
              Subject / Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Brief summary of the issue…"
              />
            </label>
            <div className="row2">
              <label>
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                >
                  {['LOW', 'MEDIUM', 'HIGH'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Detailed description
              <textarea
                required
                rows="4"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the complaint in detail so administrators can take action…"
              />
            </label>
            <button className="btn primary full" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit complaint'}
            </button>
          </form>
        </Modal>
      )}

      {upd && (
        <Modal title={`Update: ${upd.title}`} onClose={() => setUpd(null)}>
          <form onSubmit={update}>
            <label>
              Complaint status
              <select
                value={upd.status}
                onChange={(e) => setUpd({ ...upd, status: e.target.value })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Administrative response
              <textarea
                rows="4"
                value={upd.response}
                onChange={(e) => setUpd({ ...upd, response: e.target.value })}
                placeholder="Write the response or action taken to resolve this complaint…"
              />
            </label>
            <button className="btn primary full" disabled={saving}>
              {saving ? 'Saving…' : 'Save response'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

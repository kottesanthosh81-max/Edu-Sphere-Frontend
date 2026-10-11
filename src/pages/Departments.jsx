import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Empty, Modal, PageHead, useToast } from '../ui.jsx';

export default function Departments() {
  const { isSuper } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/departments')
      .then((r) => setRows(r.data))
      .catch((e) => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (form.id) {
        await api.put(`/api/departments/${form.id}`, form);
      } else {
        await api.post('/api/departments', form);
      }
      toast('Department saved successfully');
      setForm(null);
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d) => {
    if (!confirm(`Are you sure you want to delete department "${d.name}"?`)) return;
    try {
      await api.delete(`/api/departments/${d.id}`);
      toast('Department deleted successfully');
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    }
  };

  return (
    <>
      <PageHead
        title="Departments"
        sub="Academic departments and administrative branches"
      >
        {isSuper && (
          <button
            className="btn primary"
            onClick={() => setForm({ name: '', description: '' })}
          >
            ＋ Add department
          </button>
        )}
      </PageHead>

      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>Loading departments…</div>
      ) : rows.length === 0 ? (
        <Empty text="No departments found" />
      ) : (
        <div className="cards">
          {rows.map((d) => (
            <div className="res" key={d.id}>
              <div className="res-top">
                <span className="res-ico">🏛️</span>
              </div>
              <h3>{d.name}</h3>
              <p className="muted">{d.description || 'No description provided.'}</p>
              {isSuper && (
                <div className="res-actions">
                  <button
                    className="btn sm"
                    onClick={() => setForm({ ...d, description: d.description || '' })}
                  >
                    Edit
                  </button>
                  <button
                    className="btn sm danger"
                    onClick={() => remove(d)}
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {form && (
        <Modal
          title={form.id ? 'Edit department' : 'Add department'}
          onClose={() => setForm(null)}
        >
          <form onSubmit={save}>
            <label>
              Department name
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Computer Science"
              />
            </label>
            <label>
              Description
              <textarea
                rows="3"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Overview of the department and faculty"
              />
            </label>
            <button className="btn primary full" disabled={saving}>
              {saving ? 'Saving…' : 'Save department'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Empty, Modal, PageHead, fmtDate, useToast } from '../ui.jsx';

const ROLES = ['STUDENT', 'FACULTY', 'DEPARTMENT_ADMIN', 'LIBRARY_ADMIN', 'SUPER_ADMIN'];

export default function Users() {
  const { isSuper, user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('users'); // 'users' | 'logins'
  const [rows, setRows] = useState([]);
  const [logins, setLogins] = useState([]);
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/api/users').then((r) => setRows(r.data)).catch((e) => toast(errMsg(e), 'error')),
      api.get('/api/users/logins').then((r) => setLogins(r.data)).catch(() => {})
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/api/departments')
      .then((r) => setDepts(r.data))
      .catch(() => {});
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password ? form.password : null,
      role: form.role,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      active: form.active ?? true,
    };
    try {
      if (form.id) {
        await api.put(`/api/users/${form.id}`, body);
      } else {
        await api.post('/api/users', body);
      }
      toast('User saved successfully');
      setForm(null);
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u) => {
    if (!confirm(`Are you sure you want to delete user "${u.name}"?`)) return;
    try {
      await api.delete(`/api/users/${u.id}`);
      toast('User deleted successfully');
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    }
  };

  const shown = rows.filter((u) =>
    !q || (u.name + ' ' + u.email + ' ' + (u.departmentName || '')).toLowerCase().includes(q.toLowerCase())
  );

  const shownLogins = logins.filter((l) =>
    !q || (l.email + ' ' + (l.name || '') + ' ' + (l.ipAddress || '')).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <PageHead title="Users & Access Logs" sub="Registered user accounts, roles and real-time login audit activity">
        {isSuper && tab === 'users' && (
          <button
            className="btn primary"
            onClick={() =>
              setForm({
                name: '',
                email: '',
                password: '',
                role: 'STUDENT',
                departmentId: '',
                active: true,
              })
            }
          >
            ＋ Add user
          </button>
        )}
      </PageHead>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          className={`btn ${tab === 'users' ? 'primary' : ''}`}
          onClick={() => setTab('users')}
          style={{ borderRadius: '20px', padding: '8px 18px', fontWeight: 600 }}
        >
          👥 Registered Users ({rows.length})
        </button>
        <button
          className={`btn ${tab === 'logins' ? 'primary' : ''}`}
          onClick={() => setTab('logins')}
          style={{ borderRadius: '20px', padding: '8px 18px', fontWeight: 600 }}
        >
          📜 Login Activity Logs ({logins.length})
        </button>
      </div>

      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <input
          className="search"
          placeholder={tab === 'users' ? "🔍 Search users by name or email…" : "🔍 Search logins by email, name, IP…"}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {tab === 'users' ? (
          <button
            className="btn"
            onClick={() => {
              const headers = ['ID,Name,Email,Role,Department,Registered,Status'];
              const lines = shown.map((u) =>
                `"${u.id}","${u.name}","${u.email}","${u.role}","${u.departmentName || ''}","${u.createdAt || ''}","${u.active ? 'Active' : 'Inactive'}"`
              );
              const blob = new Blob([[headers, ...lines].join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `edusphere_users_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
            }}
          >
            📥 Export Users (Excel/CSV)
          </button>
        ) : (
          <button
            className="btn"
            onClick={() => {
              const headers = ['ID,User,Email,Role,LoginTime,Status,IPAddress,Device'];
              const lines = shownLogins.map((l) =>
                `"${l.id}","${l.name || ''}","${l.email}","${l.role || ''}","${l.loginTime || ''}","${l.successful ? 'Success' : 'Failed'}","${l.ipAddress || ''}","${(l.userAgent || '').replace(/"/g, '""')}"`
              );
              const blob = new Blob([[headers, ...lines].join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `edusphere_logins_${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
            }}
          >
            📥 Export Logins (Excel/CSV)
          </button>
        )}
      </div>

      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>Loading…</div>
      ) : tab === 'users' ? (
        shown.length === 0 ? (
          <Empty text="No users found" />
        ) : (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Registered</th>
                  <th>Status</th>
                  {isSuper && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {shown.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.name}</b></td>
                    <td>{u.email}</td>
                    <td><Badge v={u.role} /></td>
                    <td>{u.departmentName || '—'}</td>
                    <td>{fmtDate(u.createdAt)}</td>
                    <td>
                      {u.active ? (
                        <span className="badge b-AVAILABLE">Active</span>
                      ) : (
                        <span className="badge b-UNAVAILABLE">Inactive</span>
                      )}
                    </td>
                    {isSuper && (
                      <td className="nowrap">
                        <button
                          className="btn sm"
                          onClick={() =>
                            setForm({
                              ...u,
                              password: '',
                              departmentId: u.departmentId || '',
                            })
                          }
                        >
                          Edit
                        </button>{' '}
                        {u.id !== user?.id && (
                          <button className="btn sm danger" onClick={() => remove(u)}>
                            Delete
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        shownLogins.length === 0 ? (
          <Empty text="No login records found" />
        ) : (
          <div className="card table-wrap">
            <table>
              <thead>
                <tr>
                  <th>User / Email</th>
                  <th>Role</th>
                  <th>Login Time</th>
                  <th>Status</th>
                  <th>IP Address</th>
                  <th>Client / Device</th>
                </tr>
              </thead>
              <tbody>
                {shownLogins.map((l) => (
                  <tr key={l.id}>
                    <td>
                      <b>{l.name || 'Unknown'}</b>
                      <div style={{ fontSize: '12px', color: '#6b7a90' }}>{l.email}</div>
                    </td>
                    <td>{l.role ? <Badge v={l.role} /> : <span style={{ color: '#888' }}>—</span>}</td>
                    <td>{fmtDate(l.loginTime)}</td>
                    <td>
                      {l.successful ? (
                        <span className="badge b-AVAILABLE">Success</span>
                      ) : (
                        <span className="badge b-UNAVAILABLE" title={l.failureReason}>Failed: {l.failureReason}</span>
                      )}
                    </td>
                    <td><code style={{ fontSize: '12px' }}>{l.ipAddress || '—'}</code></td>
                    <td style={{ maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '12px', color: '#6b7a90' }} title={l.userAgent}>
                      {l.userAgent || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {form && (
        <Modal title={form.id ? 'Edit user' : 'Add user'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <label>
              Name
              <input required value={form.name} onChange={set('name')} />
            </label>
            <label>
              Email
              <input type="email" required value={form.email} onChange={set('email')} />
            </label>
            <label>
              Password {form.id && <small className="muted">(leave blank to keep current)</small>}
              <input
                type="password"
                minLength={form.id ? 0 : 6}
                required={!form.id}
                value={form.password || ''}
                onChange={set('password')}
                placeholder={form.id ? '•••••••• (leave blank to keep)' : 'At least 6 characters'}
              />
            </label>
            <div className="row2">
              <label>
                Role
                <select value={form.role} onChange={set('role')}>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Department
                <select value={form.departmentId} onChange={set('departmentId')}>
                  <option value="">— none —</option>
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="check" style={{ marginTop: '10px' }}>
              <input
                type="checkbox"
                checked={form.active ?? true}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />{' '}
              Active account
            </label>
            <button className="btn primary full" disabled={saving}>
              {saving ? 'Saving…' : 'Save user'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

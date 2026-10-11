import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, PageHead, fmtDate, useToast } from '../ui.jsx';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/api/auth/me', {
        name: name.trim(),
        password: password ? password : null,
      });
      updateUser(r.data);
      setPassword('');
      toast('Profile updated successfully');
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setSaving(false);
    }
  };

  const initial = user?.name ? user.name[0].toUpperCase() : 'U';

  return (
    <>
      <PageHead title="Profile & Settings" sub="Manage your personal account information" />
      <div className="card narrow">
        <div className="profile-head">
          <div className="avatar lg">{initial}</div>
          <div>
            <h3>{user?.name}</h3>
            <p className="muted">{user?.email}</p>
            {user?.role && <Badge v={user.role} />}{' '}
            {user?.departmentName && <span className="tag alt">{user.departmentName}</span>}
            {user?.createdAt && <p className="muted" style={{ fontSize: '12px', marginTop: '6px' }}>Member since {fmtDate(user.createdAt)}</p>}
          </div>
        </div>
        <form onSubmit={save}>
          <label>
            Full name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label>
            New password <small className="muted">(leave blank to keep current password)</small>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </label>
          <button className="btn primary" disabled={saving}>
            {saving ? 'Saving changes…' : 'Save changes'}
          </button>
        </form>
      </div>
    </>
  );
}

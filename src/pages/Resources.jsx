import { useEffect, useState, useMemo } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Empty, Modal, PageHead, useToast } from '../ui.jsx';

const ICON = {
  BOOK: '📘',
  JOURNAL: '📰',
  NOTES: '🗒️',
  LAB_EQUIPMENT: '🔬',
  DIGITAL: '💾',
};

const TYPES = ['BOOK', 'JOURNAL', 'NOTES', 'LAB_EQUIPMENT', 'DIGITAL'];

const blank = {
  title: '',
  author: '',
  category: '',
  type: 'BOOK',
  description: '',
  totalCopies: 1,
  departmentId: '',
};

export default function Resources() {
  const { user, isAdmin, canManage } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [depts, setDepts] = useState([]);
  const [q, setQ] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedDept, setSelectedDept] = useState('');
  const [availOnly, setAvailOnly] = useState(false);
  const [form, setForm] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [req, setReq] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/resources', {
      params: {
        q: q ? q.trim() : undefined,
        departmentId: selectedDept ? Number(selectedDept) : undefined,
      },
    })
      .then((r) => setItems(r.data))
      .catch((e) => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q, selectedDept]);

  useEffect(() => {
    api.get('/api/departments')
      .then((r) => setDepts(r.data))
      .catch(() => {});
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedType !== 'ALL' && item.type !== selectedType) return false;
      if (availOnly && item.availableCopies < 1) return false;
      return true;
    });
  }, [items, selectedType, availOnly]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const body = {
      ...form,
      totalCopies: Number(form.totalCopies),
      departmentId: form.departmentId ? Number(form.departmentId) : null,
    };
    try {
      if (form.id) {
        await api.put(`/api/resources/${form.id}`, body);
      } else {
        await api.post('/api/resources', body);
      }
      toast('Resource saved successfully');
      setForm(null);
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!confirm(`Are you sure you want to delete "${r.title}"?`)) return;
    try {
      await api.delete(`/api/resources/${r.id}`);
      toast('Resource deleted successfully');
      if (detailItem?.id === r.id) setDetailItem(null);
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    }
  };

  const borrow = async (r) => {
    try {
      await api.post('/api/borrow', { resourceId: r.id });
      toast(`Successfully borrowed "${r.title}" for 14 days`);
      load();
      if (detailItem?.id === r.id) {
        setDetailItem((prev) => ({
          ...prev,
          availableCopies: Math.max(0, prev.availableCopies - 1),
        }));
      }
    } catch (x) {
      toast(errMsg(x), 'error');
    }
  };

  const sendRequest = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/resource-requests', {
        resourceId: req.id,
        reason: reason.trim() || undefined,
      });
      toast('Resource request submitted successfully');
      setReq(null);
      setReason('');
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead
        title="Educational Resources Library"
        sub="Explore 60+ textbooks, research journals, and laboratory equipment across engineering departments"
      >
        {canManage && (
          <button className="btn primary" onClick={() => setForm({ ...blank })}>
            ＋ Add new resource
          </button>
        )}
      </PageHead>

      {/* Type Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
        <button
          className={`chip ${selectedType === 'ALL' ? 'active' : ''}`}
          style={selectedType === 'ALL' ? { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' } : {}}
          onClick={() => setSelectedType('ALL')}
        >
          All Types ({items.length})
        </button>
        {TYPES.map((t) => {
          const count = items.filter((i) => i.type === t).length;
          return (
            <button
              key={t}
              className={`chip ${selectedType === t ? 'active' : ''}`}
              style={selectedType === t ? { background: 'var(--navy)', color: '#fff', borderColor: 'var(--navy)' } : {}}
              onClick={() => setSelectedType(t)}
            >
              {ICON[t]} {t.replace(/_/g, ' ')} ({count})
            </button>
          );
        })}
      </div>

      <div className="toolbar">
        <input
          className="search"
          placeholder="🔍 Search title or author…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          style={{ maxWidth: '280px' }}
        >
          <option value="">All branches / departments</option>
          {depts.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <label className="check" style={{ margin: 0, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={availOnly}
            onChange={(e) => setAvailOnly(e.target.checked)}
          />
          Available in stock only
        </label>
        <span className="muted" style={{ marginLeft: 'auto', alignSelf: 'center', fontSize: '13px' }}>
          Showing <b>{filteredItems.length}</b> resources
        </span>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          Loading resources catalog…
        </div>
      ) : filteredItems.length === 0 ? (
        <Empty text="No resources found matching your search and branch filters." />
      ) : (
        <div className="cards">
          {filteredItems.map((r) => (
            <div className="res" key={r.id}>
              <div className="res-top">
                <span className="res-ico" title={r.type}>{ICON[r.type] || '📦'}</span>
                <Badge v={r.status} />
              </div>
              <h3
                style={{ cursor: 'pointer', color: 'var(--navy)' }}
                onClick={() => setDetailItem(r)}
                title="Click to view details"
              >
                {r.title}
              </h3>
              <p className="muted" style={{ fontSize: '13px' }}>
                {r.author ? `by ${r.author}` : 'Unknown author'}
              </p>
              <div className="tags">
                {r.category && <span className="tag">{r.category}</span>}
                {r.departmentName && <span className="tag alt">{r.departmentName}</span>}
              </div>
              {r.description && (
                <p
                  style={{
                    fontSize: '12px',
                    color: '#64748b',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {r.description}
                </p>
              )}
              <p className="copies">
                <b>{r.availableCopies}</b> / {r.totalCopies} copies available
              </p>
              <div className="res-actions">
                <button className="btn sm" onClick={() => setDetailItem(r)}>
                  Details
                </button>
                {!isAdmin && (
                  <>
                    <button className="btn sm" onClick={() => setReq(r)}>
                      Request
                    </button>
                    <button
                      className="btn sm primary"
                      disabled={r.availableCopies < 1}
                      onClick={() => borrow(r)}
                      title={r.availableCopies < 1 ? 'No copies available right now' : 'Borrow for 14 days'}
                    >
                      Borrow
                    </button>
                  </>
                )}
                {canManage && (
                  <button
                    className="btn sm"
                    onClick={() =>
                      setForm({ ...r, departmentId: r.departmentId || '' })
                    }
                  >
                    Edit
                  </button>
                )}
                {isAdmin && (
                  <button className="btn sm danger" onClick={() => remove(r)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Resource Detail Modal */}
      {detailItem && (
        <Modal title={detailItem.title} onClose={() => setDetailItem(null)}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '36px' }}>{ICON[detailItem.type] || '📦'}</span>
            <div>
              <b>{detailItem.author ? `Author: ${detailItem.author}` : 'Author: Unknown'}</b>
              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                <Badge v={detailItem.status} />
                {detailItem.category && <span className="tag">{detailItem.category}</span>}
                {detailItem.departmentName && <span className="tag alt">{detailItem.departmentName}</span>}
              </div>
            </div>
          </div>
          <div style={{ background: '#f8faff', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '14px', color: '#334155', lineHeight: 1.6 }}>
              {detailItem.description || 'No extended description available for this resource.'}
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <small className="muted">Total Inventory</small>
              <b style={{ display: 'block', fontSize: '16px' }}>{detailItem.totalCopies} copies</b>
            </div>
            <div>
              <small className="muted">Available to Borrow</small>
              <b style={{ display: 'block', fontSize: '16px', color: detailItem.availableCopies > 0 ? '#1f9d63' : '#d64545' }}>
                {detailItem.availableCopies} copies
              </b>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {!isAdmin && (
              <>
                <button
                  className="btn primary full"
                  disabled={detailItem.availableCopies < 1}
                  onClick={() => borrow(detailItem)}
                >
                  {detailItem.availableCopies > 0 ? 'Borrow for 14 Days' : 'Out of Stock'}
                </button>
                <button
                  className="btn full"
                  onClick={() => {
                    const item = detailItem;
                    setDetailItem(null);
                    setReq(item);
                  }}
                >
                  Request Copies
                </button>
              </>
            )}
            {canManage && (
              <button
                className="btn full"
                onClick={() => {
                  const item = detailItem;
                  setDetailItem(null);
                  setForm({ ...item, departmentId: item.departmentId || '' });
                }}
              >
                Edit Resource
              </button>
            )}
          </div>
        </Modal>
      )}

      {/* Add/Edit Modal */}
      {form && (
        <Modal
          title={form.id ? 'Edit Resource' : 'Add New Resource'}
          onClose={() => setForm(null)}
        >
          <form onSubmit={save}>
            <label>
              Resource Title
              <input required value={form.title} onChange={set('title')} placeholder="e.g. Operating System Concepts" />
            </label>
            <div className="row2">
              <label>
                Author / Manufacturer
                <input value={form.author || ''} onChange={set('author')} placeholder="e.g. Abraham Silberschatz" />
              </label>
              <label>
                Category
                <input
                  value={form.category || ''}
                  onChange={set('category')}
                  placeholder="e.g. Computer Science, VLSI, Robotics"
                />
              </label>
            </div>
            <div className="row3">
              <label>
                Resource Type
                <select value={form.type || 'BOOK'} onChange={set('type')}>
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Total Copies
                <input
                  type="number"
                  min="0"
                  value={form.totalCopies}
                  onChange={set('totalCopies')}
                />
              </label>
              <label>
                Department / Branch
                <select
                  value={form.departmentId}
                  onChange={set('departmentId')}
                >
                  <option value="">— General / All —</option>
                  {depts.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Description & Summary
              <textarea
                rows="3"
                value={form.description || ''}
                onChange={set('description')}
                placeholder="Key topics covered, syllabus reference, lab manual info…"
              />
            </label>
            <button className="btn primary full" disabled={saving}>
              {saving ? 'Saving…' : 'Save Resource'}
            </button>
          </form>
        </Modal>
      )}

      {/* Request Modal */}
      {req && (
        <Modal title={`Request: ${req.title}`} onClose={() => setReq(null)}>
          <form onSubmit={sendRequest}>
            <p className="muted" style={{ marginBottom: '12px' }}>
              Submitting a request alerts academic and library administrators to reserve or procure this resource for you.
            </p>
            <label>
              Reason for Request
              <textarea
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why you need this resource (course project, thesis, lab experiment)…"
              />
            </label>
            <button className="btn primary full" disabled={saving}>
              {saving ? 'Submitting…' : 'Submit Resource Request'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

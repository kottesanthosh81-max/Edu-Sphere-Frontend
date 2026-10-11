import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../auth.jsx';
import { Badge, Empty, Modal, PageHead, fmt, useToast } from '../ui.jsx';

export default function Requests() {
  const { isAdmin } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [dec, setDec] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/resource-requests')
      .then((r) => setRows(r.data))
      .catch((e) => toast(errMsg(e), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/api/resource-requests/${dec.row.id}`, {
        status: dec.status,
        remarks: remarks.trim() || undefined,
      });
      toast(`Request marked as ${dec.status.toLowerCase()}`);
      setDec(null);
      setRemarks('');
      load();
    } catch (x) {
      toast(errMsg(x), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHead
        title="Resource Requests"
        sub={isAdmin ? 'Review, approve or reject educational resource requests' : 'Track your submitted resource requests'}
      />
      {loading ? (
        <div className="card" style={{ padding: '30px', textAlign: 'center' }}>Loading resource requests…</div>
      ) : rows.length === 0 ? (
        <Empty text="No resource requests yet" />
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                {isAdmin && <th>Requested by</th>}
                <th>Reason</th>
                <th>Requested Date</th>
                <th>Status</th>
                <th>Remarks</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.resourceTitle}</b></td>
                  {isAdmin && <td>{r.userName}</td>}
                  <td>{r.reason || '—'}</td>
                  <td>{fmt(r.createdAt)}</td>
                  <td><Badge v={r.status} /></td>
                  <td>{r.remarks || '—'}</td>
                  {isAdmin && (
                    <td className="nowrap">
                      {r.status === 'PENDING' && (
                        <>
                          <button
                            className="btn sm primary"
                            onClick={() => setDec({ row: r, status: 'APPROVED' })}
                          >
                            Approve
                          </button>{' '}
                          <button
                            className="btn sm danger"
                            onClick={() => setDec({ row: r, status: 'REJECTED' })}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dec && (
        <Modal
          title={`${dec.status === 'APPROVED' ? 'Approve' : 'Reject'} request`}
          onClose={() => setDec(null)}
        >
          <form onSubmit={submit}>
            <p className="muted" style={{ marginBottom: '14px' }}>
              Resource: <b>{dec.row.resourceTitle}</b><br />
              Requested by: <b>{dec.row.userName}</b>
            </p>
            <label>
              Decision remarks (optional)
              <textarea
                rows="3"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add feedback or pickup instructions for the applicant…"
              />
            </label>
            <button
              className={`btn full ${dec.status === 'APPROVED' ? 'primary' : 'danger'}`}
              disabled={saving}
            >
              {saving ? 'Processing…' : `Confirm ${dec.status.toLowerCase()}`}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

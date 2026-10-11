import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import { Badge, Modal, PageHead, fmt, useToast } from '../ui.jsx';
import { useAuth } from '../auth.jsx';

const localToday = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

const ATTENDANCE_STATUSES = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'];

export default function Attendance() {
  const { user, isAdmin, canManage } = useAuth();
  const [tab, setTab] = useState('academic'); // 'academic' or 'library'

  const canViewRoster = isAdmin || user?.role === 'FACULTY';

  return (
    <>
      <PageHead
        title="Attendance & Library Visits"
        sub="Track academic attendance and physical library check-ins"
      >
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className={`btn ${tab === 'academic' ? 'primary' : ''}`}
            onClick={() => setTab('academic')}
          >
            Academic Attendance
          </button>
          <button
            className={`btn ${tab === 'library' ? 'primary' : ''}`}
            onClick={() => setTab('library')}
          >
            Library Check-in
          </button>
        </div>
      </PageHead>

      {tab === 'academic' && (
        <>
          {(user?.role === 'STUDENT' || user?.role === 'FACULTY') && (
            <div style={{ marginBottom: '24px' }}>
              <MyAcademicAttendance />
            </div>
          )}
          {canViewRoster && <AcademicRoster />}
        </>
      )}

      {tab === 'library' && <LibraryVisits />}
    </>
  );
}

function MyAcademicAttendance() {
  const toast = useToast();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/attendance/academic/mine')
      .then((response) => setRecord(response.data))
      .catch((error) => {
        // Not marked yet is ok
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const punch = async (action) => {
    setSaving(true);
    try {
      const response = await api.post(`/api/attendance/academic/${action}`);
      setRecord(response.data);
      toast(action === 'check-in' ? 'Academic check-in successful' : 'Academic check-out successful');
    } catch (error) {
      toast(errMsg(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const checkedIn = !!record?.checkedInAt;
  const checkedOut = !!record?.checkedOutAt;

  return (
    <div className="card attendance-self">
      <h3 style={{ marginBottom: '14px' }}>My Academic Attendance Today</h3>
      <div className="attendance-state">
        <div>
          <small className="muted">Today's Status</small>
          <div>
            {record?.status ? (
              <Badge v={record.status} />
            ) : (
              <span className="muted">Not checked in yet</span>
            )}
          </div>
        </div>
        <div className="attendance-punches">
          <div>
            <small className="muted">Check-in</small>
            <b>{fmt(record?.checkedInAt)}</b>
          </div>
          <div>
            <small className="muted">Check-out</small>
            <b>{fmt(record?.checkedOutAt)}</b>
          </div>
        </div>
      </div>
      <div className="attendance-actions">
        <button
          className="btn primary"
          disabled={loading || saving || checkedIn}
          onClick={() => punch('check-in')}
        >
          {saving ? 'Processing…' : 'Check in for today'}
        </button>
        <button
          className="btn"
          disabled={loading || saving || !checkedIn || checkedOut}
          onClick={() => punch('check-out')}
        >
          {saving ? 'Processing…' : 'Check out'}
        </button>
        {checkedOut && (
          <span className="muted" style={{ marginLeft: 'auto' }}>
            ✓ Attendance completed for today
          </span>
        )}
      </div>
    </div>
  );
}

function AcademicRoster() {
  const { canManage } = useAuth();
  const toast = useToast();
  const [date, setDate] = useState(localToday);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [statusVal, setStatusVal] = useState('PRESENT');
  const [noteVal, setNoteVal] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get('/api/attendance/academic', {
      params: {
        date,
        ...(role ? { role } : {}),
      },
    })
      .then((response) => setRows(response.data))
      .catch((error) => toast(errMsg(error), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [date, role]);

  const openMarkModal = (row) => {
    setEditModal(row);
    setStatusVal(row.status || 'PRESENT');
    setNoteVal(row.note || '');
  };

  const saveMark = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/api/attendance/academic', {
        userId: editModal.userId,
        date,
        status: statusVal,
        note: noteVal.trim() || undefined,
      });
      toast(`Marked ${editModal.userName} as ${statusVal}`);
      setEditModal(null);
      load();
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  const exportCSV = () => {
    if (!rows.length) return;
    const headers = ['Name', 'Email', 'Role', 'Status', 'Date', 'Check-in', 'Check-out', 'Note', 'Recorded By'];
    const csvRows = [headers.join(',')];
    rows.forEach((r) => {
      const values = [
        `"${(r.userName || '').replace(/"/g, '""')}"`,
        `"${(r.email || '').replace(/"/g, '""')}"`,
        r.role || '',
        r.status || 'NOT_MARKED',
        date,
        `"${r.checkedInAt ? new Date(r.checkedInAt).toLocaleTimeString() : ''}"`,
        `"${r.checkedOutAt ? new Date(r.checkedOutAt).toLocaleTimeString() : ''}"`,
        `"${(r.note || '').replace(/"/g, '""')}"`,
        `"${(r.recordedBy || '').replace(/"/g, '""')}"`,
      ];
      csvRows.push(values.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance-roster-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const shown = rows.filter((row) =>
    `${row.userName} ${row.email}`.toLowerCase().includes(search.toLowerCase())
  );
  const markedCount = rows.filter((row) => row.status).length;

  return (
    <>
      <div className="toolbar" style={{ marginTop: '16px' }}>
        <input
          aria-label="Attendance date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
        <select
          aria-label="Filter by role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
        >
          <option value="">Students and faculty</option>
          <option value="STUDENT">Students</option>
          <option value="FACULTY">Faculty</option>
        </select>
        <input
          className="search"
          aria-label="Search attendance"
          placeholder="🔍 Search name or email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          className="btn"
          onClick={exportCSV}
          title="Download attendance sheet as CSV"
        >
          📥 Export CSV
        </button>
        <span className="muted" style={{ alignSelf: 'center', marginLeft: 'auto' }}>
          <b>{markedCount}</b> of <b>{rows.length}</b> marked
        </span>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Note</th>
              <th>Recorded by</th>
              <th>Recorded at</th>
              {canManage && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={canManage ? 10 : 9} className="center muted">
                  Loading attendance roster…
                </td>
              </tr>
            ) : shown.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 10 : 9} className="center muted">
                  No attendance records for this date.
                </td>
              </tr>
            ) : (
              shown.map((row) => (
                <tr key={row.userId}>
                  <td><b>{row.userName}</b></td>
                  <td>{row.email}</td>
                  <td><Badge v={row.role} /></td>
                  <td>
                    {row.status ? (
                      <Badge v={row.status} />
                    ) : (
                      <span className="muted">Not marked</span>
                    )}
                  </td>
                  <td>{fmt(row.checkedInAt)}</td>
                  <td>{fmt(row.checkedOutAt)}</td>
                  <td>{row.note || '—'}</td>
                  <td>{row.recordedBy || '—'}</td>
                  <td>{fmt(row.recordedAt)}</td>
                  {canManage && (
                    <td>
                      <button
                        className="btn sm"
                        onClick={() => openMarkModal(row)}
                      >
                        {row.status ? 'Update' : 'Mark'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editModal && (
        <Modal
          title={`Mark attendance: ${editModal.userName}`}
          onClose={() => setEditModal(null)}
        >
          <form onSubmit={saveMark}>
            <p className="muted">
              Role: <b>{editModal.role}</b> • Date: <b>{date}</b>
            </p>
            <label>
              Attendance Status
              <select
                value={statusVal}
                onChange={(e) => setStatusVal(e.target.value)}
              >
                {ATTENDANCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Optional Note / Reason
              <input
                value={noteVal}
                onChange={(e) => setNoteVal(e.target.value)}
                placeholder="e.g. Present in Lab 2, Medical leave, Late arrival"
              />
            </label>
            <button className="btn primary full" disabled={saving}>
              {saving ? 'Saving…' : 'Save attendance record'}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

function LibraryVisits() {
  const { user, isSuper } = useAuth();
  const isLibAdmin = isSuper || user?.role === 'LIBRARY_ADMIN';
  const toast = useToast();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewAll, setViewAll] = useState(false);

  const load = () => {
    setLoading(true);
    const endpoint = (isLibAdmin && viewAll)
      ? '/api/attendance/library/all'
      : '/api/attendance/library/mine';

    api.get(endpoint)
      .then((res) => setVisits(res.data))
      .catch((err) => toast(errMsg(err), 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [viewAll]);

  const currentlyCheckedIn = visits.find((v) => !v.checkedOutAt && v.userId === user?.id);

  const punchLibrary = async (action) => {
    setSaving(true);
    try {
      await api.post(`/api/attendance/library/${action}`);
      toast(action === 'check-in' ? 'Checked in to Library' : 'Checked out of Library');
      load();
    } catch (err) {
      toast(errMsg(err), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3>Library Presence & Gate Pass</h3>
            <p className="muted">
              {currentlyCheckedIn
                ? `Currently checked in since ${fmt(currentlyCheckedIn.checkedInAt)}`
                : 'Not currently checked in to the library'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn primary"
              disabled={loading || saving || !!currentlyCheckedIn}
              onClick={() => punchLibrary('check-in')}
            >
              {saving ? 'Processing…' : '📖 Check in to Library'}
            </button>
            <button
              className="btn"
              disabled={loading || saving || !currentlyCheckedIn}
              onClick={() => punchLibrary('check-out')}
            >
              {saving ? 'Processing…' : '🚪 Check out of Library'}
            </button>
          </div>
        </div>
      </div>

      {isLibAdmin && (
        <div className="toolbar">
          <button
            className={`btn ${!viewAll ? 'primary' : ''}`}
            onClick={() => setViewAll(false)}
          >
            My Library Visits
          </button>
          <button
            className={`btn ${viewAll ? 'primary' : ''}`}
            onClick={() => setViewAll(true)}
          >
            All Student & Faculty Visits
          </button>
        </div>
      )}

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              {isLibAdmin && viewAll && <th>Visitor</th>}
              {isLibAdmin && viewAll && <th>Email</th>}
              <th>Check-in Time</th>
              <th>Check-out Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={isLibAdmin && viewAll ? 5 : 3} className="center muted">
                  Loading library visits…
                </td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan={isLibAdmin && viewAll ? 5 : 3} className="center muted">
                  No library visit records found.
                </td>
              </tr>
            ) : (
              visits.map((v) => (
                <tr key={v.id}>
                  {isLibAdmin && viewAll && <td><b>{v.userName}</b></td>}
                  {isLibAdmin && viewAll && <td>{v.email}</td>}
                  <td>{fmt(v.checkedInAt)}</td>
                  <td>{fmt(v.checkedOutAt)}</td>
                  <td>
                    {v.checkedOutAt ? (
                      <span className="badge b-RESOLVED">Completed</span>
                    ) : (
                      <span className="badge b-IN_PROGRESS">Currently Inside</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

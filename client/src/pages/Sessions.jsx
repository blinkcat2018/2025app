import { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const emptyForm = {
  tutor_id: '', student_id: '', subject_id: '', date: '', start_time: '', end_time: '', status: 'scheduled', notes: '',
};

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  const load = () => {
    const params = filter ? { status: filter } : undefined;
    Promise.all([
      api.sessions.list(params),
      api.tutors.list(),
      api.students.list(),
      api.subjects.list(),
    ]).then(([sess, t, st, sub]) => {
      setSessions(sess);
      setTutors(t);
      setStudents(st);
      setSubjects(sub);
    }).catch(console.error);
  };

  useEffect(load, [filter]);

  const openCreate = () => {
    setForm({ ...emptyForm, date: new Date().toISOString().split('T')[0] });
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (session) => {
    setForm({
      tutor_id: session.tutor_id,
      student_id: session.student_id,
      subject_id: session.subject_id,
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      status: session.status,
      notes: session.notes || '',
    });
    setEditingId(session.id);
    setError('');
    setShowModal(true);
  };

  const handleDelete = (session) => {
    if (confirm('Delete this session?')) {
      api.sessions.delete(session.id).then(load).catch(console.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        ...form,
        tutor_id: Number(form.tutor_id),
        student_id: Number(form.student_id),
        subject_id: Number(form.subject_id),
      };
      if (editingId) {
        await api.sessions.update(editingId, payload);
      } else {
        await api.sessions.create(payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'date', label: 'Date' },
    { key: 'start_time', label: 'Start' },
    { key: 'end_time', label: 'End' },
    { key: 'tutor_name', label: 'Tutor' },
    { key: 'student_name', label: 'Student' },
    { key: 'subject_name', label: 'Subject' },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Sessions</h1>
        <div className="page-header-actions">
          <select className="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button className="btn btn-primary" onClick={openCreate}>Add Session</button>
        </div>
      </div>

      <DataTable columns={columns} data={sessions} onEdit={openEdit} onDelete={handleDelete} />

      {showModal && (
        <Modal title={editingId ? 'Edit Session' : 'Add Session'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="form">
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>Tutor *</label>
                <select required value={form.tutor_id} onChange={(e) => setForm({ ...form, tutor_id: e.target.value })}>
                  <option value="">Select tutor...</option>
                  {tutors.filter((t) => t.status === 'active').map((t) => (
                    <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Student *</label>
                <select required value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })}>
                  <option value="">Select student...</option>
                  {students.filter((s) => s.status === 'active').map((s) => (
                    <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Subject *</label>
                <select required value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                  <option value="">Select subject...</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Start Time *</label>
                <input type="time" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
              </div>
              <div className="form-group">
                <label>End Time *</label>
                <input type="time" required value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">{editingId ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

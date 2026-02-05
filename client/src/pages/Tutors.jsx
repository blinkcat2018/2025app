import { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '', hourly_rate: '', status: 'active', notes: '', subject_ids: [],
};

export default function Tutors() {
  const [tutors, setTutors] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([api.tutors.list(), api.subjects.list()])
      .then(([t, s]) => { setTutors(t); setSubjects(s); })
      .catch(console.error);
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (tutor) => {
    api.tutors.get(tutor.id).then((t) => {
      setForm({
        first_name: t.first_name,
        last_name: t.last_name,
        email: t.email,
        phone: t.phone || '',
        hourly_rate: t.hourly_rate || '',
        status: t.status,
        notes: t.notes || '',
        subject_ids: t.subject_ids ? t.subject_ids.split(',').map(Number) : [],
      });
      setEditingId(t.id);
      setError('');
      setShowModal(true);
    });
  };

  const handleDelete = (tutor) => {
    if (confirm(`Delete tutor ${tutor.first_name} ${tutor.last_name}?`)) {
      api.tutors.delete(tutor.id).then(load).catch(console.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, hourly_rate: parseFloat(form.hourly_rate) || 0 };
      if (editingId) {
        await api.tutors.update(editingId, payload);
      } else {
        await api.tutors.create(payload);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubjectToggle = (subjectId) => {
    setForm((prev) => ({
      ...prev,
      subject_ids: prev.subject_ids.includes(subjectId)
        ? prev.subject_ids.filter((id) => id !== subjectId)
        : [...prev.subject_ids, subjectId],
    }));
  };

  const columns = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'hourly_rate', label: 'Rate/Hr', render: (v) => `$${(v || 0).toFixed(2)}` },
    { key: 'subjects', label: 'Subjects', render: (v) => v || '-' },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Tutors</h1>
        <button className="btn btn-primary" onClick={openCreate}>Add Tutor</button>
      </div>

      <DataTable columns={columns} data={tutors} onEdit={openEdit} onDelete={handleDelete} />

      {showModal && (
        <Modal title={editingId ? 'Edit Tutor' : 'Add Tutor'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="form">
            {error && <div className="form-error">{error}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input type="number" step="0.01" min="0" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            {subjects.length > 0 && (
              <div className="form-group">
                <label>Subjects</label>
                <div className="checkbox-group">
                  {subjects.map((s) => (
                    <label key={s.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={form.subject_ids.includes(s.id)}
                        onChange={() => handleSubjectToggle(s.id)}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
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

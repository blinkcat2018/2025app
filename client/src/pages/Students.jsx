import { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '', grade_level: '', status: 'active', notes: '',
};

export default function Students() {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.students.list().then(setStudents).catch(console.error);
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (student) => {
    setForm({
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      phone: student.phone || '',
      grade_level: student.grade_level || '',
      status: student.status,
      notes: student.notes || '',
    });
    setEditingId(student.id);
    setError('');
    setShowModal(true);
  };

  const handleDelete = (student) => {
    if (confirm(`Delete student ${student.first_name} ${student.last_name}?`)) {
      api.students.delete(student.id).then(load).catch(console.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.students.update(editingId, form);
      } else {
        await api.students.create(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'grade_level', label: 'Grade Level' },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <button className="btn btn-primary" onClick={openCreate}>Add Student</button>
      </div>

      <DataTable columns={columns} data={students} onEdit={openEdit} onDelete={handleDelete} />

      {showModal && (
        <Modal title={editingId ? 'Edit Student' : 'Add Student'} onClose={() => setShowModal(false)}>
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
                <label>Grade Level</label>
                <input value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
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

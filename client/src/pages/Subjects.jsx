import { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const emptyForm = { name: '', description: '' };

export default function Subjects() {
  const [subjects, setSubjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.subjects.list().then(setSubjects).catch(console.error);
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (subject) => {
    setForm({ name: subject.name, description: subject.description || '' });
    setEditingId(subject.id);
    setError('');
    setShowModal(true);
  };

  const handleDelete = (subject) => {
    if (confirm(`Delete subject "${subject.name}"?`)) {
      api.subjects.delete(subject.id).then(load).catch(console.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.subjects.update(editingId, form);
      } else {
        await api.subjects.create(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'description', label: 'Description' },
    { key: 'tutor_count', label: 'Tutors' },
    { key: 'created_at', label: 'Created' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Subjects</h1>
        <button className="btn btn-primary" onClick={openCreate}>Add Subject</button>
      </div>

      <DataTable columns={columns} data={subjects} onEdit={openEdit} onDelete={handleDelete} />

      {showModal && (
        <Modal title={editingId ? 'Edit Subject' : 'Add Subject'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit} className="form">
            {error && <div className="form-error">{error}</div>}
            <div className="form-group">
              <label>Name *</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

import { useState, useEffect } from 'react';
import { api } from '../api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const emptyContact = { name: '', relationship: '', email: '', phone: '', notes: '' };
const emptyForm = {
  first_name: '', last_name: '', email: '', phone: '', address: '', status: 'active', notes: '',
  contacts: [],
};

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    api.clients.list().then(setClients).catch(console.error);
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setShowModal(true);
  };

  const openEdit = (client) => {
    api.clients.get(client.id).then((c) => {
      setForm({
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone || '',
        address: c.address || '',
        status: c.status,
        notes: c.notes || '',
        contacts: c.contacts && c.contacts.length > 0 ? c.contacts : [],
      });
      setEditingId(c.id);
      setError('');
      setShowModal(true);
    });
  };

  const openDetail = (client) => {
    api.clients.get(client.id).then(setShowDetail).catch(console.error);
  };

  const handleDelete = (client) => {
    if (confirm(`Delete client ${client.first_name} ${client.last_name}? Their students will be unlinked but not deleted.`)) {
      api.clients.delete(client.id).then(load).catch(console.error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.clients.update(editingId, form);
      } else {
        await api.clients.create(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const addContact = () => {
    setForm((prev) => ({ ...prev, contacts: [...prev.contacts, { ...emptyContact }] }));
  };

  const removeContact = (index) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  const updateContact = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    }));
  };

  const columns = [
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'student_count', label: 'Students' },
    { key: 'contact_count', label: 'Contacts' },
    { key: 'status', label: 'Status', render: (v) => <span className={`badge badge-${v}`}>{v}</span> },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Clients</h1>
        <button className="btn btn-primary" onClick={openCreate}>Add Client</button>
      </div>

      <DataTable
        columns={columns}
        data={clients}
        onEdit={openEdit}
        onDelete={handleDelete}
        onRowClick={openDetail}
      />

      {/* Detail Modal */}
      {showDetail && (
        <Modal title={`${showDetail.first_name} ${showDetail.last_name}`} onClose={() => setShowDetail(null)}>
          <div className="client-detail">
            <div className="detail-section">
              <div className="detail-row">
                <span className="detail-label">Email:</span> {showDetail.email}
              </div>
              {showDetail.phone && (
                <div className="detail-row">
                  <span className="detail-label">Phone:</span> {showDetail.phone}
                </div>
              )}
              {showDetail.address && (
                <div className="detail-row">
                  <span className="detail-label">Address:</span> {showDetail.address}
                </div>
              )}
              <div className="detail-row">
                <span className="detail-label">Status:</span>{' '}
                <span className={`badge badge-${showDetail.status}`}>{showDetail.status}</span>
              </div>
              {showDetail.notes && (
                <div className="detail-row">
                  <span className="detail-label">Notes:</span> {showDetail.notes}
                </div>
              )}
            </div>

            {showDetail.contacts && showDetail.contacts.length > 0 && (
              <div className="detail-section">
                <h3 className="detail-section-title">Additional Contacts</h3>
                {showDetail.contacts.map((c) => (
                  <div key={c.id} className="detail-card">
                    <strong>{c.name}</strong>
                    {c.relationship && <span className="detail-muted"> ({c.relationship})</span>}
                    {c.email && <div>{c.email}</div>}
                    {c.phone && <div>{c.phone}</div>}
                    {c.notes && <div className="detail-muted">{c.notes}</div>}
                  </div>
                ))}
              </div>
            )}

            {showDetail.students && showDetail.students.length > 0 && (
              <div className="detail-section">
                <h3 className="detail-section-title">Students (Children)</h3>
                {showDetail.students.map((s) => (
                  <div key={s.id} className="detail-card">
                    <strong>{s.first_name} {s.last_name}</strong>
                    {s.grade_level && <span className="detail-muted"> - Grade {s.grade_level}</span>}
                    <div>{s.email}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <Modal title={editingId ? 'Edit Client' : 'Add Client'} onClose={() => setShowModal(false)}>
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
            <div className="form-group">
              <label>Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            {/* Contacts section */}
            <div className="form-section">
              <div className="form-section-header">
                <label>Additional Contacts</label>
                <button type="button" className="btn btn-sm btn-secondary" onClick={addContact}>+ Add Contact</button>
              </div>
              {form.contacts.map((contact, index) => (
                <div key={index} className="contact-entry">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input required value={contact.name} onChange={(e) => updateContact(index, 'name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Relationship</label>
                      <input placeholder="e.g. Father, Mother" value={contact.relationship} onChange={(e) => updateContact(index, 'relationship', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={contact.email} onChange={(e) => updateContact(index, 'email', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input value={contact.phone} onChange={(e) => updateContact(index, 'phone', e.target.value)} />
                    </div>
                  </div>
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeContact(index)}>Remove</button>
                </div>
              ))}
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

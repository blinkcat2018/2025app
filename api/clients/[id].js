const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  if (req.method === 'GET') {
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    client.contacts = db.prepare('SELECT * FROM client_contacts WHERE client_id = ? ORDER BY name').all(id);
    client.students = db.prepare('SELECT id, first_name, last_name, email, grade_level, status FROM students WHERE client_id = ? ORDER BY last_name, first_name').all(id);

    return res.json(client);
  }

  if (req.method === 'PUT') {
    const { first_name, last_name, email, phone, address, status, notes, contacts } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    const updateClient = db.prepare(`
      UPDATE clients SET first_name = ?, last_name = ?, email = ?, phone = ?, address = ?, status = ?, notes = ?
      WHERE id = ?
    `);
    const deleteContacts = db.prepare('DELETE FROM client_contacts WHERE client_id = ?');
    const insertContact = db.prepare(`
      INSERT INTO client_contacts (client_id, name, relationship, email, phone, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      const result = updateClient.run(first_name, last_name, email, phone, address, status || 'active', notes, id);
      if (result.changes === 0) return null;
      deleteContacts.run(id);
      if (contacts && contacts.length > 0) {
        for (const c of contacts) {
          if (c.name) {
            insertContact.run(id, c.name, c.relationship, c.email, c.phone, c.notes);
          }
        }
      }
      return id;
    });

    try {
      const clientId = transaction();
      if (!clientId) return res.status(404).json({ error: 'Client not found' });
      const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
      return res.json(client);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'A client with this email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const result = db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Client not found' });
    return res.json({ message: 'Client deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

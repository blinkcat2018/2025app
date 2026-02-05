const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all clients
router.get('/', (req, res) => {
  const clients = db.prepare(`
    SELECT c.*,
           COUNT(DISTINCT s.id) as student_count,
           COUNT(DISTINCT cc.id) as contact_count
    FROM clients c
    LEFT JOIN students s ON c.id = s.client_id
    LEFT JOIN client_contacts cc ON c.id = cc.client_id
    GROUP BY c.id
    ORDER BY c.last_name, c.first_name
  `).all();
  res.json(clients);
});

// GET single client with contacts and students
router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  client.contacts = db.prepare('SELECT * FROM client_contacts WHERE client_id = ? ORDER BY name').all(req.params.id);
  client.students = db.prepare('SELECT id, first_name, last_name, email, grade_level, status FROM students WHERE client_id = ? ORDER BY last_name, first_name').all(req.params.id);

  res.json(client);
});

// POST create client
router.post('/', (req, res) => {
  const { first_name, last_name, email, phone, address, status, notes, contacts } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  const insertClient = db.prepare(`
    INSERT INTO clients (first_name, last_name, email, phone, address, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertContact = db.prepare(`
    INSERT INTO client_contacts (client_id, name, relationship, email, phone, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction(() => {
    const result = insertClient.run(first_name, last_name, email, phone, address, status || 'active', notes);
    const clientId = result.lastInsertRowid;

    if (contacts && contacts.length > 0) {
      for (const c of contacts) {
        if (c.name) {
          insertContact.run(clientId, c.name, c.relationship, c.email, c.phone, c.notes);
        }
      }
    }

    return clientId;
  });

  try {
    const clientId = transaction();
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    res.status(201).json(client);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A client with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update client
router.put('/:id', (req, res) => {
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
    const result = updateClient.run(first_name, last_name, email, phone, address, status || 'active', notes, req.params.id);
    if (result.changes === 0) return null;

    deleteContacts.run(req.params.id);
    if (contacts && contacts.length > 0) {
      for (const c of contacts) {
        if (c.name) {
          insertContact.run(req.params.id, c.name, c.relationship, c.email, c.phone, c.notes);
        }
      }
    }

    return req.params.id;
  });

  try {
    const clientId = transaction();
    if (!clientId) return res.status(404).json({ error: 'Client not found' });
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    res.json(client);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A client with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE client
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Client not found' });
  res.json({ message: 'Client deleted' });
});

module.exports = router;

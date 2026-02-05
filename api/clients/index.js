const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
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
    return res.json(clients);
  }

  if (req.method === 'POST') {
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
      return res.status(201).json(client);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'A client with this email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

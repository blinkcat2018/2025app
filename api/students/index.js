const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    const students = db.prepare(`
      SELECT s.*,
             c.first_name || ' ' || c.last_name as client_name
      FROM students s
      LEFT JOIN clients c ON s.client_id = c.id
      ORDER BY s.last_name, s.first_name
    `).all();
    return res.json(students);
  }

  if (req.method === 'POST') {
    const { first_name, last_name, email, phone, grade_level, client_id, status, notes } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    try {
      const result = db.prepare(`
        INSERT INTO students (first_name, last_name, email, phone, grade_level, client_id, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(first_name, last_name, email, phone, grade_level, client_id || null, status || 'active', notes);

      const student = db.prepare('SELECT * FROM students WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json(student);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'A student with this email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

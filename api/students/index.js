const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    const students = db.prepare('SELECT * FROM students ORDER BY last_name, first_name').all();
    return res.json(students);
  }

  if (req.method === 'POST') {
    const { first_name, last_name, email, phone, grade_level, status, notes } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    try {
      const result = db.prepare(`
        INSERT INTO students (first_name, last_name, email, phone, grade_level, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(first_name, last_name, email, phone, grade_level, status || 'active', notes);

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

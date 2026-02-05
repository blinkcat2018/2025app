const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  if (req.method === 'GET') {
    const student = db.prepare(`
      SELECT s.*,
             c.first_name || ' ' || c.last_name as client_name
      FROM students s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.id = ?
    `).get(id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    return res.json(student);
  }

  if (req.method === 'PUT') {
    const { first_name, last_name, email, phone, grade_level, client_id, status, notes } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    try {
      const result = db.prepare(`
        UPDATE students SET first_name = ?, last_name = ?, email = ?, phone = ?, grade_level = ?, client_id = ?, status = ?, notes = ?
        WHERE id = ?
      `).run(first_name, last_name, email, phone, grade_level, client_id || null, status || 'active', notes, id);

      if (result.changes === 0) return res.status(404).json({ error: 'Student not found' });
      const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
      return res.json(student);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'A student with this email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const result = db.prepare('DELETE FROM students WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Student not found' });
    return res.json({ message: 'Student deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

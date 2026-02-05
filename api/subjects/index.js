const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    const subjects = db.prepare(`
      SELECT s.*,
             COUNT(DISTINCT ts.tutor_id) as tutor_count
      FROM subjects s
      LEFT JOIN tutor_subjects ts ON s.id = ts.subject_id
      GROUP BY s.id
      ORDER BY s.name
    `).all();
    return res.json(subjects);
  }

  if (req.method === 'POST') {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    try {
      const result = db.prepare('INSERT INTO subjects (name, description) VALUES (?, ?)').run(name, description);
      const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(result.lastInsertRowid);
      return res.status(201).json(subject);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'A subject with this name already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

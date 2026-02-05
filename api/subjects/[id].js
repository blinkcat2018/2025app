const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  if (req.method === 'GET') {
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
    if (!subject) return res.status(404).json({ error: 'Subject not found' });
    return res.json(subject);
  }

  if (req.method === 'PUT') {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    try {
      const result = db.prepare('UPDATE subjects SET name = ?, description = ? WHERE id = ?').run(name, description, id);
      if (result.changes === 0) return res.status(404).json({ error: 'Subject not found' });
      const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(id);
      return res.json(subject);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'A subject with this name already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const result = db.prepare('DELETE FROM subjects WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Subject not found' });
    return res.json({ message: 'Subject deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

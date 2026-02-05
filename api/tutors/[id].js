const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  if (req.method === 'GET') {
    const tutor = db.prepare(`
      SELECT t.*, GROUP_CONCAT(s.name) as subjects,
             GROUP_CONCAT(s.id) as subject_ids
      FROM tutors t
      LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      WHERE t.id = ?
      GROUP BY t.id
    `).get(id);

    if (!tutor) return res.status(404).json({ error: 'Tutor not found' });
    return res.json(tutor);
  }

  if (req.method === 'PUT') {
    const { first_name, last_name, email, phone, hourly_rate, status, notes, subject_ids } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    const updateTutor = db.prepare(`
      UPDATE tutors SET first_name = ?, last_name = ?, email = ?, phone = ?, hourly_rate = ?, status = ?, notes = ?
      WHERE id = ?
    `);
    const deleteSubjects = db.prepare('DELETE FROM tutor_subjects WHERE tutor_id = ?');
    const insertSubject = db.prepare('INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES (?, ?)');

    const transaction = db.transaction(() => {
      const result = updateTutor.run(first_name, last_name, email, phone, hourly_rate || 0, status || 'active', notes, id);
      if (result.changes === 0) return null;
      deleteSubjects.run(id);
      if (subject_ids && subject_ids.length > 0) {
        for (const subjectId of subject_ids) {
          insertSubject.run(id, subjectId);
        }
      }
      return id;
    });

    try {
      const tutorId = transaction();
      if (!tutorId) return res.status(404).json({ error: 'Tutor not found' });
      const tutor = db.prepare('SELECT * FROM tutors WHERE id = ?').get(tutorId);
      return res.json(tutor);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'A tutor with this email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const result = db.prepare('DELETE FROM tutors WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Tutor not found' });
    return res.json({ message: 'Tutor deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();

  if (req.method === 'GET') {
    const tutors = db.prepare(`
      SELECT t.*, GROUP_CONCAT(s.name) as subjects
      FROM tutors t
      LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
      LEFT JOIN subjects s ON ts.subject_id = s.id
      GROUP BY t.id
      ORDER BY t.last_name, t.first_name
    `).all();
    return res.json(tutors);
  }

  if (req.method === 'POST') {
    const { first_name, last_name, email, phone, hourly_rate, status, notes, subject_ids } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'First name, last name, and email are required' });
    }

    const insertTutor = db.prepare(`
      INSERT INTO tutors (first_name, last_name, email, phone, hourly_rate, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const insertSubject = db.prepare('INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES (?, ?)');

    const transaction = db.transaction(() => {
      const result = insertTutor.run(first_name, last_name, email, phone, hourly_rate || 0, status || 'active', notes);
      const tutorId = result.lastInsertRowid;
      if (subject_ids && subject_ids.length > 0) {
        for (const subjectId of subject_ids) {
          insertSubject.run(tutorId, subjectId);
        }
      }
      return tutorId;
    });

    try {
      const tutorId = transaction();
      const tutor = db.prepare('SELECT * FROM tutors WHERE id = ?').get(tutorId);
      return res.status(201).json(tutor);
    } catch (err) {
      if (err.message.includes('UNIQUE constraint')) {
        return res.status(400).json({ error: 'A tutor with this email already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

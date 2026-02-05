const { getDb } = require('../_lib/database');

module.exports = function handler(req, res) {
  const db = getDb();
  const { id } = req.query;

  if (req.method === 'GET') {
    const session = db.prepare(`
      SELECT s.*,
             t.first_name || ' ' || t.last_name as tutor_name,
             st.first_name || ' ' || st.last_name as student_name,
             sub.name as subject_name
      FROM sessions s
      JOIN tutors t ON s.tutor_id = t.id
      JOIN students st ON s.student_id = st.id
      JOIN subjects sub ON s.subject_id = sub.id
      WHERE s.id = ?
    `).get(id);

    if (!session) return res.status(404).json({ error: 'Session not found' });
    return res.json(session);
  }

  if (req.method === 'PUT') {
    const { tutor_id, student_id, subject_id, date, start_time, end_time, status, notes } = req.body;

    if (!tutor_id || !student_id || !subject_id || !date || !start_time || !end_time) {
      return res.status(400).json({ error: 'Tutor, student, subject, date, start time, and end time are required' });
    }

    try {
      const result = db.prepare(`
        UPDATE sessions SET tutor_id = ?, student_id = ?, subject_id = ?, date = ?, start_time = ?, end_time = ?, status = ?, notes = ?
        WHERE id = ?
      `).run(tutor_id, student_id, subject_id, date, start_time, end_time, status || 'scheduled', notes, id);

      if (result.changes === 0) return res.status(404).json({ error: 'Session not found' });

      const session = db.prepare(`
        SELECT s.*,
               t.first_name || ' ' || t.last_name as tutor_name,
               st.first_name || ' ' || st.last_name as student_name,
               sub.name as subject_name
        FROM sessions s
        JOIN tutors t ON s.tutor_id = t.id
        JOIN students st ON s.student_id = st.id
        JOIN subjects sub ON s.subject_id = sub.id
        WHERE s.id = ?
      `).get(id);

      return res.json(session);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    if (result.changes === 0) return res.status(404).json({ error: 'Session not found' });
    return res.json({ message: 'Session deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};

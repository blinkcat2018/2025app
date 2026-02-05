const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all sessions
router.get('/', (req, res) => {
  const { status, tutor_id, student_id } = req.query;

  let query = `
    SELECT s.*,
           t.first_name || ' ' || t.last_name as tutor_name,
           st.first_name || ' ' || st.last_name as student_name,
           sub.name as subject_name
    FROM sessions s
    JOIN tutors t ON s.tutor_id = t.id
    JOIN students st ON s.student_id = st.id
    JOIN subjects sub ON s.subject_id = sub.id
  `;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('s.status = ?');
    params.push(status);
  }
  if (tutor_id) {
    conditions.push('s.tutor_id = ?');
    params.push(tutor_id);
  }
  if (student_id) {
    conditions.push('s.student_id = ?');
    params.push(student_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY s.date DESC, s.start_time DESC';

  const sessions = db.prepare(query).all(...params);
  res.json(sessions);
});

// GET single session
router.get('/:id', (req, res) => {
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
  `).get(req.params.id);

  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

// POST create session
router.post('/', (req, res) => {
  const { tutor_id, student_id, subject_id, date, start_time, end_time, status, notes } = req.body;

  if (!tutor_id || !student_id || !subject_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Tutor, student, subject, date, start time, and end time are required' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO sessions (tutor_id, student_id, subject_id, date, start_time, end_time, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(tutor_id, student_id, subject_id, date, start_time, end_time, status || 'scheduled', notes);

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
    `).get(result.lastInsertRowid);

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update session
router.put('/:id', (req, res) => {
  const { tutor_id, student_id, subject_id, date, start_time, end_time, status, notes } = req.body;

  if (!tutor_id || !student_id || !subject_id || !date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Tutor, student, subject, date, start time, and end time are required' });
  }

  try {
    const result = db.prepare(`
      UPDATE sessions SET tutor_id = ?, student_id = ?, subject_id = ?, date = ?, start_time = ?, end_time = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(tutor_id, student_id, subject_id, date, start_time, end_time, status || 'scheduled', notes, req.params.id);

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
    `).get(req.params.id);

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE session
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM sessions WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Session not found' });
  res.json({ message: 'Session deleted' });
});

module.exports = router;

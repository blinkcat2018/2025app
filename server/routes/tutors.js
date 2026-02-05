const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all tutors
router.get('/', (req, res) => {
  const tutors = db.prepare(`
    SELECT t.*, GROUP_CONCAT(s.name) as subjects
    FROM tutors t
    LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
    LEFT JOIN subjects s ON ts.subject_id = s.id
    GROUP BY t.id
    ORDER BY t.last_name, t.first_name
  `).all();
  res.json(tutors);
});

// GET single tutor
router.get('/:id', (req, res) => {
  const tutor = db.prepare(`
    SELECT t.*, GROUP_CONCAT(s.name) as subjects,
           GROUP_CONCAT(s.id) as subject_ids
    FROM tutors t
    LEFT JOIN tutor_subjects ts ON t.id = ts.tutor_id
    LEFT JOIN subjects s ON ts.subject_id = s.id
    WHERE t.id = ?
    GROUP BY t.id
  `).get(req.params.id);

  if (!tutor) return res.status(404).json({ error: 'Tutor not found' });
  res.json(tutor);
});

// POST create tutor
router.post('/', (req, res) => {
  const { first_name, last_name, email, phone, hourly_rate, status, notes, subject_ids } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  const insertTutor = db.prepare(`
    INSERT INTO tutors (first_name, last_name, email, phone, hourly_rate, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertSubject = db.prepare(`
    INSERT INTO tutor_subjects (tutor_id, subject_id) VALUES (?, ?)
  `);

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
    res.status(201).json(tutor);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A tutor with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update tutor
router.put('/:id', (req, res) => {
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
    const result = updateTutor.run(first_name, last_name, email, phone, hourly_rate || 0, status || 'active', notes, req.params.id);

    if (result.changes === 0) return null;

    deleteSubjects.run(req.params.id);
    if (subject_ids && subject_ids.length > 0) {
      for (const subjectId of subject_ids) {
        insertSubject.run(req.params.id, subjectId);
      }
    }

    return req.params.id;
  });

  try {
    const tutorId = transaction();
    if (!tutorId) return res.status(404).json({ error: 'Tutor not found' });
    const tutor = db.prepare('SELECT * FROM tutors WHERE id = ?').get(tutorId);
    res.json(tutor);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A tutor with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE tutor
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM tutors WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Tutor not found' });
  res.json({ message: 'Tutor deleted' });
});

module.exports = router;

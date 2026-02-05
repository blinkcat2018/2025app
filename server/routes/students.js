const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all students
router.get('/', (req, res) => {
  const students = db.prepare(`
    SELECT s.*,
           c.first_name || ' ' || c.last_name as client_name
    FROM students s
    LEFT JOIN clients c ON s.client_id = c.id
    ORDER BY s.last_name, s.first_name
  `).all();
  res.json(students);
});

// GET single student
router.get('/:id', (req, res) => {
  const student = db.prepare(`
    SELECT s.*,
           c.first_name || ' ' || c.last_name as client_name
    FROM students s
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE s.id = ?
  `).get(req.params.id);
  if (!student) return res.status(404).json({ error: 'Student not found' });
  res.json(student);
});

// POST create student
router.post('/', (req, res) => {
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
    res.status(201).json(student);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A student with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update student
router.put('/:id', (req, res) => {
  const { first_name, last_name, email, phone, grade_level, client_id, status, notes } = req.body;

  if (!first_name || !last_name || !email) {
    return res.status(400).json({ error: 'First name, last name, and email are required' });
  }

  try {
    const result = db.prepare(`
      UPDATE students SET first_name = ?, last_name = ?, email = ?, phone = ?, grade_level = ?, client_id = ?, status = ?, notes = ?
      WHERE id = ?
    `).run(first_name, last_name, email, phone, grade_level, client_id || null, status || 'active', notes, req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Student not found' });
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    res.json(student);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A student with this email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE student
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM students WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Student not found' });
  res.json({ message: 'Student deleted' });
});

module.exports = router;

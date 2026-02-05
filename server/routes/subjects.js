const express = require('express');
const router = express.Router();
const db = require('../database');

// GET all subjects
router.get('/', (req, res) => {
  const subjects = db.prepare(`
    SELECT s.*,
           COUNT(DISTINCT ts.tutor_id) as tutor_count
    FROM subjects s
    LEFT JOIN tutor_subjects ts ON s.id = ts.subject_id
    GROUP BY s.id
    ORDER BY s.name
  `).all();
  res.json(subjects);
});

// GET single subject
router.get('/:id', (req, res) => {
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });
  res.json(subject);
});

// POST create subject
router.post('/', (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Subject name is required' });
  }

  try {
    const result = db.prepare('INSERT INTO subjects (name, description) VALUES (?, ?)').run(name, description);
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(subject);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A subject with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// PUT update subject
router.put('/:id', (req, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Subject name is required' });
  }

  try {
    const result = db.prepare('UPDATE subjects SET name = ?, description = ? WHERE id = ?').run(name, description, req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Subject not found' });
    const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(req.params.id);
    res.json(subject);
  } catch (err) {
    if (err.message.includes('UNIQUE constraint')) {
      return res.status(400).json({ error: 'A subject with this name already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// DELETE subject
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM subjects WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Subject not found' });
  res.json({ message: 'Subject deleted' });
});

module.exports = router;

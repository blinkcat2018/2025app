const { getDb } = require('./_lib/database');

module.exports = function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = getDb();

  const totalTutors = db.prepare('SELECT COUNT(*) as count FROM tutors WHERE status = ?').get('active').count;
  const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students WHERE status = ?').get('active').count;
  const totalSubjects = db.prepare('SELECT COUNT(*) as count FROM subjects').get().count;

  const today = new Date().toISOString().split('T')[0];

  const upcomingSessions = db.prepare(`
    SELECT COUNT(*) as count FROM sessions
    WHERE date >= ? AND status = 'scheduled'
  `).get(today).count;

  const completedSessions = db.prepare(`
    SELECT COUNT(*) as count FROM sessions WHERE status = 'completed'
  `).get().count;

  const totalRevenue = db.prepare(`
    SELECT COALESCE(SUM(
      t.hourly_rate * (
        (CAST(substr(s.end_time, 1, 2) AS REAL) + CAST(substr(s.end_time, 4, 2) AS REAL) / 60) -
        (CAST(substr(s.start_time, 1, 2) AS REAL) + CAST(substr(s.start_time, 4, 2) AS REAL) / 60)
      )
    ), 0) as total
    FROM sessions s
    JOIN tutors t ON s.tutor_id = t.id
    WHERE s.status = 'completed'
  `).get().total;

  const recentSessions = db.prepare(`
    SELECT s.*,
           t.first_name || ' ' || t.last_name as tutor_name,
           st.first_name || ' ' || st.last_name as student_name,
           sub.name as subject_name
    FROM sessions s
    JOIN tutors t ON s.tutor_id = t.id
    JOIN students st ON s.student_id = st.id
    JOIN subjects sub ON s.subject_id = sub.id
    WHERE s.date >= ?
    ORDER BY s.date ASC, s.start_time ASC
    LIMIT 10
  `).all(today);

  res.json({
    stats: {
      totalTutors,
      totalStudents,
      totalSubjects,
      upcomingSessions,
      completedSessions,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
    },
    recentSessions,
  });
};

import { useState, useEffect } from 'react';
import { api } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.get().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading dashboard...</p>;
  if (!data) return <p>Failed to load dashboard data.</p>;

  const { stats, recentSessions } = data;

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.totalTutors}</div>
          <div className="stat-label">Active Tutors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalStudents}</div>
          <div className="stat-label">Active Students</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalSubjects}</div>
          <div className="stat-label">Subjects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.upcomingSessions}</div>
          <div className="stat-label">Upcoming Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.completedSessions}</div>
          <div className="stat-label">Completed Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
      </div>

      <h2 className="section-title">Upcoming Sessions</h2>
      {recentSessions.length === 0 ? (
        <p className="empty-state">No upcoming sessions scheduled.</p>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Tutor</th>
                <th>Student</th>
                <th>Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentSessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.date}</td>
                  <td>{s.start_time} - {s.end_time}</td>
                  <td>{s.tutor_name}</td>
                  <td>{s.student_name}</td>
                  <td>{s.subject_name}</td>
                  <td><span className={`badge badge-${s.status}`}>{s.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

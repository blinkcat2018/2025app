import { useState, useEffect, useMemo } from 'react';
import { api } from '../api';
import Modal from '../components/Modal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells = [];

  // Previous month trailing days
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, inMonth: false });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, inMonth: true });
  }

  // Next month leading days
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, inMonth: false });
    }
  }

  return cells;
}

function formatDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const STATUS_COLORS = {
  scheduled: '#3b82f6',
  completed: '#16a34a',
  cancelled: '#dc2626',
};

export default function Calendar() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    api.sessions.list().then(setSessions).catch(console.error);
  }, []);

  const sessionsByDate = useMemo(() => {
    const map = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const cells = useMemo(() => getMonthData(year, month), [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  };

  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate());
  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const selectedSessions = selectedDate ? (sessionsByDate[selectedDate] || []) : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Calendar</h1>
      </div>

      <div className="calendar-controls">
        <button className="btn btn-secondary" onClick={prevMonth}>&larr;</button>
        <h2 className="calendar-month-label">{monthLabel}</h2>
        <button className="btn btn-secondary" onClick={nextMonth}>&rarr;</button>
        <button className="btn btn-sm btn-primary" onClick={goToday}>Today</button>
      </div>

      <div className="calendar-grid">
        {DAYS.map((d) => (
          <div key={d} className="calendar-header-cell">{d}</div>
        ))}
        {cells.map((cell, i) => {
          const dateStr = cell.inMonth ? formatDate(year, month, cell.day) : null;
          const daySessions = dateStr ? (sessionsByDate[dateStr] || []) : [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <div
              key={i}
              className={
                'calendar-cell' +
                (!cell.inMonth ? ' calendar-cell-outside' : '') +
                (isToday ? ' calendar-cell-today' : '') +
                (isSelected ? ' calendar-cell-selected' : '')
              }
              onClick={() => dateStr && setSelectedDate(dateStr)}
            >
              <span className="calendar-day-number">{cell.day}</span>
              {daySessions.length > 0 && (
                <div className="calendar-dots">
                  {daySessions.slice(0, 3).map((s) => (
                    <span
                      key={s.id}
                      className="calendar-dot"
                      style={{ background: STATUS_COLORS[s.status] || '#6b7280' }}
                      title={`${s.start_time} ${s.tutor_name} - ${s.student_name}`}
                    />
                  ))}
                  {daySessions.length > 3 && (
                    <span className="calendar-dot-more">+{daySessions.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Day detail modal */}
      {selectedDate && (
        <Modal
          title={new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          onClose={() => setSelectedDate(null)}
        >
          {selectedSessions.length === 0 ? (
            <p className="empty-state" style={{ padding: '24px' }}>No sessions on this day.</p>
          ) : (
            <div className="day-sessions">
              {selectedSessions
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((s) => (
                  <div key={s.id} className="day-session-card">
                    <div className="day-session-time">
                      {s.start_time} - {s.end_time}
                    </div>
                    <div className="day-session-info">
                      <strong>{s.subject_name}</strong>
                      <div>Tutor: {s.tutor_name}</div>
                      <div>Student: {s.student_name}</div>
                    </div>
                    <span
                      className={`badge badge-${s.status}`}
                      style={{ alignSelf: 'flex-start' }}
                    >
                      {s.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

const express = require('express');
const cors = require('cors');
const path = require('path');

const tutorsRouter = require('./routes/tutors');
const studentsRouter = require('./routes/students');
const sessionsRouter = require('./routes/sessions');
const subjectsRouter = require('./routes/subjects');
const clientsRouter = require('./routes/clients');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/tutors', tutorsRouter);
app.use('/api/students', studentsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/dashboard', dashboardRouter);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

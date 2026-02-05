import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Tutors from './pages/Tutors';
import Students from './pages/Students';
import Sessions from './pages/Sessions';
import Calendar from './pages/Calendar';
import Subjects from './pages/Subjects';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/tutors" element={<Tutors />} />
        <Route path="/students" element={<Students />} />
        <Route path="/sessions" element={<Sessions />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/subjects" element={<Subjects />} />
      </Routes>
    </Layout>
  );
}

import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import DashboardHome from './components/Dashboard/DashboardHome';
import ClientList from './components/Clients/ClientList';
import ClientDetail from './components/Clients/ClientDetail';
import ClientForm from './components/Clients/ClientForm';
import MeetingList from './components/Meetings/MeetingList';
import MeetingDetail from './components/Meetings/MeetingDetail';
import LessonList from './components/Lessons/LessonList';
import LessonDetail from './components/Lessons/LessonDetail';
import GmailSetup from './components/Gmail/GmailSetup';
import WhatsAppSetup from './components/WhatsApp/WhatsAppSetup';
import SettingsPage from './components/Settings/SettingsPage';

export default function App() {
  return (
    <Routes>
      <Route path="/dashboard" element={<AppLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="clients" element={<ClientList />} />
        <Route path="clients/new" element={<ClientForm />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="clients/:id/edit" element={<ClientForm />} />
        <Route path="meetings" element={<MeetingList />} />
        <Route path="meetings/:id" element={<MeetingDetail />} />
        <Route path="lessons" element={<LessonList />} />
        <Route path="lessons/:id" element={<LessonDetail />} />
        <Route path="gmail" element={<GmailSetup />} />
        <Route path="whatsapp" element={<WhatsAppSetup />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

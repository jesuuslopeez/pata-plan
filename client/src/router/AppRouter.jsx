import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import { Login } from '../pages/Login/Login';
import { Register } from '../pages/Register/Register';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { Animals } from '../pages/Animals/Animals';
import { AnimalProfile } from '../pages/AnimalProfile/AnimalProfile';
import { Calendar } from '../pages/Calendar/Calendar';
import { Settings } from '../pages/Settings/Settings';

function Placeholder({ title }) {
  return <h1>{title}</h1>;
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/animals/:id" element={<AnimalProfile />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/protocols" element={<Placeholder title="Protocols" />} />
            <Route path="/expenses" element={<Placeholder title="Expenses" />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import { Login } from '../pages/Login/Login';
import { Register } from '../pages/Register/Register';
import { VerifyEmail } from '../pages/VerifyEmail/VerifyEmail';
import { ForgotPassword } from '../pages/ForgotPassword/ForgotPassword';
import { ResetPassword } from '../pages/ResetPassword/ResetPassword';
import { Dashboard } from '../pages/Dashboard/Dashboard';
import { Animals } from '../pages/Animals/Animals';
import { AnimalProfile } from '../pages/AnimalProfile/AnimalProfile';
import { Calendar } from '../pages/Calendar/Calendar';
import { Protocols } from '../pages/Protocols/Protocols';
import { ProtocolEditor } from '../pages/ProtocolEditor/ProtocolEditor';
import { Expenses } from '../pages/Expenses/Expenses';
import { Settings } from '../pages/Settings/Settings';
import { NotFound } from '../pages/NotFound/NotFound';

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
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/animals/:id" element={<AnimalProfile />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/protocols" element={<Protocols />} />
            <Route path="/protocols/new" element={<ProtocolEditor />} />
            <Route path="/protocols/:id/edit" element={<ProtocolEditor />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

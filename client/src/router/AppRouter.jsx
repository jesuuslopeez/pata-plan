import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from '../components/ProtectedRoute/ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';

const Landing = lazy(() =>
  import('../pages/Landing/Landing').then((m) => ({ default: m.Landing }))
);
const Login = lazy(() =>
  import('../pages/Login/Login').then((m) => ({ default: m.Login }))
);
const Register = lazy(() =>
  import('../pages/Register/Register').then((m) => ({ default: m.Register }))
);
const VerifyEmail = lazy(() =>
  import('../pages/VerifyEmail/VerifyEmail').then((m) => ({ default: m.VerifyEmail }))
);
const ForgotPassword = lazy(() =>
  import('../pages/ForgotPassword/ForgotPassword').then((m) => ({ default: m.ForgotPassword }))
);
const ResetPassword = lazy(() =>
  import('../pages/ResetPassword/ResetPassword').then((m) => ({ default: m.ResetPassword }))
);
const Dashboard = lazy(() =>
  import('../pages/Dashboard/Dashboard').then((m) => ({ default: m.Dashboard }))
);
const Animals = lazy(() =>
  import('../pages/Animals/Animals').then((m) => ({ default: m.Animals }))
);
const AnimalProfile = lazy(() =>
  import('../pages/AnimalProfile/AnimalProfile').then((m) => ({ default: m.AnimalProfile }))
);
const Calendar = lazy(() =>
  import('../pages/Calendar/Calendar').then((m) => ({ default: m.Calendar }))
);
const Protocols = lazy(() =>
  import('../pages/Protocols/Protocols').then((m) => ({ default: m.Protocols }))
);
const ProtocolEditor = lazy(() =>
  import('../pages/ProtocolEditor/ProtocolEditor').then((m) => ({ default: m.ProtocolEditor }))
);
const Expenses = lazy(() =>
  import('../pages/Expenses/Expenses').then((m) => ({ default: m.Expenses }))
);
const Settings = lazy(() =>
  import('../pages/Settings/Settings').then((m) => ({ default: m.Settings }))
);
const NotFound = lazy(() =>
  import('../pages/NotFound/NotFound').then((m) => ({ default: m.NotFound }))
);

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-live="polite">
      <div className="route-fallback__spinner" aria-hidden="true" />
      <span className="sr-only">Cargando…</span>
    </div>
  );
}

function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <MainLayout />
    </ProtectedRoute>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function HomeGate() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-screen__spinner" />
        <p>Cargando...</p>
      </div>
    );
  }
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomeGate />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
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
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';

function Placeholder({ title }) {
  return <h1>{title}</h1>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Placeholder title="Login" />} />
        </Route>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Placeholder title="Dashboard" />} />
          <Route path="/animals" element={<Placeholder title="Animals" />} />
          <Route path="/animals/:id" element={<Placeholder title="Animal Detail" />} />
          <Route path="/calendar" element={<Placeholder title="Calendar" />} />
          <Route path="/protocols" element={<Placeholder title="Protocols" />} />
          <Route path="/expenses" element={<Placeholder title="Expenses" />} />
          <Route path="/settings" element={<Placeholder title="Settings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Header } from '../components/Header/Header';
import './MainLayout.scss';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="main-layout">
      <a className="skip-link" href="#main-content">
        Saltar al contenido principal
      </a>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-layout__content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main id="main-content" className="main-layout__main" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

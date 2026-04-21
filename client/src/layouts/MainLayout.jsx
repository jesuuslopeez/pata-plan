import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar/Sidebar';
import { Header } from '../components/Header/Header';
import './MainLayout.scss';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="main-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-layout__content">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-layout__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

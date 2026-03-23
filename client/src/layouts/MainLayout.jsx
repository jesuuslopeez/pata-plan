import { Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div className="main-layout">
      <aside className="main-layout__sidebar">
        <div className="main-layout__logo">PataPlan</div>
        <nav className="main-layout__nav">
          <a href="/">Dashboard</a>
          <a href="/animals">Animals</a>
          <a href="/calendar">Calendar</a>
          <a href="/protocols">Protocols</a>
          <a href="/expenses">Expenses</a>
          <a href="/settings">Settings</a>
        </nav>
      </aside>
      <main className="main-layout__content">
        <Outlet />
      </main>
    </div>
  );
}

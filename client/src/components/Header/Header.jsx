import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, AlertTriangle, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getDashboard } from '../../services/dashboard.service';
import './Header.scss';

const REFRESH_INTERVAL_MS = 30000;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días,';
  if (hour < 20) return 'Buenas tardes,';
  return 'Buenas noches,';
}

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getFirstName(name) {
  if (!name) return 'Usuario';
  return name.split(' ')[0];
}

export function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [counts, setCounts] = useState({ overdue: 0, pending: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const loadCounts = useCallback(() => {
    getDashboard()
      .then((res) => {
        setCounts({
          overdue: res.data.summary?.overdueEventsCount || 0,
          pending: res.data.summary?.pendingEventsCount || 0,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadCounts();
  }, [loadCounts, location.pathname]);

  useEffect(() => {
    const interval = setInterval(loadCounts, REFRESH_INTERVAL_MS);
    const onVisible = () => {
      if (!document.hidden) loadCounts();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', loadCounts);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', loadCounts);
    };
  }, [loadCounts]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleAccount = () => {
    setMenuOpen(false);
    navigate('/settings');
  };

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
  };

  return (
    <header className="header" role="banner">
      <button
        className="header__menu"
        onClick={onMenuClick}
        type="button"
        aria-label="Abrir menú"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="header__greeting">
        <span className="header__greeting-text">{getGreeting()}</span>
        <span className="header__greeting-name">{getFirstName(user?.name)}</span>
      </div>

      <div className="header__actions">
        <div
          className="header__badge"
          role="status"
          aria-label={`${counts.overdue} vencidos y ${counts.pending} pendientes`}
          title={`${counts.overdue} vencidos · ${counts.pending} pendientes`}
        >
          <AlertTriangle className="header__badge-icon" size={16} aria-hidden="true" />
          <span className="header__badge-overdue">
            {counts.overdue}
            <span className="header__badge-label"> vencidos</span>
          </span>
          <span className="header__badge-separator" aria-hidden="true">|</span>
          <span className="header__badge-pending">
            {counts.pending}
            <span className="header__badge-label"> pendientes</span>
          </span>
        </div>
        <div className="header__user-menu" ref={menuRef}>
          <button
            type="button"
            className="header__avatar"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Abrir menú de usuario"
          >
            <span aria-hidden="true">{getInitials(user?.name)}</span>
          </button>

          {menuOpen && (
            <div className="header__dropdown" role="menu">
              <div className="header__dropdown-header">
                <span className="header__dropdown-name">{user?.name}</span>
                <span className="header__dropdown-email">{user?.email}</span>
              </div>
              <button
                type="button"
                className="header__dropdown-item"
                onClick={handleAccount}
                role="menuitem"
              >
                <UserCircle size={16} aria-hidden="true" />
                <span>Mi cuenta</span>
              </button>
              <button
                type="button"
                className="header__dropdown-item header__dropdown-item--danger"
                onClick={handleLogout}
                role="menuitem"
              >
                <LogOut size={16} aria-hidden="true" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

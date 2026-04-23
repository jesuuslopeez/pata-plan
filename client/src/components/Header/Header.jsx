import { useEffect, useState } from 'react';
import { Menu, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getDashboard } from '../../services/dashboard.service';
import './Header.scss';

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
  const { user } = useAuth();
  const [counts, setCounts] = useState({ overdue: 0, pending: 0 });

  useEffect(() => {
    getDashboard()
      .then((res) => {
        setCounts({
          overdue: res.data.summary?.overdueEventsCount || 0,
          pending: res.data.summary?.pendingEventsCount || 0,
        });
      })
      .catch(() => {});
  }, []);

  return (
    <header className="header">
      <button className="header__menu" onClick={onMenuClick} type="button">
        <Menu size={20} />
      </button>

      <div className="header__greeting">
        <span className="header__greeting-text">{getGreeting()}</span>
        <span className="header__greeting-name">{getFirstName(user?.name)}</span>
      </div>

      <div className="header__actions">
        <div className="header__badge">
          <AlertTriangle className="header__badge-icon" size={16} />
          <span className="header__badge-overdue">{counts.overdue} vencidos</span>
          <span className="header__badge-separator">|</span>
          <span className="header__badge-pending">{counts.pending} pendientes</span>
        </div>
        <div className="header__avatar">{getInitials(user?.name)}</div>
      </div>
    </header>
  );
}

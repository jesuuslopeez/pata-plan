import { Menu, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
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

export function Header({ onMenuClick }) {
  const { user } = useAuth();
  const userName = user?.name || 'Usuario';

  return (
    <header className="header">
      <button className="header__menu" onClick={onMenuClick} type="button">
        <Menu size={20} />
      </button>

      <div className="header__greeting">
        <span className="header__greeting-text">{getGreeting()}</span>
        <span className="header__greeting-name">{userName}</span>
      </div>

      <div className="header__actions">
        <div className="header__badge">
          <AlertTriangle size={16} />
        </div>
        <div className="header__avatar">{getInitials(userName)}</div>
      </div>
    </header>
  );
}

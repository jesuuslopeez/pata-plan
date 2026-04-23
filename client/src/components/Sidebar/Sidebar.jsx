import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  PawPrint,
  Calendar,
  ClipboardList,
  Wallet,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { NavItem } from './NavItem';
import './Sidebar.scss';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Panel' },
  { to: '/animals', icon: PawPrint, label: 'Animales' },
  { to: '/calendar', icon: Calendar, label: 'Calendario' },
  { to: '/protocols', icon: ClipboardList, label: 'Protocolos' },
  { to: '/expenses', icon: Wallet, label: 'Gastos' },
];

export function Sidebar({ isOpen, onClose }) {
  const { logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [location.pathname]);

  return (
    <>
      {isOpen && <div className="sidebar__overlay" onClick={onClose} />}
      <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar__header">
          <div className="sidebar__brand">
            <img className="sidebar__logo" src="/pataplan.png" alt="PataPlan" />
          </div>
          <button className="sidebar__close" onClick={onClose} type="button">
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <NavItem key={item.to} {...item} />
          ))}
        </nav>

        <div className="sidebar__footer">
          <NavItem to="/settings" icon={Settings} label="Ajustes" className="sidebar__item--secondary" />
          <NavItem icon={LogOut} label="Cerrar sesión" onClick={logout} className="sidebar__item--secondary" />
        </div>
      </aside>
    </>
  );
}

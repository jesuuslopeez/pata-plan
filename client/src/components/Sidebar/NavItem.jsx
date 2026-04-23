import { NavLink } from 'react-router-dom';

export function NavItem({ to, icon: Icon, label, onClick, className }) {
  if (onClick) {
    return (
      <button className={`sidebar__item ${className || ''}`} onClick={onClick} type="button">
        <Icon className="sidebar__icon" size={16} />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `sidebar__item ${isActive ? 'sidebar__item--active' : ''} ${className || ''}`
      }
    >
      <Icon className="sidebar__icon" size={16} />
      <span>{label}</span>
    </NavLink>
  );
}

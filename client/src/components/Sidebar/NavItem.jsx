import { NavLink } from 'react-router-dom';

export function NavItem({ to, icon: Icon, label, onClick, className }) {
  if (onClick) {
    return (
      <li>
        <button className={`sidebar__item ${className || ''}`} onClick={onClick} type="button">
          <Icon className="sidebar__icon" size={16} aria-hidden="true" />
          <span>{label}</span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <NavLink
        to={to}
        className={({ isActive }) =>
          `sidebar__item ${isActive ? 'sidebar__item--active' : ''} ${className || ''}`
        }
      >
        <Icon className="sidebar__icon" size={16} aria-hidden="true" />
        <span>{label}</span>
      </NavLink>
    </li>
  );
}

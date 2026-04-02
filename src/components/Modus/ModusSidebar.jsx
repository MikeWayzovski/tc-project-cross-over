import React from 'react';
import ModusIcon from './ModusIcon';
import styles from './ModusSidebar.module.css'; 

const ModusSidebar = ({ isOpen, activePage, onPageChange }) => {
  // FIX: NavItems netjes hier gedefinieerd zodat de sidebar de juiste lijst toont
  const navItems = [
    { id: 'projects', label: 'Projecten', icon: 'folder-simple' },
    { id: 'users', label: 'Gebruikers', icon: 'users' },
    { id: 'groups', label: 'Groepen', icon: 'users-four' },
    { id: 'settings', label: 'Instellingen', icon: 'gear' }
  ];

  return (
    <nav className={`modus-sidebar ${styles.sidebarBase} ${!isOpen ? styles.sidebarClosed : ''}`}>
      <ul className="nav flex-column">
        
        {navItems.map((item) => (
          <li className="nav-item" key={item.id}>
            <a 
              href="#" 
              className={`nav-link ${activePage === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onPageChange(item.id);
              }}
            >
              <ModusIcon name={item.icon} type="duotone" extraClasses="left-nav-icon" />
              <span>{item.label}</span>
            </a>
          </li>
        ))}

      </ul>
    </nav>
  );
};

export default ModusSidebar;
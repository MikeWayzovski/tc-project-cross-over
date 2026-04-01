import React from 'react';
import ModusIcon from './ModusIcon';
// Hier is de magie: we importeren de CSS speciaal voor dit component!
import styles from './ModusSidebar.module.css'; 

const ModusSidebar = ({ isOpen, activePage, onPageChange }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: 'house' },
    { id: 'users', label: 'Gebruikers', icon: 'users' },
    { id: 'settings', label: 'Instellingen', icon: 'gear' }
  ];

  return (
    // We combineren de standaard modus-sidebar, onze eigen base class (voor de animatie), 
    // en conditioneel de closed class.
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
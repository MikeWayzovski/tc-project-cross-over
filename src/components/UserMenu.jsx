import React, { useEffect, useState } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react';
import ModusIconButton from './ModusIconButton';
import ModusIcon from './ModusIcon';
import AuthImage from './AuthImage';

const UserMenu = () => {
  // Haal de benodigde functies uit de Trimble ID SDK [cite: 1550, 1557, 1568, 1581]
  const { isAuthenticated, loginWithRedirect, logout, getAccessTokenSilently } = useAuth();
  
  // State om de gegevens van Trimble Connect in op te slaan
  const [connectUser, setConnectUser] = useState(null);

  useEffect(() => {
    // Zodra de gebruiker is ingelogd, halen we de gegevens op
    if (isAuthenticated) {
      const fetchConnectUser = async () => {
        try {
          // 1. Haal de token op [cite: 1581, 1583]
          const token = await getAccessTokenSilently();
          
          // 2. Roep de Trimble Connect API aan [cite: 4544, 4549]
          const response = await fetch('https://app.connect.trimble.com/tc/api/2.0/users/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setConnectUser(data);
          }
        } catch (error) {
          console.error("Fout bij ophalen gebruiker:", error);
        }
      };

      fetchConnectUser();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  // SCENARIO 1: NIET INGELOGD
  if (!isAuthenticated) {
    return (
      <ModusIconButton 
        icon="person" 
        type="duotone"
        onClick={() => loginWithRedirect()} // Start het inlogproces
        ariaLabel="Inloggen" 
        tooltip="Inloggen bij Trimble"
        extraClasses="text-white"
      />
    );
  }

  // SCENARIO 2: WEL INGELOGD (Toon de Dropdown)
  return (
    <div className="dropdown">
      {/* De knop die de dropdown opent. data-bs-toggle is de Bootstrap magie! */}
      <button 
        className="btn btn-icon-only text-white d-flex justify-content-center align-items-center" 
        data-bs-toggle="dropdown" 
        aria-expanded="false"
      >
        {/* Laat de avatar zien als die er is, anders een standaard icoontje */}
        {connectUser?.thumbnail ? (
          <AuthImage 
            src={connectUser.thumbnail} 
            alt="Avatar" 
            style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} 
            fallbackNode={<ModusIcon name="person" type="duotone" size="24px" />}
          />
        ) : (
          <ModusIcon name="person" type="duotone" size="24px" />
        )}
        
      </button>

      {/* Het menu dat uitklapt. dropdown-menu-end zorgt dat hij rechts uitlijnt */}
      <ul className="dropdown-menu dropdown-menu-end shadow-sm" style={{ minWidth: '240px' }}>
        
        {/* Gebruikersinfo */}
        <li className="px-3 py-2 text-center bg-light">
          {connectUser?.thumbnail && (
            <div className="mb-2 d-flex justify-content-center">
              <AuthImage 
                src={connectUser.thumbnail} 
                alt="Avatar" 
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            </div>
          )}
          <div className="fw-bold">{connectUser?.firstName} {connectUser?.lastName}</div>
          <div className="text-muted small">{connectUser?.email}</div>
        </li>
        
        <li><hr className="dropdown-divider" /></li>
        
        {/* Menu items conform jouw afbeelding */}
        <li>
          <a className="dropdown-item d-flex align-items-center" href="https://myprofile.trimble.com" target="_blank" rel="noreferrer">
            <ModusIcon name="user" type="duotone" size="18px" extraClasses="me-2 text-primary" />
            Trimble profiel
            <ModusIcon name="link-simple" type="duotone" size="16px" extraClasses="ms-auto text-muted" />
          </a>
        </li>
        <li>
          <button className="dropdown-item d-flex align-items-center">
            <ModusIcon name="gear" type="duotone" size="18px" extraClasses="me-2 text-primary" />
            Applicatie voorkeuren
          </button>
        </li>
        
        <li><hr className="dropdown-divider" /></li>
        
        {/* Uitloggen [cite: 1568, 1569] */}
        <li>
          <button className="dropdown-item d-flex align-items-center" onClick={() => logout()}>
            <ModusIcon name="sign-out" type="duotone" size="18px" extraClasses="me-2 text-primary" />
            Uitloggen
          </button>
        </li>
      </ul>
    </div>
  );
};

export default UserMenu;
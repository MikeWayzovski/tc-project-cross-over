import React, { useState } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react';
import ModusIcon from '../Modus/ModusIcon';
import { getGroupUsers } from '../../api/groupsApi';
import { Logger } from '../../utils/logger';
import { readStoredToken } from '../../utils/accessToken';

const GroupCanvas = ({ groups, isLoading, region }) => {
  const { getAccessTokenSilently } = useAuth();
  
  // -- STATE VOOR LAZY LOADING --
  const [expandedGroups, setExpandedGroups] = useState({}); // Welke zijn opengeklapt?
  const [groupMembers, setGroupMembers] = useState({});     // Opgeslagen leden per groep
  const [loadingMembers, setLoadingMembers] = useState({}); // Draait het wieltje voor deze groep?

  if (isLoading && groups.length === 0) return null;

  // Groepeer de data per project voor de visualisatie
  const groupedByProject = groups.reduce((acc, group) => {
    if (!acc[group.projectName]) acc[group.projectName] = [];
    acc[group.projectName].push(group);
    return acc;
  }, {});

  const handleToggleGroup = async (groupId) => {
    const isExpanded = !!expandedGroups[groupId];
    
    // Toggle de UI direct voor snelle feedback
    setExpandedGroups(prev => ({ ...prev, [groupId]: !isExpanded }));

    // Als we hem openklappen én we hebben de data nog niet in de lokale cache, fetch het!
    if (!isExpanded && !groupMembers[groupId]) {
      setLoadingMembers(prev => ({ ...prev, [groupId]: true }));
      try {
        const token = await readStoredToken(getAccessTokenSilently);
        if (!token) throw new Error('Geen geldig token beschikbaar.');
        const users = await getGroupUsers(token, region, groupId);
        
        // Sorteer de gevonden leden netjes op voornaam (A-Z)
        const sortedUsers = (users || []).sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
        
        setGroupMembers(prev => ({ ...prev, [groupId]: sortedUsers }));
      } catch (error) {
        Logger.error(`Fout bij ophalen leden voor groep ${groupId}:`, error);
        setGroupMembers(prev => ({ ...prev, [groupId]: [] }));
      } finally {
        setLoadingMembers(prev => ({ ...prev, [groupId]: false }));
      }
    }
  };

  return (
    <div className="group-canvas p-2">
      <div className="row g-4">
        {Object.entries(groupedByProject).map(([projectName, projectGroups]) => (
          <div key={projectName} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border-0 border-start border-primary border-4">
              <div className="card-header bg-white border-0 pb-0 pt-3">
                <h6 className="text-primary mb-0 d-flex align-items-center">
                  <ModusIcon name="folder-simple" type="duotone" size="20px" extraClasses="me-2" />
                  {projectName}
                </h6>
              </div>
              <div className="card-body">
                <div className="d-flex flex-column gap-2">
                  
                  {projectGroups.map(group => {
                    const isExpanded = expandedGroups[group.id];
                    const isLoadingMembers = loadingMembers[group.id];
                    const members = groupMembers[group.id];

                    return (
                      <div key={group.id} className="bg-light rounded border border-secondary border-opacity-10 overflow-hidden shadow-sm">
                        
                        {/* KLIKBARE HEADER VAN DE GROEP */}
                        <div 
                          className="d-flex align-items-center justify-content-between p-2"
                          style={{ cursor: 'pointer', transition: 'background-color 0.2s' }}
                          onClick={() => handleToggleGroup(group.id)}
                          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#e9ecef'}
                          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <div className="d-flex align-items-center">
                            <ModusIcon 
                              name={isExpanded ? 'chevron-down' : 'chevron-right'} 
                              size="16px" 
                              extraClasses="text-muted me-2" 
                            />
                            <ModusIcon name="users-four" type="duotone" size="18px" extraClasses="text-muted me-2" />
                            <span className="fw-bold small">{group.name}</span>
                          </div>
                          <span className={`badge rounded-pill small ${group.usersCount === 0 ? 'bg-secondary' : 'bg-info text-dark'}`}>
                            {group.usersCount} {group.usersCount === 1 ? 'lid' : 'leden'}
                          </span>
                        </div>

                        {/* UITKLAPGEDEELTE MET DE LEDEN */}
                        {isExpanded && (
                          <div className="bg-white border-top border-secondary border-opacity-10 p-2" style={{ fontSize: '0.85rem' }}>
                            {isLoadingMembers ? (
                              <div className="d-flex align-items-center justify-content-center p-3 text-muted">
                                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                <span className="fst-italic">Leden ophalen...</span>
                              </div>
                            ) : members && members.length > 0 ? (
                              <div className="d-flex flex-column gap-1">
                                {members.map(user => (
                                  <div key={user.id} className="d-flex align-items-center p-1 border-bottom border-light">
                                    <div 
                                      className="bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center text-white me-2 flex-shrink-0" 
                                      style={{ width: '24px', height: '24px', fontSize: '0.65rem', fontWeight: 'bold' }}
                                    >
                                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                    </div>
                                    <div className="text-truncate">
                                      <span className="fw-semibold me-1 text-dark">{user.firstName} {user.lastName}</span>
                                      <span className="text-muted small">({user.email})</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center text-muted p-2 fst-italic">
                                Geen leden gevonden in deze groep.
                              </div>
                            )}
                          </div>
                        )}
                        
                      </div>
                    );
                  })}

                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupCanvas;
import React, { useState, useEffect } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react';
import ModusIcon from '../Modus/ModusIcon';
import AuthImage from '../Shared/AuthImage';
import { getProjectDetails } from '../../api/projectsApi';
import { getProjectGroups } from '../../api/groupsApi';
import { getMyProjectRole, getProjectUsers } from '../../api/usersApi';

// Helper om bytes om te rekenen naar MB/GB
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ProjectDetails = ({ project, region, onBack }) => {
  const { getAccessTokenSilently } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActivePage] = useState('overview');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        const token = await getAccessTokenSilently();
        
        // Haal alles PARALLEL op voor maximale snelheid!
        const [fullDetails, roleData, usersData, groupsData] = await Promise.all([
          getProjectDetails(token, region, project.id),
          getMyProjectRole(token, region, project.id),
          getProjectUsers(token, region, project.id),
          getProjectGroups(token, region, project.id)
        ]);

        setDetails(fullDetails || project); // Fallback naar minimal project
        setMyRole(roleData);
        setUsers(usersData);
        setGroups(groupsData);

      } catch (error) {
        console.error("Fout tijdens laden project details", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [project.id, region, getAccessTokenSilently]);

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
        <h5 className="mt-3 text-muted">Projectdata ophalen...</h5>
      </div>
    );
  }

  // Bepaal of de gebruiker beheerder is en/of is uitgenodigd
  const isAdmin = myRole?.role === 'ADMIN';
  const isOwner = details?.createdBy?.email === myRole?.email;

  return (
    <div className="project-details">
      {/* Terug knop */}
      <button className="btn btn-link p-0 mb-3 text-decoration-none d-flex align-items-center" onClick={onBack}>
        <ModusIcon name="arrow-left" type="duotone" size="16px" extraClasses="me-1" />
        Terug naar overzicht
      </button>

      {/* Header sectie */}
      <div className="d-flex align-items-start mb-4 bg-white p-4 rounded border shadow-sm">
        <AuthImage 
          src={details?.thumbnail} 
          style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }}
          fallbackNode={<ModusIcon name="hard-hat" type="duotone" size="80px" extraClasses="text-secondary opacity-50" />}
        />
        <div className="ms-4 flex-grow-1">
          <div className="d-flex align-items-center">
            <h2 className="mb-0 me-3">{details?.name}</h2>
            {isAdmin ? (
              <span className="badge bg-primary text-white">Beheerder</span>
            ) : (
              <span className="badge bg-secondary text-white">Lid</span>
            )}
            {!isOwner && (
              <span className="badge bg-info text-dark ms-2">Uitgenodigd door {details?.createdBy?.firstName}</span>
            )}
          </div>
          <p className="text-muted mt-2 mb-0">Project ID: {details?.id} • Regio: {region}</p>
        </div>
      </div>

      {/* Navigatie Tabs (Modus Navs) */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'overview' ? 'active fw-bold' : 'text-muted'}`} href="#" onClick={(e) => { e.preventDefault(); setActivePage('overview'); }}>Overzicht</a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'users' ? 'active fw-bold' : 'text-muted'}`} href="#" onClick={(e) => { e.preventDefault(); setActivePage('users'); }}>
            Teamleden <span className="badge bg-secondary ms-1">{users.length}</span>
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'groups' ? 'active fw-bold' : 'text-muted'}`} href="#" onClick={(e) => { e.preventDefault(); setActivePage('groups'); }}>
            Groepen <span className="badge bg-secondary ms-1">{groups.length}</span>
          </a>
        </li>
      </ul>

      {/* Content per Tab */}
      {activeTab === 'overview' && (
        <div className="row g-3">
          {/* Stats Cards */}
          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-white">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-1">Grootte</h6>
                <h3>{formatBytes(details?.size || 0)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-white">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-1">Mappen</h6>
                <h3>{details?.foldersCount || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-white">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-1">Bestanden</h6>
                <h3>{details?.filesCount || 0}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-white">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-1">Gemaakt Op</h6>
                <h5>{new Date(details?.createdOn).toLocaleDateString('nl-NL')}</h5>
              </div>
            </div>
          </div>
          
          <div className="col-12 mt-4">
            <h5>Beschrijving</h5>
            <p className="text-muted">{details?.description || "Geen beschrijving beschikbaar voor dit project."}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white p-3 rounded border shadow-sm">
          <h5>Gebruikers in dit project</h5>
          {/* Hier kun je later een tabel van maken! */}
          <ul className="list-group list-group-flush mt-3">
            {users.map(u => (
              <li key={u.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>{u.firstName} {u.lastName}</strong> <span className="text-muted ms-2">{u.email}</span>
                </div>
                <span className={`badge ${u.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}`}>{u.role}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTab === 'groups' && (
        <div className="bg-white p-3 rounded border shadow-sm">
          <h5>Groepen in dit project</h5>
          <ul className="list-group list-group-flush mt-3">
            {groups.map(g => (
              <li key={g.id} className="list-group-item d-flex justify-content-between align-items-center">
                <strong>{g.name}</strong>
                <span className="badge bg-info text-dark">{g.usersCount || 0} leden</span>
              </li>
            ))}
            {groups.length === 0 && <li className="list-group-item text-muted">Geen groepen gevonden.</li>}
          </ul>
        </div>
      )}

    </div>
  );
};

export default ProjectDetails;
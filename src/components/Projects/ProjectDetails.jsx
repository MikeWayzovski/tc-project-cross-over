import React, { useState, useEffect, useCallback } from 'react';
import ModusIcon from '../Modus/ModusIcon';
import AuthImage from '../Shared/AuthImage';
import { getProjectDetails } from '../../api/projectsApi';
import { getProjectGroups } from '../../api/groupsApi';
import { getMyProjectRole, getProjectUsers } from '../../api/usersApi';
import { Logger } from '../../utils/logger';
import { isTokenUnavailable } from '../../utils/accessToken';

// Helper om bytes om te rekenen naar MB/GB
const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

// Ontbrekende waarden tonen we als streepje: een harde 0 suggereert een leeg project.
const orUnknown = (value, render = (v) => v) =>
  value === null || value === undefined ? '—' : render(value);

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('nl-NL');
};

const ProjectDetails = ({ project, region, getValidToken, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [details, setDetails] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [sideLoadFailed, setSideLoadFailed] = useState(false);
  const [activeTab, setActivePage] = useState('overview');

  const loadProjectData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSideLoadFailed(false);

    try {
      const token = await getValidToken();

      // De kerngegevens bepalen of de pagina zinvol is; de rest mag stilletjes falen.
      const [detailsResult, roleResult, usersResult, groupsResult] = await Promise.allSettled([
        getProjectDetails(token, region, project.id),
        getMyProjectRole(token, region, project.id),
        getProjectUsers(token, region, project.id),
        getProjectGroups(token, region, project.id),
      ]);

      if (detailsResult.status === 'rejected') {
        throw detailsResult.reason;
      }

      setDetails(detailsResult.value);
      setMyRole(roleResult.status === 'fulfilled' ? roleResult.value : null);
      setUsers(usersResult.status === 'fulfilled' ? usersResult.value || [] : []);
      setGroups(groupsResult.status === 'fulfilled' ? groupsResult.value || [] : []);
      setSideLoadFailed(
        [roleResult, usersResult, groupsResult].some((result) => result.status === 'rejected'),
      );
    } catch (err) {
      Logger.error('Fout tijdens laden project details', err.message || err);
      setDetails(null);
      setError(
        isTokenUnavailable(err)
          ? 'Log in om de projectinformatie te bekijken.'
          : err.message || 'Onbekende fout bij het ophalen van dit project.',
      );
    } finally {
      setLoading(false);
    }
  }, [project.id, region, getValidToken]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  const backButton = (
    <button type="button" className="btn btn-link p-0 mb-3 text-decoration-none d-flex align-items-center" onClick={onBack}>
      <ModusIcon name="arrow-left" type="duotone" size="16px" extraClasses="me-1" />
      Terug naar overzicht
    </button>
  );

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center mt-5">
        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">Bezig met laden</span>
        </div>
        <h5 className="mt-3 text-muted">Projectdata ophalen...</h5>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-details">
        {backButton}
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <ModusIcon name="warning-circle" type="duotone" size="48px" extraClasses="text-danger mb-3" />
            <h5>Projectinformatie kon niet worden geladen</h5>
            <p className="text-muted mb-1">{error}</p>
            <p className="text-muted small mb-4">
              Project {project.name} · regio {region}
            </p>
            <button type="button" className="btn btn-primary d-inline-flex align-items-center" onClick={loadProjectData}>
              <ModusIcon name="arrow-clockwise" type="duotone" size="18px" extraClasses="me-2" />
              Opnieuw proberen
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Bepaal of de gebruiker beheerder is en/of is uitgenodigd
  const isAdmin = myRole?.role === 'ADMIN';
  const isOwner = details?.createdBy?.email === myRole?.email;

  return (
    <div className="project-details">
      {backButton}

      {sideLoadFailed && (
        <div className="alert alert-warning d-flex align-items-center" role="alert">
          <ModusIcon name="warning-circle" type="duotone" size="20px" extraClasses="me-2 flex-shrink-0" />
          <span>Niet alles kon worden opgehaald. Je rol, teamleden of groepen zijn mogelijk onvolledig.</span>
        </div>
      )}

      {/* Header sectie */}
      <div className="d-flex align-items-start mb-4 bg-white p-4 rounded border shadow-sm">
        <AuthImage
          src={details?.thumbnail}
          alt=""
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
            {!isOwner && details?.createdBy?.firstName && (
              <span className="badge bg-info text-dark ms-2">Uitgenodigd door {details.createdBy.firstName}</span>
            )}
          </div>
          <p className="text-muted mt-2 mb-0">Project ID: {details?.id} • Regio: {region}</p>
        </div>
      </div>

      {/* Navigatie Tabs (Modus Navs) */}
      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button type="button" className={`nav-link ${activeTab === 'overview' ? 'active fw-bold' : 'text-muted'}`} onClick={() => setActivePage('overview')}>Overzicht</button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${activeTab === 'users' ? 'active fw-bold' : 'text-muted'}`} onClick={() => setActivePage('users')}>
            Teamleden <span className="badge bg-secondary ms-1">{users.length}</span>
          </button>
        </li>
        <li className="nav-item">
          <button type="button" className={`nav-link ${activeTab === 'groups' ? 'active fw-bold' : 'text-muted'}`} onClick={() => setActivePage('groups')}>
            Groepen <span className="badge bg-secondary ms-1">{groups.length}</span>
          </button>
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
                <h3>{orUnknown(details?.size, formatBytes)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-white">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-1">Mappen</h6>
                <h3>{orUnknown(details?.foldersCount)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-white">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-1">Bestanden</h6>
                <h3>{orUnknown(details?.filesCount)}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-3">
            <div className="card border-0 shadow-sm bg-white">
              <div className="card-body">
                <h6 className="text-muted text-uppercase mb-1">Gemaakt op</h6>
                <h5>{formatDate(details?.createdOn)}</h5>
              </div>
            </div>
          </div>

          <div className="col-12 mt-4">
            <h5>Beschrijving</h5>
            <p className="text-muted">{details?.description || 'Geen beschrijving beschikbaar voor dit project.'}</p>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white p-3 rounded border shadow-sm">
          <h5>Gebruikers in dit project</h5>
          <ul className="list-group list-group-flush mt-3">
            {users.map(u => (
              <li key={u.id} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <strong>{u.firstName} {u.lastName}</strong> <span className="text-muted ms-2">{u.email}</span>
                </div>
                <span className={`badge ${u.role === 'ADMIN' ? 'bg-primary' : 'bg-secondary'}`}>{u.role}</span>
              </li>
            ))}
            {users.length === 0 && <li className="list-group-item text-muted">Geen gebruikers gevonden.</li>}
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

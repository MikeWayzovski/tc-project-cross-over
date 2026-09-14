import React, { useMemo, useState } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react';
import ModusIcon from '../Modus/ModusIcon';
import CopyableText from '../Modus/CopyableText';
import { getGroupUsers } from '../../api/groupsApi';
import { Logger } from '../../utils/logger';
import { readStoredToken } from '../../utils/accessToken';

const projectKey = (group) =>
  group.projectId || group.project?.id || group.projectName || 'unknown';

const projectTitle = (group) =>
  group.projectName || group.project?.name || 'Naamloos project';

const GroupCanvas = ({ groups, isLoading, region }) => {
  const { getAccessTokenSilently } = useAuth();

  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupMembers, setGroupMembers] = useState({});
  const [loadingMembers, setLoadingMembers] = useState({});

  const projects = useMemo(() => {
    const byProject = new Map();

    (groups || []).forEach((group) => {
      const id = projectKey(group);
      if (!byProject.has(id)) {
        byProject.set(id, { id, name: projectTitle(group), groups: [] });
      }
      byProject.get(id).groups.push(group);
    });

    return [...byProject.values()]
      .sort((a, b) => a.name.localeCompare(b.name, 'nl'))
      .map((project) => ({
        ...project,
        groups: [...project.groups].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'nl')),
      }));
  }, [groups]);

  if (isLoading && projects.length === 0) return null;

  if (!isLoading && projects.length === 0) {
    return (
      <div className="text-center text-muted py-5">
        <ModusIcon name="users-four" type="duotone" size="48px" extraClasses="mb-3 opacity-50" />
        <p className="mb-0">Geen groepen gevonden in deze regio.</p>
      </div>
    );
  }

  const handleToggleGroup = async (groupId) => {
    const isExpanded = !!expandedGroups[groupId];
    setExpandedGroups((prev) => ({ ...prev, [groupId]: !isExpanded }));

    if (!isExpanded && !groupMembers[groupId]) {
      setLoadingMembers((prev) => ({ ...prev, [groupId]: true }));
      try {
        const token = await readStoredToken(getAccessTokenSilently);
        if (!token) throw new Error('Geen geldig token beschikbaar.');
        const users = await getGroupUsers(token, region, groupId);
        const sortedUsers = (users || []).sort((a, b) =>
          (a.firstName || '').localeCompare(b.firstName || ''),
        );
        setGroupMembers((prev) => ({ ...prev, [groupId]: sortedUsers }));
      } catch (error) {
        Logger.error(`Fout bij ophalen leden voor groep ${groupId}:`, error);
        setGroupMembers((prev) => ({ ...prev, [groupId]: [] }));
      } finally {
        setLoadingMembers((prev) => ({ ...prev, [groupId]: false }));
      }
    }
  };

  return (
    <div className="group-canvas">
      <div className="row g-3">
        {projects.map((project) => (
          <div key={project.id} className="col-md-6 col-lg-4">
            <div className="card h-100 shadow-sm border">
              <div className="card-header bg-transparent d-flex align-items-center gap-2">
                <ModusIcon
                  name="hard-hat"
                  type="duotone"
                  size="20px"
                  extraClasses="text-primary flex-shrink-0"
                  title="Project"
                />
                <h2 className="h6 mb-0 text-truncate" title={project.name}>
                  {project.name}
                </h2>
                <span className="badge bg-light text-muted ms-auto flex-shrink-0">
                  {project.groups.length}
                </span>
              </div>

              <div className="list-group list-group-flush">
                {project.groups.map((group) => {
                  const isExpanded = expandedGroups[group.id];
                  const isLoadingMembers = loadingMembers[group.id];
                  const members = groupMembers[group.id];
                  const panelId = `group-members-${group.id}`;

                  return (
                    <div key={group.id}>
                      <button
                        type="button"
                        className="list-group-item list-group-item-action d-flex align-items-center gap-2"
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        onClick={() => handleToggleGroup(group.id)}
                      >
                        <ModusIcon
                          name={isExpanded ? 'caret-down' : 'caret-right'}
                          type="duotone"
                          size="14px"
                          extraClasses="text-muted flex-shrink-0"
                        />
                        <ModusIcon
                          name="users-four"
                          type="duotone"
                          size="18px"
                          extraClasses="text-muted flex-shrink-0"
                        />
                        <span className="fw-semibold small text-truncate">{group.name}</span>
                        <span className={`badge rounded-pill ms-auto flex-shrink-0 ${group.usersCount === 0 ? 'bg-secondary' : 'bg-info text-dark'}`}>
                          {group.usersCount ?? 0} {group.usersCount === 1 ? 'lid' : 'leden'}
                        </span>
                      </button>

                      {isExpanded && (
                        <div id={panelId} className="bg-light border-top px-3 py-2">
                          {isLoadingMembers ? (
                            <div className="d-flex align-items-center justify-content-center p-3 text-muted">
                              <div className="spinner-border spinner-border-sm me-2" role="status">
                                <span className="visually-hidden">Bezig</span>
                              </div>
                              <span>Leden ophalen...</span>
                            </div>
                          ) : members && members.length > 0 ? (
                            <ul className="list-unstyled mb-0">
                              {members.map((user) => {
                                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
                                return (
                                <li key={user.id} className="d-flex align-items-center py-1">
                                  <span
                                    className="bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center text-white me-2 flex-shrink-0 small"
                                    style={{ width: '24px', height: '24px' }}
                                    aria-hidden="true"
                                  >
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                  </span>
                                  <span className="d-flex flex-column min-w-0">
                                    <CopyableText
                                      value={fullName}
                                      className="fw-semibold small"
                                      buttonAriaLabel={`Kopieer naam ${fullName}`}
                                    />
                                    <CopyableText
                                      value={user.email}
                                      className="text-muted small"
                                      buttonAriaLabel={`Kopieer e-mail ${user.email}`}
                                    />
                                  </span>
                                </li>
                                );
                              })}
                            </ul>
                          ) : (
                            <p className="text-center text-muted small mb-0 py-2">
                              Geen leden gevonden in deze groep.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupCanvas;

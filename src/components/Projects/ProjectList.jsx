import React from 'react';
import ModusIcon from '../Modus/ModusIcon';
import AuthImage from '../Shared/AuthImage';
import { sortProjects } from './projectOrdering';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ProjectList = ({
  projects,
  searchQuery,
  favoriteIds,
  onProjectClick,
  onCloneClick,
  onToggleFavorite,
  onDownloadClick,
}) => {
  const visibleProjects = sortProjects(projects, searchQuery, favoriteIds);

  return (
    <div className="table-responsive mt-2">
      <table className="table table-hover align-middle bg-white border rounded shadow-sm">
        <thead className="table-light">
          <tr>
            <th scope="col" style={{ width: '40px' }}><span className="visually-hidden">Favoriet</span></th>
            <th scope="col" style={{ width: '60px' }}><span className="visually-hidden">Voorbeeld</span></th>
            <th scope="col">Naam</th>
            <th scope="col">ID</th>
            <th scope="col">Laatst bezocht</th>
            <th scope="col" className="text-end">Acties</th>
          </tr>
        </thead>
        <tbody>
          {visibleProjects.map(project => {
            const isFavorite = favoriteIds?.has(project.id);

            return (
              <tr key={project.id} style={{ cursor: 'pointer' }} onClick={() => onProjectClick(project)}>
                <td>
                  <button
                    type="button"
                    className="btn btn-icon-only btn-sm border-0 bg-transparent p-0"
                    aria-pressed={isFavorite}
                    aria-label={isFavorite ? `${project.name} niet meer bovenaan zetten` : `${project.name} bovenaan zetten`}
                    title={isFavorite ? 'Bovenaan houden uitzetten' : 'Bovenaan in deze sessie'}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(project.id);
                    }}
                  >
                    <ModusIcon
                      name="star"
                      type={isFavorite ? 'fill' : 'duotone'}
                      size="18px"
                      extraClasses={isFavorite ? 'text-warning' : 'text-muted'}
                    />
                  </button>
                </td>
                <td>
                  <AuthImage
                    src={project.thumbnail}
                    alt=""
                    style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                    fallbackNode={<ModusIcon name="hard-hat" type="duotone" size="24px" extraClasses="text-secondary opacity-50" />}
                  />
                </td>
                <td className="fw-bold text-primary">{project.name}</td>
                <td className="text-muted small">{project.id}</td>
                <td>{formatDate(project.lastVisitedOn)}</td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-icon-only btn-sm btn-outline-secondary border-0"
                    aria-label={`${project.name} downloaden`}
                    title="Hele project downloaden"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadClick(project);
                    }}
                  >
                    <ModusIcon name="download-simple" type="duotone" size="18px" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon-only btn-sm btn-outline-secondary border-0"
                    aria-label={`Projectinformatie van ${project.name}`}
                    title="Projectinformatie"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectClick(project);
                    }}
                  >
                    <ModusIcon name="info" type="duotone" size="18px" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-icon-only btn-sm btn-outline-primary border-0"
                    aria-label={`Nieuw project maken op basis van ${project.name}`}
                    title="Nieuw project genereren (geavanceerd sjabloon)"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onCloneClick) onCloneClick(project);
                    }}
                  >
                    <ModusIcon name="copy" type="duotone" size="18px" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectList;

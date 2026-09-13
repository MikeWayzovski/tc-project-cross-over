import React from 'react';
import ModusIcon from '../Modus/ModusIcon';
import AuthImage from '../Shared/AuthImage';
import { sortProjects } from './projectOrdering';

const formatDate = (dateString) => {
  if (!dateString) return 'Onbekend';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Onbekend';
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ProjectGrid = ({
  projects,
  searchQuery,
  favoriteIds,
  onProjectClick,
  onCloneClick,
  onToggleFavorite,
  onDownloadClick,
}) => {
  const visibleProjects = sortProjects(projects, searchQuery, favoriteIds);

  if (visibleProjects.length === 0) {
    return (
      <div className="text-center text-muted mt-5">
        <ModusIcon name="folder-simple" type="duotone" size="48px" extraClasses="mb-3 opacity-50" />
        <h5>Geen projecten gevonden</h5>
        <p>Probeer een andere zoekterm of selecteer een andere regio.</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-wrap gap-4 mt-3">
      {visibleProjects.map(project => {
        const isFavorite = favoriteIds?.has(project.id);

        return (
          <div
            key={project.id}
            className="card shadow-sm border-0"
            style={{ width: '280px', transition: 'transform 0.2s', cursor: 'pointer' }}
            onClick={() => onProjectClick(project)}
          >
            <div className="card-img-top bg-light d-flex justify-content-center align-items-center" style={{ height: '160px', overflow: 'hidden' }}>
              <AuthImage
                src={project.thumbnail}
                alt={project.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                fallbackNode={<ModusIcon name="hard-hat" type="duotone" size="64px" extraClasses="text-secondary opacity-25" />}
              />
            </div>

            <div className="card-body d-flex flex-column">
              <h6 className="card-title text-truncate mb-1" title={project.name}>{project.name}</h6>
              <small className="text-muted mb-3 d-block">Laatst bezocht: {formatDate(project.lastVisitedOn)}</small>

              <div className="mt-auto d-flex gap-2">
                <button
                  type="button"
                  className={`btn btn-icon-only btn-sm border-0 ${isFavorite ? 'btn-outline-warning' : 'btn-outline-secondary'}`}
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
                    extraClasses={isFavorite ? 'text-warning' : ''}
                  />
                </button>

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
                  className="btn btn-icon-only btn-sm btn-outline-primary border-0 ms-auto"
                  aria-label={`Nieuw project maken op basis van ${project.name}`}
                  title="Nieuw project genereren (geavanceerd sjabloon)"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCloneClick) onCloneClick(project);
                  }}
                >
                  <ModusIcon name="copy" type="duotone" size="18px" />
                </button>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default ProjectGrid;

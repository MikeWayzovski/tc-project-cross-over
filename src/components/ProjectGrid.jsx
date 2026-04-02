import React from 'react';
import ModusIcon from './ModusIcon';
import AuthImage from './AuthImage'; // 1. IMPORT TOEGEVOEGD!

const formatDate = (dateString) => {
  if (!dateString) return 'Onbekend';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const ProjectGrid = ({ projects, searchQuery, onProjectClick }) => {
  
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (filteredProjects.length === 0) {
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
      {filteredProjects.map(project => (
        <div 
          key={project.id} 
          className="card shadow-sm border-0" 
          style={{ width: '280px', transition: 'transform 0.2s', cursor: 'pointer' }}
          onClick={() => onProjectClick(project)}
        >
          {/* AFBEELDING GEDEELTE AANGEPAST */}
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
               <button className="btn btn-icon-only btn-sm btn-outline-secondary border-0"><ModusIcon name="star" type="duotone" size="18px" /></button>
               <button className="btn btn-icon-only btn-sm btn-outline-secondary border-0"><ModusIcon name="download-simple" type="duotone" size="18px" /></button>
               <button className="btn btn-icon-only btn-sm btn-outline-secondary border-0"><ModusIcon name="share-network" type="duotone" size="18px" /></button>
               <button className="btn btn-icon-only btn-sm btn-outline-secondary border-0 ms-auto"><ModusIcon name="list" type="duotone" size="18px" /></button>
            </div>
          </div>

        </div>
      ))}
    </div>
  );
};

export default ProjectGrid;
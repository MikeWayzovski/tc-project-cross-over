import React from 'react';
import ModusIcon from '../Modus/ModusIcon';
import AuthImage from '../Shared/AuthImage';

const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const ProjectList = ({ projects, searchQuery, onProjectClick }) => {
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="table-responsive mt-2">
      <table className="table table-hover align-middle bg-white border rounded shadow-sm">
        <thead className="table-light">
          <tr>
            <th style={{ width: '40px' }}></th>
            <th style={{ width: '60px' }}></th>
            <th>Naam</th>
            <th>ID</th>
            <th>Laatst bezocht</th>
            <th className="text-end">Acties</th>
          </tr>
        </thead>
        <tbody>
          {filteredProjects.map(project => (
            <tr key={project.id} style={{ cursor: 'pointer' }} onClick={() => onProjectClick(project)}>
              <td>
                <ModusIcon name="star" type="duotone" size="18px" extraClasses="text-muted" />
              </td>
              <td>
                <AuthImage 
                  src={project.thumbnail} 
                  style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }}
                  fallbackNode={<ModusIcon name="hard-hat" type="duotone" size="24px" extraClasses="text-secondary opacity-50" />}
                />
              </td>
              <td className="fw-bold text-primary">{project.name}</td>
              <td className="text-muted small">{project.id}</td>
              <td>{formatDate(project.lastVisitedOn)}</td>
              <td className="text-end">
                <button className="btn btn-icon-only btn-sm btn-outline-secondary border-0"><ModusIcon name="download-simple" type="duotone" size="18px" /></button>
                <button className="btn btn-icon-only btn-sm btn-outline-secondary border-0"><ModusIcon name="share-network" type="duotone" size="18px" /></button>
                <button className="btn btn-icon-only btn-sm btn-outline-secondary border-0"><ModusIcon name="dots-three-vertical" type="duotone" size="18px" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectList;
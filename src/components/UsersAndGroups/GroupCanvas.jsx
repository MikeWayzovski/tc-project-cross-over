import React from 'react';
import ModusIcon from '../Modus/ModusIcon';

const GroupCanvas = ({ groups, isLoading }) => {
  if (isLoading && groups.length === 0) return null;

  // Groepeer de data per project voor de visualisatie
  const groupedByProject = groups.reduce((acc, group) => {
    if (!acc[group.projectName]) acc[group.projectName] = [];
    acc[group.projectName].push(group);
    return acc;
  }, {});

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
                  {projectGroups.map(group => (
                    <div key={group.id} className="d-flex align-items-center justify-content-between p-2 bg-light rounded border border-secondary border-opacity-10">
                      <div className="d-flex align-items-center">
                        <ModusIcon name="users-four" type="duotone" size="18px" extraClasses="text-muted me-2" />
                        <span className="fw-bold small">{group.name} </span>
                      </div>
                      <span className="badge rounded-pill bg-info text-dark small">
                        {group.usersCount} leden
                      </span>
                    </div>
                  ))}
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
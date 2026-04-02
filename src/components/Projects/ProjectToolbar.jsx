import React from 'react';
import ModusIcon from '../Modus/ModusIcon';

const ProjectToolbar = ({ viewMode, setViewMode, region, setRegion, searchQuery, setSearchQuery, onRefresh }) => {
  return (
    <div className="modus-toolbar d-flex justify-content-between align-items-center px-3 border-bottom bg-white" style={{ minHeight: '48px' }}>
      
      {/* LINKER KANT */}
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small mb-0">Projectserver locatie</span>
          <div className="dropdown">
            <button className="btn btn-outline-secondary btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              {region}
            </button>
            <ul className="dropdown-menu shadow-sm">
              <li><button className="dropdown-item" onClick={() => setRegion('Europa')}>Europa</button></li>
              <li><button className="dropdown-item" onClick={() => setRegion('Noord-Amerika')}>Noord-Amerika</button></li>
              <li><button className="dropdown-item" onClick={() => setRegion('Azië')}>Azië</button></li>
              <li><button className="dropdown-item" onClick={() => setRegion('Australië')}>Australië</button></li>
            </ul>
          </div>
        </div>

        <div className="vr bg-secondary opacity-25" style={{ height: '24px' }}></div>

        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-primary btn-sm">Nieuw project</button>
          
          {/* HIER IS DE KOPPELING MET ONREFRESH */}
          <button className="btn btn-icon-only btn-sm text-secondary" title="Vernieuwen" onClick={onRefresh}>
            <ModusIcon name="arrows-clockwise" type="duotone" size="20px" />
          </button>
        </div>
      </div>

      {/* RECHTER KANT */}
      <div className="d-flex align-items-center gap-3">
        <div className="d-flex align-items-center border rounded px-2" style={{ backgroundColor: 'var(--bs-body-bg)' }}>
          <ModusIcon name="magnifying-glass" type="duotone" size="16px" extraClasses="text-muted" />
          <input 
            type="text" 
            className="form-control form-control-sm border-0 shadow-none bg-transparent" 
            placeholder="Zoeken..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '200px' }}
          />
        </div>

        <div className="vr bg-secondary opacity-25" style={{ height: '24px' }}></div>

        <div className="btn-group" role="group" aria-label="Weergave modus">
          <button 
            type="button"
            className={`btn btn-sm d-flex align-items-center justify-content-center ${viewMode === 'grid' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('grid')}
            title="Card weergave"
          >
            <ModusIcon name="squares-four" type="duotone" size="20px" />
          </button>
          <button 
            type="button"
            className={`btn btn-sm d-flex align-items-center justify-content-center ${viewMode === 'list' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('list')}
            title="Lijst weergave"
          >
            <ModusIcon name="list" type="duotone" size="20px" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectToolbar;
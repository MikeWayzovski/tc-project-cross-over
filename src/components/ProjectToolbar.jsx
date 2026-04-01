import React from 'react';
import ModusIcon from './ModusIcon';

const ProjectToolbar = ({ viewMode, setViewMode, region, setRegion, searchQuery, setSearchQuery }) => {
  return (
    // De hoofdbalk: verdeelt de ruimte TUSSEN het linker- en rechterblok (justify-content-between)
    <div className="modus-toolbar d-flex justify-content-between align-items-center px-3 border-bottom bg-white" style={{ minHeight: '48px' }}>
      
      {/* LINKER KANT: Regio -> Nieuw Project -> Vernieuwen */}
      <div className="d-flex align-items-center gap-3">
        
        {/* 1. Regio Dropdown */}
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

        {/* Een subtiel verticaal lijntje ter scheiding */}
        <div className="vr bg-secondary opacity-25" style={{ height: '24px' }}></div>

        {/* 2. Acties */}
        <div className="d-flex align-items-center gap-2">
          <button className="btn btn-primary btn-sm">Nieuw project</button>
          <button className="btn btn-icon-only btn-sm text-secondary" title="Vernieuwen">
            <ModusIcon name="arrows-clockwise" type="duotone" size="20px" />
          </button>
        </div>

      </div>

      {/* RECHTER KANT: Zoeken -> Weergave wisselen */}
      <div className="d-flex align-items-center gap-3">
        
        {/* 3. Zoekbalk */}
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

        {/* Nog een scheidingslijntje */}
        <div className="vr bg-secondary opacity-25" style={{ height: '24px' }}></div>

        {/* 4. De View Toggle (List vs Grid) */}
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
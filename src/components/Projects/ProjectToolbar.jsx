import React from 'react';
import ModusIcon from '../Modus/ModusIcon';
import ModusIconButton from '../Modus/ModusIconButton';

const ProjectToolbar = ({ 
  viewMode, 
  setViewMode, 
  region, 
  setRegion, 
  searchQuery, 
  setSearchQuery, 
  onRefresh, 
  isEmbedded // Voeg 'isEmbedded' toe aan de destructurering van props
}) => {
  return (
    <div className="toolbar container-fluid bg-light p-3 border-bottom d-flex justify-content-between align-items-center">
      
      {/* LINKER DEEL: Regio kiezer, Nieuw Project, Verversen */}
      <div className="d-flex align-items-center">
        
        {/* CONDITIONAL RENDERING: Verberg regio kiezer als we Embedded draaien! */}
        {!isEmbedded && (
          <div className="region-picker d-flex align-items-center me-4">
            <label htmlFor="regionSelect" className="me-2 fw-bold text-muted small m-0">Projectserver locatie:</label>
            <select 
              id="regionSelect" 
              className="form-select form-select-sm w-auto" 
              value={region} 
              onChange={(e) => setRegion(e.target.value)}
            >
              <option value="Europa">Europa</option>
              <option value="Azië">Azië</option>
              <option value="Australië">Australië</option>
              <option value="Noord-Amerika">Noord-Amerika</option>
            </select>
          </div>
        )}
        
        {/* CONDITIONAL RENDERING: Verberg 'Nieuw project' knop als we Embedded draaien! */}
        {!isEmbedded && (
          <button className="btn btn-sm btn-primary d-flex align-items-center me-3">
            <ModusIcon name="plus" size="18px" extraClasses="me-1" />
            Nieuw project
          </button>
        )}
        
        {/* Verversen knop - Houden we altijd! */}
        <ModusIconButton icon="refresh" title="Verversen" onClick={onRefresh} extraClasses="text-primary" />
      </div>
      
      {/* RECHTER DEEL: Weergave Toggles en Zoeken */}
      <div className="d-flex align-items-center ms-auto">
        <div className="view-toggle btn-group btn-group-sm me-3" role="group">
          <button 
            type="button" 
            className={`btn btn-outline-secondary ${viewMode === 'grid' ? 'active' : ''}`} 
            onClick={() => setViewMode('grid')}
            title="Raster weergave"
          >
            <ModusIcon name="view-grid" size="18px" />
          </button>
          <button 
            type="button" 
            className={`btn btn-outline-secondary ${viewMode === 'list' ? 'active' : ''}`} 
            onClick={() => setViewMode('list')}
            title="Lijst weergave"
          >
            <ModusIcon name="view-list" size="18px" />
          </button>
        </div>
        
        <div className="search-box">
          <input 
            type="search" 
            className="form-control form-control-sm" 
            placeholder="Projecten zoeken..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProjectToolbar;
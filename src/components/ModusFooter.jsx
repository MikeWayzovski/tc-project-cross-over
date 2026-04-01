import React from 'react';
import ModusIcon from './ModusIcon';

const ModusFooter = ({ isLoading, loadingText, progress }) => {
  return (
    // De officiële Modus footer klasse. We gebruiken d-flex om de blokken netjes te verdelen.
    <div className="modus-footer d-flex align-items-center px-3 bg-light border-top" style={{ minHeight: '40px', fontSize: '0.85rem' }}>
      
      {/* BLOK 1: Systeem Status (Spinner voor onbepaalde tijd) */}
      <div className="d-flex align-items-center text-muted" style={{ minWidth: '200px' }}>
        {isLoading ? (
          <>
            {/* Een kleine Bootstrap spinner */}
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
              <span className="visually-hidden">Laden...</span>
            </div>
            <span>{loadingText || 'Bezig met laden...'}</span>
          </>
        ) : (
          <>
            <ModusIcon name="check-circle" type="duotone" size="16px" extraClasses="text-success me-2" />
            <span>Systeem gereed</span>
          </>
        )}
      </div>

      {/* Een subtiel verticaal scheidingslijntje (vr) */}
      <div className="vr mx-3 bg-secondary opacity-25"></div>

      {/* BLOK 2: Progress Bar (Voor meetbare processen, bijv. 0 tot 100%) */}
      <div className="d-flex align-items-center flex-grow-1">
        {progress !== null && progress !== undefined && (
          <div className="d-flex align-items-center w-100" style={{ maxWidth: '300px' }}>
            <span className="me-2 text-muted">Voortgang:</span>
            <div className="progress flex-grow-1" style={{ height: '8px' }}>
              <div 
                className="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                role="progressbar" 
                style={{ width: `${progress}%` }} 
                aria-valuenow={progress} 
                aria-valuemin="0" 
                aria-valuemax="100"
              ></div>
            </div>
            <span className="ms-2 text-muted fw-bold">{progress}%</span>
          </div>
        )}
      </div>

      {/* BLOK 3: Extra info aan de rechterkant (bijv. versiebeheer of copyright) */}
      <div className="ms-auto text-muted">
        <span>Trimble Sandbox v1.0</span>
      </div>

    </div>
  );
};

export default ModusFooter;
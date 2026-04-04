import React, { useState } from 'react';
import ModusIcon from '../Modus/ModusIcon';

const ProjectCloneWizard = ({ sourceProject, onClose, onClone }) => {
  // State voor de nieuwe projectnaam
  const [newProjectName, setNewProjectName] = useState(`${sourceProject?.name || 'Sjabloon'} - Kopie`);
  
  // State voor de 4 standaard Trimble vinkjes
  const [copySettings, setCopySettings] = useState(true);
  const [copyMembers, setCopyMembers] = useState(false);
  const [copyGroups, setCopyGroups] = useState(false);
  const [copyFolders, setCopyFolders] = useState(false);

  // State voor Fase 2: De geselecteerde bestanden/mappen
  // (Dit is nu nog een placeholder voor de treeview die we later bouwen)
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    // Verzamel alle data en stuur het terug naar de hoofdapplicatie
    const cloneData = {
      sourceProjectId: sourceProject.id,
      newProjectName,
      options: {
        copySettings,
        copyMembers,
        copyGroups,
        copyFolders
      },
      filesToCopy: selectedFiles
    };

    onClone(cloneData);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div>
          <h2 className="mb-1">Nieuw van bestaand project</h2>
          <p className="text-muted mb-0">
            Dit project wordt afgeleid van <strong>{sourceProject?.name}</strong>
          </p>
        </div>
        <button className="btn btn-icon-only btn-outline-secondary border-0" onClick={onClose} title="Sluiten">
          <ModusIcon name="close" size="24px" />
        </button>
      </div>

      <div className="row g-5">
        {/* LINKERKOLOM: Standaard Trimble Instellingen */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light fw-bold">
              <ModusIcon name="clipboard" size="18px" extraClasses="me-2" />
              Project configuraties
            </div>
            <div className="card-body">
              
              <div className="mb-4">
                <label className="form-label fw-bold">Naam nieuw project <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Bijv. 2026-001 Nieuwbouw Kantoor"
                  required
                />
              </div>

              <p className="fw-bold mb-3">Selecteer om te kopiëren:</p>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="chkSettings" checked={copySettings} onChange={(e) => setCopySettings(e.target.checked)} />
                <label className="form-check-label" htmlFor="chkSettings">
                  <strong>Project instellingen</strong><br/>
                  <small className="text-muted">Meeste project instellingen blijven behouden</small>
                </label>
              </div>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="chkMembers" checked={copyMembers} onChange={(e) => setCopyMembers(e.target.checked)} />
                <label className="form-check-label" htmlFor="chkMembers">
                  <strong>Project leden</strong><br/>
                  <small className="text-muted">Gebruiker en beheerder rollen blijven behouden</small>
                </label>
              </div>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="chkGroups" checked={copyGroups} onChange={(e) => setCopyGroups(e.target.checked)} />
                <label className="form-check-label" htmlFor="chkGroups">
                  <strong>Groepen</strong><br/>
                  <small className="text-muted">Project leden worden ingevuld indien geselecteerd</small>
                </label>
              </div>

              <div className="form-check mb-4">
                <input className="form-check-input" type="checkbox" id="chkFolders" checked={copyFolders} onChange={(e) => setCopyFolders(e.target.checked)} />
                <label className="form-check-label" htmlFor="chkFolders">
                  <strong>Mappenstructuren</strong><br/>
                  <small className="text-muted">Rechten voor gekopieerde gebruikers en groepen blijven behouden</small>
                </label>
              </div>

            </div>
          </div>
        </div>

        {/* RECHTERKOLOM: De "Cherry on top" Content Injector */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-primary h-100">
            <div className="card-header bg-primary text-white fw-bold">
              <ModusIcon name="folder-open" size="18px" extraClasses="me-2 text-white" />
              Geavanceerd: Project Inhoud (Fase 2)
            </div>
            <div className="card-body d-flex flex-column">
              <p className="text-muted small mb-3">
                Selecteer specifieke mappen of bestanden uit het sjabloon die je wilt overnemen in het nieuwe project. 
                (Bijv. ISO-19650 mapstructuur, BIM Protocollen, Veiligheidsvoorschriften).
              </p>
              
              {/* PLACEHOLDER VOOR DE BESTANDEN-TREEVIEW */}
              <div className="flex-grow-1 bg-light border rounded d-flex flex-column align-items-center justify-content-center p-4 text-center" style={{ minHeight: '200px' }}>
                <ModusIcon name="lock" type="duotone" size="48px" extraClasses="text-secondary opacity-50 mb-2" />
                <h6 className="text-secondary">Bestandenboom wordt geladen...</h6>
                <small className="text-muted">
                  Deze functionaliteit bouwen we in de volgende stap. De API zal hier live de bestanden uit <strong>{sourceProject?.name}</strong> tonen.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIES */}
      <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
          Annuleren
        </button>
        <button 
          type="button" 
          className="btn btn-primary d-flex align-items-center" 
          onClick={handleSubmit}
          disabled={!newProjectName.trim()}
        >
          <ModusIcon name="check" size="18px" extraClasses="me-2" />
          Project Aanmaken
        </button>
      </div>
    </div>
  );
};

export default ProjectCloneWizard;
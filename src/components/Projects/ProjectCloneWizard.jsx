import React, { useState, useEffect } from 'react';
import ModusIcon from '../Modus/ModusIcon';
import { getProjectSnapshot } from '../../api/projectsApi';
import { Logger } from '../../utils/logger';


// --- HULP COMPONENT: Bestand Icoontjes Bepalen ---
const getFileIcon = (filename) => {
  if (!filename.includes('.')) return { name: 'document', color: 'text-secondary' };
  
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': 
      return { name: 'document', color: 'text-danger' }; // Rood document voor PDF
    case 'xls': case 'xlsx': case 'csv': 
      return { name: 'table', color: 'text-success' }; // Groene tabel voor Excel
    case 'ifc': case 'skp': case 'rvt': case 'dwg': case 'dxf': case 'trb': 
      return { name: 'cube', color: 'text-info' }; // Blauwe 3D doos voor BIM modellen
    case 'doc': case 'docx': 
      return { name: 'document', color: 'text-primary' }; // Blauw document voor Word
    case 'jpg': case 'jpeg': case 'png': case 'bmp': 
      return { name: 'image', color: 'text-warning' }; // Geel icoon voor afbeeldingen
    default: 
      return { name: 'document', color: 'text-secondary' }; // Standaard grijs
  }
};


// --- HULP COMPONENT: De Recursieve Tree Node ---
const TreeNode = ({ node }) => {
  // Standaard klappen we de hoofdmap uit, en de rest in
  const [isOpen, setIsOpen] = useState(node.nm === 'RootFolder' || !node.pid);
  const isFolder = node.tp === 'FOLDER';
  const fileIcon = !isFolder ? getFileIcon(node.nm) : null;

  return (
    <div style={{ marginLeft: '20px', marginTop: '4px' }}>
      <div 
        className="d-flex align-items-center py-1" 
        style={{ cursor: isFolder ? 'pointer' : 'default' }} 
        onClick={() => isFolder && setIsOpen(!isOpen)}
      >
        {/* Placeholder voor de checkbox (voor Fase 2.2) */}
        <input 
          type="checkbox" 
          className="form-check-input me-2" 
          disabled 
          title="Binnenkort beschikbaar" 
          onClick={(e) => e.stopPropagation()} // Voorkom map in/uitklappen bij klikken op checkbox
        />
        
        {isFolder ? (
          <ModusIcon name={isOpen ? 'folder-open' : 'folder'} size="18px" type="duotone" extraClasses="me-2 text-primary" />
        ) : (
          <ModusIcon name={fileIcon.name} size="18px" type="duotone" extraClasses={`me-2 ${fileIcon.color}`} />
        )}
        <span className={isFolder ? 'fw-bold' : ''} style={{ fontSize: '0.9rem' }}>{node.nm}</span>
      </div>
      
      {/* Als het een map is, en hij is opengeklapt, teken dan de 'kinderen' */}
      {isFolder && isOpen && node.children && node.children.map(child => (
        <TreeNode key={child.id} node={child} />
      ))}
    </div>
  );
};


// --- HOOFD COMPONENT ---
const ProjectCloneWizard = ({ sourceProject, region, getValidToken, onClose, onClone }) => {
  const [newProjectName, setNewProjectName] = useState(`${sourceProject?.name || 'Sjabloon'} - Kopie`);
  
  const [copySettings, setCopySettings] = useState(true);
  const [copyMembers, setCopyMembers] = useState(false);
  const [copyGroups, setCopyGroups] = useState(true);
  const [copyFolders, setCopyFolders] = useState(true);

  // NIEUW: States voor de treeview
  const [snapshotTree, setSnapshotTree] = useState([]);
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true);

  // Zodra de wizard opent: Haal de snapshot op!
  useEffect(() => {
    const fetchSnapshot = async () => {
      setIsLoadingSnapshot(true);
      try {
        const token = await getValidToken();
        const data = await getProjectSnapshot(token, region, sourceProject.id);
        
        if (data && data.items) {
          Logger.info(`Snapshot opgehaald: ${data.items.length} items gevonden.`);
          
          // Bouw de boomstructuur op
          const map = {};
          const roots = [];

          // Stap 1: Maak een snelle zoek-map
          data.items.forEach(item => {
            map[item.id] = { ...item, children: [] };
          });

          // Stap 2: Koppel kinderen aan hun ouders
          data.items.forEach(item => {
            if (item.pid && map[item.pid]) {
              map[item.pid].children.push(map[item.id]);
            } else {
              roots.push(map[item.id]);
            }
          });

          // Stap 3: Sorteer de inhoud (Mappen bovenaan, dan A-Z)
          const sortTree = (nodes) => {
            nodes.sort((a, b) => {
              if (a.tp === 'FOLDER' && b.tp !== 'FOLDER') return -1;
              if (a.tp !== 'FOLDER' && b.tp === 'FOLDER') return 1;
              return a.nm.localeCompare(b.nm);
            });
            nodes.forEach(node => sortTree(node.children));
          };
          sortTree(roots);

          setSnapshotTree(roots);
        }
      } catch (error) {
        Logger.error("Fout bij ophalen project snapshot:", error.message);
      } finally {
        setIsLoadingSnapshot(false);
      }
    };

    if (sourceProject) fetchSnapshot();
  }, [sourceProject, region, getValidToken]);


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const cloneData = {
      sourceProjectId: sourceProject.id,
      newProjectName,
      options: { copySettings, copyMembers, copyGroups, copyFolders },
      filesToCopy: [] // Straks vullen we dit met de aangevinkte bestanden!
    };

    onClone(cloneData);
  };

  return (
    <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
        <div>
          <h2 className="mb-1">Nieuw van bestaand project</h2>
          <p className="text-muted mb-0">Dit project wordt afgeleid van <strong>{sourceProject?.name}</strong></p>
        </div>
        <button className="btn btn-icon-only btn-outline-secondary border-0" onClick={onClose} title="Sluiten">
          <ModusIcon name="close" size="24px" />
        </button>
      </div>

      <div className="row g-5">
        {/* LINKERKOLOM: Instellingen */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-header bg-light fw-bold">
              <ModusIcon name="clipboard" size="18px" extraClasses="me-2" />
              Project configuraties
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label fw-bold">Naam nieuw project <span className="text-danger">*</span></label>
                <input type="text" className="form-control" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} required />
              </div>

              <p className="fw-bold mb-3">Selecteer om te kopiëren:</p>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="chkSettings" checked={copySettings} onChange={(e) => setCopySettings(e.target.checked)} />
                <label className="form-check-label" htmlFor="chkSettings"><strong>Project instellingen</strong></label>
              </div>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="chkMembers" checked={copyMembers} onChange={(e) => setCopyMembers(e.target.checked)} />
                <label className="form-check-label" htmlFor="chkMembers"><strong>Project leden</strong></label>
              </div>

              <div className="form-check mb-3">
                <input className="form-check-input" type="checkbox" id="chkGroups" checked={copyGroups} onChange={(e) => setCopyGroups(e.target.checked)} />
                <label className="form-check-label" htmlFor="chkGroups"><strong>Groepen</strong></label>
              </div>

              <div className="form-check mb-4">
                <input className="form-check-input" type="checkbox" id="chkFolders" checked={copyFolders} onChange={(e) => setCopyFolders(e.target.checked)} />
                <label className="form-check-label" htmlFor="chkFolders"><strong>Mappenstructuren</strong></label>
              </div>
            </div>
          </div>
        </div>

        {/* RECHTERKOLOM: Bestandenboom (Fase 2.1) */}
        <div className="col-lg-6">
          <div className="card shadow-sm border-primary h-100">
            <div className="card-header bg-primary text-white fw-bold">
              <ModusIcon name="folder-open" size="18px" extraClasses="me-2 text-white" />
              Geavanceerd: Project Inhoud (Sjabloonbestanden)
            </div>
            <div className="card-body d-flex flex-column p-0">
              
              {isLoadingSnapshot ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5 text-muted">
                  <div className="spinner-border mb-3" role="status"></div>
                  <span>Bestandenstructuur inlezen...</span>
                </div>
              ) : (
                <div className="flex-grow-1" style={{ overflowY: 'auto', maxHeight: '450px', padding: '15px' }}>
                  {snapshotTree.length > 0 ? (
                    snapshotTree.map(rootNode => <TreeNode key={rootNode.id} node={rootNode} />)
                  ) : (
                    <div className="text-center text-muted p-4">Geen bestanden of mappen gevonden in dit project.</div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTIES */}
      <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
        <button type="button" className="btn btn-outline-secondary" onClick={onClose}>Annuleren</button>
        <button type="button" className="btn btn-primary d-flex align-items-center" onClick={handleSubmit} disabled={!newProjectName.trim()}>
          <ModusIcon name="check" size="18px" extraClasses="me-2" />
          Project Aanmaken
        </button>
      </div>
    </div>
  );
};

export default ProjectCloneWizard;
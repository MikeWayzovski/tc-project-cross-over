import React, { useState, useEffect } from 'react';
import ModusIcon from '../Modus/ModusIcon';
import { getProjectSnapshot } from '../../api/projectsApi';
import { Logger } from '../../utils/logger';
import ConfirmModal from '../Modus/ConfirmModal';



// --- HULP COMPONENT: Bestand Icoontjes Bepalen ---
const getFileIcon = (filename) => {
  if (!filename.includes('.')) return { name: 'document', color: 'text-secondary' };
  
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf': 
      return { name: 'document', color: 'text-danger' };
    case 'xls': case 'xlsx': case 'csv': 
      return { name: 'table', color: 'text-success' };
    case 'ifc': case 'skp': case 'rvt': case 'dwg': case 'dxf': case 'trb': 
      return { name: 'box', color: 'text-info' };
    case 'doc': case 'docx': 
      return { name: 'document', color: 'text-primary' };
    case 'jpg': case 'jpeg': case 'png': case 'bmp': 
      return { name: 'image', color: 'text-warning' };
    default: 
      return { name: 'document', color: 'text-secondary' };
  }
};

// --- HULP COMPONENT: De Recursieve Tree Node met Checkbox ---
const TreeNode = ({ node, selectedIds, onToggle }) => {
  const [isOpen, setIsOpen] = useState(node.nm === 'RootFolder' || !node.pid);
  const isFolder = node.tp === 'FOLDER';
  const fileIcon = !isFolder ? getFileIcon(node.nm) : null;
  
  // Controleer of deze specifieke node in onze 'geselecteerd' lijst staat
  const isChecked = selectedIds.has(node.id);

  return (
    <div style={{ marginLeft: '20px', marginTop: '4px' }}>
      <div 
        className="d-flex align-items-center py-1 rounded" 
        style={{ cursor: isFolder ? 'pointer' : 'default', transition: 'background-color 0.2s' }} 
        onClick={() => isFolder && setIsOpen(!isOpen)}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        <input 
          type="checkbox" 
          className="form-check-input me-2" 
          checked={isChecked}
          onChange={(e) => {
            e.stopPropagation();
            onToggle(node.id, e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()} // Voorkom in/uitklappen bij vinken
        />
        
        {isFolder ? (
          <ModusIcon name={isOpen ? 'folder-open' : 'folder'} size="18px" type="duotone" extraClasses="me-2 text-primary" />
        ) : (
          <ModusIcon name={fileIcon.name} size="18px" type="duotone" extraClasses={`me-2 ${fileIcon.color}`} />
        )}
        <span className={isFolder ? 'fw-bold' : ''} style={{ fontSize: '0.9rem' }}>{node.nm}</span>
      </div>
      
      {isFolder && isOpen && node.children && node.children.map(child => (
        <TreeNode key={child.id} node={child} selectedIds={selectedIds} onToggle={onToggle} />
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

  const [snapshotTree, setSnapshotTree] = useState([]);
  const [nodeMap, setNodeMap] = useState({}); // Snelle lookup-tabel voor het aanvinken
  const [selectedIds, setSelectedIds] = useState(new Set()); // De actieve vinkjes
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    const fetchSnapshot = async () => {
      setIsLoadingSnapshot(true);
      try {
        const token = await getValidToken();
        const data = await getProjectSnapshot(token, region, sourceProject.id);
        
        if (data && data.items) {
          const map = {};
          const roots = [];

          // Stap 1: Vul de lookup map
          data.items.forEach(item => {
            map[item.id] = { ...item, children: [] };
          });

          // Stap 2: Bouw de boom
          data.items.forEach(item => {
            if (item.pid && map[item.pid]) {
              map[item.pid].children.push(map[item.id]);
            } else {
              roots.push(map[item.id]);
            }
          });

          // Stap 3: Sorteren (Mappen eerst, dan A-Z)
          const sortTree = (nodes) => {
            nodes.sort((a, b) => {
              if (a.tp === 'FOLDER' && b.tp !== 'FOLDER') return -1;
              if (a.tp !== 'FOLDER' && b.tp === 'FOLDER') return 1;
              return a.nm.localeCompare(b.nm);
            });
            nodes.forEach(node => sortTree(node.children));
          };
          sortTree(roots);

          setNodeMap(map); // Bewaar in state voor de checkboxes
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

  // Recursieve functie voor de checkboxes (Vinkt alle kinderen mee aan/uit)
  const handleToggle = (nodeId, isChecked) => {
    const newSelected = new Set(selectedIds);
    
    const toggleRecursive = (id, check) => {
      if (check) newSelected.add(id);
      else newSelected.delete(id);
      
      const node = nodeMap[id];
      if (node && node.children) {
        node.children.forEach(child => toggleRecursive(child.id, check));
      }
    };

    toggleRecursive(nodeId, isChecked);
    setSelectedIds(newSelected);
  };

  // Stap 1: Valideer en open de modal
  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    setIsConfirmOpen(true);
  };

  // Stap 2: Voer de echte kloon uit (wordt aangeroepen door de Modal)
  const executeClone = () => {
    setIsConfirmOpen(false); // Sluit de modal

    const filesToCopy = Array.from(selectedIds)
      .map(id => nodeMap[id])
      .filter(node => node && node.tp === 'FILE');

    const cloneData = {
      sourceProjectId: sourceProject.id,
      newProjectName,
      options: { copySettings, copyMembers, copyGroups, copyFolders },
      filesToCopy 
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

        <div className="col-lg-6">
          <div className="card shadow-sm border-primary h-100">
            <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
              <div>
                <ModusIcon name="folder-open" size="18px" extraClasses="me-2 text-white" />
                Geavanceerd: Project Inhoud
              </div>
              <span className="badge bg-light text-primary">
                {Array.from(selectedIds).map(id => nodeMap[id]).filter(n => n?.tp === 'FILE').length} bestanden
              </span>
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
                    snapshotTree.map(rootNode => (
                      <TreeNode 
                        key={rootNode.id} 
                        node={rootNode} 
                        selectedIds={selectedIds} 
                        onToggle={handleToggle} 
                      />
                    ))
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
        {/* Deze knop opent nu eerst de waarschuwing! */}
        <button type="button" className="btn btn-primary d-flex align-items-center" onClick={handleOpenConfirm} disabled={!newProjectName.trim()}>
          <ModusIcon name="check" size="18px" extraClasses="me-2" />
          Project Aanmaken
        </button>
      </div>

      {/* DE WAARSCHUWING MODAL */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Project Klonen Bevestigen"
        message={`Je staat op het punt een nieuw project genaamd '${newProjectName}' aan te maken op basis van '${sourceProject?.name}'. Weet je zeker dat je wilt doorgaan?`}
        confirmText="Ja, start klonen"
        cancelText="Annuleren"
        variant="primary" // Blauwe knop, want het is een positieve actie!
        onConfirm={executeClone}
        onCancel={() => setIsConfirmOpen(false)}
      />
    </div>
  );
};

export default ProjectCloneWizard;
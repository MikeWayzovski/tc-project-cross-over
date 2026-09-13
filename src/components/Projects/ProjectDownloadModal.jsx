import React, { useState, useEffect, useMemo, useRef } from 'react';
import ModusIcon from '../Modus/ModusIcon';
import { formatBytes, ROOT_FOLDER_ID } from '../../services/downloadService';

// Boven deze grens waarschuwen we: de hele zip wordt in het geheugen van de browser opgebouwd.
const LARGE_DOWNLOAD_BYTES = 1024 * 1024 * 1024;

// Een checkbox kent geen "half aangevinkt" in HTML; dat kan alleen via de DOM.
const TriStateCheckbox = ({ checked, indeterminate, onChange, ariaLabel }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="form-check-input me-2 flex-shrink-0"
      checked={checked}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.checked)}
      onClick={(e) => e.stopPropagation()}
    />
  );
};

const FolderRow = ({ node, depth, selection, onToggle }) => {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const state = selection.stateOf(node.id);

  return (
    <>
      <div
        className="d-flex align-items-center py-1 rounded"
        style={{ paddingLeft: `${depth * 20}px`, cursor: hasChildren ? 'pointer' : 'default' }}
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <TriStateCheckbox
          checked={state === 'all'}
          indeterminate={state === 'some'}
          ariaLabel={`Map ${node.name} selecteren`}
          onChange={(next) => onToggle(node.id, next)}
        />

        <span style={{ width: '18px' }} className="flex-shrink-0">
          {hasChildren && (
            <ModusIcon name={isOpen ? 'caret-down' : 'caret-right'} type="duotone" size="14px" extraClasses="text-muted" />
          )}
        </span>

        <ModusIcon name="folder-simple" type="duotone" size="18px" extraClasses="me-2 text-primary flex-shrink-0" />
        <span className="text-truncate">{node.name}</span>
        <span className="badge bg-light text-muted ms-auto flex-shrink-0">
          {node.totalFileCount} · {formatBytes(node.totalSize)}
        </span>
      </div>

      {hasChildren && isOpen && node.children.map((child) => (
        <FolderRow key={child.id} node={child} depth={depth + 1} selection={selection} onToggle={onToggle} />
      ))}
    </>
  );
};

const ProjectDownloadModal = ({
  project,
  isInspecting,
  plan,
  error,
  isDownloading,
  progress,
  progressText,
  onConfirm,
  onRetry,
  onAbort,
  onCancel,
}) => {
  // We houden bij wat de gebruiker *uit*vinkt, niet wat aanstaat. Zo is "alles aan"
  // de lege begintoestand en hoeft de selectie niet gereset te worden als het plan binnenkomt.
  const [deselectedIds, setDeselectedIds] = useState(() => new Set());

  // Per map onthouden welke mappen eronder hangen, zodat aanvinken doorwerkt
  // naar submappen en de half-aangevinkte staat te bepalen is.
  const descendants = useMemo(() => {
    const map = new Map();
    const walk = (node) => {
      const ids = [node.id];
      node.children.forEach((child) => ids.push(...walk(child)));
      map.set(node.id, ids);
      return ids;
    };
    (plan?.tree || []).forEach(walk);
    map.set(ROOT_FOLDER_ID, [ROOT_FOLDER_ID]);
    return map;
  }, [plan]);

  const selection = useMemo(() => ({
    stateOf: (id) => {
      const ids = descendants.get(id) || [id];
      const picked = ids.filter((candidate) => !deselectedIds.has(candidate)).length;
      if (picked === 0) return 'none';
      return picked === ids.length ? 'all' : 'some';
    },
  }), [descendants, deselectedIds]);

  const toggleFolder = (id, shouldSelect) => {
    setDeselectedIds((current) => {
      const next = new Set(current);
      (descendants.get(id) || [id]).forEach((candidate) => {
        if (shouldSelect) next.delete(candidate);
        else next.add(candidate);
      });
      return next;
    });
  };

  const selectedFiles = useMemo(
    () => (plan ? plan.files.filter((file) => !deselectedIds.has(file.folderId)) : []),
    [plan, deselectedIds],
  );

  const selectedBytes = selectedFiles.reduce((sum, file) => sum + (file.size ?? 0), 0);

  if (!project) return null;

  const isLarge = selectedBytes > LARGE_DOWNLOAD_BYTES;
  const canConfirm = Boolean(plan) && selectedFiles.length > 0 && !isDownloading;
  const showPicker = Boolean(plan) && !isInspecting && !error && !isDownloading;

  return (
    <>
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>

      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true" aria-labelledby="downloadModalTitle" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content shadow-lg border-0">

            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center" id="downloadModalTitle">
                <ModusIcon name="download-simple" type="duotone" size="24px" extraClasses="me-2 text-primary" />
                Project downloaden
              </h5>
              {!isDownloading && (
                <button type="button" className="btn-close" onClick={onCancel} aria-label="Sluiten"></button>
              )}
            </div>

            <div className="modal-body">
              <p className="text-muted">
                Project <strong className="text-body">{project.name}</strong>
              </p>

              {isInspecting && (
                <div className="d-flex align-items-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary me-3" role="status">
                    <span className="visually-hidden">Bezig</span>
                  </div>
                  <span>Mappenstructuur inlezen...</span>
                </div>
              )}

              {error && !isInspecting && (
                <div className="alert alert-danger d-flex align-items-start mb-0" role="alert">
                  <ModusIcon name="warning-circle" type="duotone" size="20px" extraClasses="me-2 flex-shrink-0" />
                  <div>
                    <strong className="d-block">De mappenstructuur kon niet worden gelezen.</strong>
                    <span className="small">{error}</span>
                  </div>
                </div>
              )}

              {isDownloading && (
                <div className="py-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="text-truncate me-3">{progressText || 'Bezig met downloaden...'}</span>
                    <span className="fw-bold flex-shrink-0">{progress ?? 0}%</span>
                  </div>
                  <div className="progress" style={{ height: '10px' }}>
                    <div
                      className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                      role="progressbar"
                      style={{ width: `${progress ?? 0}%` }}
                      aria-valuenow={progress ?? 0}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    ></div>
                  </div>
                  <p className="text-muted small mt-3 mb-0">
                    Houd dit tabblad open. Afbreken stopt na het bestand dat nu wordt opgehaald.
                  </p>
                </div>
              )}

              {showPicker && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold">Kies wat je wilt downloaden</span>
                    <span className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setDeselectedIds(new Set())}
                      >
                        Alles
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setDeselectedIds(new Set(plan.folderIds))}
                      >
                        Niets
                      </button>
                    </span>
                  </div>

                  <div className="border rounded p-2 mb-3" style={{ maxHeight: '260px', overflowY: 'auto' }}>
                    {plan.rootFileCount > 0 && (
                      <div className="d-flex align-items-center py-1">
                        <TriStateCheckbox
                          checked={!deselectedIds.has(ROOT_FOLDER_ID)}
                          indeterminate={false}
                          ariaLabel="Losse bestanden in de projectmap selecteren"
                          onChange={(next) => toggleFolder(ROOT_FOLDER_ID, next)}
                        />
                        <span style={{ width: '18px' }} className="flex-shrink-0"></span>
                        <ModusIcon name="file-text" type="duotone" size="18px" extraClasses="me-2 text-secondary flex-shrink-0" />
                        <span className="fst-italic text-muted">Losse bestanden in de projectmap</span>
                        <span className="badge bg-light text-muted ms-auto flex-shrink-0">
                          {plan.rootFileCount} · {formatBytes(plan.rootFileSize)}
                        </span>
                      </div>
                    )}

                    {plan.tree.map((node) => (
                      <FolderRow key={node.id} node={node} depth={0} selection={selection} onToggle={toggleFolder} />
                    ))}

                    {plan.tree.length === 0 && plan.rootFileCount === 0 && (
                      <p className="text-muted mb-0 p-2">Dit project bevat geen bestanden om te downloaden.</p>
                    )}
                  </div>

                  <div className="d-flex justify-content-between align-items-center border-top pt-3">
                    <span className="text-muted">
                      Geselecteerd: <strong className="text-body">{selectedFiles.length}</strong> van {plan.fileCount} bestanden
                      {' · '}
                      <strong className="text-body">{formatBytes(selectedBytes)}</strong>
                      {!plan.sizeIsComplete && <span className="small"> (schatting)</span>}
                    </span>
                  </div>

                  {isLarge && (
                    <div className="alert alert-warning d-flex align-items-start mt-3 mb-0" role="alert">
                      <ModusIcon name="warning-circle" type="duotone" size="20px" extraClasses="me-2 flex-shrink-0" />
                      <div className="small">
                        Deze selectie is groter dan 1 GB. De zip wordt in je browser opgebouwd, dus dit kan
                        lang duren en veel geheugen kosten. Vink mappen uit om de download kleiner te maken.
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="modal-footer border-top-0 bg-light">
              {isDownloading ? (
                <button type="button" className="btn btn-outline-danger d-flex align-items-center" onClick={onAbort}>
                  <ModusIcon name="x" type="duotone" size="18px" extraClasses="me-2" />
                  Download afbreken
                </button>
              ) : (
                <>
                  <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                    Annuleren
                  </button>

                  {error ? (
                    <button type="button" className="btn btn-primary d-flex align-items-center" onClick={onRetry}>
                      <ModusIcon name="arrow-clockwise" type="duotone" size="18px" extraClasses="me-2" />
                      Opnieuw proberen
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-primary d-flex align-items-center"
                      onClick={() => onConfirm(selectedFiles)}
                      disabled={!canConfirm}
                    >
                      <ModusIcon name="download-simple" type="duotone" size="18px" extraClasses="me-2" />
                      {selectedFiles.length > 0 ? `Download ${selectedFiles.length} bestanden` : 'Downloaden'}
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ProjectDownloadModal;

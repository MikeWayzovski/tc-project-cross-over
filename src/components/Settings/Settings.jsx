import React, { useState, useEffect } from 'react';
import ModusIcon from '../Modus/ModusIcon';
import { Logger } from '../../utils/logger';

const Settings = ({ isDarkMode, setIsDarkMode }) => {
  // Slimme state: Haal uit geheugen OF gebruik standaardwaarde
  const [sendInvite, setSendInvite] = useState(() => JSON.parse(localStorage.getItem('trimble_send_invite') ?? 'true'));
  const [autoCreateGroups, setAutoCreateGroups] = useState(() => JSON.parse(localStorage.getItem('trimble_auto_create_groups') ?? 'true'));
  const [csvSeparator, setCsvSeparator] = useState(() => localStorage.getItem('trimble_csv_separator') || ',');
  const [defaultRole, setDefaultRole] = useState(() => localStorage.getItem('trimble_default_role') || 'USER');
  const [logCount, setLogCount] = useState(0);

  // Sla direct op in localStorage als een instelling verandert!
  useEffect(() => localStorage.setItem('trimble_send_invite', JSON.stringify(sendInvite)), [sendInvite]);
  useEffect(() => localStorage.setItem('trimble_auto_create_groups', JSON.stringify(autoCreateGroups)), [autoCreateGroups]);
  useEffect(() => localStorage.setItem('trimble_csv_separator', csvSeparator), [csvSeparator]);
  useEffect(() => localStorage.setItem('trimble_default_role', defaultRole), [defaultRole]);

  // Haal op hoeveel logs er momenteel in het geheugen staan
  useEffect(() => {
    const logs = Logger.getLogs();
    setLogCount(logs.length);
  }, []);

  const handleClearLogs = () => {
    if (window.confirm("Weet je zeker dat je alle systeemlogs wilt wissen?")) {
      Logger.clearLogs();
      setLogCount(0);
      Logger.info("Systeemlogs handmatig gewist door gebruiker.");
    }
  };

  const handleExportLogs = () => {
    Logger.exportLogs();
  };

  return (
    <div className="settings-page row g-4">
      <div className="col-lg-8">
        <h3 className="mb-4">Applicatie Instellingen</h3>

        {/* 1. WEERGAVE & UI */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-light fw-bold text-dark">
            <ModusIcon name="monitor" size="18px" extraClasses="me-2" />
            Weergave
          </div>
          <div className="card-body">
            <div className="form-check form-switch">
              <input 
                className="form-check-input" 
                type="checkbox" 
                role="switch" 
                id="darkModeSwitch" 
                checked={isDarkMode} 
                onChange={() => setIsDarkMode(!isDarkMode)} 
              />
              <label className="form-check-label" htmlFor="darkModeSwitch">
                Donkere Modus (Dark Mode) inschakelen
              </label>
            </div>
            <p className="text-muted small mt-1 mb-0">
              Past het kleurenthema van de extensie aan, onafhankelijk van Trimble Connect.
            </p>
          </div>
        </div>

        {/* 2. ONBOARDING & GEBRUIKERS */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-light fw-bold text-dark">
            <ModusIcon name="users" size="18px" extraClasses="me-2" />
            Gebruikers Onboarding (Provisioning)
          </div>
          <div className="card-body">
            <div className="form-check form-switch mb-3">
              <input 
                className="form-check-input" 
                type="checkbox" 
                role="switch" 
                id="inviteSwitch" 
                checked={sendInvite} 
                onChange={(e) => setSendInvite(e.target.checked)} 
              />
              <label className="form-check-label" htmlFor="inviteSwitch">
                Stuur standaard een welkomst-email via Trimble Connect
              </label>
            </div>
            
            <div className="form-check form-switch mb-3">
              <input 
                className="form-check-input" 
                type="checkbox" 
                role="switch" 
                id="groupSwitch" 
                checked={autoCreateGroups} 
                onChange={(e) => setAutoCreateGroups(e.target.checked)} 
              />
              <label className="form-check-label" htmlFor="groupSwitch">
                Ontbrekende groepen automatisch aanmaken in doelprojecten
              </label>
            </div>

            <div className="mt-3">
              <label className="form-label small fw-bold">Standaard Projectrol bij nieuwe gebruikers</label>
              <select 
                className="form-select form-select-sm w-50" 
                value={defaultRole} 
                onChange={(e) => setDefaultRole(e.target.value)}
              >
                <option value="USER">User (Standaard gebruiker)</option>
                <option value="ADMIN">Admin (Projectbeheerder)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. DATA & EXPORT */}
        <div className="card shadow-sm border-0 mb-4">
          <div className="card-header bg-light fw-bold text-dark">
            <ModusIcon name="document" size="18px" extraClasses="me-2" />
            Data & Export
          </div>
          <div className="card-body">
            <label className="form-label small fw-bold">CSV Scheidingsteken (voor Export Audit)</label>
            <select 
              className="form-select form-select-sm w-50" 
              value={csvSeparator} 
              onChange={(e) => setCsvSeparator(e.target.value)}
            >
              <option value=",">Komma (,) - Internationale standaard</option>
              <option value=";">Puntkomma (;) - Geoptimaliseerd voor Nederlandse Excel</option>
            </select>
            <p className="text-muted small mt-2 mb-0">
              Kies puntkomma als de kolommen in Excel niet goed worden gescheiden na een export.
            </p>
          </div>
        </div>

      </div>

      {/* RECHTERKOLOM: SYSTEM & LOGS */}
      <div className="col-lg-4">
        <div className="card shadow-sm border-danger mb-4">
          <div className="card-header bg-danger text-white fw-bold">
            <ModusIcon name="warning" size="18px" extraClasses="me-2 text-white" />
            Systeembeheer
          </div>
          <div className="card-body bg-light">
            <h6 className="fw-bold">Achtergrond Logs</h6>
            <p className="small text-muted mb-3">
              De applicatie houdt technische gebeurtenissen bij in het geheugen van je browser. Dit is handig voor probleemoplossing.
            </p>
            
            <div className="d-flex justify-content-between align-items-center mb-3 p-2 bg-white border rounded">
              <span className="small fw-bold">Aantal logs bewaard:</span>
              <span className="badge bg-secondary">{logCount}</span>
            </div>

            <div className="d-grid gap-2">
              <button 
                className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center"
                onClick={handleExportLogs}
                disabled={logCount === 0}
              >
                <ModusIcon name="download" size="16px" extraClasses="me-2" />
                Download Logs (.txt)
              </button>
              <button 
                className="btn btn-outline-danger btn-sm d-flex align-items-center justify-content-center"
                onClick={handleClearLogs}
                disabled={logCount === 0}
              >
                <ModusIcon name="trash" size="16px" extraClasses="me-2" />
                Wis Geheugen
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
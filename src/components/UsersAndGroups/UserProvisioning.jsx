import React, { useState, useEffect } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react';
import ModusIcon from '../Modus/ModusIcon';
import { getProjectGroups, createProjectGroup, addUserToGroup, removeUserFromGroup, getGroupUsers } from '../../api/groupsApi';
import { addUserToProject, getUserByEmail } from '../../api/usersApi';
import { Logger } from '../../utils/logger';

const UserProvisioning = ({ projects, region }) => {
  const { getAccessTokenSilently } = useAuth();
  
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(''); 
  const [role, setRole] = useState('USER');
  const [sourceProjectId, setSourceProjectId] = useState('');
  
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [autoCreateGroups, setAutoCreateGroups] = useState(true);

  const [sourceGroups, setSourceGroups] = useState([]);
  const [selectedGroupNames, setSelectedGroupNames] = useState([]);
  const [targetProjectIds, setTargetProjectIds] = useState([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);

  const validateEmail = (mail) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(mail);
  };

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) {
      setEmailError('Voer een geldig e-mailadres in.');
    } else {
      setEmailError('');
    }
  };

  useEffect(() => {
    const fetchGroups = async () => {
      if (!sourceProjectId) {
        setSourceGroups([]);
        return;
      }
      const token = await getAccessTokenSilently();
      const groups = await getProjectGroups(token, region, sourceProjectId);
      setSourceGroups(groups || []);
      setSelectedGroupNames([]); 
    };
    fetchGroups();
  }, [sourceProjectId, region, getAccessTokenSilently]);

  const toggleTargetProject = (id) => {
    setTargetProjectIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  };

  const toggleGroupName = (name) => {
    setSelectedGroupNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message, type }]);
  };

  const exportLogs = () => {
    if (logs.length === 0) return;
    const logText = logs.map(l => `[${l.time}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trimble_provisioning_log_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // DE VERNIEUWDE STATE-SYNC LOGICA
  const handleExecute = async () => {
    if (!validateEmail(email)) {
      setEmailError('Voer een geldig e-mailadres in.');
      return;
    }
    setEmailError('');

    if (targetProjectIds.length === 0 || selectedGroupNames.length === 0) {
      alert("Kies minimaal één groep en minimaal één doel-project!");
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    addLog(`Start onboarding sync voor ${email}...`, 'primary');

    try {
      const token = await getAccessTokenSilently();

      for (const projectId of targetProjectIds) {
        const projName = projects.find(p => p.id === projectId)?.name || projectId;
        addLog(`--- Verwerk project: ${projName} ---`);

        // 1. BEPAAL PROJECT LIDMAATSCHAP
        let user = await getUserByEmail(token, region, projectId, email);
        if (user) {
          addLog(`ℹ️ Gebruiker is al lid van project. Controleer groepen...`, 'info');
        } else {
          user = await addUserToProject(token, region, projectId, email, role, sendInviteEmail);
          if (!user || !user.id) {
            addLog(`❌ Fout bij toevoegen aan project ${projName}.`, 'danger');
            continue; 
          }
          addLog(`✅ Nieuwe gebruiker succesvol aan project toegevoegd.`, 'success');
        }

        // 2. GROEPEN SYNCEN (Bestaande groepen)
        const targetGroups = await getProjectGroups(token, region, projectId);
        
        for (const targetGroup of targetGroups) {
          const isDesiredGroup = selectedGroupNames.some(sgn => sgn.toLowerCase() === targetGroup.name.toLowerCase());
          
          // Kijk of de gebruiker in deze groep zit
          const groupUsers = await getGroupUsers(token, region, targetGroup.id);
          const isInGroup = groupUsers.some(u => u.id === user.id);

          if (isDesiredGroup && !isInGroup) {
            // Moet er in, maar zit er niet in -> TOEVOEGEN
            const success = await addUserToGroup(token, region, targetGroup.id, user.id);
            if (success) addLog(`✅ Toegevoegd aan groep: "${targetGroup.name}".`, 'success');
            else addLog(`❌ Fout bij toevoegen aan groep "${targetGroup.name}".`, 'warning');
          
          } else if (!isDesiredGroup && isInGroup) {
            // Zit er in, maar hoort er NIET in -> VERWIJDEREN (Cleanup)
            const success = await removeUserFromGroup(token, region, targetGroup.id, user.id);
            if (success) addLog(`🧹 Verwijderd uit ongewenste groep: "${targetGroup.name}".`, 'info');
            else addLog(`❌ Fout bij verwijderen uit groep "${targetGroup.name}".`, 'warning');
          }
        }

        // 3. GROEPEN AANMAKEN (Sjabloongroepen die nog helemaal niet bestaan in het doelproject)
        for (const desiredGroupName of selectedGroupNames) {
          const existsInTarget = targetGroups.some(g => g.name.toLowerCase() === desiredGroupName.toLowerCase());
          
          if (!existsInTarget) {
            if (autoCreateGroups) {
              addLog(`Groep "${desiredGroupName}" ontbreekt. Bezig met aanmaken...`, 'info');
              const newGroup = await createProjectGroup(token, region, projectId, desiredGroupName);
              
              if (newGroup) {
                const success = await addUserToGroup(token, region, newGroup.id, user.id);
                if (success) addLog(`✅ Aangemaakt en toegevoegd aan: "${desiredGroupName}".`, 'success');
                else addLog(`❌ Groep "${desiredGroupName}" aangemaakt, maar kon gebruiker niet toevoegen.`, 'warning');
              } else {
                addLog(`❌ Kon groep "${desiredGroupName}" niet aanmaken.`, 'danger');
              }
            } else {
              addLog(`⚠️ Groep "${desiredGroupName}" bestaat niet. Overgeslagen.`, 'warning');
            }
          }
        }
      }
      addLog("🎉 Onboarding Sync voltooid!", 'success');
    } catch (error) {
      addLog(`Kritieke fout: ${error.message}`, 'danger');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="user-provisioning row g-4">
      <div className="col-lg-8">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Bedrijfsbrede Onboarding (Template Methode)</h5>
          </div>
          <div className="card-body">
            
            <h6 className="text-primary mb-3">1. Medewerker Details</h6>
            <div className="row g-3 mb-3">
              <div className="col-md-8">
                <label className="form-label small text-muted">E-mailadres (Trimble ID)</label>
                <input 
                  type="email" 
                  className={`form-control ${emailError ? 'is-invalid' : ''}`} 
                  value={email} 
                  onChange={e => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError('');
                  }} 
                  onBlur={handleEmailBlur}
                  placeholder="naam@bedrijf.nl" 
                  disabled={isProcessing} 
                />
                {emailError && <div className="invalid-feedback">{emailError}</div>}
              </div>
              <div className="col-md-4">
                <label className="form-label small text-muted">Project Rol</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)} disabled={isProcessing}>
                  <option value="USER">User (Standaard)</option>
                  <option value="ADMIN">Admin (Beheerder)</option>
                </select>
              </div>
            </div>

            <div className="bg-light p-3 rounded mb-4 border">
              <div className="form-check form-switch mb-2">
                <input className="form-check-input" type="checkbox" role="switch" id="notifySwitch" checked={sendInviteEmail} onChange={() => setSendInviteEmail(!sendInviteEmail)} disabled={isProcessing} />
                <label className="form-check-label small" htmlFor="notifySwitch">Stuur uitnodigings e-mail naar gebruiker</label>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" role="switch" id="createGroupSwitch" checked={autoCreateGroups} onChange={() => setAutoCreateGroups(!autoCreateGroups)} disabled={isProcessing} />
                <label className="form-check-label small" htmlFor="createGroupSwitch">Creëer ontbrekende groepen automatisch in doelprojecten</label>
              </div>
            </div>

            <h6 className="text-primary mb-3">2. Kies Sjabloon & Groepen</h6>
            <div className="mb-4">
              <select className="form-select mb-3" value={sourceProjectId} onChange={e => setSourceProjectId(e.target.value)} disabled={isProcessing}>
                <option value="">-- Selecteer een bronproject --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {sourceGroups.length > 0 && (
                <div className="border p-3 rounded">
                  <label className="form-label small fw-bold">Selecteer de gewenste groepen uit dit sjabloon:</label>
                  <div className="d-flex flex-wrap gap-3 mt-2">
                    {sourceGroups.map(g => (
                      <div className="form-check" key={g.id}>
                        <input className="form-check-input" type="checkbox" id={`group-${g.id}`} checked={selectedGroupNames.includes(g.name)} onChange={() => toggleGroupName(g.name)} disabled={isProcessing} />
                        <label className="form-check-label" htmlFor={`group-${g.id}`}>{g.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <h6 className="text-primary mb-3">3. Pas toe op deze projecten</h6>
            <div className="border rounded p-3 mb-4 bg-light" style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {projects.map(p => (
                <div className="form-check border-bottom pb-2 mb-2" key={p.id}>
                  <input className="form-check-input" type="checkbox" id={`target-${p.id}`} checked={targetProjectIds.includes(p.id)} onChange={() => toggleTargetProject(p.id)} disabled={isProcessing} />
                  <label className="form-check-label d-block" htmlFor={`target-${p.id}`}>
                    {p.name} <span className="text-muted small float-end">{p.id}</span>
                  </label>
                </div>
              ))}
            </div>

            <button 
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center py-2" 
              onClick={handleExecute}
              disabled={isProcessing || targetProjectIds.length === 0 || selectedGroupNames.length === 0}
            >
              {isProcessing ? (
                <><div className="spinner-border spinner-border-sm me-2"></div> Configureren...</>
              ) : (
                <><ModusIcon name="rocket" type="duotone" size="20px" extraClasses="me-2" /> Start Onboarding</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="col-lg-4">
        <div className="card shadow-sm border-0 h-100 bg-dark text-white">
          <div className="card-header border-secondary d-flex justify-content-between align-items-center">
            <h6 className="mb-0">Uitvoer Logboek</h6>
            
            <div className="d-flex align-items-center">
              {logs.length > 0 && (
                
                <button 
                  className="btn btn-sm btn-secondary me-3 py-0 px-2 d-flex align-items-center" 
                  onClick={exportLogs} 
                  title="Exporteer als .txt"
                >
                  <ModusIcon name="download-simple" type="duotone" size="14px" extraClasses="me-1" />
                  Export
                </button>
              )}
              <span className="badge bg-secondary">{logs.length} events</span>
            </div>
            
          </div>
          <div className="card-body" style={{ maxHeight: '700px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.85rem' }}>
            {logs.length === 0 ? (
              <div className="text-center text-muted mt-5">Wachtend op invoer...</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className={`mb-2 text-${log.type}`}>
                  <span className="text-secondary">[{log.time}]</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProvisioning;
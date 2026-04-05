import React, { useState, useEffect } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react';
import ModusIcon from '../Modus/ModusIcon';
import { getProjectGroups, createProjectGroup, addUserToGroup, removeUserFromGroup, getGroupUsers } from '../../api/groupsApi';
import { addUserToProject, getUserByEmail, getProjectUsers, getUserDetails } from '../../api/usersApi';
import { Logger } from '../../utils/logger';
import ConfirmModal from '../Modus/ConfirmModal';

const UserProvisioning = ({ projects, region }) => {
  const { getAccessTokenSilently } = useAuth();
  
  // -- BASIS STATE --
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState(''); 
  const [sourceProjectId, setSourceProjectId] = useState('');
  
  const [sendInviteEmail, setSendInviteEmail] = useState(() => JSON.parse(localStorage.getItem('trimble_send_invite') ?? 'true'));
  const [autoCreateGroups, setAutoCreateGroups] = useState(() => JSON.parse(localStorage.getItem('trimble_auto_create_groups') ?? 'true'));
  const [role, setRole] = useState(() => localStorage.getItem('trimble_default_role') || 'USER');

  const [sourceGroups, setSourceGroups] = useState([]);
  const [selectedGroupNames, setSelectedGroupNames] = useState([]);
  const [targetProjectIds, setTargetProjectIds] = useState([]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // -- STATE VOOR COPY USER --
  const [projectUsers, setProjectUsers] = useState([]); 
  const [selectedSourceUserId, setSelectedSourceUserId] = useState(''); 
  const [sourceUserDetails, setSourceUserDetails] = useState(null); 

  // -- NIEUW: STATE VOOR DE INNER CIRCLE --
  const [innerCircleUsers, setInnerCircleUsers] = useState([]);
  const [isLoadingInnerCircle, setIsLoadingInnerCircle] = useState(false);

  // 1. Haal de "Inner Circle" op de achtergrond op
  useEffect(() => {
    const fetchInnerCircle = async () => {
      if (!projects || projects.length === 0) return;
      setIsLoadingInnerCircle(true);
      
      try {
        const token = window.trimbleSandboxToken || await getAccessTokenSilently();
        
        // Sorteer de bestaande projecten lokaal op 'lastVisitedOn' of 'modifiedOn' (nieuwste eerst)
        const recentProjects = [...projects].sort((a, b) => {
          const dateA = new Date(a.lastVisitedOn || a.modifiedOn || 0).getTime();
          const dateB = new Date(b.lastVisitedOn || b.modifiedOn || 0).getTime();
          return dateB - dateA;
        }).slice(0, 5); // Pak alleen de top 5

        const allUsers = [];
        const seenIds = new Set();

        // Haal de gebruikers op voor deze 5 projecten
        for (const proj of recentProjects) {
          try {
            const users = await getProjectUsers(token, region, proj.id);
            users.forEach(u => {
              if (!seenIds.has(u.id)) {
                seenIds.add(u.id);
                // Bewaar ook in welk project we deze persoon vonden, dit is straks onze 'Source'!
                allUsers.push({ ...u, foundInProjectId: proj.id, foundInProjectName: proj.name });
              }
            });
          } catch(e) {
            // Negeer individuele project-foutjes stilzwijgend
          }
        }
        
        // Sorteer het uiteindelijke lijstje netjes op voornaam (A-Z)
        allUsers.sort((a, b) => a.firstName.localeCompare(b.firstName));
        setInnerCircleUsers(allUsers);
        
      } catch(error) {
        Logger.warn("Kon inner circle niet ophalen", error);
      } finally {
        setIsLoadingInnerCircle(false);
      }
    };
    
    fetchInnerCircle();
  }, [projects, region, getAccessTokenSilently]);

  // 2. Ophalen van gebruikers en groepen als er een (handmatig) bronproject wordt gekozen
  useEffect(() => {
    const fetchTemplateData = async () => {
      if (!sourceProjectId) {
        setSourceGroups([]);
        setProjectUsers([]);
        return;
      }
      try {
        const token = window.trimbleSandboxToken || await getAccessTokenSilently();
        const groups = await getProjectGroups(token, region, sourceProjectId);
        setSourceGroups(groups || []);
        setSelectedGroupNames([]); 
        
        const users = await getProjectUsers(token, region, sourceProjectId);
        setProjectUsers(users || []);
      } catch (error) {
        Logger.error("Fout bij ophalen sjabloon data:", error);
      }
    };
    fetchTemplateData();
  }, [sourceProjectId, region, getAccessTokenSilently]);

  // 3. Haal de diepe details op als er een bron-gebruiker is geselecteerd
  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!selectedSourceUserId || !sourceProjectId) {
        setSourceUserDetails(null);
        return;
      }
      try {
        const token = window.trimbleSandboxToken || await getAccessTokenSilently();
        const details = await getUserDetails(token, region, sourceProjectId, selectedSourceUserId);
        setSourceUserDetails(details);
        
        // DIT IS DE BELANGRIJKE LOG VOOR DE VOLGENDE STAP:
        Logger.info("GEVONDEN USER DETAILS VOOR COPY:", details);

      } catch (error) {
        Logger.error("Fout bij ophalen user details:", error);
      }
    };
    fetchUserDetails();
  }, [selectedSourceUserId, sourceProjectId, region, getAccessTokenSilently]);

  const validateEmail = (mail) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

  const handleEmailBlur = () => {
    if (email && !validateEmail(email)) setEmailError('Voer een geldig e-mailadres in.');
    else setEmailError('');
  };

  const toggleTargetProject = (id) => setTargetProjectIds(prev => prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]);
  const toggleGroupName = (name) => setSelectedGroupNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);

  const handleOpenConfirm = () => {
    if (!validateEmail(email)) {
      setEmailError('Voer een geldig e-mailadres in.');
      return;
    }
    if (targetProjectIds.length === 0 || selectedGroupNames.length === 0) {
      alert("Kies minimaal één groep en minimaal één doel-project!");
      return;
    }
    setIsConfirmOpen(true);
  };

  const handleExecute = async () => {
    setIsConfirmOpen(false);
    setIsProcessing(true);
    Logger.info(`Start onboarding sync voor ${email}...`);

    try {
      const token = window.trimbleSandboxToken || await getAccessTokenSilently();

      for (const projectId of targetProjectIds) {
        const projName = projects.find(p => p.id === projectId)?.name || projectId;
        Logger.info(`--- Verwerk project: ${projName} ---`);

        // 1. BEPAAL PROJECT LIDMAATSCHAP
        let user = await getUserByEmail(token, region, projectId, email);
        if (user) {
          Logger.info(`Gebruiker is al lid van project. Controleer groepen...`);
        } else {
          user = await addUserToProject(token, region, projectId, email, role, sendInviteEmail);
          if (!user || !user.id) {
            Logger.error(`Fout bij toevoegen aan project ${projName}.`);
            continue; 
          }
          Logger.info(`Nieuwe gebruiker succesvol aan project toegevoegd.`);
        }

        // 2. GROEPEN SYNCEN (Bestaande groepen)
        const targetGroups = await getProjectGroups(token, region, projectId);
        
        for (const targetGroup of targetGroups) {
          const isDesiredGroup = selectedGroupNames.some(sgn => sgn.toLowerCase() === targetGroup.name.toLowerCase());
          const groupUsers = await getGroupUsers(token, region, targetGroup.id);
          const isInGroup = groupUsers.some(u => u.id === user.id);

          if (isDesiredGroup && !isInGroup) {
            const success = await addUserToGroup(token, region, targetGroup.id, user.id);
            if (success) Logger.info(`Toegevoegd aan groep: "${targetGroup.name}".`);
            else Logger.warn(`Fout bij toevoegen aan groep "${targetGroup.name}".`);
          } else if (!isDesiredGroup && isInGroup) {
            const success = await removeUserFromGroup(token, region, targetGroup.id, user.id);
            if (success) Logger.info(`Verwijderd uit ongewenste groep: "${targetGroup.name}".`);
            else Logger.warn(`Fout bij verwijderen uit groep "${targetGroup.name}".`);
          }
        }

        // 3. GROEPEN AANMAKEN
        for (const desiredGroupName of selectedGroupNames) {
          const existsInTarget = targetGroups.some(g => g.name.toLowerCase() === desiredGroupName.toLowerCase());
          
          if (!existsInTarget) {
            if (autoCreateGroups) {
              Logger.info(`Groep "${desiredGroupName}" ontbreekt. Bezig met aanmaken...`);
              const newGroup = await createProjectGroup(token, region, projectId, desiredGroupName);
              
              if (newGroup) {
                const success = await addUserToGroup(token, region, newGroup.id, user.id);
                if (success) Logger.info(`Aangemaakt en toegevoegd aan: "${desiredGroupName}".`);
                else Logger.warn(`Groep "${desiredGroupName}" aangemaakt, maar kon gebruiker niet toevoegen.`);
              } else {
                Logger.error(`Kon groep "${desiredGroupName}" niet aanmaken.`);
              }
            } else {
              Logger.warn(`Groep "${desiredGroupName}" bestaat niet. Overgeslagen.`);
            }
          }
        }
      }
      
      Logger.info("🎉 Onboarding Sync voltooid!");
      alert("Onboarding succesvol voltooid! Controleer de systeemlogs voor de details.");
      
    } catch (error) {
      Logger.error(`Kritieke fout: ${error.message}`);
      alert(`Er is een fout opgetreden: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="user-provisioning row g-4">
      {/* LINKERKOLOM: Configuratie */}
      <div className="col-lg-8">
        <div className="card shadow-sm border-0">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Bedrijfsbrede Onboarding</h5>
          </div>
          <div className="card-body">
            
            {/* STAP 1: KIES BRON (Met Inner Circle!) */}
            <h6 className="text-primary mb-3">1. Selecteer Rechten-sjabloon (Bron)</h6>
            <div className="bg-light p-3 rounded mb-4 border">
              
              <label className="form-label small fw-bold text-success d-flex align-items-center">
                <ModusIcon name="lightning" size="16px" extraClasses="me-1" /> Snel kopiëren (Inner Circle)
              </label>
              <div className="d-flex align-items-center mb-3">
                <select 
                  className="form-select border-success" 
                  value={innerCircleUsers.some(u => u.id === selectedSourceUserId) ? selectedSourceUserId : ""} 
                  onChange={e => {
                    const uid = e.target.value;
                    if (uid) {
                      const user = innerCircleUsers.find(u => u.id === uid);
                      // Magie: We zetten zowel de user ID als het bijbehorende Project ID!
                      setSourceProjectId(user.foundInProjectId);
                      setSelectedSourceUserId(uid);
                    } else {
                      setSelectedSourceUserId('');
                    }
                  }} 
                  disabled={isProcessing || isLoadingInnerCircle}
                >
                  <option value="">-- Kies een recente collega --</option>
                  {innerCircleUsers.map(u => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                  ))}
                </select>
                {isLoadingInnerCircle && <div className="spinner-border spinner-border-sm text-success ms-3" role="status"></div>}
              </div>

              <div className="text-center text-muted small mb-3">-- OF --</div>

              <label className="form-label small fw-bold">Zoek handmatig in specifiek project</label>
              <select className="form-select mb-3" value={sourceProjectId} onChange={e => {
                  setSourceProjectId(e.target.value);
                  setSelectedSourceUserId(''); // Reset gebruiker als we van project wisselen
                }} disabled={isProcessing}>
                <option value="">-- Kies een project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              {/* Toon de project users dropdown alleen als we via de handmatige flow gaan (en hij niet al is geselecteerd via de inner circle) */}
              {sourceProjectId && projectUsers.length > 0 && !innerCircleUsers.some(u => u.id === selectedSourceUserId) && (
                <>
                  <label className="form-label small fw-bold mt-2">Kies collega uit project</label>
                  <select className="form-select border-primary" value={selectedSourceUserId} onChange={e => setSelectedSourceUserId(e.target.value)} disabled={isProcessing}>
                    <option value="">-- Selecteer collega --</option>
                    {projectUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                    ))}
                  </select>
                </>
              )}
            </div>

            {/* STAP 2: DE NIEUWE GEBRUIKER */}
            <h6 className="text-primary mb-3">2. Doel Medewerker Details</h6>
            <div className="row g-3 mb-4">
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
                <label className="form-label small text-muted">Standaard Project Rol</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)} disabled={isProcessing}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {/* STAP 3: VINKJES */}
            <h6 className="text-primary mb-3">3. Toepassen op deze data</h6>
            
            <div className="row">
              <div className="col-md-6">
                 {/* Groepen */}
                <div className="border rounded p-3 mb-4 h-100">
                  <label className="form-label small fw-bold mb-2 border-bottom pb-2 d-block">Te koppelen groepen:</label>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {sourceGroups.length === 0 ? (
                      <span className="text-muted small">Kies eerst een bron in stap 1.</span>
                    ) : sourceGroups.map(g => (
                      <div className="form-check" key={g.id}>
                        <input className="form-check-input" type="checkbox" id={`group-${g.id}`} checked={selectedGroupNames.includes(g.name)} onChange={() => toggleGroupName(g.name)} disabled={isProcessing} />
                        <label className="form-check-label small" htmlFor={`group-${g.id}`}>{g.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="col-md-6">
                {/* Projecten */}
                <div className="border rounded p-3 mb-4 h-100">
                  <label className="form-label small fw-bold mb-2 border-bottom pb-2 d-block">Aan deze projecten toevoegen:</label>
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {projects.map(p => (
                      <div className="form-check" key={p.id}>
                        <input className="form-check-input" type="checkbox" id={`target-${p.id}`} checked={targetProjectIds.includes(p.id)} onChange={() => toggleTargetProject(p.id)} disabled={isProcessing} />
                        <label className="form-check-label small" htmlFor={`target-${p.id}`}>
                          {p.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button 
              className="btn btn-primary w-100 d-flex align-items-center justify-content-center py-2 mt-2" 
              onClick={handleOpenConfirm}
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

      {/* RECHTERKOLOM: DE USER CARD */}
      <div className="col-lg-4">
        {sourceUserDetails ? (
          <div className="card shadow-sm border-primary h-100">
            <div className="card-header bg-primary text-white d-flex align-items-center">
              <ModusIcon name="user" size="18px" extraClasses="me-2 text-white" />
              Bron Gebruiker Details
            </div>
            <div className="card-body">
              
              <div className="text-center mb-4">
                {sourceUserDetails.thumbnail ? (
                  <img src={sourceUserDetails.thumbnail} alt="User" className="rounded-circle mb-3" style={{ width: '80px', height: '80px', objectFit: 'cover' }} />
                ) : (
                  <div className="bg-secondary rounded-circle d-inline-flex align-items-center justify-content-center text-white mb-3" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                    {sourceUserDetails.firstName?.charAt(0)}{sourceUserDetails.lastName?.charAt(0)}
                  </div>
                )}
                <h5 className="fw-bold mb-0">{sourceUserDetails.firstName} {sourceUserDetails.lastName}</h5>
                <span className="text-muted small">{sourceUserDetails.email}</span>
              </div>

              <div className="border-top pt-3">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Status</span>
                  <span className="badge bg-success">{sourceUserDetails.status}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">Rol (in {projects.find(p=>p.id===sourceProjectId)?.name})</span>
                  <span className="fw-bold small">{sourceUserDetails.role || 'ONBEKEND'}</span>
                </div>
              </div>

            </div>
          </div>
        ) : (
          <div className="card shadow-sm border-0 h-100 bg-light d-flex align-items-center justify-content-center text-center p-4">
            <ModusIcon name="user" size="48px" extraClasses="text-secondary mb-3 opacity-50" />
            <p className="text-muted small">
              Selecteer een collega via de 'Snel kopiëren' of project-lijst om zijn of haar rechtenprofiel in te zien.
            </p>
          </div>
        )}
      </div>

      {/* BEVESTIGING MODAL */}
      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Onboarding Bevestigen"
        message={`Je gaat ${email} toevoegen aan ${targetProjectIds.length} projecten en ${selectedGroupNames.length} groepen. Weet je zeker dat je wilt doorgaan?`}
        confirmText="Ja, voer uit"
        cancelText="Annuleren"
        variant="primary" 
        onConfirm={handleExecute}
        onCancel={() => setIsConfirmOpen(false)}
      />

    </div>
  );
};

export default UserProvisioning;
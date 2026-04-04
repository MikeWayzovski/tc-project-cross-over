import React, { useState, useEffect } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react'; 
import trimbleLogo from './assets/trimble.svg';

import { useWorkspaceApi } from './utils/useWorkspaceApi';
import { Logger } from './utils/logger';

import ModusIconButton from './components/Modus/ModusIconButton';
import ModusSidebar from './components/Modus/ModusSidebar';
import ModusFooter from './components/Modus/ModusFooter'; 
import ModusIcon from './components/Modus/ModusIcon';

import UserMenu from './components/UsersAndGroups/UserMenu';
import GroupCanvas from './components/UsersAndGroups/GroupCanvas';
import UserProvisioning from './components/UsersAndGroups/UserProvisioning';

import ProjectToolbar from './components/Projects/ProjectToolbar'; 
import ProjectGrid from './components/Projects/ProjectGrid';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetails from './components/Projects/ProjectDetails';
import ProjectCloneWizard from './components/Projects/ProjectCloneWizard'; 

import { getProjects, cloneProject, getCloneStatus } from './api/projectsApi';
import { getAllAccountGroups, getAllGroupsWithUsers } from './api/groupsApi';
import Settings from './components/Settings/Settings';

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth(); 
  const { isEmbedded, workspaceApi, embeddedToken, embeddedProject } = useWorkspaceApi();
  
  // -- STATE MANAGEMENT --
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); 
  const [region, setRegion] = useState('Europa');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [progress, setProgress] = useState(null); 
  
  const [projects, setProjects] = useState([]);
  const [groups, setGroups] = useState([]);
  
  const [activePage, setActivePage] = useState('projects'); 
  const [selectedProject, setSelectedProject] = useState(null);
  
  const [cloningProject, setCloningProject] = useState(null);

  // -- LOGICA & FUNCTIES --
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const openProject = (project) => {
    setSelectedProject(project);
    setCloningProject(null); 
  };

  const handleCloneSubmit = async (cloneData) => {
    Logger.info("Kloon data ontvangen uit wizard:", cloneData);
    
    setCloningProject(null); 
    setIsLoading(true);
    setLoadingText(`Kloon-opdracht indienen...`);

    try {
      const token = await getValidToken();
      // 1. Start de kloon
      const cloneResponse = await cloneProject(token, region, cloneData);
      const cloneId = cloneResponse.cloneId;
      
      Logger.info("Kloon-opdracht in de wachtrij:", cloneId);

      // 2. Start het pollen (elke 5 seconden)
      const pollInterval = setInterval(async () => {
        try {
          const statusUpdate = await getCloneStatus(token, region, cloneId);
          Logger.info(`Pollen... status voor ${cloneId} is nu: ${statusUpdate.status}`);

          // Controleer op de juiste statussen uit de Trimble documentatie
          if (statusUpdate.status === 'DONE') {
            clearInterval(pollInterval); // Stop met pollen
            setIsLoading(false);
            setLoadingText('');
            
            const newProjectId = statusUpdate.result?.projectId;
            alert(`Project '${cloneData.newProjectName}' is succesvol aangemaakt!`);
            
            // Ververs de lijst
            await loadProjects();
            
          } else if (statusUpdate.status === 'ERROR') {
            clearInterval(pollInterval); // Stop met pollen
            setIsLoading(false);
            setLoadingText('');
            
            const errorMsg = statusUpdate.error?.message || "Onbekende fout";
            Logger.error(`Klonen mislukt bij Trimble. Reden: ${errorMsg}`);
            alert(`Het klonen is mislukt aan de kant van Trimble.\nReden: ${errorMsg}`);
            
          } else {
            // Hij is dus QUEUED of PROCESSING
            let uiStatus = statusUpdate.status === 'QUEUED' ? 'In de wachtrij...' : 'Trimble is aan het kopiëren...';
            setLoadingText(`Bezig met klonen (${uiStatus})`);
          }
        } catch (pollError) {
          // Haal de echte boodschap uit de error
          Logger.error("Fout tijdens pollen van API:", pollError.message, pollError.stack);
          // We stoppen het pollen NIET direct bij één netwerkfoutje, 
          // we wachten gewoon de volgende 5 seconden af (misschien hikte het netwerk even).
        }
      }, 5000);

    } catch (error) {
      Logger.error("Fout bij starten van kloon:", error.message, error.stack);
      setIsLoading(false);
      setLoadingText('');
      alert(`Er is een fout opgetreden bij het indienen van de opdracht: ${error.message}`);
    }
  };

  useEffect(() => {
    if (embeddedProject) {
      const projectRegion = embeddedProject.location || embeddedProject.region; 
      
      if (projectRegion) {
        let mappedRegion = 'Europa';
        if (projectRegion.toLowerCase() === 'asia') mappedRegion = 'Azië';
        if (projectRegion.toLowerCase() === 'aus') mappedRegion = 'Australië';
        if (projectRegion.toLowerCase() === 'na') mappedRegion = 'Noord-Amerika';
        
        setRegion(mappedRegion);
        Logger.info(`Regio automatisch ingesteld op ${mappedRegion} via embedded project.`);
      }
    }
  }, [embeddedProject]);

  const getValidToken = async () => {
    let token = null;
    if (isEmbedded && embeddedToken) {
      token = embeddedToken;
    } else if (isAuthenticated) {
      token = await getAccessTokenSilently();
    }
    
    if (token) {
      window.trimbleSandboxToken = token; 
      return token;
    }
    throw new Error("Geen geldig token beschikbaar.");
  };

  useEffect(() => {
    const fetchGroups = async () => {
      const hasAccess = isAuthenticated || (isEmbedded && embeddedToken);
      
      if (hasAccess && activePage === 'groups') {
        setIsLoading(true);
        setLoadingText("Alle bedrijfs-groepen in kaart brengen...");
        setProgress(0);

        try {
          const token = await getValidToken();
          const allGroups = await getAllAccountGroups(token, region, (p) => setProgress(p));
          setGroups(allGroups);
        } catch (error) {
          Logger.error("Fout bij ophalen bedrijfsbrede groepen:", error);
        } finally {
          setIsLoading(false);
          setLoadingText("");
          setTimeout(() => setProgress(null), 1000);
        }
      }
    };
    fetchGroups();
  }, [activePage, isAuthenticated, embeddedToken, isEmbedded, region]);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const loadProjects = async () => {
    const hasAccess = isAuthenticated || (isEmbedded && embeddedToken);
    if (!hasAccess) return;
    
    if (isEmbedded) {
      if (!embeddedProject) {
        Logger.info("Wachten op project details voordat we de lijst laden...");
        return;
      }

      const projLoc = (embeddedProject.location || embeddedProject.region || '').toLowerCase();
      let expectedRegion = 'Europa';
      if (projLoc === 'asia') expectedRegion = 'Azië';
      if (projLoc === 'aus') expectedRegion = 'Australië';
      if (projLoc === 'na') expectedRegion = 'Noord-Amerika';

      if (region !== expectedRegion) {
        Logger.warn(`Tijdelijke stop: React state (${region}) loopt nog fractie achter op Trimble (${expectedRegion}). Wachten...`);
        return; 
      }
    }

    setIsLoading(true);
    setLoadingText(`Projecten ophalen uit ${region}...`);
    
    try {
      const token = await getValidToken();
      const fetchedProjects = await getProjects(token, region);
      
      if (Array.isArray(fetchedProjects)) {
        setProjects(fetchedProjects);
      } else if (fetchedProjects && Array.isArray(fetchedProjects.data)) {
        setProjects(fetchedProjects.data); 
      } else {
        setProjects([]);
      }
    } catch (error) {
      Logger.error("Fout bij ophalen projecten:", error);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  useEffect(() => {
    if (activePage === 'projects') {
      loadProjects();
    }
  }, [isAuthenticated, embeddedToken, isEmbedded, region, activePage, embeddedProject]);

  const hasAccess = isAuthenticated || (isEmbedded && embeddedToken);
  if (!hasAccess && !isEmbedded) {
    return <div className="p-5 text-center">Wachten op authenticatie...</div>;
  }

  return (
    <div className="modus-layout">
      {!isEmbedded && (
        <nav className="navbar navbar-expand-lg modus-header bg-primary">
          <div className="container-fluid align-items-center">
            <div className="d-flex align-items-center">
              <ModusIconButton icon="menu" onClick={toggleSidebar} ariaLabel="Menu" extraClasses="text-white me-3" />
              <a className="navbar-brand d-flex align-items-center text-white m-0" href="/">
                <img src={trimbleLogo} alt="Trimble Logo" height="28" className="me-2" />
                <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>Trimble Sand Box</span>
              </a>
            </div>
          </div>
        </nav>
      )}

      <div className={`modus-body sidebar-open ${!isSidebarOpen || isEmbedded ? 'mini-sidebar-active' : ''}`}>
        
        {!isEmbedded && (
          <ModusSidebar 
            isOpen={isSidebarOpen} 
            activePage={activePage} 
            onPageChange={(id) => { 
              setActivePage(id); 
              setSelectedProject(null); 
              setCloningProject(null); 
            }} 
          />
        )}

        <div className="modus-content-rows" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          
          {isEmbedded && (
            <div className="bg-light border-bottom px-3 pt-2">
              <ul className="nav nav-tabs border-bottom-0">
                <li className="nav-item">
                  <button className={`nav-link text-dark ${activePage === 'projects' ? 'active fw-bold' : ''}`} onClick={() => { setActivePage('projects'); setSelectedProject(null); setCloningProject(null); }}>Projecten</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link text-dark ${activePage === 'users' ? 'active fw-bold' : ''}`} onClick={() => { setActivePage('users'); setSelectedProject(null); setCloningProject(null); }}>Gebruikers</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link text-dark ${activePage === 'groups' ? 'active fw-bold' : ''}`} onClick={() => { setActivePage('groups'); setSelectedProject(null); setCloningProject(null); }}>Groepen</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link text-dark ${activePage === 'settings' ? 'active fw-bold' : ''}`} onClick={() => { setActivePage('settings'); setSelectedProject(null); setCloningProject(null); }}>Instellingen</button>
                </li>
              </ul>
            </div>
          )}

          {activePage === 'projects' && !selectedProject && !cloningProject && (
            <ProjectToolbar 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              region={region} 
              setRegion={setRegion} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery}
              onRefresh={loadProjects} 
              isEmbedded={isEmbedded} 
            />
          )}

          <div className="modus-content-columns" style={{ flexGrow: 1, overflow: 'hidden' }}>
            <div className="modus-content" style={{ overflowY: 'auto', height: '100%', padding: '20px' }}>
              
              {activePage === 'projects' && (
                <>
                  {cloningProject ? (
                    <ProjectCloneWizard 
                      sourceProject={cloningProject} 
                      onClose={() => setCloningProject(null)} 
                      onClone={handleCloneSubmit} 
                    />
                  ) : selectedProject ? (
                    <ProjectDetails 
                      project={selectedProject} 
                      region={region} 
                      onBack={() => setSelectedProject(null)} 
                    />
                  ) : (
                    viewMode === 'grid' ? (
                      <ProjectGrid 
                        projects={projects} 
                        searchQuery={searchQuery} 
                        onProjectClick={openProject} 
                        onCloneClick={(p) => setCloningProject(p)} 
                      />
                    ) : (
                      <ProjectList 
                        projects={projects} 
                        searchQuery={searchQuery} 
                        onProjectClick={openProject} 
                        onCloneClick={(p) => setCloningProject(p)} 
                      />
                    )
                  )}
                </>
              )}

              {activePage === 'users' && <UserProvisioning projects={projects} region={region} />}
              
              {activePage === 'groups' && (
                <div className="d-flex flex-column h-100">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h3 className="mb-0">Bedrijfsbrede Groepen Audit</h3>
                    </div>
                  </div>
                  <div style={{ flexGrow: 1, overflowY: 'auto' }}>
                    <GroupCanvas groups={groups} isLoading={isLoading && groups.length === 0} />
                  </div>
                </div>
              )}
              
              {activePage === 'settings' && (
                <Settings 
                  isDarkMode={isDarkMode} 
                  setIsDarkMode={setIsDarkMode} 
                />
              )}
            
            </div>
          </div>
          <ModusFooter isLoading={isLoading} loadingText={loadingText} progress={progress} />
        </div>
      </div>
    </div>
  );
}

export default App;
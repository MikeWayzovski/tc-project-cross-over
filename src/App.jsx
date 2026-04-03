// Importeer je vernieuwde API's en de nieuwe hook!

import { useWorkspaceApi } from './utils/useWorkspaceApi';
import { Logger } from './utils/logger';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react'; 
import trimbleLogo from './assets/trimble.svg';

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

import { getProjects } from './api/projectsApi';
import { getAllAccountGroups, getAllGroupsWithUsers } from './api/groupsApi';

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth(); 
  
  const { isEmbedded, workspaceApi, embeddedToken, embeddedProject } = useWorkspaceApi();
  
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

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const openProject = (project) => {
    setSelectedProject(project);
  };

useEffect(() => {
    if (embeddedProject) {
      // Afhankelijk van de exacte benaming in de ConnectProject interface, is dit vaak 'location' of 'region'.
      // We loggen hem al via de Logger, dus je kunt in de console precies zien hoe de property heet!
      const projectRegion = embeddedProject.location || embeddedProject.region; 
      
      if (projectRegion) {
        // Zorg dat de API regiokey overeenkomt met jouw mapping (bijv. 'eu' -> 'Europa')
        let mappedRegion = 'Europa';
        if (projectRegion.toLowerCase() === 'asia') mappedRegion = 'Azië';
        if (projectRegion.toLowerCase() === 'aus') mappedRegion = 'Australië';
        if (projectRegion.toLowerCase() === 'na') mappedRegion = 'Noord-Amerika';
        
        setRegion(mappedRegion);
        Logger.info(`Regio automatisch ingesteld op ${mappedRegion} via embedded project.`);
      }
    }
  }, [embeddedProject]);


  // DE FIX VOOR AUTH IMAGE: Sla het actieve token globaal op
  const getValidToken = async () => {
    let token = null;
    if (isEmbedded && embeddedToken) {
      token = embeddedToken;
    } else if (isAuthenticated) {
      token = await getAccessTokenSilently();
    }
    
    if (token) {
      window.trimbleSandboxToken = token; // Sla op voor AuthImage.jsx!
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
    
    // HIER IS DE SLAGBOOM: Als we in Trimble draaien, maar we weten de regio nog niet... WACHT!
    if (isEmbedded && !embeddedProject) {
      Logger.info("Wachten op project details voordat we de lijst laden...");
      return;
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

  const handleExportGroupsCSV = async () => { /* Je huidige CSV logica hier */ };

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
      {/* HEADER: Alleen lokaal zichtbaar */}
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

      {/* BODY */}
      <div className={`modus-body sidebar-open ${!isSidebarOpen || isEmbedded ? 'mini-sidebar-active' : ''}`}>
        
        {/* ZIJBALK: Alleen lokaal zichtbaar */}
        {!isEmbedded && (
          <ModusSidebar isOpen={isSidebarOpen} activePage={activePage} onPageChange={(id) => { setActivePage(id); setSelectedProject(null); }} />
        )}

        <div className="modus-content-rows" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          
          {/* NIEUW: HORIZONTALE NAVIGATIE (Alleen zichtbaar als we in Trimble Connect draaien) */}
          {isEmbedded && (
            <div className="bg-light border-bottom px-3 pt-2">
              <ul className="nav nav-tabs border-bottom-0">
                <li className="nav-item">
                  <button className={`nav-link text-dark ${activePage === 'projects' ? 'active fw-bold' : ''}`} onClick={() => { setActivePage('projects'); setSelectedProject(null); }}>Projecten</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link text-dark ${activePage === 'users' ? 'active fw-bold' : ''}`} onClick={() => { setActivePage('users'); setSelectedProject(null); }}>Gebruikers</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link text-dark ${activePage === 'groups' ? 'active fw-bold' : ''}`} onClick={() => { setActivePage('groups'); setSelectedProject(null); }}>Groepen</button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link text-dark ${activePage === 'settings' ? 'active fw-bold' : ''}`} onClick={() => { setActivePage('settings'); setSelectedProject(null); }}>Instellingen</button>
                </li>
              </ul>
            </div>
          )}

          {activePage === 'projects' && !selectedProject && (
            <ProjectToolbar 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              region={region} 
              setRegion={setRegion} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery}
              onRefresh={loadProjects} 
              isEmbedded={isEmbedded} // VOEG DEZE REGEL TOE!
            />
          )}

          <div className="modus-content-columns" style={{ flexGrow: 1, overflow: 'hidden' }}>
            <div className="modus-content" style={{ overflowY: 'auto', height: '100%', padding: '20px' }}>
              
              {activePage === 'projects' && (
                <>
                  {selectedProject ? (
                    <ProjectDetails project={selectedProject} region={region} onBack={() => setSelectedProject(null)} />
                  ) : (
                    viewMode === 'grid' ? (
                      <ProjectGrid projects={projects} searchQuery={searchQuery} onProjectClick={openProject} />
                    ) : (
                      <ProjectList projects={projects} searchQuery={searchQuery} onProjectClick={openProject} />
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
              
              {activePage === 'settings' && <h3>Instellingen</h3>}
            
            </div>
          </div>
          <ModusFooter isLoading={isLoading} loadingText={loadingText} progress={progress} />
        </div>
      </div>
    </div>
  );
}

export default App;
import React, { useState, useEffect } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react'; 
import trimbleLogo from './assets/trimble.svg';
import ModusIconButton from './components/ModusIconButton';
import ModusSidebar from './components/ModusSidebar';
import UserMenu from './components/UserMenu';
import ProjectToolbar from './components/ProjectToolbar'; 
import ModusFooter from './components/ModusFooter'; 
import ProjectGrid from './components/ProjectGrid';
import ProjectList from './components/ProjectList';
import { getProjects } from './api/connectApi'; 

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth(); 
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); 
  const [region, setRegion] = useState('Europa');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  const [projects, setProjects] = useState([]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const [activePage, setActivePage] = useState('projects'); 
  const [selectedProject, setSelectedProject] = useState(null);

  const openProject = (project) => {
    setSelectedProject(project);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // De losgetrokken data fetch functie
  const loadProjects = async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setLoadingText(`Projecten ophalen uit ${region}...`);
    
    try {
      const token = await getAccessTokenSilently();
      const fetchedProjects = await getProjects(token, region);
      
      if (Array.isArray(fetchedProjects)) {
        setProjects(fetchedProjects);
      } else if (fetchedProjects && Array.isArray(fetchedProjects.data)) {
        setProjects(fetchedProjects.data); 
      } else {
        setProjects([]);
      }
    } catch (error) {
      console.error("Fout:", error);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  // Vuur de functie automatisch af als we op de projects pagina landen of van regio wisselen
  useEffect(() => {
    if (activePage === 'projects') {
      loadProjects();
    }
  }, [isAuthenticated, region, activePage, getAccessTokenSilently]); 

  return (
    <div className="modus-layout">
      {/* HEADER */}
      <nav className="navbar navbar-expand-lg modus-header bg-primary">
        <div className="container-fluid align-items-center">
          <div className="d-flex align-items-center">
            <ModusIconButton icon="menu" onClick={toggleSidebar} ariaLabel="Menu" extraClasses="text-white me-3" />
            <a className="navbar-brand d-flex align-items-center text-white m-0" href="/">
              <img src={trimbleLogo} alt="Trimble Logo" height="28" className="me-2" />
              <span style={{ fontSize: '1.25rem', fontWeight: '600' }}>Trimble Sand Box</span>
            </a>
          </div>
          <div className="d-flex align-items-center ms-auto">
            <ModusIconButton icon={isDarkMode ? "sun" : "moon"} onClick={() => setIsDarkMode(!isDarkMode)} ariaLabel="Thema" extraClasses="text-white me-2" />
            <ModusIconButton icon="apps" ariaLabel="Applicaties" extraClasses="text-white me-2" />
            <UserMenu />
          </div>
        </div>
      </nav>

      {/* BODY */}
      <div className={`modus-body sidebar-open ${!isSidebarOpen ? 'mini-sidebar-active' : ''}`}>
        <ModusSidebar 
          isOpen={isSidebarOpen} 
          activePage={activePage} 
          onPageChange={(id) => {
            setActivePage(id);
            setSelectedProject(null); 
          }} 
        />

        <div className="modus-content-rows" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          
          {activePage === 'projects' && !selectedProject && (
            <ProjectToolbar 
              viewMode={viewMode} 
              setViewMode={setViewMode} 
              region={region} 
              setRegion={setRegion} 
              searchQuery={searchQuery} 
              setSearchQuery={setSearchQuery}
              onRefresh={loadProjects} // HIER GEVEN WE DE FUNCTIE DOOR!
            />
          )}

          <div className="modus-content-columns" style={{ flexGrow: 1, overflow: 'hidden' }}>
            <div className="modus-content" style={{ overflowY: 'auto', height: '100%', padding: '20px' }}>
              
              {activePage === 'projects' && (
                <>
                  {selectedProject ? (
                    <div>
                      <button className="btn btn-link p-0 mb-3" onClick={() => setSelectedProject(null)}>
                        <ModusIcon name="arrow-left" type="duotone" size="16px" extraClasses="me-1" />
                        Terug naar overzicht
                      </button>
                      <h3>Project: {selectedProject.name}</h3>
                      <p className="text-muted">ID: {selectedProject.id}</p>
                    </div>
                  ) : (
                    viewMode === 'grid' ? (
                      <ProjectGrid projects={projects} searchQuery={searchQuery} onProjectClick={openProject} />
                    ) : (
                      <ProjectList projects={projects} searchQuery={searchQuery} onProjectClick={openProject} />
                    )
                  )}
                </>
              )}

              {activePage === 'users' && <h3>Bedrijfsbreed Gebruikersbeheer</h3>}
              {activePage === 'groups' && <h3>Organisatie van Gebruikersgroepen</h3>}
              {activePage === 'settings' && <h3>Instellingen</h3>}
            
            </div>
          </div>
          <ModusFooter isLoading={isLoading} loadingText={loadingText} progress={null} />
        </div>
      </div>
    </div>
  );
}

export default App;
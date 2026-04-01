import React, { useState, useEffect } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react'; // AUTH HOOK TOEGEVOEGD
import trimbleLogo from './assets/trimble.svg';
import ModusIconButton from './components/ModusIconButton';
import ModusSidebar from './components/ModusSidebar';
import UserMenu from './components/UserMenu';
import ProjectToolbar from './components/ProjectToolbar'; 
import ModusFooter from './components/ModusFooter'; 
import ProjectGrid from './components/ProjectGrid'; // NIEUW COMPONENT
import { getProjects } from './api/connectApi'; // API HELPER

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth(); // Pak auth gegevens
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activePage, setActivePage] = useState('home');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // Laten we starten op grid!
  const [region, setRegion] = useState('Europa');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  
  // Hier slaan we de projecten in op!
  const [projects, setProjects] = useState([]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // DE DATA FETCH LUS
  useEffect(() => {
    const fetchMyProjects = async () => {
      // Alleen ophalen als we ingelogd zijn en op de home pagina staan
      if (isAuthenticated && activePage === 'home') {
        setIsLoading(true);
        setLoadingText(`Projecten ophalen uit ${region}...`);
        
        try {
          const token = await getAccessTokenSilently();
          const fetchedProjects = await getProjects(token, region);
          
          // API Response veilig wegschrijven
          if (Array.isArray(fetchedProjects)) {
            setProjects(fetchedProjects);
          } else if (fetchedProjects && Array.isArray(fetchedProjects.data)) {
            setProjects(fetchedProjects.data); // Soms zit het in een .data object (zoals je minimal voorbeeld)
          } else {
            setProjects([]);
          }
        } catch (error) {
          console.error("Fout:", error);
        } finally {
          setIsLoading(false);
          setLoadingText('');
        }
      } else {
        // Niet ingelogd? Maak de lijst leeg.
        setProjects([]);
      }
    };

    fetchMyProjects();
  }, [isAuthenticated, region, activePage, getAccessTokenSilently]); // Vuur opnieuw af als regio verandert!

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
        <ModusSidebar isOpen={isSidebarOpen} activePage={activePage} onPageChange={setActivePage} />

        <div className="modus-content-rows" style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          
          {/* TOOLBAR */}
          {activePage === 'home' && (
            <ProjectToolbar viewMode={viewMode} setViewMode={setViewMode} region={region} setRegion={setRegion} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
          )}

          {/* CONTENT (SCROLLABLE) */}
          <div className="modus-content-columns" style={{ flexGrow: 1, overflow: 'hidden' }}>
            <div className="modus-content" style={{ overflowY: 'auto', height: '100%', padding: '20px' }}>
              
              {!isAuthenticated ? (
                <div className="alert alert-primary mt-3" role="alert">
                  Je moet inloggen via het poppetje rechtsboven om projecten te bekijken.
                </div>
              ) : activePage === 'home' ? (
                // Hier tekenen we het Grid! We kunnen later makkelijk schakelen naar een List op basis van viewMode
                viewMode === 'grid' ? (
                  <ProjectGrid projects={projects} searchQuery={searchQuery} />
                ) : (
                  <div className="alert alert-info mt-3">Lijstweergave wordt hier straks gebouwd!</div>
                )
              ) : (
                <h3>Content voor {activePage}</h3>
              )}
            
            </div>
          </div>

          <ModusFooter isLoading={isLoading} loadingText={loadingText} progress={null} />
        </div>
      </div>
    </div>
  );
}

export default App;
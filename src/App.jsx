import React, { useState, useEffect } from 'react';
import { useAuth } from '@trimble-oss/trimble-id-react'; 
import trimbleLogo from './assets/trimble.svg';
import ModusIconButton from './components/Modus/ModusIconButton';
import ModusSidebar from './components/Modus/ModusSidebar';
import UserMenu from './components/UserAndGroups/UserMenu';
import ProjectToolbar from './components/Projects/ProjectToolbar'; 
import ModusFooter from './components/Modus/ModusFooter'; 
import ProjectGrid from './components/Projects/ProjectGrid';
import ProjectList from './components/Projects/ProjectList';
import ProjectDetails from './components/Projects/ProjectDetails';
import GroupCanvas from './components/UserAndGroups/GroupCanvas';
import UserProvisioning from './components/UserAndGroups/UserProvisioning';
import ModusIcon from './components/Modus/ModusIcon'; // Zorg dat deze import er staat voor de CSV knop
import { getProjects } from './api/projectsApi';
import { getAllAccountGroups, getAllGroupsWithUsers } from './api/groupsApi';

function App() {
  const { isAuthenticated, getAccessTokenSilently } = useAuth(); 
  
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
    const fetchGroups = async () => {
      if (isAuthenticated && activePage === 'groups') {
        setIsLoading(true);
        setLoadingText("Alle bedrijfs-groepen in kaart brengen...");
        setProgress(0);

        try {
          const token = await getAccessTokenSilently();
          const allGroups = await getAllAccountGroups(token, region, (p) => setProgress(p));
          setGroups(allGroups);
        } catch (error) {
          console.error("Fout bij ophalen groepen:", error);
        } finally {
          setIsLoading(false);
          setLoadingText("");
          setTimeout(() => setProgress(null), 1000);
        }
      }
    };
    fetchGroups();
  }, [activePage, isAuthenticated, region, getAccessTokenSilently]);

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

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
      console.error("Fout bij ophalen projecten:", error);
    } finally {
      setIsLoading(false);
      setLoadingText('');
    }
  };

  const handleExportGroupsCSV = async () => {
    if (!projects || projects.length === 0) return;

    setIsLoading(true);
    setLoadingText("Live groepsdata en gebruikers ophalen uit de Trimble Cloud...");
    setProgress(0);

    try {
      const token = await getAccessTokenSilently();
      const data = await getAllGroupsWithUsers(token, region, projects, (p) => setProgress(p));

      if (data.length === 0) {
        alert("Geen groepen of gebruikers gevonden om te exporteren.");
        return;
      }

      const headers = ["Project Naam", "Project ID", "Groep Naam", "Groep ID", "Gebruiker Naam", "Gebruiker Email", "Gebruiker Rol"];
      
      const csvRows = data.map(row => [
        `"${row.projectName || ''}"`,
        `"${row.projectId || ''}"`,
        `"${row.groupName || ''}"`,
        `"${row.groupId || ''}"`,
        `"${row.userName || ''}"`,
        `"${row.userEmail || ''}"`,
        `"${row.userRole || ''}"`
      ].join(','));

      const csvContent = [headers.join(','), ...csvRows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trimble_groups_audit_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Fout bij exporteren CSV:", error);
      alert("Er is een fout opgetreden bij het genereren van de CSV.");
    } finally {
      setIsLoading(false);
      setLoadingText("");
      setTimeout(() => setProgress(null), 1000);
    }
  };

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
              onRefresh={loadProjects} 
            />
          )}

          <div className="modus-content-columns" style={{ flexGrow: 1, overflow: 'hidden' }}>
            <div className="modus-content" style={{ overflowY: 'auto', height: '100%', padding: '20px' }}>
              
              {activePage === 'projects' && (
                <>
                  {selectedProject ? (
                    <ProjectDetails 
                      project={selectedProject} 
                      region={region} 
                      onBack={() => setSelectedProject(null)} 
                    />
                  ) : (
                    viewMode === 'grid' ? (
                      <ProjectGrid projects={projects} searchQuery={searchQuery} onProjectClick={openProject} />
                    ) : (
                      <ProjectList projects={projects} searchQuery={searchQuery} onProjectClick={openProject} />
                    )
                  )}
                </>
              )}

              {activePage === 'users' && (
                <UserProvisioning projects={projects} region={region} />
              )}
              
              {activePage === 'groups' && (
                <div className="d-flex flex-column h-100">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                      <h3 className="mb-0">Bedrijfsbrede Groepen Audit</h3>
                      <span className="text-muted small">Totaal: {groups.length} groepen gevonden over {projects.length} projecten</span>
                    </div>
                    
                    <button 
                      className="btn btn-outline-primary d-flex align-items-center" 
                      onClick={handleExportGroupsCSV}
                      disabled={isLoading || projects.length === 0}
                    >
                      <ModusIcon name="download-simple" type="duotone" size="20px" extraClasses="me-2" />
                      Exporteer Live Data (CSV)
                    </button>
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
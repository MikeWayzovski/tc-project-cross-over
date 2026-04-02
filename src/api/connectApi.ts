// src/api/connectApi.js

export const getUserPreferences = async (token) => {
  try {
    const response = await fetch('https://app.connect.trimble.com/tc/api/2.0/users/me', {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error("Fout bij ophalen gebruiker");
    return await response.json();
  } catch (error) {
    console.error("API Fout:", error);
    return null;
  }
};

// De baseUrl helper voor regio's
const getBaseUrlForRegion = (regionName) => {
  switch(regionName) {
    case 'Europa': return 'https://app21.connect.trimble.com';
    case 'Azië': return 'https://app31.connect.trimble.com';
    case 'Australië': return 'https://app32.connect.trimble.com';
    default: return 'https://app.connect.trimble.com'; // Noord-Amerika is vaak de default
  }
};

// Haal de projecten op
export const getProjects = async (token, regionName) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data; 
  } catch (error) {
    console.error("Fout bij ophalen projecten:", error);
    return [];
  }
};

// Haal de volledige projectdetails op (inclusief grootte en counts)
export const getProjectDetails = async (token, regionName, projectId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/projects/${projectId}?fullyLoaded=true`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error("Fout bij ophalen project details");
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Haal JOUW rol op in dit specifieke project
export const getMyProjectRole = async (token, regionName, projectId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/projects/${projectId}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error("Fout bij ophalen eigen project rol");
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Haal alle gebruikers van het project op
export const getProjectUsers = async (token, regionName, projectId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/projects/${projectId}/users`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Haal alle groepen van het project op
export const getProjectGroups = async (token, regionName, projectId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/groups?projectId=${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error(error);
    return [];
  }
};

// Haal de ondiepe lijst van groepen op voor de visuele Canvas weergave
export const getAllAccountGroups = async (token, regionName, onProgress) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  const config = {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  };

  try {
    const res = await fetch(`${baseUrl}/tc/api/2.1/projects?minimal=true`, config);
    const data = await res.json();
    const projects = Array.isArray(data) ? data : (data.items || []);

    const allGroups = [];
    const concurrencyLimit = 5; 

    for (let i = 0; i < projects.length; i += concurrencyLimit) {
      const chunk = projects.slice(i, i + concurrencyLimit);
      
      const chunkPromises = chunk.map(async (project) => {
        try {
          const groupRes = await fetch(`${baseUrl}/tc/api/2.0/groups?projectId=${project.id}`, config);
          if (groupRes.ok) {
            const groups = await groupRes.json();
            return groups.map(g => ({ ...g, projectName: project.name }));
          }
        } catch (e) { console.error(`Fout bij project ${project.id}`, e); }
        return [];
      });

      const results = await Promise.all(chunkPromises);
      allGroups.push(...results.flat());

      if (onProgress) {
        const percent = Math.round(((i + chunk.length) / projects.length) * 100);
        onProgress(percent);
      }
    }

    return allGroups;
  } catch (error) {
    console.error("Fout bij aggregeren groepen:", error);
    return [];
  }
};

// Voeg een gebruiker toe (of nodig ze uit) aan een project
export const addUserToProject = async (token, regionName, projectId, email, role, notify = true) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/projects/${projectId}/users?notify=${notify}`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Accept': 'application/json',
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ email, role })
    });
    
    if (!response.ok) {
        console.warn(`Kon ${email} niet toevoegen aan project ${projectId}`);
        return null;
    }
    return await response.json(); 
  } catch (error) {
    console.error("Fout bij toevoegen gebruiker aan project:", error);
    return null;
  }
};

// Voeg een gebruiker toe aan een specifieke groep
export const addUserToGroup = async (token, regionName, groupId, userId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/groups/${groupId}/users`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ id: userId }]) 
    });
    return response.ok;
  } catch (error) {
    console.error("Fout bij toevoegen gebruiker aan groep:", error);
    return false;
  }
};

// Creëer een nieuwe groep in een project
export const createProjectGroup = async (token, regionName, projectId, groupName) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/groups`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: groupName, projectId: projectId })
    });
    
    if (!response.ok) return null;
    return await response.json(); 
  } catch (error) {
    console.error("Fout bij aanmaken groep:", error);
    return null;
  }
};

// Zoek een gebruiker in een project op e-mail
export const getUserByEmail = async (token, regionName, projectId, email) => {
  const users = await getProjectUsers(token, regionName, projectId);
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

// Haal gebruikers van een specifieke groep op
export const getGroupUsers = async (token, regionName, groupId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/groups/${groupId}/users`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Fout bij ophalen groep gebruikers:", error);
    return [];
  }
};

// Verwijder een gebruiker uit een groep
export const removeUserFromGroup = async (token, regionName, groupId, userId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/groups/${groupId}/users`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify([{ id: userId }]) 
    });
    return response.ok || response.status === 204;
  } catch (error) {
    console.error("Fout bij verwijderen uit groep:", error);
    return false;
  }
};

// Haal de diepe lijst op van alle groepen én hun gebruikers voor de CSV export
export const getAllGroupsWithUsers = async (token, regionName, projects, onProgress) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  const config = { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } };
  const allData = [];
  const concurrencyLimit = 3; 

  for (let i = 0; i < projects.length; i += concurrencyLimit) {
    const chunk = projects.slice(i, i + concurrencyLimit);

    const chunkPromises = chunk.map(async (project) => {
      try {
        const groupRes = await fetch(`${baseUrl}/tc/api/2.0/groups?projectId=${project.id}`, config);
        if (!groupRes.ok) return [];
        const groups = await groupRes.json();

        const projectData = [];

        for (const group of groups) {
          try {
            const userRes = await fetch(`${baseUrl}/tc/api/2.0/groups/${group.id}/users`, config);
            const users = userRes.ok ? await userRes.json() : [];

            if (users.length === 0) {
              projectData.push({
                projectName: project.name,
                projectId: project.id,
                groupName: group.name,
                groupId: group.id,
                userName: '',
                userEmail: '',
                userRole: ''
              });
            } else {
              users.forEach(user => {
                projectData.push({
                  projectName: project.name,
                  projectId: project.id,
                  groupName: group.name,
                  groupId: group.id,
                  userName: `${user.firstName} ${user.lastName}`.trim(),
                  userEmail: user.email,
                  userRole: user.role || ''
                });
              });
            }
          } catch (e) {
            console.error(`Fout bij ophalen gebruikers voor groep ${group.name}`, e);
          }
        }
        return projectData;
      } catch (e) {
        console.error(`Fout bij ophalen groepen voor project ${project.name}`, e);
        return [];
      }
    });

    const results = await Promise.all(chunkPromises);
    allData.push(...results.flat());

    if (onProgress) {
      const percent = Math.round(((i + chunk.length) / projects.length) * 100);
      onProgress(Math.min(percent, 100));
    }
  }
  return allData;
};
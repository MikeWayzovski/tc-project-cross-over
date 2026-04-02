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

// Nieuwe functie: Haal de projecten op!
export const getProjects = async (token, regionName) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  
  try {
    // We vragen hier de API aan. Door minimal=false te forceren (of weg te laten, afhankelijk van de API default) 
    // hopen we in één keer de benodigde data zoals lastVisitedOn te krijgen.
    const response = await fetch(`${baseUrl}/tc/api/2.0/projects`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    return data; // Trimble Connect geeft vaak een array van projecten direct terug in de body (zoals in jouw voorbeeld)
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



export const getAllAccountGroups = async (token, regionName, onProgress) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  const config = {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  };

  try {
    // 1. Haal alle projecten op (v2.1 voor snelheid)
    const res = await fetch(`${baseUrl}/tc/api/2.1/projects?minimal=true`, config);
    const data = await res.json();
    const projects = Array.isArray(data) ? data : (data.items || []);

    const allGroups = [];
    const concurrencyLimit = 5; // Haal 5 projecten tegelijk op om de API niet te overbelasten

    for (let i = 0; i < projects.length; i += concurrencyLimit) {
      const chunk = projects.slice(i, i + concurrencyLimit);
      
      const chunkPromises = chunk.map(async (project) => {
        try {
          const groupRes = await fetch(`${baseUrl}/tc/api/2.0/groups?projectId=${project.id}`, config);
          if (groupRes.ok) {
            const groups = await groupRes.json();
            // Voeg projectinfo toe aan elke groep voor de visualisatie
            return groups.map(g => ({ ...g, projectName: project.name }));
          }
        } catch (e) { console.error(`Fout bij project ${project.id}`, e); }
        return [];
      });

      const results = await Promise.all(chunkPromises);
      allGroups.push(...results.flat());

      // Update voortgang voor de footer
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
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
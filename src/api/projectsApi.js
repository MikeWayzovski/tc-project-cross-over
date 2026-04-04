import { getBaseUrlForRegion } from './config';
import { Logger } from '../utils/logger';

export const getProjects = async (token, regionName) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/projects`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    
    const data = await response.json();
    Logger.info(`Projecten succesvol opgehaald uit regio ${regionName}.`);
    return data; 
  } catch (error) {
    Logger.error(`Fout bij ophalen projecten uit ${regionName}`, error.message);
    return [];
  }
};

export const getProjectDetails = async (token, regionName, projectId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/projects/${projectId}?fullyLoaded=true`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error("Fout bij ophalen project details");
    return await response.json();
  } catch (error) {
    Logger.error(`Fout bij ophalen details voor project ${projectId}`, error.message);
    return null;
  }
};

export const cloneProject = async (token, region, cloneData) => {
  // LET OP: Gebruik hier jouw bestaande functie/variabele voor de base URL!
  // Bijvoorbeeld: const baseUrl = REGION_URLS[region]; of getBaseUrl(region);
  const baseUrl = getBaseUrlForRegion(regionName);
  
  const url = `${baseUrl}/projects/clones`;

  // 1. Vertaal de wizard-vinkjes naar de Trimble 'include' array
  const includeItems = [];
  if (cloneData.options.copySettings) includeItems.push("settings");
  if (cloneData.options.copyMembers) includeItems.push("users");
  if (cloneData.options.copyGroups) includeItems.push("groups");
  if (cloneData.options.copyFolders) {
    includeItems.push("folders");
    includeItems.push("folderPermissions"); // Cruciaal: Neemt direct de rechten over!
  }

  // Als er per ongeluk helemaal niets is aangevinkt, vallen we terug op de wildcard '*'
  const finalInclude = includeItems.length > 0 ? includeItems : ["*"];

  // 2. Bouw de officiële payload op
  const payload = {
    sourceProjectId: cloneData.sourceProjectId,
    include: finalInclude,
    targetProjectDetails: {
      name: cloneData.newProjectName
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API Fout bij klonen (${response.status}): ${errorData.message || response.statusText}`);
  }

  // Trimble geeft een 202 (QUEUED) terug. Dit object bevat o.a. { cloneId, status }
  return await response.json();
};
import { getBaseUrlForRegion } from './config';
import { Logger } from '../utils/logger';

export const getProjects = async (token, regionName) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    // Aangepast: baseUrl bevat al /tc/api/2.0
    const response = await fetch(`${baseUrl}/projects`, {
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
    // Aangepast: baseUrl bevat al /tc/api/2.0
    const response = await fetch(`${baseUrl}/projects/${projectId}?fullyLoaded=true`, {
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
  const baseUrl = getBaseUrlForRegion(region);
  const url = `${baseUrl}/projects/clones`;

  const includeItems = [];
  if (cloneData.options.copySettings) includeItems.push("settings");
  if (cloneData.options.copyMembers) includeItems.push("users");
  if (cloneData.options.copyGroups) includeItems.push("groups");
  
  if (cloneData.options.copyFolders) {
    includeItems.push("folders");
    includeItems.push("folderPermissions"); 
  }

  const finalInclude = includeItems.length > 0 ? includeItems : ["*"];

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
    const errorText = await response.text();
    throw new Error(`Trimble Fout (${response.status}): ${errorText}`);
  }

  return await response.json();
};
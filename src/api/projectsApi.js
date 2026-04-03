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
import { getBaseUrlForRegion } from './config';
import { Logger } from '../utils/logger';

export const getUserPreferences = async (token) => {
  try {
    const response = await fetch('https://app.connect.trimble.com/tc/api/2.0/users/me', {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error("Fout bij ophalen gebruiker");
    return await response.json();
  } catch (error) {
    Logger.error("API Fout bij getUserPreferences", error.message);
    return null;
  }
};

export const getMyProjectRole = async (token, regionName, projectId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/projects/${projectId}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) throw new Error("Fout bij ophalen eigen project rol");
    return await response.json();
  } catch (error) {
    Logger.error(`Fout bij ophalen rol in project ${projectId}`, error.message);
    return null;
  }
};


export const getUserByEmail = async (token, regionName, projectId, email) => {
  const users = await getProjectUsers(token, regionName, projectId);
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

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
        Logger.warn(`API weigerde ${email} toe te voegen aan project ${projectId}.`);
        return null;
    }
    const data = await response.json();
    Logger.success(`Gebruiker ${email} toegevoegd/geverifieerd in project ${projectId}.`);
    return data; 
  } catch (error) {
    Logger.error(`Kritieke fout bij toevoegen gebruiker aan project ${projectId}`, error.message);
    return null;
  }
};

export const getProjectUsers = async (token, region, projectId) => {
  const baseUrl = getBaseUrlForRegion(region);
  const url = `${baseUrl}/tc/api/2.0/projects/${projectId}/users`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    Logger.error(`Fout bij ophalen projectgebruikers (${response.status}): ${errorText}`);
    return [];
  }

  return await response.json();
};

export const getUserDetails = async (token, region, userId) => {
  const baseUrl = getBaseUrlForRegion(region);
  const url = `${baseUrl}/tc/api/2.0/users/${userId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    Logger.error(`Fout bij ophalen details voor gebruiker ${userId} (${response.status}): ${errorText}`);
    return null;
  }

  return await response.json();
};
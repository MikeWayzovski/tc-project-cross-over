import { getBaseUrlForRegion } from './config';
import { Logger } from '../utils/logger';
import { getProjects } from './projectsApi';

const asList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const projectLabel = (project) =>
  project?.name || project?.title || project?.nm || 'Naamloos project';

export const getProjectGroups = async (token, regionName, projectId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/groups?projectId=${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    Logger.error(`Fout bij ophalen groepen voor project ${projectId}`, error.message);
    return [];
  }
};

export const getGroupUsers = async (token, regionName, groupId) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    const response = await fetch(`${baseUrl}/tc/api/2.0/groups/${groupId}/users`, {
      headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    Logger.error(`Fout bij ophalen gebruikers voor groep ${groupId}`, error.message);
    return [];
  }
};

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
    const data = await response.json();
    Logger.success(`Nieuwe groep "${groupName}" succesvol aangemaakt in project ${projectId}.`);
    return data; 
  } catch (error) {
    Logger.error(`Fout bij aanmaken groep "${groupName}"`, error.message);
    return null;
  }
};

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
    Logger.error(`Fout bij toevoegen gebruiker ${userId} aan groep ${groupId}`, error.message);
    return false;
  }
};

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
    Logger.error(`Fout bij verwijderen gebruiker ${userId} uit groep ${groupId}`, error.message);
    return false;
  }
};

export const getAllAccountGroups = async (token, regionName, onProgress, knownProjects = []) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  const config = { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } };

  try {
    // De 2.1-minimal lijst levert vaak geen naam; gebruik de 2.0-projecten (of de al geladen lijst).
    let projects = asList(knownProjects).filter((project) => project?.id);
    if (projects.length === 0) {
      projects = asList(await getProjects(token, regionName)).filter((project) => project?.id);
    }

    const allGroups = [];
    const concurrencyLimit = 5; 

    for (let i = 0; i < projects.length; i += concurrencyLimit) {
      const chunk = projects.slice(i, i + concurrencyLimit);
      
      const chunkPromises = chunk.map(async (project) => {
        try {
          const groupRes = await fetch(`${baseUrl}/tc/api/2.0/groups?projectId=${project.id}`, config);
          if (groupRes.ok) {
            const groups = asList(await groupRes.json());
            const name = projectLabel(project);
            return groups.map((group) => ({
              ...group,
              projectId: project.id,
              projectName: name,
            }));
          }
        } catch { 
          Logger.warn(`Kon groepen voor project ${project.id} niet ophalen.`); 
        }
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
    Logger.error("Fout bij ophalen van alle accountgroepen", error.message);
    return [];
  }
};

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
            Logger.warn(`Fout bij ophalen gebruikers voor groep ${group.name}`);
          }
        }
        return projectData;
      } catch (e) {
        Logger.warn(`Fout bij ophalen groepen voor project ${project.name}`);
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
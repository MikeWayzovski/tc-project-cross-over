import { getBaseUrlForRegion } from './config';
import { Logger } from '../utils/logger';

export const getProjects = async (token, regionName) => {
  const baseUrl = getBaseUrlForRegion(regionName);
  try {
    // HET FIXJE: /tc/api/2.0 staat er weer netjes in!
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
    // HET FIXJE: /tc/api/2.0 staat er weer netjes in!
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
  const baseUrl = getBaseUrlForRegion(region);
  
  // Zorg dat ook hier het pad exact klopt voor de Trimble Clone API
  const url = `${baseUrl}/tc/api/2.0/projects/clones`;

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

export const getCloneStatus = async (token, region, cloneId) => {
  const baseUrl = getBaseUrlForRegion(region);
  
  // De endpoint voor het opvragen van de status
  const url = `${baseUrl}/tc/api/2.0/projects/clones/${cloneId}`;

  const response = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'Accept': 'application/json' 
    }
  });

  if (!response.ok) throw new Error(`Fout bij ophalen kloon-status: ${response.status}`);
  
  return await response.json();
};

export const getProjectSnapshot = async (token, region, projectId) => {
  const baseUrl = getBaseUrlForRegion(region);
  
  // We halen maximaal 100.000 items op, en filteren direct op mappen en bestanden
  const url = `${baseUrl}/tc/api/2.0/files/fs/snapshot?projectId=${projectId}&objectTypes=FILE,FOLDER&maxItems=100000`;

  const response = await fetch(url, {
    headers: { 
      'Authorization': `Bearer ${token}`, 
      'Accept': 'application/json' 
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Trimble Fout bij ophalen snapshot (${response.status}): ${errorText}`);
  }

  return await response.json();
};

export const downloadFileBlob = async (token, region, fileId, versionId) => {
  const baseUrl = getBaseUrlForRegion(region);

  // Stap 1: Vraag de S3 download URL op bij Trimble
  const urlResponse = await fetch(`${baseUrl}/tc/api/2.0/files/${fileId}/downloadurl?versionId=${versionId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!urlResponse.ok) throw new Error(`Kon download-URL niet ophalen (${urlResponse.status})`);
  const { url } = await urlResponse.json();

  // Stap 2: Download het bestand in het geheugen van de browser
  const blobResponse = await fetch(url);
  if (!blobResponse.ok) throw new Error(`S3 Download mislukt (${blobResponse.status})`);

  return await blobResponse.blob();
};

export const uploadFileBlob = async (token, region, parentFolderId, fileName, fileBlob) => {
  const baseUrl = getBaseUrlForRegion(region);

  // Stap 1: Kondig de upload aan bij Trimble
  const initResponse = await fetch(`${baseUrl}/tc/api/2.0/files/fs/upload?parentId=${parentFolderId}&parentType=FOLDER`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name: fileName, contents: [] }) // Lege contents = snelle singlepart upload
  });

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    throw new Error(`Upload initiëren mislukt (${initResponse.status}): ${errorText}`);
  }

  const initData = await initResponse.json();
  const uploadUrl = initData.contents[0].url;

  // Stap 2: Pomp de blob direct naar de AWS S3 bucket van het nieuwe project
  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: fileBlob
  });

  if (!putResponse.ok) throw new Error(`S3 Upload mislukt (${putResponse.status})`);

  return initData;
};
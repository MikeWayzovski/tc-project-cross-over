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

  const response = await fetch(`${baseUrl}/tc/api/2.0/projects/${projectId}?fullyLoaded=true`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
  });

  // Bewust geen stille null: de detailpagina liet dan lege nullen zien zonder uitleg.
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    Logger.error(`Fout bij ophalen details voor project ${projectId} (${response.status}): ${body}`);
    throw new Error(`Trimble gaf status ${response.status} terug bij het ophalen van dit project.`);
  }

  return await response.json();
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

  // Stap 1: Vraag de S3 download URL op bij Trimble (Let op de toegevoegde /fs/!)
  const urlResponse = await fetch(`${baseUrl}/tc/api/2.0/files/fs/${fileId}/downloadurl?versionId=${versionId}`, {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });

  if (!urlResponse.ok) {
    const errorText = await urlResponse.text();
    throw new Error(`Kon download-URL niet ophalen (${urlResponse.status}): ${errorText}`);
  }
  
  const data = await urlResponse.json();
  const downloadUrl = data.url;

  // Stap 2: Download het bestand in het geheugen van de browser via de AWS S3 link
  const blobResponse = await fetch(downloadUrl);
  if (!blobResponse.ok) throw new Error(`Bestand downloaden van S3 mislukt (${blobResponse.status})`);

  return await blobResponse.blob();
};

export const uploadFileBlob = async (token, region, parentFolderId, fileName, fileBlob) => {
  const baseUrl = getBaseUrlForRegion(region);

  // Stap 1: Kondig de upload aan bij Trimble via de Package Upload API
  const initResponse = await fetch(`${baseUrl}/tc/api/2.0/files/fs/upload?parentId=${parentFolderId}&parentType=FOLDER`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    // Lege contents of alleen de naam vertelt Trimble dat we 1 simpel bestand sturen
    body: JSON.stringify({ name: fileName }) 
  });

  if (!initResponse.ok) {
    const errorText = await initResponse.text();
    throw new Error(`Upload initiëren mislukt (${initResponse.status}): ${errorText}`);
  }

  const initData = await initResponse.json();
  
  // Haal de gegenereerde S3 upload URL uit de response
  let uploadUrl = null;
  if (initData.contents && initData.contents.length > 0) {
    uploadUrl = initData.contents[0].url;
  } else if (initData.uploadUrl) {
    uploadUrl = initData.uploadUrl; // Fallback voor oudere Trimble API versies
  }

  if (!uploadUrl) {
    throw new Error("Geen geldige S3 upload URL ontvangen van Trimble.");
  }

  // Stap 2: Pomp de blob direct naar de AWS S3 bucket van het nieuwe project
  // Let op: Bij Trimble S3 pre-signed URLs sturen we GEEN Authorization headers mee!
  const putResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: fileBlob
  });

  if (!putResponse.ok) {
    throw new Error(`Bestand uploaden naar S3 mislukt (${putResponse.status})`);
  }

  return initData;
};
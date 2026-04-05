import { cloneProject, getCloneStatus, getProjectSnapshot, downloadFileBlob, uploadFileBlob } from '../api/projectsApi';
import { Logger } from '../utils/logger';

export const executeProjectClone = async ({
  token,
  region,
  cloneData,
  onProgress, // Callback om de tekst onderin beeld te updaten
  onSuccess,  // Callback als alles klaar is
  onError     // Callback bij een fout
}) => {
  try {
    const cloneResponse = await cloneProject(token, region, cloneData);
    const cloneId = cloneResponse.cloneId;
    Logger.info("Kloon-opdracht in de wachtrij:", cloneId);

    const pollInterval = setInterval(async () => {
      try {
        const statusUpdate = await getCloneStatus(token, region, cloneId);
        
        if (statusUpdate.status === 'DONE') {
          clearInterval(pollInterval);
          const newProjectId = statusUpdate.result?.projectId;
          
          // --- FASE 2.3: BESTANDEN KOPIËREN ---
          if (cloneData.filesToCopy && cloneData.filesToCopy.length > 0) {
            onProgress('Mappenstructuur vergelijken voor bestandenoverdracht...');
            
            try {
              const oldSnapshot = await getProjectSnapshot(token, region, cloneData.sourceProjectId);
              const newSnapshot = await getProjectSnapshot(token, region, newProjectId);
              
              const buildPaths = (items) => {
                const map = {};
                items.forEach(item => map[item.id] = item);
                
                const getPath = (id) => {
                  if (!id || !map[id]) return '';
                  const node = map[id];
                  if (!node.pid) return 'ROOT'; 
                  const parentPath = getPath(node.pid);
                  return parentPath ? `${parentPath}/${node.nm}` : node.nm;
                };
                
                const idToPath = {};
                const pathToId = {};
                items.filter(i => i.tp === 'FOLDER').forEach(f => {
                  const path = getPath(f.id);
                  idToPath[f.id] = path;
                  pathToId[path] = f.id;
                });
                return { idToPath, pathToId };
              };
              
              const oldPaths = buildPaths(oldSnapshot.items || []);
              const newPaths = buildPaths(newSnapshot.items || []);
              
              let successCount = 0;
              let failCount = 0;

              for (let i = 0; i < cloneData.filesToCopy.length; i++) {
                const file = cloneData.filesToCopy[i];
                onProgress(`Bestand overzetten (${i + 1}/${cloneData.filesToCopy.length}): ${file.nm}`);
                
                const folderPath = oldPaths.idToPath[file.pid];
                const newFolderId = newPaths.pathToId[folderPath];
                
                if (newFolderId) {
                  try {
                    const fileBlob = await downloadFileBlob(token, region, file.id, file.vid);
                    await uploadFileBlob(token, region, newFolderId, file.nm, fileBlob);
                    successCount++;
                  } catch (err) {
                    Logger.error(`Overzetten mislukt voor ${file.nm}:`, err.message || err);
                    failCount++;
                  }
                } else {
                  Logger.warn(`Doelmap niet gevonden in nieuwe project voor: ${file.nm} (pad: ${folderPath})`);
                  failCount++;
                }
              }
              
              onSuccess(`Project aangemaakt! ${successCount} bestanden gekopieerd (${failCount} mislukt).`, successCount > 0 ? 'success' : 'warning');
            } catch (error) {
              Logger.error("Fout bij het overzetten van bestanden:", error.message || error);
              onSuccess(`Project is aangemaakt, maar er ging iets mis bij het kopiëren van de bestanden.`, 'warning');
            }
          } else {
            onSuccess(`Project '${cloneData.newProjectName}' is succesvol aangemaakt!`, 'success');
          }
        } else if (statusUpdate.status === 'ERROR') {
          clearInterval(pollInterval);
          const errorMsg = statusUpdate.error?.message || "Onbekende fout";
          Logger.error(`Klonen mislukt bij Trimble. Reden: ${errorMsg}`);
          onError(`Klonen mislukt: ${errorMsg}`);
        } else {
          let uiStatus = statusUpdate.status === 'QUEUED' ? 'In de wachtrij...' : 'Trimble is aan het kopiëren...';
          onProgress(`Bezig met klonen (${uiStatus})`);
        }
      } catch (pollError) {
        Logger.error("Fout tijdens pollen van API:", pollError.message, pollError.stack);
      }
    }, 5000);

  } catch (error) {
    Logger.error("Fout bij starten van kloon:", error.message, error.stack);
    onError(`Er is een fout opgetreden bij het indienen van de opdracht: ${error.message}`);
  }
};
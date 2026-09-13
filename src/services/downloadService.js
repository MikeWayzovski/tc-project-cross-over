import JSZip from 'jszip';
import { getProjectSnapshot, downloadFileBlob } from '../api/projectsApi';
import { Logger } from '../utils/logger';

// Bestanden die direct in de projectmap staan horen bij geen enkele submap,
// maar moeten wel aan- en uitgevinkt kunnen worden.
export const ROOT_FOLDER_ID = '__root__';

// Trimble snapshot items zijn afgekort: id, pid (parent), nm (naam), tp (FILE|FOLDER), vid (versie).
// De grootte komt onder wisselende namen terug, afhankelijk van de API-versie.
const readSize = (item) => {
  const raw = item.sz ?? item.size ?? item.fileSize;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : null;
};

// Windows accepteert deze tekens niet in pad-onderdelen, dus strippen we ze uit zip-namen.
const sanitizeSegment = (name) => (name || 'naamloos').replace(/[\\/:*?"<>|]/g, '_').trim() || 'naamloos';

export const formatBytes = (bytes, decimals = 1) => {
  if (bytes === null || bytes === undefined || !Number.isFinite(bytes)) return 'onbekend';
  if (bytes === 0) return '0 bytes';
  const units = ['bytes', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${parseFloat(value.toFixed(exponent === 0 ? 0 : decimals))} ${units[exponent]}`;
};

/**
 * Leest de mappenstructuur van een project in zonder iets te downloaden.
 * Levert de boom voor de selectie en de platte bestandslijst voor de zip.
 */
export const inspectProjectStructure = async (token, region, projectId) => {
  const snapshot = await getProjectSnapshot(token, region, projectId);
  const items = Array.isArray(snapshot?.items) ? snapshot.items : [];

  const byId = new Map(items.map((item) => [item.id, item]));
  const allFolders = items.filter((item) => item.tp === 'FOLDER');
  const rootFolders = allFolders.filter((folder) => !folder.pid || !byId.has(folder.pid));

  // Bij precies één root (de gebruikelijke projectmap) laten we die naam weg,
  // zodat de zip niet één overbodige map diep begint.
  const skipRootId = rootFolders.length === 1 ? rootFolders[0].id : null;

  const pathCache = new Map();
  const segmentsFor = (id, seen = new Set()) => {
    if (pathCache.has(id)) return pathCache.get(id);
    const node = byId.get(id);
    if (!node || seen.has(id)) return [];
    seen.add(id);

    const parentSegments = node.pid && byId.has(node.pid) ? segmentsFor(node.pid, seen) : [];
    const segments = id === skipRootId ? [] : [...parentSegments, sanitizeSegment(node.nm)];
    pathCache.set(id, segments);
    return segments;
  };

  const usedPaths = new Set();
  let totalBytes = 0;
  let filesWithKnownSize = 0;

  const files = items
    .filter((item) => item.tp === 'FILE')
    .map((item) => {
      const parentId = item.pid && byId.has(item.pid) ? item.pid : null;
      const folderSegments = parentId ? segmentsFor(parentId) : [];
      const baseName = sanitizeSegment(item.nm);

      // Twee bestanden mogen niet op hetzelfde zip-pad landen; anders overschrijft JSZip er één.
      let path = [...folderSegments, baseName].join('/');
      if (usedPaths.has(path)) {
        const dot = baseName.lastIndexOf('.');
        const stem = dot > 0 ? baseName.slice(0, dot) : baseName;
        const extension = dot > 0 ? baseName.slice(dot) : '';
        let suffix = 2;
        while (usedPaths.has(path)) {
          path = [...folderSegments, `${stem} (${suffix})${extension}`].join('/');
          suffix += 1;
        }
      }
      usedPaths.add(path);

      const size = readSize(item);
      if (size !== null) {
        totalBytes += size;
        filesWithKnownSize += 1;
      }

      return {
        id: item.id,
        versionId: item.vid,
        name: item.nm,
        path,
        size,
        folderId: !parentId || parentId === skipRootId ? ROOT_FOLDER_ID : parentId,
      };
    });

  // --- Selectieboom opbouwen (de overgeslagen projectmap doet niet mee) ---
  const selectableFolders = allFolders.filter((folder) => folder.id !== skipRootId);
  const nodes = new Map(
    selectableFolders.map((folder) => [
      folder.id,
      { id: folder.id, name: folder.nm, children: [], fileCount: 0, totalBytes: 0 },
    ]),
  );

  const tree = [];
  selectableFolders.forEach((folder) => {
    const parent = folder.pid && folder.pid !== skipRootId ? nodes.get(folder.pid) : null;
    if (parent) parent.children.push(nodes.get(folder.id));
    else tree.push(nodes.get(folder.id));
  });

  files.forEach((file) => {
    const node = nodes.get(file.folderId);
    if (node) {
      node.fileCount += 1;
      node.totalBytes += file.size ?? 0;
    }
  });

  // Mappen tonen het totaal inclusief submappen, anders lijkt een map met alleen
  // submappen leeg terwijl er honderden bestanden onder hangen.
  const rollUp = (node) => {
    node.children.sort((a, b) => a.name.localeCompare(b.name));
    node.children.forEach(rollUp);
    node.totalFileCount = node.fileCount + node.children.reduce((sum, child) => sum + child.totalFileCount, 0);
    node.totalSize = node.totalBytes + node.children.reduce((sum, child) => sum + child.totalSize, 0);
  };
  tree.sort((a, b) => a.name.localeCompare(b.name));
  tree.forEach(rollUp);

  const rootFiles = files.filter((file) => file.folderId === ROOT_FOLDER_ID);

  return {
    fileCount: files.length,
    folderCount: selectableFolders.length,
    totalBytes,
    sizeIsComplete: filesWithKnownSize === files.length,
    files,
    tree,
    folderIds: [ROOT_FOLDER_ID, ...selectableFolders.map((folder) => folder.id)],
    rootFileCount: rootFiles.length,
    rootFileSize: rootFiles.reduce((sum, file) => sum + (file.size ?? 0), 0),
  };
};

/**
 * Haalt elk bestand op en pakt alles in één zip met behoud van de mappenstructuur.
 * onProgress krijgt een percentage (0-100) en een omschrijving van de huidige stap.
 * shouldCancel wordt voor elk bestand geraadpleegd, zodat afbreken snel reageert.
 */
export const downloadProjectAsZip = async ({
  token,
  region,
  projectName,
  files,
  onProgress,
  shouldCancel,
}) => {
  const zip = new JSZip();
  const failed = [];
  let completed = 0;

  for (const file of files) {
    if (shouldCancel?.()) {
      return { cancelled: true, downloaded: completed - failed.length, failed };
    }

    onProgress?.(
      Math.round((completed / files.length) * 90),
      `Bestand ${completed + 1} van ${files.length}: ${file.name}`,
    );

    try {
      const blob = await downloadFileBlob(token, region, file.id, file.versionId);
      zip.file(file.path, blob);
    } catch (error) {
      Logger.error(`Downloaden mislukt voor ${file.path}:`, error.message || error);
      failed.push({ path: file.path, reason: error.message || String(error) });
    }

    completed += 1;
  }

  // Laatste uitstap: hierna is inpakken niet meer te onderbreken.
  if (shouldCancel?.()) {
    return { cancelled: true, downloaded: completed - failed.length, failed };
  }

  if (failed.length === files.length && files.length > 0) {
    throw new Error('Geen enkel bestand kon worden gedownload. Controleer je rechten op dit project.');
  }

  // Een leesbaar overzicht van wat er misging reist mee in de zip zelf.
  if (failed.length > 0) {
    const report = failed.map((entry) => `${entry.path} — ${entry.reason}`).join('\n');
    zip.file('_niet-gedownload.txt', `Deze bestanden konden niet worden opgehaald:\n\n${report}\n`);
  }

  onProgress?.(92, 'Zip-bestand samenstellen...');

  const archive = await zip.generateAsync(
    { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
    (metadata) => onProgress?.(92 + Math.round(metadata.percent * 0.08), 'Zip-bestand samenstellen...'),
  );

  const objectUrl = URL.createObjectURL(archive);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${sanitizeSegment(projectName)}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Direct intrekken kan de download in sommige browsers afbreken.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);

  return { cancelled: false, downloaded: files.length - failed.length, failed };
};

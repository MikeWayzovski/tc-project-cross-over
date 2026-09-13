/**
 * Filtert op de zoekterm en tilt favorieten naar boven.
 * De onderlinge volgorde binnen beide groepen blijft zoals de API hem aanleverde.
 */
export const sortProjects = (projects, searchQuery, favoriteIds) => {
  const query = (searchQuery || '').toLowerCase();
  const matches = (projects || []).filter((project) =>
    (project.name || '').toLowerCase().includes(query),
  );

  if (!favoriteIds || favoriteIds.size === 0) return matches;

  const favorites = matches.filter((project) => favoriteIds.has(project.id));
  const rest = matches.filter((project) => !favoriteIds.has(project.id));
  return [...favorites, ...rest];
};

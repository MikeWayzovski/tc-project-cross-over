// Centrale plek voor basis configuratie
export const getBaseUrlForRegion = (regionName) => {
  switch(regionName) {
    case 'Europa': return 'https://app21.connect.trimble.com';
    case 'Azië': return 'https://app31.connect.trimble.com';
    case 'Australië': return 'https://app32.connect.trimble.com';
    default: return 'https://app.connect.trimble.com'; // Noord-Amerika is vaak de default
  }
};
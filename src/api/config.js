// Centrale plek voor basis configuratie
export const getBaseUrlForRegion = (regionName) => {
  const region = (regionName || '').toLowerCase();

  switch(region) {
    case 'europa':
    case 'europe':
    case 'eu': 
      return 'https://app21.connect.trimble.com';
    
    case 'azië':
    case 'azie':
    case 'asia':
    case 'ap': 
      return 'https://app31.connect.trimble.com';
    
    case 'australië':
    case 'australie':
    case 'aus':
    case 'ap-au': 
      return 'https://app32.connect.trimble.com';
    
    case 'noord-amerika':
    case 'northamerica':
    case 'na':
    default: 
      return 'https://app.connect.trimble.com'; // Noord-Amerika is de master/default
  }
};
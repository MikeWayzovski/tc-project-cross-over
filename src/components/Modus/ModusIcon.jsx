import React from 'react';

// Als we geen type meegeven, is het standaard 'solid'
const ModusIcon = ({ name, type = "solid", size = "24px", extraClasses = "" }) => {
  
  // Als we expliciet om een duotone icoon vragen (de nieuwe npm package)
  if (type === "duotone") {
    // De nieuwe iconen gebruiken specifieke class names, bijv: modus-icon-alien-duotone
    return (
      <i 
        className={`modus-icon-${name}-duotone ${extraClasses}`} 
        style={{ fontSize: size }}
      ></i>
    );
  }

  // De fallback naar de standaard solid iconen (via ligaturen)
  return (
    <i 
      className={`modus-icons ${extraClasses}`} 
      style={{ fontSize: size }}
    >
      {name}
    </i>
  );
};

export default ModusIcon;
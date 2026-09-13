import React from 'react';

// Twee icoonsets draaien naast elkaar:
// - 'solid' is het ligatuur-lettertype uit @trimble-oss/modus-icons en schaalt met font-size.
// - de overige types komen uit @trimble-oss/modus-icons-css en zijn CSS-masks met een vaste
//   24px box, dus die schalen alleen mee via width/height.
const MASK_TYPES = { duotone: '-duotone', fill: '-fill', regular: '' };

const ModusIcon = ({ name, type = 'solid', size = '24px', extraClasses = '', title }) => {
  const maskSuffix = MASK_TYPES[type];

  if (maskSuffix !== undefined) {
    return (
      <i
        className={`modus-icon-${name}${maskSuffix} ${extraClasses}`}
        style={{ width: size, height: size }}
        role={title ? 'img' : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : 'true'}
      ></i>
    );
  }

  return (
    <i
      className={`modus-icons ${extraClasses}`}
      style={{ fontSize: size }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : 'true'}
    >
      {name}
    </i>
  );
};

export default ModusIcon;

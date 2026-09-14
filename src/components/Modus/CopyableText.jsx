import React from 'react';
import CopyButton from './CopyButton';

/**
 * Toont tekst met een copy-knop ernaast. `value` is wat er gekopieerd wordt;
 * `children` is wat je ziet (valt terug op `value`).
 */
const CopyableText = ({
  value,
  children,
  className = '',
  buttonAriaLabel,
}) => {
  const display = children ?? value;
  if (display === null || display === undefined || display === '') return null;

  return (
    <span className={`d-inline-flex align-items-center gap-1 min-w-0 ${className}`.trim()}>
      <span className="text-truncate">{display}</span>
      <CopyButton value={value} ariaLabel={buttonAriaLabel} />
    </span>
  );
};

export default CopyableText;

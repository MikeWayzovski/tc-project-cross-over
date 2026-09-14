import React, { useEffect, useRef, useState } from 'react';
import ModusIcon from './ModusIcon';
import { copyToClipboard } from '../../utils/clipboard';

/**
 * Icon-only knop die `value` naar het klembord kopieert.
 * Toont kort een vinkje na succes; bruikbaar naast namen, e-mails, id's, paden, enz.
 */
const CopyButton = ({
  value,
  ariaLabel,
  extraClasses = '',
  iconSize = '14px',
}) => {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef(null);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  if (!String(value ?? '').trim()) return null;

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(true);
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopied(false), 1600);
  };

  const label = copied ? 'Gekopieerd' : ariaLabel || `Kopieer ${String(value).trim()}`;

  return (
    <button
      type="button"
      className={`btn btn-icon-only btn-sm border-0 flex-shrink-0 ${extraClasses}`.trim()}
      aria-label={label}
      title={label}
      onClick={handleClick}
    >
      <ModusIcon
        name={copied ? 'check' : 'copy'}
        type="duotone"
        size={iconSize}
        extraClasses={copied ? 'text-success' : 'text-muted'}
      />
      <span className="visually-hidden" aria-live="polite">
        {copied ? 'Gekopieerd' : ''}
      </span>
    </button>
  );
};

export default CopyButton;

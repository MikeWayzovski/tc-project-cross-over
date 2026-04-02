import React, { useEffect, useRef } from 'react';
import { Tooltip } from "bootstrap";
import ModusIcon from './ModusIcon';

const ModusIconButton = ({ 
  icon, 
  iconType = "solid", 
  ariaLabel, 
  tooltip, 
  variant = "", 
  disabled = false,
  extraClasses = "",
  onClick 
}) => {
  const triggerRef = useRef(null);

  useEffect(() => {
    let bsTooltip = null;
    
    const initTooltip = setTimeout(() => {
      if (tooltip && triggerRef.current) {
        bsTooltip = new Tooltip(triggerRef.current, { 
          title: tooltip,
          placement: 'bottom',
          trigger: 'hover' 
        });
      }
    }, 10);

    return () => {
      clearTimeout(initTooltip);
      if (bsTooltip) {
        // DE FIX: Geen hide() meer gebruiken! Direct dispose() 
        // voorkomt asynchrone animatie-crashes in Bootstrap 5.
        bsTooltip.dispose(); 
      }
    };
  }, [tooltip, icon, disabled]); 

  let buttonClasses = "btn btn-icon-only d-flex justify-content-center align-items-center";
  if (variant) buttonClasses += ` btn-${variant}`;
  if (extraClasses) buttonClasses += ` ${extraClasses}`;

  if (disabled) {
    return (
      <span 
        className="d-inline-block" 
        tabIndex="0" 
        ref={triggerRef} 
        aria-label={ariaLabel}
      >
        <button className={buttonClasses} disabled style={{ pointerEvents: 'none' }}>
          <ModusIcon name={icon} type={iconType} />
        </button>
      </span>
    );
  }

  return (
    <button 
      ref={triggerRef} 
      className={buttonClasses} 
      aria-label={ariaLabel} 
      onClick={onClick}
    >
      <ModusIcon name={icon} type={iconType} />
    </button>
  );
};

export default ModusIconButton;
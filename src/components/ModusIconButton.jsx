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
    
    // Een kleine timeout zorgt ervoor dat React écht klaar is met het tekenen van de DOM
    const initTooltip = setTimeout(() => {
      if (tooltip && triggerRef.current) {
        bsTooltip = new Tooltip(triggerRef.current, { 
          title: tooltip,
          placement: 'bottom',
          // We zetten de trigger expliciet op 'hover'. 
          // Dit voorkomt dat tooltips open blijven staan nadat je erop geklikt hebt!
          trigger: 'hover' 
        });
      }
    }, 10);

    // Cleanup: Als de knop van het scherm verdwijnt, ruim de tooltip dan grondig op
    return () => {
      clearTimeout(initTooltip);
      if (bsTooltip) {
        bsTooltip.hide(); // Verberg hem eerst
        bsTooltip.dispose(); // Gooi hem daarna weg uit het geheugen
      }
    };
  }, [tooltip, icon, disabled]); // Herlaad de tooltip als een van deze belangrijke waardes verandert

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
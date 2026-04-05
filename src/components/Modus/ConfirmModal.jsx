import React from 'react';
import ModusIcon from './ModusIcon';

const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = "Bevestigen", 
  cancelText = "Annuleren",
  variant = "primary" // Kan zijn: 'primary' (Blauw), 'danger' (Rood), 'warning' (Oranje)
}) => {
  
  if (!isOpen) return null;

  // Bepaal de knop styling en het icoon op basis van de variant
  const buttonClass = `btn btn-${variant}`;
  
  let iconName = 'info';
  let iconColor = 'text-primary';
  
  if (variant === 'danger') { 
    iconName = 'warning'; 
    iconColor = 'text-danger'; 
  } else if (variant === 'warning') { 
    iconName = 'warning'; 
    iconColor = 'text-warning'; 
  }

  return (
    <>
      {/* Donkere achtergrond overlay */}
      <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
      
      {/* De Modal zelf */}
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content shadow-lg border-0">
            
            <div className="modal-header">
              <h5 className="modal-title d-flex align-items-center">
                <ModusIcon name={iconName} size="24px" extraClasses={`me-2 ${iconColor}`} />
                {title}
              </h5>
              <button type="button" className="btn-close" onClick={onCancel} aria-label="Sluiten"></button>
            </div>
            
            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>
            
            <div className="modal-footer border-top-0 bg-light">
              <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
                {cancelText}
              </button>
              <button type="button" className={buttonClass} onClick={onConfirm}>
                {confirmText}
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
};

export default ConfirmModal;
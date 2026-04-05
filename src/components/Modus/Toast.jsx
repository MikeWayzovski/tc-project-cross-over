import React from 'react';
import ModusIcon from './ModusIcon';

const Toast = ({ toast, onClose }) => {
  if (!toast) return null;

  const borderColor = toast.type === 'success' ? '#00853B' : toast.type === 'warning' ? '#E56A00' : '#D22D2D';
  const iconName = toast.type === 'success' ? 'check-circle' : 'warning';

  return (
    <div 
      className={`alert alert-${toast.type} shadow-lg d-flex align-items-center`} 
      style={{ 
        position: 'absolute', 
        top: '20px', 
        right: '20px', 
        zIndex: 9999, 
        minWidth: '350px',
        borderLeft: `5px solid ${borderColor}`
      }}
    >
      <ModusIcon 
        name={iconName} 
        size="24px" 
        extraClasses={`me-3 text-${toast.type}`} 
      />
      <div className="fw-semibold">
        {toast.message}
      </div>
      <button type="button" className="btn-close ms-auto" onClick={onClose}></button>
    </div>
  );
};

export default Toast;
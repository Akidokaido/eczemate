import React from 'react';

const Card = ({ 
  children, 
  className = "", 
  hoverEffect = false, 
  onClick, 
  ...props 
}) => {
  // Base classes for the card
  const baseClasses = "bg-white border border-slate-100 p-6 rounded-2xl shadow-sm";
  
  // Optional hover animation classes
  const hoverClasses = hoverEffect ? "hover:shadow-md transition-shadow cursor-pointer" : "";

  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`.trim()} 
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;

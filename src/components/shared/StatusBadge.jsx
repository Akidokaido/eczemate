// Reusable badge that shows appointment/doctor status with color coding
// Green = approved/completed, Yellow = pending, Red = rejected/cancelled
import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalizedStatus = status.toLowerCase();
  
  // Base styling classes shared by all badges
  const baseClasses = "text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider";
  
  // Determine specific colors based on the status
  let colorClasses = "";
  
  switch (normalizedStatus) {
    case 'approved':
    case 'completed':
      colorClasses = "bg-emerald-100 text-emerald-700";
      break;
    case 'pending':
      colorClasses = "bg-amber-100 text-amber-700";
      break;
    case 'rejected':
    case 'cancelled':
      colorClasses = "bg-rose-100 text-rose-700";
      break;
    default:
      colorClasses = "bg-slate-100 text-slate-700";
      break;
  }

  return (
    <span className={`${baseClasses} ${colorClasses}`}>
      {status}
    </span>
  );
};

export default StatusBadge;

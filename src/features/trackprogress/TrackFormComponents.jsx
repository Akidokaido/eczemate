// Reusable form components used in TrackProgress
// Chip = selectable tag, SliderRow = labeled range slider, CollapsibleSection = accordion
import { useState } from "react";
import { X, ChevronDown } from "lucide-react";

// Clickable chip/tag - used for triggers and food selections
export const Chip = ({ label, active, removable, onClick, onRemove, disabled }) => (
  <div
    onClick={disabled ? undefined : onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
      disabled ? "cursor-default opacity-70" : "cursor-pointer"
    } ${
      active
        ? "bg-[#0D9488]/10 border-[#0D9488] text-[#0D9488]"
        : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"
    }`}
  >
    {label}
    {removable && !disabled && (
      <X
        size={14}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="hover:text-red-500"
      />
    )}
  </div>
);

// Range slider with label, value display, and color that changes based on severity
export const SliderRow = ({ label, value, setValue, max = 3, disabled }) => {
  const ratio = max > 0 ? value / max : 0;
  
  // Color changes: green (low) → orange (mid) → red (high)
  const accentColor = ratio > 0.66 ? "accent-red-500" : ratio > 0.33 ? "accent-orange-500" : "accent-emerald-500";
  const textColor = ratio > 0.66 ? "text-red-600" : ratio > 0.33 ? "text-orange-600" : "text-emerald-600";
  const bgColor = ratio > 0.66 ? "bg-red-50" : ratio > 0.33 ? "bg-orange-50" : "bg-emerald-50";

  return (
    <div className="space-y-1 mb-4">
      <div className="flex justify-between text-sm text-slate-600 font-medium group relative">
        <span className="flex items-center gap-1 cursor-help" title={`Rate intensity from 0 (None) to ${max} (Severe)`}>
          {label}
        </span>
        <span className={`${bgColor} px-2 py-0.5 rounded ${textColor} font-bold transition-colors`}>
          {value} / {max}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={`w-full ${accentColor} transition-colors duration-300`}
        disabled={disabled}
      />
      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mt-1">
        <span>None</span>
        <span>Severe</span>
      </div>
    </div>
  );
};

// Collapsible accordion section with title, icon, and expand/collapse toggle
export const CollapsibleSection = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3 text-xl font-bold text-slate-800">
          {icon}
          {title}
        </div>
        <div className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={24} />
        </div>
      </button>
      
      {/* Animated expand/collapse content area */}
      <div 
        className={`transition-all duration-300 ease-in-out origin-top ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="p-5 pt-0 border-t border-slate-100">
          {children}
        </div>
      </div>
    </div>
  );
};

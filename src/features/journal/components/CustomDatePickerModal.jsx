import React, { useState, useEffect, useMemo } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper: Get number of days in a month
const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// Helper: Format date as YYYY-MM-DD local
const toLocalDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CustomDatePickerModal = ({ isOpen, onClose, onSelect, initialMode = 'week', initialDate = new Date(), data = [] }) => {
  const [mode, setMode] = useState(initialMode);
  // View month is the left calendar's month
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11
  
  const [selectedDate, setSelectedDate] = useState(initialDate);

  // Reset view when opened
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setSelectedDate(initialDate);
      setViewYear(initialDate.getFullYear());
      setViewMonth(initialDate.getMonth());
    }
  }, [isOpen, initialMode, initialDate]);

  // Create a map of dates that have data to their severity color
  const dataDots = useMemo(() => {
    const map = {};
    data.forEach(item => {
      const d = item.fullDate || new Date(item.date);
      const str = toLocalDateStr(d);
      const score = item.score || 0;
      let severity = 'mild';
      if (score > 50) severity = 'severe';
      else if (score > 25) severity = 'moderate';
      map[str] = severity;
    });
    return map;
  }, [data]);

  if (!isOpen) return null;

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  // Calculate the currently selected range based on selectedDate and mode
  const getSelectedRange = () => {
    if (!selectedDate) return { start: null, end: null };
    
    if (mode === 'week') {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start, end };
    } else {
      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
      return { start, end };
    }
  };

  const { start: rangeStart, end: rangeEnd } = getSelectedRange();

  const isDateInRange = (d) => {
    if (!rangeStart || !rangeEnd) return false;
    const dateStr = toLocalDateStr(d);
    return dateStr >= toLocalDateStr(rangeStart) && dateStr <= toLocalDateStr(rangeEnd);
  };

  const isDateSelected = (d) => {
    return toLocalDateStr(d) === toLocalDateStr(selectedDate);
  };

  const handleDateClick = (d) => {
    setSelectedDate(d);
  };

  const handleSelect = () => {
    onSelect(mode, selectedDate);
    onClose();
  };

  const renderCalendarMonth = (year, month) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = getDaysInMonth(year, month);
    const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'short' });
    
    const days = [];
    // Empty slots before 1st day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
    }
    
    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const currentDate = new Date(year, month, i);
      const dateStr = toLocalDateStr(currentDate);
      const inRange = isDateInRange(currentDate);
      const isStart = rangeStart && dateStr === toLocalDateStr(rangeStart);
      const isEnd = rangeEnd && dateStr === toLocalDateStr(rangeEnd);
      const severity = dataDots[dateStr];
      
      let bgClass = "bg-transparent";
      let textClass = "text-slate-700 hover:bg-slate-100";
      let roundedClass = "rounded-full";

      if (inRange) {
        bgClass = "bg-[#0D9488]/10";
        textClass = "text-[#0D9488] font-bold";
        roundedClass = "rounded-none"; // square for in-between days
      }

      if (isStart) {
        bgClass = "bg-[#0D9488]";
        textClass = "text-white font-bold";
        roundedClass = "rounded-l-full";
      }

      if (isEnd) {
        bgClass = isStart ? "bg-[#0D9488]" : "bg-[#0D9488]";
        textClass = "text-white font-bold";
        roundedClass = isStart ? "rounded-full" : "rounded-r-full";
      }

      // If week mode and the range spans only one day (impossible here but safety), or it's just selected
      if (mode === 'month' && inRange) {
         bgClass = "bg-[#0D9488]/10";
         textClass = "text-[#0D9488] font-bold";
         roundedClass = "rounded-none";
         if (i === 1) roundedClass = "rounded-l-xl";
         if (i === daysInMonth) roundedClass = "rounded-r-xl";
      }

      days.push(
        <div key={i} className="relative h-10 w-10 flex items-center justify-center p-0.5">
           <button
             onClick={() => handleDateClick(currentDate)}
             className={`w-full h-full flex flex-col items-center justify-center transition-all ${bgClass} ${textClass} ${roundedClass}`}
           >
             <span className="text-sm">{i}</span>
             {severity && (
               <span className={`w-1 h-1 rounded-full mt-0.5 absolute bottom-1.5 ${severity === 'severe' ? 'bg-rose-500' : severity === 'moderate' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
             )}
           </button>
        </div>
      );
    }

    return (
      <div className="w-full">
        <h3 className="text-center font-bold text-slate-800 mb-4">{monthName} {year}</h3>
        <div className="grid grid-cols-7 gap-y-1 place-items-center">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="text-xs font-bold text-slate-400 mb-2">{day}</div>
          ))}
          {days}
        </div>
      </div>
    );
  };

  // Right calendar is always next month
  let rightYear = viewYear;
  let rightMonth = viewMonth + 1;
  if (rightMonth > 11) {
    rightMonth = 0;
    rightYear++;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-[#0D9488] text-white px-6 py-4 flex items-center justify-between">
          <h2 className="font-bold text-sm tracking-widest uppercase">Select Date Range</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Toggle */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center bg-slate-100 p-1 rounded-full">
              <button
                onClick={() => setMode('week')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'week' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Week
              </button>
              <button
                onClick={() => setMode('month')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${mode === 'month' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Calendars */}
          <div className="relative flex flex-col md:flex-row gap-8">
            <button onClick={prevMonth} className="absolute left-0 top-0 mt-0 md:-ml-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 transition-colors z-10">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex-1 px-4">
              {renderCalendarMonth(viewYear, viewMonth)}
            </div>
            
            <div className="hidden md:block w-px bg-slate-100"></div>
            
            <div className="flex-1 px-4">
              {renderCalendarMonth(rightYear, rightMonth)}
            </div>

            <button onClick={nextMonth} className="absolute right-0 top-0 mt-0 md:-mr-3 p-2 bg-slate-50 hover:bg-slate-100 rounded-full text-slate-600 transition-colors z-10">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Footer Legend & Action */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-600">
              <span className="uppercase text-[10px] tracking-widest text-slate-400">PO-SCORAD key:</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Mild</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Moderate</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Severe</span>
            </div>
            <button
              onClick={handleSelect}
              className="w-full sm:w-auto px-8 py-3 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-xl font-bold shadow-sm shadow-[#0D9488]/20 transition-all"
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDatePickerModal;

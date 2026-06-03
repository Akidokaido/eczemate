import React, { useState, useMemo } from "react";
import { Activity, CalendarDays, Camera, Flame, Apple, Pill, Calendar } from "lucide-react";
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import BodyMap from "../../../components/shared/BodyMap";
import { auth } from "../../../firebase/config";

const toLocalDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getSeverityInfo = (score) => {
  if (score > 50) return { label: "Severe", color: "bg-rose-500", textColor: "text-rose-600", bgColor: "bg-rose-50", borderColor: "border-rose-200" };
  if (score > 25) return { label: "Moderate", color: "bg-amber-500", textColor: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200" };
  return { label: "Mild", color: "bg-emerald-500", textColor: "text-emerald-600", bgColor: "bg-emerald-50", borderColor: "border-emerald-200" };
};

const PastProgressLogs = ({ progressData = [] }) => {
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [showCalendar, setShowCalendar] = useState(false);
  const [bodyMapView, setBodyMapView] = useState("front");

  // Map of dateKey -> log data
  const logsByDate = useMemo(() => {
    const map = {};
    progressData.forEach(log => {
      if (log.dateKey) {
        map[log.dateKey] = log;
      } else if (log.timestamp) {
        const d = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
        map[toLocalDateStr(d)] = log;
      }
    });
    return map;
  }, [progressData]);

  const selectedLog = logsByDate[selectedDate] || null;

  const userName = auth.currentUser?.displayName || "Patient";

  return (
    <div className="relative w-full z-10">
      {/* Header Row */}
      <div className="flex items-start justify-between mb-8 relative z-20">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-none bg-white px-1 mt-2">
            {selectedDate === todayStr ? "Todays Log" : new Date(selectedDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </h2>
        </div>

        <div className="relative z-[60]">
          <button
            onClick={() => setShowCalendar(!showCalendar)}
            className="flex items-center justify-center gap-2 bg-white border border-slate-300 hover:border-slate-400 rounded-full px-6 py-2 shadow-sm transition-all text-sm font-bold text-slate-800 min-w-[140px]"
          >
            <CalendarDays className="w-4 h-4 text-[#0D9488]" />
            {new Date(selectedDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}
          </button>

          {/* Floating Calendar Dropdown */}
          {showCalendar && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
              <div className="absolute top-12 right-0 z-50 bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
                <ReactCalendar
                  onChange={(date) => {
                    setSelectedDate(toLocalDateStr(date));
                    setShowCalendar(false);
                  }}
                  value={new Date(selectedDate + "T00:00:00")}
                  className="border-0 font-sans"
                  tileContent={({ date, view }) => {
                    if (view === 'month') {
                      const dateStr = toLocalDateStr(date);
                      const log = logsByDate[dateStr];
                      if (log) {
                        const score = log.scoradScore ?? log.percentage ?? 0;
                        let dotColor = "bg-emerald-500";
                        if (score > 50) dotColor = "bg-rose-500";
                        else if (score > 25) dotColor = "bg-amber-500";
                        return <div className={`w-1.5 h-1.5 ${dotColor} rounded-full mx-auto mt-1 absolute bottom-1 left-1/2 -translate-x-1/2 shadow-sm`} />;
                      }
                    }
                    return null;
                  }}
                  tileClassName={({ date, view }) => {
                    if (view === 'month') {
                      return "relative pt-2 pb-4 hover:bg-slate-50 rounded-xl transition-all";
                    }
                    return "";
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      {selectedLog ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* Column 1: PO-SCORAD Score & Clinical Signs */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            
            {/* Score Box */}
            {(() => {
              const score = Math.round(selectedLog.scoradScore ?? selectedLog.percentage ?? 0);
              const severity = getSeverityInfo(score);
              return (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col relative overflow-hidden shadow-sm">
                  {/* Decorative severity line at the top */}
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${severity.color}`} />
                  
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">PO-SCORAD SCORE</p>
                    <div className={`px-2.5 py-0.5 rounded-full bg-white border ${severity.borderColor} shadow-sm flex items-center gap-1.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${severity.color}`} />
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${severity.textColor}`}>{severity.label}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black text-slate-800 tracking-tighter">{score}</span>
                    <span className="text-sm text-slate-400 font-bold">/103</span>
                  </div>
                </div>
              );
            })()}

            {/* Clinical Signs Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-sm">
              <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-200">
                <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#0D9488]" /> Clinical Signs
                </h4>
              </div>
              
              <div className="p-5 flex-1 flex flex-col">
                {selectedLog.skinCondition ? (
                  <div className="flex-1 flex flex-col">
                    <div className="space-y-1 mb-auto">
                      {Object.entries(selectedLog.skinCondition).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <span className="text-xs font-semibold text-slate-600 capitalize">{key}</span>
                          <div className="flex items-center gap-1">
                            {/* Visual indicator for score /3 */}
                            <div className="flex gap-0.5">
                              {[1, 2, 3].map(num => (
                                <div key={num} className={`w-3 h-1.5 rounded-sm ${num <= value ? 'bg-[#0D9488]' : 'bg-slate-200'}`} />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 w-5 text-right">{value}/3</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Itch & Sleep inline at the bottom of Clinical Signs */}
                    <div className="mt-6 pt-5 border-t border-slate-200 grid grid-cols-2 gap-4">
                      <div className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                          <Flame className="w-3 h-3 text-rose-400" /> ITCH
                        </p>
                        <p className="text-xl font-black text-slate-800">{selectedLog.itch ?? '-'}<span className="text-xs text-slate-400 font-bold">/10</span></p>
                      </div>
                      <div className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1">
                           SLEEP
                        </p>
                        <p className="text-xl font-black text-slate-800">{selectedLog.sleep ?? '-'}<span className="text-xs text-slate-400 font-bold">/10</span></p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-xs font-bold text-slate-400">
                    No signs recorded
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Column 2: Triggers */}
          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-200">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Apple className="w-3.5 h-3.5 text-rose-500" /> Triggers
              </h4>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {selectedLog.triggers?.environmental?.map((t, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {t}
                  </div>
                ))}
                {selectedLog.triggers?.food?.map((f, i) => (
                  <div key={`f-${i}`} className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400" /> {f}
                  </div>
                ))}
                {(!selectedLog.triggers?.environmental?.length && !selectedLog.triggers?.food?.length) && (
                  <div className="bg-white border border-slate-100 border-dashed rounded-xl p-4 text-xs font-bold text-slate-400 text-center">
                    None recorded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Medications */}
          <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
            <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-200">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Pill className="w-3.5 h-3.5 text-[#0D9488]" /> Medications
              </h4>
            </div>
            <div className="p-5 flex-1 overflow-y-auto">
              <div className="flex flex-col gap-2">
                {selectedLog.medications?.map((m, i) => {
                  const name = typeof m === 'string' ? m : m.name;
                  return (
                    <div key={i} className="bg-white border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#0D9488]" /> {name || 'Unknown'}
                    </div>
                  );
                })}
                {(!selectedLog.medications || selectedLog.medications.length === 0) && (
                  <div className="bg-white border border-slate-100 border-dashed rounded-xl p-4 text-xs font-bold text-slate-400 text-center">
                    None recorded
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 4: Affected Areas (Body Map) */}
          <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm relative">
            <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-200 relative z-10">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                 Affected Areas
              </h4>
            </div>
            
            <div className="flex-1 w-full flex items-center justify-center p-4 bg-gradient-to-b from-slate-50 to-slate-100/50 min-h-[350px]">
              <div className="w-full max-w-[200px]">
                <BodyMap 
                  readOnly={true} 
                  selectedParts={selectedLog.affectedAreas || []} 
                  externalView={bodyMapView}
                  hideControls={true}
                  photos={selectedLog.photos || {}}
                />
              </div>
            </div>

            {/* View Toggles on the right side of the map */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-20">
              <button 
                onClick={() => setBodyMapView("front")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                  bodyMapView === "front" 
                    ? "bg-white text-slate-800 border-2 border-[#0D9488] shadow-md scale-105" 
                    : "bg-white/80 text-slate-500 border border-slate-200 hover:bg-white hover:border-slate-300"
                }`}
              >
                Front View
              </button>
              <button 
                onClick={() => setBodyMapView("back")}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-sm ${
                  bodyMapView === "back" 
                    ? "bg-white text-slate-800 border-2 border-[#0D9488] shadow-md scale-105" 
                    : "bg-white/80 text-slate-500 border border-slate-200 hover:bg-white hover:border-slate-300"
                }`}
              >
                Back View
              </button>
            </div>

          </div>

        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <CalendarDays className="h-8 w-8 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-600">No log for this day</p>
          <p className="text-sm text-slate-400 mt-1">Pick a date with a colored dot from the calendar</p>
        </div>
      )}
    </div>
  );
};

export default PastProgressLogs;

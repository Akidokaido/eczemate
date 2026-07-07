// ReadOnlyView - shown after the patient has already submitted their daily PO-SCORAD log
// Displays a summary dashboard with SCORAD gauge, AI insight, quick stats, clinical signs, and body map
import { Hand, Droplet, Moon, Activity, Flame, Apple, Pill, Edit3, HelpCircle, Sparkles, ChevronRight, Zap, AlertTriangle, User } from "lucide-react";
import { getAuth } from "firebase/auth";
import BodyMap from "../../components/shared/BodyMap";
import { calculateSCORADArea, getAiInsight } from "./scoradUtils";

export default function ReadOnlyView({ 
  scoradScore, skin, itch, sleep, affectedAreas, photos,
  activeTriggers, customTriggers, activeFoods, customFoods,
  medications, setIsEditing, setActiveSection
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 lg:p-8 text-slate-800 flex justify-center font-sans">
      <div className="max-w-6xl w-full space-y-6 animate-fade-in-up mt-6">
        
        {/* HERO SECTION - color changes by severity */}
        <div className={`rounded-2xl shadow-md p-8 lg:p-10 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between transition-colors duration-500 ${
          scoradScore > 50 ? 'bg-gradient-to-br from-red-600 to-rose-500' :
          scoradScore >= 26 ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
          'bg-gradient-to-br from-teal-600 to-emerald-500'
        }`}>
           {/* Background glow effect */}
           <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none" />
           
           {/* Info tooltip explaining PO-SCORAD */}
           <div className="absolute top-4 right-4 group cursor-help z-20">
             <div className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center transition-colors">
               <HelpCircle size={18} className="text-white" />
             </div>
             <div className="absolute top-full right-0 mt-2 w-72 bg-slate-800 text-white text-xs p-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 font-medium">
               PO-SCORAD (Patient-Oriented SCORing Atopic Dermatitis) is a clinical formula that calculates eczema severity based on affected body area (20%), intensity of redness/swelling (60%), and subjective symptoms like itchiness and sleep loss (20%).
               <div className="absolute bottom-full right-3 border-4 border-transparent border-b-slate-800"></div>
             </div>
           </div>
           
           {/* Greeting and edit button */}
           <div className="relative z-10 text-center lg:text-left flex flex-col items-center lg:items-start">
              <p className="text-white/80 font-medium mb-1.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Good morning, {getAuth().currentUser?.displayName?.split(' ')[0] || "Patient"}</h1>
              <p className="text-white/80 mt-3 text-sm sm:text-base max-w-md leading-relaxed">Your health log for today has been successfully recorded. You're doing great!</p>
              
              <button onClick={() => setIsEditing(true)} className="mt-8 bg-white/20 hover:bg-white/30 transition backdrop-blur-md px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm">
                 <Edit3 size={16} /> Edit Today's Log
              </button>
           </div>
           
           {/* SCORAD circular gauge */}
           <div className="mt-10 lg:mt-0 flex items-center gap-6 relative z-10">
              <div className="relative flex items-center justify-center">
                 <svg className="w-36 h-36 sm:w-40 sm:h-40 transform -rotate-90">
                    <circle cx="80" cy="80" r="65" className="stroke-white/20" strokeWidth="10" fill="none" />
                    <circle cx="80" cy="80" r="65" className="stroke-white transition-all duration-1000 ease-out" strokeWidth="10" fill="none" strokeDasharray={408} strokeDashoffset={408 - (scoradScore / 103) * 408} strokeLinecap="round" />
                 </svg>
                 <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl sm:text-5xl font-black">{Math.round(scoradScore)}</span>
                    <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-1">PO-SCORAD</span>
                 </div>
              </div>
              <div className="flex flex-col gap-3">
                 <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-sm">
                    <span className="text-[10px] text-white/80 block mb-0.5 uppercase tracking-widest font-bold">Severity</span>
                    <span className="text-lg font-bold">{scoradScore > 50 ? "Severe" : scoradScore >= 26 ? "Moderate" : "Mild"}</span>
                 </div>
                 {scoradScore > 50 && (
                   <div className="bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                      <AlertTriangle size={14}/> Action Needed
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* AI INSIGHT CARD */}
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] transition duration-300">
           <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 to-emerald-400" />
           <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-teal-600 group-hover:scale-110 transition duration-300">
                 <Sparkles size={24} />
              </div>
              <div>
                 <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">System Insights</h3>
                 <p className="text-slate-700 text-sm leading-relaxed font-medium">{getAiInsight(scoradScore, skin, itch, sleep)}</p>
              </div>
           </div>
            {/* Severe → book appointment, Mild → ask AI */}
            {scoradScore >= 26 ? (
              <button onClick={() => setActiveSection("appointment")} className="flex-shrink-0 bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold px-6 py-2.5 rounded-full transition shadow-md shadow-orange-200/50 flex items-center gap-2 text-sm w-full md:w-auto justify-center">
                Seek Help <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={() => setActiveSection("ai-chat")} className="flex-shrink-0 bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold px-6 py-2.5 rounded-full transition shadow-md shadow-teal-200/50 flex items-center gap-2 text-sm w-full md:w-auto justify-center">
                Ask AI <ChevronRight size={16} />
              </button>
            )}
         </div>

        {/* QUICK STATS - 4 cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           {[
             { label: "Itch Level", val: `${itch}/10`, icon: Droplet, col: "text-sky-500", bg: "bg-sky-50" },
             { label: "Sleep Loss", val: `${sleep}/10`, icon: Moon, col: "text-indigo-500", bg: "bg-indigo-50" },
             { label: "Affected BSA", val: `${Math.round(calculateSCORADArea(affectedAreas))}%`, icon: Activity, col: "text-rose-500", bg: "bg-rose-50" },
             { label: "Days Streak", val: "3 Days", icon: Flame, col: "text-orange-500", bg: "bg-orange-50" }
           ].map((s, i) => (
             <div key={i} className="bg-white rounded-2xl p-5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-slate-100 hover:-translate-y-1 transition duration-300">
                <div className="flex items-center gap-3 mb-3">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.col}`}><s.icon size={16}/></div>
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{s.label}</span>
                </div>
                <div className="text-2xl font-black text-slate-800">{s.val}</div>
             </div>
           ))}
        </div>

        {/* 60/40 SPLIT - Clinical details on left, body map on right */}
        <div className="flex flex-col lg:flex-row gap-6">
           
           {/* LEFT COLUMN (60%) */}
           <div className="flex-[3] space-y-6">
              {/* Clinical Signs breakdown */}
              <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <Hand size={18} className="text-teal-600" />
                     <h3 className="font-bold text-slate-800">Clinical Signs</h3>
                   </div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensity</span>
                 </div>
                 <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                    {[
                      { l: "Redness", v: skin.redness }, { l: "Swelling", v: skin.swelling },
                      { l: "Oozing/Crusts", v: skin.oozing }, { l: "Scratch Marks", v: skin.scratch },
                      { l: "Skin Thickening", v: skin.lichenification }, { l: "Dryness", v: skin.dryness },
                    ].map(({ l, v }) => (
                      <div key={l} className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-slate-700">{l}</span>
                          <span className="font-bold text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">{v}/3</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-1000 ease-out ${v === 0 ? 'w-0' : v === 1 ? 'w-1/3 bg-emerald-400' : v === 2 ? 'w-2/3 bg-amber-400' : 'w-full bg-red-400'}`}></div>
                        </div>
                      </div>
                    ))}
                 </div>
              </div>

              {/* Triggers & Diet tags */}
              {([...activeTriggers, ...customTriggers, ...activeFoods, ...customFoods].length > 0) && (
                <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                   <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                      <Zap size={18} className="text-orange-500" />
                      <h3 className="font-bold text-slate-800">Triggers & Diet</h3>
                   </div>
                   <div className="p-6 flex gap-2.5 overflow-x-auto custom-scrollbar pb-6">
                      {[...activeTriggers, ...customTriggers].map(t => (
                        <span key={t} className="whitespace-nowrap px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full border border-blue-100">{t}</span>
                      ))}
                      {[...activeFoods, ...customFoods].map(f => (
                        <span key={f} className="whitespace-nowrap px-4 py-1.5 bg-orange-50 text-orange-600 text-sm font-semibold rounded-full border border-orange-100">{f}</span>
                      ))}
                   </div>
                </div>
              )}

              {/* Medications list */}
              <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                 <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                    <Pill size={18} className="text-indigo-500" />
                    <h3 className="font-bold text-slate-800">Medications</h3>
                 </div>
                 <div className="p-4 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                    {medications.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-6 font-medium">No medications logged today.</p>
                    ) : (
                      medications.map(m => (
                        <div key={m.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                           <div className="flex items-center gap-3">
                              <div className={`w-2 h-2 rounded-full shadow-sm ${m.status === 'ongoing' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-300'}`} />
                              <div>
                                 <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                                 <p className="text-xs text-slate-500 font-medium mt-0.5">{m.dosage || "Daily"}</p>
                              </div>
                           </div>
                           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{m.frequency || "As needed"}</span>
                        </div>
                      ))
                    )}
                 </div>
              </div>
           </div>

           {/* RIGHT COLUMN (40%) - Body Map */}
           <div className="flex-[2] space-y-6 flex flex-col">
              <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-[380px]">
                 <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <User size={18} className="text-slate-600" />
                     <h3 className="font-bold text-slate-800">Affected Areas</h3>
                   </div>
                   <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-md">{Math.round(calculateSCORADArea(affectedAreas))}% BSA</span>
                 </div>
                 <div className="flex-1 flex justify-center items-center p-4 bg-[#FAFAF9] relative">
                    <BodyMap selectedParts={affectedAreas} photos={photos} readOnly />
                 </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}

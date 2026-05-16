import React from "react";
import { Send, Coffee, PencilLine, Sparkles } from "lucide-react";
import { emotionsList, PILL_COLORS } from "../constants";

const JournalComposer = ({ 
  newEntry, setNewEntry, 
  selectedEmotion, setSelectedEmotion, 
  foodLog, setFoodLog, 
  handlePostEntry, submitting, error 
}) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden relative group transition-all duration-500 hover:shadow-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0D9488]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <PencilLine className="h-5 w-5 text-[#0D9488]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">Today's Reflection</h3>
            <p className="text-xs text-[#64748B] font-medium">Capture your feelings and progress</p>
          </div>
        </div>
        <Sparkles className="h-4 w-4 text-[#F97316] animate-pulse" />
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl text-sm bg-rose-50 text-rose-600 border border-rose-100 animate-fade-in flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          {error}
        </div>
      )}
      
      <form onSubmit={handlePostEntry} className="space-y-8">
        {/* Emotion Selector */}
        <div>
          <label className="text-[11px] font-bold text-[#64748B] mb-3 block uppercase tracking-widest">How are you feeling?</label>
          <div className="grid grid-cols-5 gap-2">
            {emotionsList.map(emo => {
              const Icon = emo.icon;
              const isSelected = selectedEmotion === emo.id;
              const colors = PILL_COLORS[emo.id] || PILL_COLORS.calm;

              return (
                <button 
                  key={emo.id} type="button"
                  onClick={() => setSelectedEmotion(emo.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300 border-2 ${isSelected ? `${colors.bg} ${colors.text} border-transparent shadow-sm` : `bg-white border-slate-50 text-slate-400 hover:border-slate-100 hover:bg-slate-50`}`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="text-[10px] font-bold">{emo.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Food Log */}
        <div className="relative">
          <label className="text-sm font-bold text-[#1C1917] mb-2 flex items-center gap-2 tracking-wide">
            <Coffee className="h-4 w-4 text-[#64748B]" /> Dietary Log
          </label>
          <input 
            type="text"
            placeholder="What was on your plate today?"
            className="w-full bg-[#FDFBF7] border-2 border-transparent rounded-2xl px-5 py-4 text-sm text-[#1C1917] placeholder-[#94a3b8] focus:bg-white focus:border-[#0D9488]/20 focus:ring-4 focus:ring-[#0D9488]/[0.06] transition-all duration-300 outline-none"
            value={foodLog}
            onChange={(e) => setFoodLog(e.target.value)}
          />
        </div>

        {/* Journal Text */}
        <div className="relative">
          <label className="text-sm font-bold text-[#1C1917] mb-2 block tracking-wide">Detailed Thoughts</label>
          <textarea 
            className="w-full bg-[#FDFBF7] border-2 border-transparent rounded-3xl px-5 py-4 text-sm text-[#1C1917] placeholder-[#94a3b8] focus:bg-white focus:border-[#0D9488]/20 focus:ring-4 focus:ring-[#0D9488]/[0.06] transition-all duration-300 outline-none resize-none min-h-[140px]"
            placeholder="How did your skin behave today? Any specific triggers or victories..."
            value={newEntry}
            onChange={(e) => setNewEntry(e.target.value)}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={submitting || !newEntry.trim()} 
          className="w-full relative group overflow-hidden bg-[#0D9488] hover:bg-[#0f766e] text-white flex justify-center items-center gap-2.5 py-3 rounded-xl disabled:opacity-50 transition-all duration-300 font-bold shadow-lg shadow-[#0D9488]/20"
        >
          <Send className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /> 
          <span className="relative z-10 text-sm">{submitting ? "Publishing..." : "Post Reflection"}</span>
        </button>
      </form>
    </div>
  );
};

export default JournalComposer;

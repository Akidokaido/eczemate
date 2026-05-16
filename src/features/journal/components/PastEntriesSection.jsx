import React, { useRef } from "react";
import { BookOpen, Sparkles, XCircle, Coffee, CalendarDays, Filter, ChevronRight } from "lucide-react";
import { emotionsList, PILL_COLORS } from "../constants";

const PastEntriesSection = ({ 
  loading, 
  entries, 
  filteredEntries, 
  selectedDate, 
  setSelectedDate, 
  handleAnalyzeTriggers, 
  isAnalyzing, 
  aiInsight,
  setAiInsight,
  formatTime
}) => {
  const dateInputRef = useRef(null);

  const handleDateClick = () => {
    if (dateInputRef.current && dateInputRef.current.showPicker) {
      try {
        dateInputRef.current.showPicker();
      } catch (err) {
        console.error("Browser doesn't support showPicker", err);
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col print:!bg-white print:!shadow-none h-full transition-all duration-500 hover:shadow-md" style={{ maxHeight: 'calc(100vh - 120px)' }}>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 print:hidden flex-shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-[#0D9488]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">Timeline</h3>
            <p className="text-[10px] text-[#64748B] font-medium">Historical reflections</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleAnalyzeTriggers} 
            disabled={isAnalyzing || entries.length === 0} 
            className="group flex items-center gap-2 px-3 py-2 bg-[#F97316]/10 text-[#F97316] hover:bg-[#F97316]/20 rounded-xl text-[10px] font-bold transition-all duration-300 disabled:opacity-50 border border-[#F97316]/20 shadow-sm"
          >
            <Sparkles className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} />
            {isAnalyzing ? "..." : "Analyze"}
          </button>
          
          <div className="relative flex items-center group">
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute w-0 h-0 opacity-0 overflow-hidden"
            />
            <button 
              onClick={handleDateClick}
              className={`flex items-center gap-2 px-3 py-2 border-2 rounded-xl text-[10px] font-bold transition-all duration-300 ${selectedDate ? 'bg-[#0D9488]/10 border-[#0D9488]/20 text-[#0D9488]' : 'bg-white border-slate-50 text-[#64748B] hover:bg-slate-50'}`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {selectedDate ? new Date(selectedDate).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : "Select Date"}
            </button>
          </div>
          
          {selectedDate && (
            <button onClick={() => setSelectedDate("")} className="w-10 h-10 flex items-center justify-center rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition-colors">
              <XCircle className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {aiInsight && (
        <div className="mb-8 bg-[#0D9488]/[0.04] rounded-[2rem] p-6 border border-[#0D9488]/20 shadow-sm relative print:hidden animate-fade-in-up group overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#0D9488]/[0.06] rounded-full blur-2xl" />
          
          <button onClick={() => setAiInsight(null)} className="absolute top-4 right-4 text-[#0D9488]/40 hover:text-[#0D9488] transition-colors">
            <XCircle className="h-5 w-5" />
          </button>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="h-5 w-5 text-[#0D9488]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#0D9488] mb-2 uppercase tracking-widest">AI Wellness Insight</h4>
              <p className="text-sm text-[#1C1917]/70 leading-relaxed font-medium">{aiInsight}</p>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-y-auto flex-1 space-y-6 pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 280px)' }}>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 text-slate-400">
            <div className="w-8 h-8 border-3 border-slate-100 border-t-[#0D9488] rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Fetching history...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center p-20">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-slate-600 font-bold text-lg mb-1">Begin your story</p>
            <p className="text-slate-400 text-sm font-medium">Your daily logs will appear here</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center p-20">
            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <CalendarDays className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-slate-600 font-bold text-lg mb-1">No matches found</p>
            <p className="text-slate-400 text-sm font-medium">Try another date for entries</p>
          </div>
        ) : (
          filteredEntries.map((entry, idx) => {
            const emoObj = emotionsList.find(e => e.id === entry.emotion) || emotionsList[1];
            const EmoIcon = emoObj.icon;
            const colors = PILL_COLORS[entry.emotion] || PILL_COLORS.calm;

            return (
              <div key={entry.id || idx} className="group bg-white rounded-2xl p-5 border-2 border-slate-50 hover:border-slate-100 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-500 animate-fade-in-up">
                <div className="flex justify-between items-start mb-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                    <EmoIcon className="h-3.5 w-3.5" /> 
                    {emoObj.label}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    <CalendarDays className="h-3 w-3" />
                    {formatTime(entry.createdAt)}
                  </div>
                </div>
                
                <p className="whitespace-pre-wrap leading-relaxed text-slate-700 text-[13px] font-medium mb-5 group-hover:text-slate-900 transition-colors">
                  {entry.entry}
                </p>
                
                {entry.foodLog && (
                  <div className="mt-2 p-3 rounded-xl bg-[#FDFBF7] flex items-center justify-between group-hover:bg-[#F97316]/[0.04] transition-colors duration-500">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center">
                        <Coffee className="h-3.5 w-3.5 text-[#F97316]" />
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-[#64748B] uppercase tracking-widest mb-0.5">Diet</p>
                        <p className="text-[11px] text-[#1C1917] font-bold">{entry.foodLog}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-200 group-hover:text-[#F97316]/40 transition-all" />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PastEntriesSection;

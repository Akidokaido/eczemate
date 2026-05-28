import React, { useState } from "react";
import { BookOpen, CheckCircle, ListChecks, ChevronDown, ChevronUp } from "lucide-react";

const ActionItemsSection = ({ actionItems, toggleActionItem }) => {
  const [showCompleted, setShowCompleted] = useState(false);
  const activeTasks = actionItems.filter(item => !item.completed);
  const completedTasks = actionItems.filter(item => item.completed);
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden hover:shadow-md transition-all duration-500 group">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#F97316]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
            <ListChecks className="h-4 w-4 text-[#F97316]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">Daily Care</h3>
            <p className="text-[10px] text-[#64748B] font-medium">Assigned tasks</p>
          </div>
        </div>
        {actionItems.length > 0 && (
          <div className="flex items-center gap-1.5 bg-[#0D9488]/10 text-[#0D9488] px-3 py-1 rounded-lg text-[10px] font-bold border border-[#0D9488]/20">
            <CheckCircle className="h-3 w-3 animate-pulse" /> 
            {actionItems.filter(a => a.completed).length}/{actionItems.length}
          </div>
        )}
      </div>
      
      {actionItems.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
          <BookOpen className="h-8 w-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-bold">No active tasks</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {activeTasks.map(item => (
            <div 
              key={item.id} 
              className="flex items-start gap-3 p-4 rounded-2xl transition-all duration-300 border-2 bg-white border-slate-50 hover:border-emerald-100 shadow-sm shadow-slate-100/50"
            >
              <button 
                onClick={() => toggleActionItem(item)} 
                className="mt-0.5 rounded-lg w-6 h-6 flex items-center justify-center transition-all duration-500 bg-white border-2 border-slate-100 text-transparent hover:border-[#0D9488] hover:scale-110"
              >
                <CheckCircle className="h-3.5 w-3.5 opacity-0 hover:opacity-20 text-[#0D9488]" />
              </button>
              <div className="flex-1">
                <p className="text-[13px] font-bold tracking-tight transition-all duration-300 text-slate-700 hover:text-slate-900">{item.task}</p>
                {item.doctorName && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="w-1 h-1 rounded-full bg-slate-200" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dr. {item.doctorName}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
          {activeTasks.length === 0 && actionItems.length > 0 && (
            <div className="text-center py-6 text-sm text-slate-400 font-bold">All caught up!</div>
          )}
        </div>
      )}

      {/* Completed Tasks Toggle */}
      {completedTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-100">
          <button 
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center gap-2 text-[11px] font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider transition-colors w-full"
          >
            {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showCompleted ? 'Hide' : 'View'} {completedTasks.length} Completed Task{completedTasks.length !== 1 ? 's' : ''}
          </button>
          
          {showCompleted && (
            <div className="mt-4 space-y-3 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
              {completedTasks.map(item => (
                <div 
                  key={item.id} 
                  className="flex items-start gap-3 p-3 rounded-2xl transition-all duration-300 border-2 bg-slate-50/50 border-transparent opacity-70"
                >
                  <button 
                    onClick={() => toggleActionItem(item)} 
                    className="mt-0.5 rounded-lg w-6 h-6 flex items-center justify-center transition-all duration-500 bg-[#0D9488] text-white scale-90"
                  >
                    <CheckCircle className="h-3.5 w-3.5 opacity-100" />
                  </button>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold tracking-tight transition-all duration-300 line-through text-slate-400">{item.task}</p>
                    {item.doctorName && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dr. {item.doctorName}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActionItemsSection;

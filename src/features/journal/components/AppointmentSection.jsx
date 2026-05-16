import React from "react";
import { CalendarDays, Clock, User, ChevronRight } from "lucide-react";

const AppointmentSection = ({ upcomingAppts, onCancelClick }) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden flex flex-col hover:shadow-md transition-all duration-500 group">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          <CalendarDays className="h-4 w-4 text-[#0D9488]" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">Clinical Visits</h3>
          <p className="text-[10px] text-[#64748B] font-medium">Consultations</p>
        </div>
      </div>
      
      {upcomingAppts.length === 0 ? (
        <div className="my-auto text-center py-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
          <CalendarDays className="h-8 w-8 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-bold">No upcoming visits</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcomingAppts.slice(0, 2).map(appt => {
            const apptDate = appt.date?.toDate ? appt.date.toDate() : new Date(appt.date);
            return (
              <div key={appt.id} className="group/card relative bg-slate-50/50 rounded-2xl p-4 border-2 border-transparent hover:border-[#0D9488]/20 hover:bg-white transition-all duration-500">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover/card:scale-110 transition-transform duration-500">
                      <User className="h-5 w-5 text-[#0D9488]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-tight">Dr. {appt.doctorName || "Doctor"}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Dermatologist</p>
                    </div>
                  </div>
                  <div className="bg-emerald-100/50 text-emerald-600 text-[9px] font-bold px-2 py-1 rounded-lg border border-emerald-100 flex items-center gap-1">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    Ok
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/60 border border-slate-100">
                    <CalendarDays className="h-3.5 w-3.5 text-slate-400" /> 
                    <span className="text-[10px] font-bold text-slate-600">{apptDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                  </div>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/60 border border-slate-100">
                    <Clock className="h-3.5 w-3.5 text-slate-400" /> 
                    <span className="text-[10px] font-bold text-slate-600">{appt.timeSlot || "10:30"}</span>
                  </div>
                </div>
                
                <button 
                  onClick={() => onCancelClick(appt)}
                  className="w-full flex items-center justify-center gap-2 text-[11px] font-bold text-rose-400 hover:text-rose-600 transition-colors py-1"
                >
                  Cancel Appointment
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentSection;

import React from "react";
import { XCircle, AlertCircle, CalendarDays, Clock, User } from "lucide-react";

const CancelApptModal = ({ 
  appt, 
  cancelReason, 
  setCancelReason, 
  onClose, 
  onConfirm, 
  cancelling 
}) => {
  if (!appt) return null;

  const apptDate = appt.date?.toDate ? appt.date.toDate() : new Date(appt.date);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white p-6 rounded-3xl max-w-md w-full animate-fade-in-up shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Decorative background */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-50 rounded-full blur-2xl opacity-60" />
        
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
            <XCircle className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Cancel Visit?</h3>
            <p className="text-xs text-slate-500 font-medium">This will free up the slot.</p>
          </div>
        </div>

        <div className="bg-slate-50/80 rounded-[1.5rem] p-5 mb-8 border border-slate-100 relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
              <User className="h-4 w-4 text-slate-400" />
            </div>
            <p className="text-sm font-bold text-slate-800">Dr. {appt.doctorName || "Doctor"}</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {apptDate.toLocaleDateString("en-MY", { day: "numeric", month: "short" })}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {appt.timeSlot}
            </div>
          </div>
        </div>

        <div className="mb-6 relative z-10">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Reason</label>
          <textarea
            className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-rose-100 transition-all duration-300 outline-none resize-none"
            rows={3}
            placeholder="Help us understand..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            autoFocus
          />
          <div className="flex items-center gap-2 mt-3 text-[10px] font-bold text-rose-400 uppercase">
            <AlertCircle className="h-3 w-3" />
            This action cannot be undone
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-all"
          >
            Go Back
          </button>
          <button
            onClick={onConfirm}
            disabled={cancelling || !cancelReason.trim()}
            className="flex-1 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white py-3.5 px-6 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-rose-100"
          >
            {cancelling ? "Cancelling..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CancelApptModal;

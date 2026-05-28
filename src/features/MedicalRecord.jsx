import React, { useState, useEffect } from "react";
import { firestore, auth, onAuthStateChanged, collection, query, orderBy, getDocs } from "../firebase/config";
import { FileText, Clock, Stethoscope, Calendar } from "lucide-react";
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const MedicalRecord = () => {
  const [userId, setUserId] = useState(null);
  const [records, setRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);

  const toLocalDateStr = (timestamp) => {
    if (!timestamp) return "";
    const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setUserId(user.uid);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (userId) fetchRecords();
  }, [userId]);

  const fetchRecords = async () => {
    try {
      const q = query(
        collection(firestore, "users", "patients", "accounts", userId, "officialRecords"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecords(docs);
      if (docs.length > 0) {
        setSelectedDate(toLocalDateStr(docs[0].createdAt));
      }
    } catch (err) {
      console.error("Error fetching medical records:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-MY", { 
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  return (
    <div className="flex flex-col items-center p-6 animate-fade-in-up relative overflow-hidden bg-[#FDFBF7]" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Background mesh */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0D9488]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F97316]/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-7xl space-y-6 relative z-10">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white shadow-lg shadow-[#0D9488]/10">
              <FileText className="h-6 w-6 text-[#0D9488]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight">Official Medical Records</h2>
              <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Summaries and prescriptions</p>
            </div>
          </div>
          
          {records.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-[#0D9488]/30 rounded-xl px-4 py-2.5 shadow-sm transition-all"
              >
                <Clock className="w-4 h-4 text-[#0D9488]" />
                <span className="text-sm font-bold text-slate-700">
                  {selectedDate ? new Date(selectedDate).toLocaleDateString("en-MY", { day: 'numeric', month: 'short', year: 'numeric' }) : 'Select Date'}
                </span>
                <Calendar className="w-3.5 h-3.5 text-slate-400 ml-2" />
              </button>

              {showCalendar && (
                <>
                  {/* Backdrop to close calendar when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowCalendar(false)} />
                  <div className="absolute top-14 right-0 z-50 bg-white p-4 rounded-3xl shadow-xl border border-slate-100">
                    <ReactCalendar
                      onChange={(date) => {
                        setSelectedDate(toLocalDateStr(date));
                        setShowCalendar(false);
                      }}
                      value={selectedDate ? new Date(selectedDate) : new Date()}
                      className="border-0 font-sans"
                      tileContent={({ date, view }) => {
                        if (view === 'month') {
                          const dateStr = toLocalDateStr(date);
                          const hasRecord = records.some(r => toLocalDateStr(r.createdAt) === dateStr);
                          if (hasRecord) {
                            return <div className="w-1.5 h-1.5 bg-[#0D9488] rounded-full mx-auto mt-1 absolute bottom-1 left-1/2 -translate-x-1/2 shadow-sm" />;
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
          )}
        </div>

        {loading ? (
          <div className="text-center p-8 text-[#64748B] font-medium">Loading your medical records...</div>
        ) : records.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-12 text-center">
            <Stethoscope className="h-10 w-10 text-slate-200 mx-auto mb-3" />
            <p className="font-bold text-[#1C1917] text-lg">No official records found</p>
            <p className="text-sm text-[#64748B] mt-1 font-medium">Your doctor will upload your summary here after a consultation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {records.filter(r => toLocalDateStr(r.createdAt) === selectedDate).length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-12 text-center">
                <Calendar className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                <p className="font-bold text-[#1C1917] text-lg">No records on this date</p>
                <p className="text-sm text-[#64748B] mt-1 font-medium">Try selecting a different date from the calendar.</p>
              </div>
            ) : (
              records.filter(r => toLocalDateStr(r.createdAt) === selectedDate).map((record) => (
              <div key={record.id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-6 border-l-[6px] hover:shadow-xl hover:-translate-y-1 transition-all duration-500" style={{ borderLeftColor: "#0D9488" }}>
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-2 text-[#0D9488] bg-[#0D9488]/10 px-4 py-2 rounded-xl text-sm font-bold shadow-sm shadow-[#0D9488]/5">
                    <Stethoscope className="h-4 w-4" />
                    Dr. {record.doctorName || "Unknown"}
                  </div>
                  <div className="flex items-center gap-1.5 text-[#64748B] text-[10px] font-bold uppercase tracking-wider bg-slate-50 px-3 py-1.5 rounded-lg">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(record.createdAt)}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-2">Patient Summary</h4>
                    <p className="text-[13px] text-[#1C1917] font-medium whitespace-pre-wrap leading-relaxed p-5 bg-[#FDFBF7] rounded-2xl border border-slate-100">
                      {record.patientSummary || "No summary provided."}
                    </p>
                  </div>
                  
                  {record.prescriptions && record.prescriptions.length > 0 && (
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#64748B] mb-2">Prescriptions & Instructions</h4>
                      <div className="flex flex-wrap gap-2">
                        {record.prescriptions.map((rx, idx) => (
                          <span key={idx} className="bg-white border-2 border-slate-50 text-[#1C1917] px-4 py-2 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
                            {rx}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MedicalRecord;

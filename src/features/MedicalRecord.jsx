import React, { useState, useEffect } from "react";
import { firestore, auth, onAuthStateChanged, collection, query, orderBy, getDocs } from "../firebase/config";
import { FileText, Clock, Stethoscope } from "lucide-react";

const MedicalRecord = () => {
  const [userId, setUserId] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() })));
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
    <div className="flex flex-col items-center p-6 animate-fade-in-up" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div className="w-full max-w-4xl space-y-6">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-50">
            <FileText className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Official Medical Records</h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Summaries and prescriptions provided by your doctor</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-8 text-slate-500">Loading your medical records...</div>
        ) : records.length === 0 ? (
          <div className="glass p-12 text-center rounded-2xl">
            <Stethoscope className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-600">No official records found.</p>
            <p className="text-sm text-slate-400 mt-1">Your doctor will upload your summary here after a consultation.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {records.map((record, i) => (
              <div key={record.id} className="glass p-6 border-l-4" style={{ borderLeftColor: "#6366f1" }}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-semibold">
                    <Stethoscope className="h-4 w-4" />
                    Dr. {record.doctorName || "Unknown"}
                  </div>
                  <div className="flex items-center gap-1 text-slate-400 text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    {formatTime(record.createdAt)}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Patient Summary</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed p-4 bg-slate-50 rounded-xl border border-slate-100">
                      {record.patientSummary || "No summary provided."}
                    </p>
                  </div>
                  
                  {record.prescriptions && record.prescriptions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Prescriptions / Instructions</h4>
                      <div className="flex flex-wrap gap-2">
                        {record.prescriptions.map((rx, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                            {rx}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default MedicalRecord;

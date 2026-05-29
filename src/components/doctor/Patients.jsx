import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../DoctorLayout";
import { auth, firestore, onAuthStateChanged, collection, query, where, getDocs } from "../../firebase/config";
import { getUserCollectionRef } from "../../firebase/userPaths";
import { User, Search, Filter } from "lucide-react";

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDocs(query(getUserCollectionRef("patient"), where("doctorId", "==", user.uid)));
        setPatients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) { console.error("Error:", err); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const filteredPatients = patients.filter(p => {
    const q = searchQuery.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <DoctorLayout title="Patients">
      <div className="space-y-6 animate-fade-in-up">
        
        {/* Controls: Search */}
        <div className="glass p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-3 w-full sm:w-1/2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 flex-shrink-0">
              <Search className="h-5 w-5 text-sky-500" />
            </div>
            <div className="w-full relative">
              <input 
                type="text" 
                placeholder="Search patient by name or email..." 
                className="input-dark w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest">
            <Filter size={14} />
            <span>Showing {filteredPatients.length} Patients</span>
          </div>
        </div>

        {loading ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>Loading patients...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>
            {searchQuery ? `No patients matching "${searchQuery}"` : "No patients assigned."}
          </div>
        ) : (
          <div className="stagger space-y-3 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
            {filteredPatients.map((p, i) => (
              <div key={p.id} className="glow-card p-5 flex justify-between items-center animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50">
                    <User className="h-5 w-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{p.name || "Unnamed Patient"}</p>
                    <p className="text-sm text-slate-500">{p.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                     onClick={() => navigate(`/doctor/patient/${p.id}`)} 
                     className="btn-gradient text-xs py-2 px-5"
                   >
                     View History
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default Patients;
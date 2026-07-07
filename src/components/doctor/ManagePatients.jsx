// Admin page - view and delete patient accounts
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { getDocs, deleteDoc } from "firebase/firestore";
import { getUserCollectionRef, getUserDocRef } from "../../firebase/userPaths";
import { User, Trash2, ArrowLeft, LogOut, Search } from "lucide-react";

const ManagePatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all patients from Firestore
  const fetchPatients = async () => {
    const snap = await getDocs(getUserCollectionRef("patient"));
    setPatients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  // Delete a patient after confirmation
  const deletePatient = async (id) => {
    if (!confirm("Delete this patient?")) return;
    await deleteDoc(getUserDocRef("patient", id));
    fetchPatients();
  };

  useEffect(() => { fetchPatients(); }, []);

  // Filter patients by name or email
  const filteredPatients = patients.filter(p => 
    (p.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="glass-strong p-6 space-y-4">
        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100"
          />
        </div>

        {/* Patient list */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {loading ? <p style={{ color: "var(--text-secondary)" }}>Loading...</p> : filteredPatients.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>No patients found.</p> : filteredPatients.map((p) => (
            <div key={p.id} className="glow-card p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-50">
                  <User className="h-4 w-4 text-sky-500" />
                </div>
                <div>
                  <p className="font-medium" style={{ color: "var(--text-primary)" }}>{p.name || "Unnamed"}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{p.email}</p>
                </div>
              </div>
              <button onClick={() => deletePatient(p.id)} className="btn-danger flex items-center gap-1 text-xs py-1.5 px-3">
                <Trash2 className="h-3 w-3" /> Delete
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManagePatients;
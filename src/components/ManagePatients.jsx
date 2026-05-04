import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/config";
import { signOut } from "firebase/auth";
import { getDocs, deleteDoc } from "firebase/firestore";
import { getUserCollectionRef, getUserDocRef } from "../firebase/userPaths";
import { User, Trash2, ArrowLeft, LogOut } from "lucide-react";

const ManagePatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    const snap = await getDocs(getUserCollectionRef("patient"));
    setPatients(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const deletePatient = async (id) => {
    if (!confirm("Delete this patient?")) return;
    await deleteDoc(getUserDocRef("patient", id));
    fetchPatients();
  };

  useEffect(() => { fetchPatients(); }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-mesh" />
      <div className="relative z-10 max-w-4xl mx-auto p-8 animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/adminDashboard")} className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <button onClick={async () => { await signOut(auth); navigate("/login"); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Manage Patients</h2>
        <div className="glass-strong p-6 space-y-3">
          {loading ? <p style={{ color: "var(--text-secondary)" }}>Loading...</p> : patients.length === 0 ? <p style={{ color: "var(--text-secondary)" }}>No patients found.</p> : patients.map((p) => (
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
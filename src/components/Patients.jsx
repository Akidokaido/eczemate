import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "./DoctorLayout";
import { auth, firestore, onAuthStateChanged, collection, query, where, getDocs } from "../firebase/config";
import { getUserCollectionRef } from "../firebase/userPaths";
import { User } from "lucide-react";

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <DoctorLayout title="Patients">
      <div className="space-y-4 animate-fade-in-up">
        {loading ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>Loading...</div>
        ) : patients.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>No patients assigned.</div>
        ) : (
          <div className="stagger space-y-3">
            {patients.map((p, i) => (
              <div key={p.id} className="glow-card p-5 flex justify-between items-center animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50">
                    <User className="h-5 w-5 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{p.name || "Unnamed"}</p>
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>{p.email}</p>
                  </div>
                </div>
                <button onClick={() => navigate(`/doctor/patient/${p.id}`)} className="btn-gradient text-sm py-2 px-5">View History</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default Patients;
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { auth, firestore, onAuthStateChanged, collection, query, where, getDocs } from "../../firebase/config";
import { getUserCollectionRef } from "../../firebase/userPaths";
import { Calendar, Users, FileText, Settings } from "lucide-react";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ appointments: 0, pendingAppts: 0, patients: 0 });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        // Query appointments from patient subcollections (where BookAppointment stores them)
        const patientsSnap = await getDocs(collection(firestore, "users", "patients", "accounts"));
        let allAppts = [];
        for (const patDoc of patientsSnap.docs) {
          const apptSnap = await getDocs(
            query(
              collection(firestore, "users", "patients", "accounts", patDoc.id, "appointments"),
              where("doctorId", "==", user.uid)
            )
          );
          allAppts.push(...apptSnap.docs.map(d => d.data()));
        }
        const pending = allAppts.filter((a) => a.status === "pending").length;
        const patSnap = await getDocs(query(getUserCollectionRef("patient"), where("doctorId", "==", user.uid)));
        setStats({ appointments: allAppts.length, pendingAppts: pending, patients: patSnap.size });
      } catch (err) { console.error("Error:", err); }
    });
    return () => unsub();
  }, []);

  const cards = [
    { label: "Appointments", value: stats.appointments, sub: `${stats.pendingAppts} pending`, icon: Calendar, color: "#6366f1", path: "/doctor/appointments" },
    { label: "Patients", value: stats.patients, sub: "Assigned to you", icon: Users, color: "#06b6d4", path: "/doctor/patients" },
    { label: "Settings", value: null, sub: "Account & prefs", icon: Settings, color: "#10b981", path: "/doctor/settings" },
  ];

  return (
    <DoctorLayout title="Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
        {cards.map(({ label, value, sub, icon: Icon, color, path }, i) => (
          <div key={label} onClick={() => navigate(path)} className="glow-card p-6 cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${color}12` }}>
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            {value !== null && <p className="text-3xl font-extrabold gradient-text mb-1">{value}</p>}
            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{label}</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{sub}</p>
          </div>
        ))}
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
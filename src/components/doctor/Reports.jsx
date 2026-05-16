import React, { useState, useEffect } from "react";
import DoctorLayout from "../DoctorLayout";
import { auth, firestore, onAuthStateChanged, collection, query, where, getDocs } from "../../firebase/config";
import { getUserCollectionRef } from "../../firebase/userPaths";

const Reports = () => {
  const [stats, setStats] = useState({ totalPatients: 0, totalAppointments: 0, pendingAppts: 0, approvedAppts: 0, rejectedAppts: 0, totalSymptomLogs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const apptSnap = await getDocs(query(collection(firestore, "appointments"), where("doctorId", "==", user.uid)));
        const appts = apptSnap.docs.map((d) => d.data());
        const patSnap = await getDocs(query(getUserCollectionRef("patient"), where("doctorId", "==", user.uid)));
        let totalLogs = 0;
        for (const pid of patSnap.docs.map((d) => d.id)) {
          const logSnap = await getDocs(query(collection(firestore, "symptom_logs"), where("userId", "==", pid)));
          totalLogs += logSnap.size;
        }
        setStats({
          totalPatients: patSnap.size, totalAppointments: apptSnap.size,
          pendingAppts: appts.filter((a) => a.status === "pending").length,
          approvedAppts: appts.filter((a) => a.status === "approved").length,
          rejectedAppts: appts.filter((a) => a.status === "rejected").length,
          totalSymptomLogs: totalLogs
        });
      } catch (err) { console.error("Error:", err); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const reportCards = [
    { label: "Total Patients", value: stats.totalPatients, color: "#6366f1" },
    { label: "Total Appointments", value: stats.totalAppointments, color: "#06b6d4" },
    { label: "Pending", value: stats.pendingAppts, color: "#f59e0b" },
    { label: "Approved", value: stats.approvedAppts, color: "#10b981" },
    { label: "Rejected", value: stats.rejectedAppts, color: "#ef4444" },
    { label: "Symptom Logs", value: stats.totalSymptomLogs, color: "#8b5cf6" },
  ];

  return (
    <DoctorLayout title="Reports">
      <div className="space-y-6 animate-fade-in-up">
        <div className="glass-strong p-6">
          <h3 className="text-lg font-semibold mb-6" style={{ color: "var(--text-primary)" }}>Summary Report</h3>
          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 stagger">
              {reportCards.map(({ label, value, color }, i) => (
                <div key={label} className="glow-card p-5 text-center animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                  <p className="text-3xl font-extrabold" style={{ color }}>{value}</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
};

export default Reports;
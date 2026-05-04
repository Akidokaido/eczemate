import React, { useState, useEffect } from "react";
import DoctorLayout from "../components/DoctorLayout";
import { auth, firestore, onAuthStateChanged, collection, query, where, getDocs, doc, updateDoc } from "../firebase/config";
import { Search, ChevronDown } from "lucide-react";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchAppointments = async (doctorUid) => {
    try {
      const patientsSnap = await getDocs(collection(firestore, "users", "patients", "accounts"));
      const allAppts = [];
      for (const patDoc of patientsSnap.docs) {
        const apptSnap = await getDocs(
          query(
            collection(firestore, "users", "patients", "accounts", patDoc.id, "appointments"),
            where("doctorId", "==", doctorUid)
          )
        );
        apptSnap.docs.forEach(d => {
          allAppts.push({ id: d.id, patientDocId: patDoc.id, ...d.data() });
        });
      }
      allAppts.sort((a, b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));
      setAppointments(allAppts);
    } catch (err) { console.error("Error:", err); }
    finally { setLoading(false); }
  };

  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { if (u) fetchAppointments(u.uid); }); return () => unsub(); }, []);

  const handleStatusChange = async (appt, status) => {
    await updateDoc(doc(firestore, "users", "patients", "accounts", appt.patientDocId, "appointments", appt.id), { status });
    setAppointments((prev) => prev.map((a) => a.id === appt.id ? { ...a, status } : a));
  };

  const filteredAppointments = appointments.filter(appt => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (appt.patientName || "").toLowerCase().includes(q) ||
                          (appt.patientEmail || "").toLowerCase().includes(q) ||
                          (appt.reason || "").toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || appt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <DoctorLayout title="Appointments">
      <div className="space-y-5 animate-fade-in-up">

        {/* Search & Status Filter */}
        <div className="glass p-4 flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by patient name or reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-dark pl-10 w-full"
            />
          </div>
          <div className="relative w-full sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-dark w-full appearance-none pr-10 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Appointment List */}
        {loading ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>No appointments found.</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>No appointments match your search.</div>
        ) : (
          <div className="stagger space-y-4">
            {filteredAppointments.map((appt, i) => (
              <div key={appt.id} className="glow-card p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{appt.patientName || appt.patientEmail || "Unknown"}</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {appt.date?.toDate ? appt.date.toDate().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}
                    {appt.timeSlot && <span className="ml-2 font-semibold text-indigo-500">• {appt.timeSlot}</span>}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{appt.reason || "—"}</p>
                  <span className={`badge mt-2 ${appt.status === "approved" ? "badge-approved" : appt.status === "rejected" ? "badge-rejected" : appt.status === "cancelled" ? "badge-cancelled" : "badge-pending"}`}>
                    {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
                  </span>
                </div>
                {appt.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusChange(appt, "approved")} className="btn-success">Approve</button>
                    <button onClick={() => handleStatusChange(appt, "rejected")} className="btn-danger">Reject</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
};

export default Appointments;
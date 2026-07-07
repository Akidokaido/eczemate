// Appointments page - doctor views, approves/rejects, and completes their appointments
import React, { useState, useEffect } from "react";
import DoctorLayout from "../DoctorLayout";
import { auth, firestore, onAuthStateChanged, collection, query, where, getDocs, doc, updateDoc } from "../../firebase/config";
import { Search, ChevronDown, CheckCircle } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch all appointments for this doctor across all patients
  const fetchAppointments = async (doctorUid) => {
    try {
      const patientsSnap = await getDocs(collection(firestore, "users", "patients", "accounts"));
      const allAppts = [];
      // Loop through each patient and get their appointments for this doctor
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
      // Sort newest first
      allAppts.sort((a, b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));
      setAppointments(allAppts);
    } catch (err) { console.error("Error:", err); }
    finally { setLoading(false); }
  };

  // Start fetching when doctor logs in
  useEffect(() => { const unsub = onAuthStateChanged(auth, (u) => { if (u) fetchAppointments(u.uid); }); return () => unsub(); }, []);

  // Update appointment status (approve, reject, or complete)
  const handleStatusChange = async (appt, status) => {
    if (status === "completed") {
      // Check if medical record exists for today before allowing completion
      try {
        const today = new Date().toISOString().split('T')[0];
        const recSnap = await getDocs(collection(firestore, "users", "patients", "accounts", appt.patientDocId, "officialRecords"));
        const recordToday = recSnap.docs.some(doc => {
          const data = doc.data();
          const recordDate = data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : "";
          return recordDate === today;
        });

        if (!recordToday) {
          alert("Incomplete: Please fill out the medical record in the Patient's File before marking this appointment as completed.");
          return;
        }
      } catch (err) {
        console.error("Error checking records:", err);
      }
    }

    // Update status in Firestore and local state
    await updateDoc(doc(firestore, "users", "patients", "accounts", appt.patientDocId, "appointments", appt.id), { status });
    setAppointments((prev) => prev.map((a) => a.id === appt.id ? { ...a, status } : a));
    if (status === "completed") alert("Appointment marked as completed!");
  };

  // Filter by search text and status
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

        {/* Search and filter controls */}
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

        {/* Appointment cards */}
        {loading ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>No appointments found.</div>
        ) : filteredAppointments.length === 0 ? (
          <div className="glass p-8 text-center" style={{ color: "var(--text-secondary)" }}>No appointments match your search.</div>
        ) : (
          <div className="stagger space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2 pb-4">
            {filteredAppointments.map((appt, i) => (
              <div key={appt.id} className="glow-card p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                {/* Patient info */}
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{appt.patientName || appt.patientEmail || "Unknown"}</p>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {appt.date?.toDate ? appt.date.toDate().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}
                    {appt.timeSlot && <span className="ml-2 font-semibold text-indigo-500">• {appt.timeSlot}</span>}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{appt.reason || "—"}</p>
                  <div className="mt-2 inline-block">
                    <StatusBadge status={appt.status} />
                  </div>
                </div>

                {/* Pending: approve or reject */}
                {appt.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => handleStatusChange(appt, "approved")} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-100 transition">Approve</button>
                    <button onClick={() => handleStatusChange(appt, "rejected")} className="bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-rose-100 transition">Reject</button>
                  </div>
                )}

                {/* Approved: mark as completed */}
                {appt.status === "approved" && (
                  <button 
                    onClick={() => handleStatusChange(appt, "completed")} 
                    className="flex items-center gap-2 bg-[#0D9488]/10 text-[#0D9488] px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#0D9488]/20 transition"
                  >
                    <CheckCircle size={14} /> Mark as Completed
                  </button>
                )}

                {/* Completed label */}
                {appt.status === "completed" && (
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold text-xs">
                    <CheckCircle size={14} /> Completed
                  </span>
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
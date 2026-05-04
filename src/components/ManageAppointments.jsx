import React, { useState, useEffect } from "react";
import { firestore, collection, getDocs, doc, updateDoc, query, where } from "../firebase/config";
import { getUserCollectionRef } from "../firebase/userPaths";
import { Search, CalendarX2, User, Stethoscope, ChevronLeft, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ManageAppointments = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Cancel Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  
  const navigate = useNavigate();

  // 1. Fetch Doctors
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const docSnap = await getDocs(collection(firestore, "users", "doctors", "accounts"));
        const allDoctors = docSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const accountSnap = await getDocs(getUserCollectionRef("doctor"));
        const approvedIds = new Set(
          accountSnap.docs
            .filter((d) => d.data().status === "approved")
            .map((d) => d.id)
        );

        setDoctors(allDoctors.filter((d) => approvedIds.has(d.id)));
      } catch (err) {
        console.error("Error fetching doctors:", err);
      }
    };
    fetchDoctors();
  }, []);

  // 2. Fetch Appointments when Doctor selected
  useEffect(() => {
    if (!selectedDoctorId) {
      setAppointments([]);
      return;
    }

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const patientsSnap = await getDocs(collection(firestore, "users", "patients", "accounts"));
        const allAppts = [];

        for (const patientDoc of patientsSnap.docs) {
          const q = query(
            collection(firestore, "users", "patients", "accounts", patientDoc.id, "appointments"),
            where("doctorId", "==", selectedDoctorId)
          );
          const apptsSnap = await getDocs(q);
          apptsSnap.docs.forEach(a => {
            allAppts.push({ id: a.id, patientDocId: patientDoc.id, ...a.data() });
          });
        }
        
        // Sort by date descending
        allAppts.sort((a, b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));
        setAppointments(allAppts);
      } catch (err) {
        console.error("Error fetching appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedDoctorId]);

  const handleCancelClick = (appt) => {
    setSelectedAppt(appt);
    setCancelReason("");
    setIsCancelModalOpen(true);
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) return;
    setCancelling(true);
    
    try {
      const apptRef = doc(firestore, "users", "patients", "accounts", selectedAppt.patientDocId, "appointments", selectedAppt.id);
      
      await updateDoc(apptRef, {
        status: "cancelled",
        cancelReason: cancelReason.trim()
      });

      // Update local state
      setAppointments(prev => prev.map(a => 
        a.id === selectedAppt.id ? { ...a, status: "cancelled", cancelReason: cancelReason.trim() } : a
      ));
      
      setIsCancelModalOpen(false);
    } catch (err) {
      console.error("Error cancelling appointment:", err);
      alert("Failed to cancel appointment.");
    } finally {
      setCancelling(false);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      (a.patientName || "").toLowerCase().includes(q) ||
      (a.patientEmail || "").toLowerCase().includes(q) ||
      (a.reason || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-mesh" />

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full">
        <header className="glass-strong flex items-center justify-between px-8 py-4 m-6 rounded-2xl">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-full transition">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Manage Appointments</h2>
          </div>
        </header>

        <main className="px-8 pb-8 flex-1 animate-fade-in-up">
          
          {/* Controls: Dropdown and Search */}
          <div className="glass p-6 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            <div className="flex items-center gap-3 w-full md:w-1/2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-50 flex-shrink-0">
                <Stethoscope className="h-5 w-5 text-sky-500" />
              </div>
              <div className="w-full relative">
                <select 
                  className="input-dark w-full appearance-none cursor-pointer"
                  value={selectedDoctorId}
                  onChange={(e) => setSelectedDoctorId(e.target.value)}
                >
                  <option value="">Select a Doctor to view appointments...</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>{d.name} {d.specialty ? `(${d.specialty})` : ""}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full md:w-1/3 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search patient or reason..." 
                className="input-dark pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
          </div>

          {/* Table */}
          <div className="glass overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.02)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Patient</th>
                  <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Date</th>
                  <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Reason</th>
                  <th className="p-4 text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>Status</th>
                  <th className="p-4 text-sm font-semibold text-right" style={{ color: "var(--text-secondary)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!selectedDoctorId ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">Please select a doctor to view their appointments.</td>
                  </tr>
                ) : loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">Loading appointments...</td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">No appointments found.</td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50 transition" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center">
                            <User className="h-4 w-4 text-sky-500" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-slate-800">{appt.patientName || "Unknown Patient"}</p>
                            <p className="text-xs text-slate-500">{appt.patientEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <div>
                            <span className="text-sm text-slate-700">
                              {appt.date?.toDate ? appt.date.toDate().toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                            </span>
                            {appt.timeSlot && <span className="block text-xs font-semibold text-indigo-500">{appt.timeSlot}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 max-w-xs truncate" title={appt.reason}>
                        {appt.reason || "—"}
                      </td>
                      <td className="p-4">
                        <span className={`badge ${appt.status === "approved" ? "badge-approved" : appt.status === "rejected" ? "badge-rejected" : appt.status === "cancelled" ? "badge-cancelled" : "badge-pending"}`}>
                          {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
                        </span>
                        {appt.cancelReason && (
                          <p className="text-[10px] text-red-500 mt-1 max-w-[120px] truncate" title={appt.cancelReason}>
                            Reason: {appt.cancelReason}
                          </p>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {appt.status !== "cancelled" && appt.status !== "rejected" && (
                          <button 
                            onClick={() => handleCancelClick(appt)}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg transition"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </main>
      </div>

      {/* Cancel Modal */}
      {isCancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-strong p-6 max-w-md w-full animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <CalendarX2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Cancel Appointment</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              You are about to cancel the appointment for <strong className="text-slate-800">{selectedAppt?.patientName}</strong>. Please provide a reason for cancellation.
            </p>

            <textarea 
              className="input-dark w-full mb-6 resize-none"
              rows={3}
              placeholder="e.g. Doctor is unavailable, scheduling conflict..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              autoFocus
            />

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsCancelModalOpen(false)}
                className="btn-ghost py-2 px-4 text-sm"
              >
                Go Back
              </button>
              <button 
                onClick={submitCancel}
                disabled={cancelling || !cancelReason.trim()}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2 px-4 rounded-xl text-sm font-semibold transition"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAppointments;

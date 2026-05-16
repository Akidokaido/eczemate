import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth, firestore, onAuthStateChanged,
  doc, getDoc, collection, query, where, getDocs, updateDoc
} from "../../firebase/config";
import { getUserDocRef } from "../../firebase/userPaths";
import TrackProgress from "../../features/trackprogress";
import Journal from "../../features/journal";
import AiChat from "../../features/aichat";
import BookAppointment from "../../components/BookAppointment";
import MedicalRecord from "../../features/MedicalRecord";
import { Activity, BookOpen, MessageSquare, Calendar, Plus, List, XCircle, FileText } from "lucide-react";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";

const PatientDashboard = () => {
  const [activeSection, setActiveSection] = useState("track");
  const [apptView, setApptView] = useState("list");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModalAppt, setCancelModalAppt] = useState(null);
  const navigate = useNavigate();

  const fetchAppointments = async (uid) => {
    try {
      const q = query(
        collection(firestore, "users", "patients", "accounts", uid, "appointments"),
        where("patientId", "==", uid)
      );
      const snap = await getDocs(q);
      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((a) => a.status !== "cancelled");
      data.sort((a, b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0));
      setAppointments(data);
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) { navigate("/login"); return; }
      setUser(currentUser);
      const userDoc = await getDoc(getUserDocRef("patient", currentUser.uid));
      if (userDoc.exists()) setProfile({ ...userDoc.data(), role: "patient" });
      await fetchAppointments(currentUser.uid);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleBooked = () => {
    if (user) fetchAppointments(user.uid);
    setApptView("list");
  };

  const cancelAppointment = async (appointmentId) => {
    try {
      const apptRef = doc(
        firestore, "users", "patients", "accounts", user.uid, "appointments", appointmentId
      );
      await updateDoc(apptRef, { status: "cancelled" });
      await fetchAppointments(user.uid);
    } catch (err) {
      console.error("Error canceling appointment:", err);
    }
  };

  const tabs = [
    { id: "track",       label: "Track",        icon: Activity },
    { id: "journal",     label: "Journal",       icon: BookOpen },
    { id: "medical",     label: "Records",       icon: FileText },
    { id: "ai-chat",     label: "AI Chat",       icon: MessageSquare },
    { id: "appointment", label: "Appointments",  icon: Calendar },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <div className="animate-glow glass p-6 rounded-2xl">
          <p className="gradient-text font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-mesh" />

      <Header 
        user={user} 
        profile={profile} 
        isDashboard={true} 
        tabs={tabs} 
        activeSection={activeSection} 
        setActiveSection={setActiveSection} 
      />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <main className="flex-1 overflow-auto">
          {activeSection === "track"       && <TrackProgress setActiveSection={setActiveSection} />}
          {activeSection === "journal"     && <Journal />}
          {activeSection === "medical"     && <MedicalRecord />}
          {activeSection === "ai-chat"     && <AiChat />}
          {activeSection === "appointment" && (
            <div className="p-6 max-w-7xl mx-auto animate-fade-in-up">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {apptView === "list" ? "Your Appointments" : "Book Appointment"}
                </h2>
                <button
                  onClick={() => setApptView(apptView === "list" ? "book" : "list")}
                  className={apptView === "list"
                    ? "btn-gradient flex items-center gap-2 text-sm py-2 px-5"
                    : "btn-ghost flex items-center gap-2 text-sm py-2 px-5"
                  }
                >
                  {apptView === "list"
                    ? <><Plus className="h-4 w-4" /> Book New</>
                    : <><List className="h-4 w-4" /> My Appointments</>
                  }
                </button>
              </div>

              {apptView === "book" ? (
                <BookAppointment onBooked={handleBooked} />
              ) : (
                <>
                  {appointments.length === 0 ? (
                    <div className="glass-strong p-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                      <p className="text-lg font-semibold" style={{ color: "var(--text-secondary)" }}>No appointments yet</p>
                      <p className="text-sm mt-1 mb-4" style={{ color: "var(--text-muted)" }}>Book your first appointment with a doctor.</p>
                      <button onClick={() => setApptView("book")} className="btn-gradient text-sm py-2 px-5 inline-flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Book Appointment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 stagger">
                      {appointments.map((appt, i) => (
                        <div
                          key={appt.id}
                          className="glow-card p-5 flex justify-between items-center animate-fade-in-up"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          <div>
                            <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{appt.doctorName || "Doctor"}</p>
                            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                              {appt.date?.toDate
                                ? appt.date.toDate().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })
                                : "N/A"}
                              {appt.timeSlot && <span className="ml-2 font-semibold text-[#F97316]">• {appt.timeSlot}</span>}
                            </p>
                            <p className="text-sm" style={{ color: "var(--text-muted)" }}>{appt.reason}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`badge ${
                              appt.status === "approved"   ? "badge-approved"   :
                              appt.status === "rejected"   ? "badge-rejected"   :
                              appt.status === "cancelled"  ? "badge-cancelled"  : "badge-pending"
                            }`}>
                              {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1)}
                            </span>
                            {appt.status !== "cancelled" && (
                              <button onClick={() => setCancelModalAppt(appt)} className="text-red-500 hover:text-red-700">
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
        <Footer />
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="glass-strong p-6 max-w-sm w-full animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Cancel Appointment?</h3>
            </div>
            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              Are you sure you want to cancel your appointment with{" "}
              <strong style={{ color: "var(--text-primary)" }}>{cancelModalAppt.doctorName || "Doctor"}</strong>?
            </p>
            <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
              {cancelModalAppt.date?.toDate
                ? cancelModalAppt.date.toDate().toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })
                : ""}
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setCancelModalAppt(null)} className="btn-ghost py-2 px-5 text-sm">Go Back</button>
              <button
                onClick={async () => { await cancelAppointment(cancelModalAppt.id); setCancelModalAppt(null); }}
                className="bg-red-500 hover:bg-red-600 text-white py-2 px-5 rounded-xl text-sm font-semibold transition"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDashboard;
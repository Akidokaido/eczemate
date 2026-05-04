import React, { useState, useEffect } from "react";
import {
  auth,
  firestore,
  onAuthStateChanged,
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
} from "../firebase/config";
import { getUserDocRef, getUserCollectionRef } from "../firebase/userPaths";
import {
  UserCheck,
  CalendarPlus,
  MapPin,
  Clock,
  Stethoscope,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

const BookAppointment = ({ onBooked }) => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [timeSlot, setTimeSlot] = useState("");
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        // Fetch doctor profiles (specialty, clinic info, etc.)
        const docSnap = await getDocs(collection(firestore, "users", "doctors", "accounts"));
        const allDoctors = docSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Fetch approved doctor accounts from users/doctors/accounts
        const accountSnap = await getDocs(getUserCollectionRef("doctor"));
        const approvedIds = new Set(
          accountSnap.docs
            .filter((d) => d.data().status === "approved")
            .map((d) => d.id)
        );

        // Only show doctors who are approved
        setDoctors(allDoctors.filter((d) => approvedIds.has(d.id)));
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Fetch already-booked time slots for the selected doctor + date
  const fetchBookedSlots = async (doctorId, dateStr) => {
    if (!doctorId || !dateStr) { setBookedSlots([]); return; }
    setLoadingSlots(true);
    try {
      const patientsSnap = await getDocs(collection(firestore, "users", "patients", "accounts"));
      const booked = [];
      for (const patDoc of patientsSnap.docs) {
        const q = query(
          collection(firestore, "users", "patients", "accounts", patDoc.id, "appointments"),
          where("doctorId", "==", doctorId)
        );
        const apptSnap = await getDocs(q);
        apptSnap.docs.forEach(d => {
          const data = d.data();
          if (data.status === "cancelled" || data.status === "rejected") return;
          const apptDate = data.date?.toDate ? data.date.toDate() : new Date(data.date);
          const apptDateStr = apptDate.toISOString().split("T")[0];
          if (apptDateStr === dateStr && data.timeSlot) {
            booked.push(data.timeSlot);
          }
        });
      }
      setBookedSlots(booked);
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (selectedDoctor && date) {
      fetchBookedSlots(selectedDoctor.id, date);
      setTimeSlot("");
    } else {
      setBookedSlots([]);
      setTimeSlot("");
    }
  }, [selectedDoctor, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedDoctor) {
      setError("Please select a doctor.");
      return;
    }
    if (!date) {
      setError("Please select a date.");
      return;
    }
    if (!timeSlot) {
      setError("Please select a time slot.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason for your visit.");
      return;
    }

    // Ensure date is in the future
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError("Please select a date in the future.");
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("You must be logged in.");
        return;
      }

      const userDoc = await getDoc(getUserDocRef("patient", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};

      await addDoc(collection(firestore,"users","patients","accounts", user.uid, "appointments"), {
        patientId: user.uid,
        patientName: userData.name || "",
        patientEmail: userData.email || user.email,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        date: Timestamp.fromDate(new Date(date)),
        timeSlot,
        status: "pending",
        reason: reason.trim(),
        createdAt: serverTimestamp(),
      });

      // Update the patient's assigned primary doctor
      await updateDoc(getUserDocRef("patient", user.uid), {
        doctorId: selectedDoctor.id
      });

      setSuccess(true);
      setSelectedDoctor(null);
      setDate("");
      setTimeSlot("");
      setReason("");

      // Notify parent to refresh appointments
      if (onBooked) onBooked();

      // Auto-dismiss after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Error booking appointment:", err);
      setError("Failed to book appointment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Minimum date is tomorrow
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {success && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl animate-fade-in-up"
          style={{
            background: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.2)",
            color: "#065f46",
          }}
        >
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-medium">
            Appointment booked successfully! The doctor will review your
            request.
          </p>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          className="p-4 rounded-xl animate-fade-in-up text-sm font-medium"
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            color: "#991b1b",
          }}
        >
          {error}
        </div>
      )}

      {/* Step 1: Select Doctor */}
      <div className="glass-strong p-6 space-y-4">
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-sky-50">
            <Stethoscope className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Select a Doctor
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Choose which doctor you'd like to see
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-6" style={{ color: "var(--text-secondary)" }}>
            Loading doctors...
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-6" style={{ color: "var(--text-secondary)" }}>
            No doctors available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {doctors.map((doc) => {
              const isSelected = selectedDoctor?.id === doc.id;
              return (
                <div
                  key={doc.id}
                  onClick={() => { setSelectedDoctor(doc); setError(""); }}
                  className="relative cursor-pointer rounded-xl p-4 transition-all duration-300"
                  style={{
                    background: isSelected
                      ? "rgba(99, 102, 241, 0.06)"
                      : "white",
                    border: isSelected
                      ? "2px solid #6366f1"
                      : "1px solid rgba(0, 0, 0, 0.06)",
                    boxShadow: isSelected
                      ? "0 4px 15px rgba(99, 102, 241, 0.15)"
                      : "var(--shadow-sm)",
                    transform: isSelected ? "translateY(-2px)" : "none",
                  }}
                >
                  {isSelected && (
                    <div
                      className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "var(--gradient-primary)" }}
                    >
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: isSelected ? "rgba(99, 102, 241, 0.1)" : "#f8fafc" }}
                    >
                      <UserCheck
                        className="h-5 w-5"
                        style={{ color: isSelected ? "#6366f1" : "var(--text-muted)" }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        className="font-semibold text-sm"
                        style={{
                          color: isSelected ? "#6366f1" : "var(--text-primary)",
                        }}
                      >
                        {doc.name}
                      </p>
                      {doc.specialty && (
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                          {doc.specialty}
                        </p>
                      )}
                      {doc.clinicInfo && (
                        <div className="flex items-center gap-1 mt-1.5">
                          <MapPin className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                            {doc.clinicInfo.name || doc.clinicInfo.address}
                          </p>
                        </div>
                      )}
                      {doc.availability && doc.availability.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {doc.availability.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Date & Reason */}
      <form onSubmit={handleSubmit} className="glass-strong p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50">
            <CalendarPlus className="h-4 w-4 text-violet-500" />
          </div>
          <div>
            <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
              Appointment Details
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Pick a date and explain your reason
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-2 block"
              style={{ color: "var(--text-muted)" }}
            >
              Preferred Date
            </label>
            <input
              type="date"
              value={date}
              min={getMinDate()}
              onChange={(e) => { setDate(e.target.value); setError(""); }}
              className="input-dark"
              style={{ cursor: "pointer" }}
            />
          </div>
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-2 block"
              style={{ color: "var(--text-muted)" }}
            >
              Selected Doctor
            </label>
            <div
              className="input-dark flex items-center gap-2"
              style={{ color: selectedDoctor ? "var(--text-primary)" : "var(--text-muted)" }}
            >
              <Stethoscope className="h-4 w-4 flex-shrink-0" style={{ color: selectedDoctor ? "#6366f1" : "var(--text-muted)" }} />
              {selectedDoctor ? selectedDoctor.name : "None selected"}
            </div>
          </div>
        </div>

        {/* Time Slot Selection — visible once doctor + date are chosen */}
        {selectedDoctor && date && (
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
              Select a Time Slot
            </label>
            {loadingSlots ? (
              <div className="text-sm text-center py-4" style={{ color: "var(--text-secondary)" }}>Checking availability...</div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((slot) => {
                    const isBooked = bookedSlots.includes(slot);
                    const isSelected = timeSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        onClick={() => { setTimeSlot(slot); setError(""); }}
                        className="py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-300"
                        style={{
                          background: isBooked
                            ? "rgba(0,0,0,0.04)"
                            : isSelected
                            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                            : "white",
                          color: isBooked
                            ? "var(--text-muted)"
                            : isSelected
                            ? "white"
                            : "var(--text-primary)",
                          border: isBooked
                            ? "1px solid rgba(0,0,0,0.06)"
                            : isSelected
                            ? "2px solid #6366f1"
                            : "1px solid rgba(0,0,0,0.08)",
                          cursor: isBooked ? "not-allowed" : "pointer",
                          opacity: isBooked ? 0.5 : 1,
                          textDecoration: isBooked ? "line-through" : "none",
                          boxShadow: isSelected ? "0 4px 15px rgba(99, 102, 241, 0.25)" : "none",
                        }}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
                {bookedSlots.length > 0 && (
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Crossed-out slots are already booked for this doctor on this date.
                  </p>
                )}
                {bookedSlots.length === TIME_SLOTS.length && (
                  <div className="p-3 rounded-xl text-sm font-medium bg-amber-50 text-amber-700 border border-amber-100">
                    ⚠️ All time slots are fully booked for this date. Please choose a different date.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div>
          <label
            className="text-xs font-semibold uppercase tracking-wider mb-2 block"
            style={{ color: "var(--text-muted)" }}
          >
            Reason for Visit
          </label>
          <textarea
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(""); }}
            placeholder="Describe your symptoms or reason for the appointment..."
            rows={3}
            className="input-dark"
            style={{ resize: "vertical", minHeight: "80px" }}
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="btn-gradient flex items-center gap-2"
            style={{ opacity: submitting ? 0.7 : 1 }}
          >
            <CalendarPlus className="h-4 w-4" />
            {submitting ? "Booking..." : "Book Appointment"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookAppointment;

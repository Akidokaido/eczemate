import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DoctorLayout from "../DoctorLayout";
import { firestore, auth, onAuthStateChanged, collection, query, where, getDocs, orderBy, getDoc, addDoc, serverTimestamp, Timestamp } from "../../firebase/config";
import { getUserDocRef } from "../../firebase/userPaths";
import { Send, FileText, CheckSquare, Printer, Stethoscope, CalendarDays, ClipboardList, CalendarPlus, Clock, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";

const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

const PatientHistory = () => {
  const { patientId } = useParams();
  const [patient, setPatient] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [newActionItem, setNewActionItem] = useState("");
  const [patientSummary, setPatientSummary] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [prescriptionsInput, setPrescriptionsInput] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordDateFilter, setRecordDateFilter] = useState("");
  const [scoradHistory, setScoradHistory] = useState([]);

  // Set Future Appointment state
  const [apptDate, setApptDate] = useState("");
  const [apptTimeSlot, setApptTimeSlot] = useState("");
  const [apptReason, setApptReason] = useState("");
  const [apptBookedSlots, setApptBookedSlots] = useState([]);
  const [apptLoadingSlots, setApptLoadingSlots] = useState(false);
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const [apptError, setApptError] = useState("");
  const [apptSuccess, setApptSuccess] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docSnap = await getDoc(getUserDocRef("doctor", user.uid));
          if (docSnap.exists()) setDoctorProfile({ uid: user.uid, ...docSnap.data() });
        } catch (e) {
          console.error("Error fetching doctor profile", e);
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        // 1. Fetch Patient Info
        try {
          const patDoc = await getDoc(getUserDocRef("patient", patientId));
          if (patDoc.exists()) {
            const patData = patDoc.data();

            // STRICT ACCESS CONTROL
            if (patData.doctorId !== doctorProfile.uid) {
              setErrorMsg("Access Denied: You are not the assigned doctor for this patient.");
              setLoading(false);
              return; // Completely stop fetching any other private data
            }

            setPatient(patData);
          } else {
            setErrorMsg("Patient not found.");
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error("Error fetching patient", e);
        }

        // 2. Fetch Journal
        try {
          const jrnSnap = await getDocs(query(collection(firestore, "users", "patients", "accounts", patientId, "journal"), orderBy("createdAt", "desc")));
          setJournalEntries(jrnSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.log("Index missing for journal, falling back to manual sort");
          try {
            const jrnSnap = await getDocs(query(collection(firestore, "users", "patients", "accounts", patientId, "journal")));
            let arr = jrnSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            arr.sort((a, b) => {
              const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || a.date || 0).getTime();
              const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || b.date || 0).getTime();
              return timeB - timeA;
            });
            setJournalEntries(arr);
          } catch (err2) {
            console.error("Complete failure in journal fetch:", err2);
          }
        }

        // 3. Fetch Medical Records
        try {
          const recSnap = await getDocs(query(collection(firestore, "users", "patients", "accounts", patientId, "officialRecords"), orderBy("createdAt", "desc")));
          setMedicalRecords(recSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (e) {
          try {
            const recSnap = await getDocs(collection(firestore, "users", "patients", "accounts", patientId, "officialRecords"));
            let arr = recSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
            arr.sort((a, b) => {
              const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
              const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
              return tB - tA;
            });
            setMedicalRecords(arr);
          } catch (err2) {
            console.error("Error fetching medical records:", err2);
          }
        }

        // 4. Fetch SCORAD Track Progress
        try {
          const trackSnap = await getDocs(collection(firestore, "users", "patients", "accounts", patientId, "trackProgress"));
          let tracks = trackSnap.docs.map(d => d.data());
          tracks.sort((a, b) => {
            const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp || a.dateKey || 0).getTime();
            const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp || b.dateKey || 0).getTime();
            return tA - tB;
          });
          const chartData = tracks.map(t => ({
            date: t.dateKey || (t.timestamp?.toDate ? t.timestamp.toDate().toLocaleDateString("en-MY", { day: "numeric", month: "short" }) : "?"),
            score: Math.round(t.scoradScore ?? t.finalPercentage ?? 0),
          })).filter(t => t.score > 0);
          setScoradHistory(chartData);
        } catch (e) {
          console.error("Error fetching track progress:", e);
        }
      } catch (err) {
        console.error("Critical Error in fetchData:", err);
        setErrorMsg("Failed to load patient data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    // Only run when we know who the doctor is
    if (patientId && doctorProfile) {
      fetchData();
    }
  }, [patientId, doctorProfile]);

  const handleAssignAction = async (e) => {
    e.preventDefault();
    if (!newActionItem.trim()) return;
    try {
      await addDoc(collection(firestore, "users", "patients", "accounts", patientId, "actionItems"), {
        task: newActionItem.trim(),
        doctorName: doctorProfile?.name || "Your Doctor",
        completed: false,
        createdAt: serverTimestamp()
      });
      setNewActionItem("");
      alert("Action item assigned to patient!");
    } catch (e) {
      console.error(e);
      alert("Failed to assign action item.");
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!patientSummary.trim()) return;
    try {
      await addDoc(collection(firestore, "users", "patients", "accounts", patientId, "officialRecords"), {
        patientSummary: patientSummary.trim(),
        privateNotes: privateNotes.trim(),
        prescriptions: prescriptionsInput.split(",").map(s => s.trim()).filter(Boolean),
        doctorName: doctorProfile?.name || "Your Doctor",
        doctorId: doctorProfile?.uid || "",
        createdAt: serverTimestamp()
      });
      setPatientSummary("");
      setPrivateNotes("");
      setPrescriptionsInput("");
      alert("Medical Record saved to patient's file!");
      // Refresh records list
      try {
        const recSnap = await getDocs(collection(firestore, "users", "patients", "accounts", patientId, "officialRecords"));
        let arr = recSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
        arr.sort((a, b) => {
          const tA = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
          const tB = b.createdAt?.toMillis ? b.createdAt.toMillis() : new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        setMedicalRecords(arr);
      } catch (e2) { /* ignore */ }
    } catch (e) {
      console.error(e);
      alert("Failed to create medical record.");
    }
  };

  // --- Set Future Appointment ---
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  const fetchApptBookedSlots = async (dateStr) => {
    if (!dateStr || !doctorProfile) { setApptBookedSlots([]); return; }
    setApptLoadingSlots(true);
    try {
      const patientsSnap = await getDocs(collection(firestore, "users", "patients", "accounts"));
      const booked = [];
      for (const patDoc of patientsSnap.docs) {
        const q = query(
          collection(firestore, "users", "patients", "accounts", patDoc.id, "appointments"),
          where("doctorId", "==", doctorProfile.uid)
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
      setApptBookedSlots(booked);
    } catch (err) {
      console.error("Error fetching booked slots:", err);
    } finally {
      setApptLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (apptDate && doctorProfile) {
      fetchApptBookedSlots(apptDate);
      setApptTimeSlot("");
    } else {
      setApptBookedSlots([]);
      setApptTimeSlot("");
    }
  }, [apptDate, doctorProfile]);

  const handleSetAppointment = async (e) => {
    e.preventDefault();
    setApptError("");
    if (!apptDate) { setApptError("Please select a date."); return; }
    if (!apptTimeSlot) { setApptError("Please select a time slot."); return; }
    if (!apptReason.trim()) { setApptError("Please provide a reason."); return; }
    setApptSubmitting(true);
    try {
      await addDoc(collection(firestore, "users", "patients", "accounts", patientId, "appointments"), {
        patientId,
        patientName: patient?.name || "",
        patientEmail: patient?.email || "",
        doctorId: doctorProfile.uid,
        doctorName: doctorProfile.name || "Doctor",
        date: Timestamp.fromDate(new Date(apptDate)),
        timeSlot: apptTimeSlot,
        status: "approved",
        reason: apptReason.trim(),
        setByDoctor: true,
        createdAt: serverTimestamp(),
      });
      setApptDate("");
      setApptTimeSlot("");
      setApptReason("");
      setApptSuccess(true);
      setTimeout(() => setApptSuccess(false), 3000);
    } catch (err) {
      console.error("Error setting appointment:", err);
      setApptError("Failed to set appointment.");
    } finally {
      setApptSubmitting(false);
    }
  };

  const exportToPDF = () => {
    window.print();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString("en-MY", {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch (e) {
      return "N/A";
    }
  };

  // Safe renderer for arrays
  const safeArrayJoin = (arr1, arr2) => {
    const a1 = Array.isArray(arr1) ? arr1 : [];
    const a2 = Array.isArray(arr2) ? arr2 : [];
    return [...a1, ...a2].join(", ") || "None";
  };

  return (
    <DoctorLayout title="Patient File">

      {/* CSS for printing */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body { background: white !important; }
          .sidebar, header, nav, button, .print-hide, .no-print { display: none !important; }
          .glass-strong, .glass, .bg-white { background: white !important; box-shadow: none !important; border: 1px solid #ccc !important; }
          main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
        }
      `}} />

      <div className="space-y-6 animate-fade-in-up pb-12">

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div>
            <h3 className="text-2xl font-bold text-slate-800">
              {loading ? "Loading..." : patient ? patient.name || "Unnamed Patient" : "Unknown Patient"}
            </h3>
            {patient && <p className="text-sm text-slate-500">{patient.email}</p>}
          </div>
          <button onClick={exportToPDF} className="print-hide btn-ghost flex items-center gap-2 text-sm py-2 px-4 rounded-xl border border-slate-200 hover:bg-slate-50">
            <Printer className="h-4 w-4" /> Export Patient File
          </button>
        </div>

        {/* SCORAD Trend Chart */}
        <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 print-hide">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#0D9488]" /> SCORAD Trend
            </h3>
            {scoradHistory.length > 0 && (
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span> Mild (0–25)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> Moderate (26–50)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Severe (&gt;50)</span>
              </div>
            )}
          </div>
          {scoradHistory.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400">
              <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm font-semibold">No SCORAD data recorded yet.</p>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={scoradHistory} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 103]} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                    formatter={(val) => [`${val}`, 'SCORAD Score']}
                  />
                  <ReferenceLine y={25} stroke="#86efac" strokeDasharray="4 4" strokeWidth={1.5} />
                  <ReferenceLine y={50} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#0D9488"
                    strokeWidth={2.5}
                    dot={(props) => {
                      const { cx, cy, payload } = props;
                      const color = payload.score > 50 ? '#ef4444' : payload.score > 25 ? '#f59e0b' : '#10b981';
                      return <circle key={cx} cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />;
                    }}
                    activeDot={{ r: 7, stroke: '#0D9488', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-hide">

          {/* Assign Action Item */}
          <div className="bg-sky-50 p-6 rounded-2xl border border-sky-100">
            <h3 className="text-lg font-bold text-sky-800 flex items-center gap-2 mb-4">
              <CheckSquare className="h-5 w-5" /> Assign Action Item
            </h3>
            <p className="text-xs text-sky-600 mb-4">Send a task directly to the top of the patient's journal.</p>
            <form onSubmit={handleAssignAction} className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Apply steroid cream 2x daily"
                className="input-dark flex-1 bg-white border-sky-200 focus:border-sky-500 text-slate-800 placeholder-slate-400"
                value={newActionItem}
                onChange={e => setNewActionItem(e.target.value)}
              />
              <button type="submit" disabled={!newActionItem.trim()} className="bg-sky-500 text-white px-4 py-2 rounded-xl hover:bg-sky-600 transition disabled:opacity-50">
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

          {/* Create Official Medical Record */}
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
            <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2 mb-4">
              <Stethoscope className="h-5 w-5" /> Create Official Medical Record
            </h3>
            <p className="text-xs text-indigo-600 mb-4">Upload a post-consultation summary to the patient's file.</p>
            <form onSubmit={handleCreateRecord} className="space-y-4">

              <div>
                <label className="text-xs font-bold text-indigo-800 uppercase mb-1 block">Patient-Facing Summary (Visible to Patient)</label>
                <textarea
                  rows={2} className="input-dark w-full bg-white border-indigo-200 text-sm text-slate-800 placeholder-slate-400"
                  placeholder="Summary of consultation and instructions..."
                  value={patientSummary} onChange={e => setPatientSummary(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-rose-800 uppercase mb-1 block">Private Clinical Notes (Hidden from Patient)</label>
                <textarea
                  rows={2} className="input-dark w-full bg-white border-rose-200 text-sm text-slate-800 placeholder-slate-400"
                  placeholder="Private observations, differentials..."
                  value={privateNotes} onChange={e => setPrivateNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-indigo-800 uppercase mb-1 block">Prescriptions (Comma Separated)</label>
                <input
                  type="text" className="input-dark w-full bg-white border-indigo-200 text-sm text-slate-800 placeholder-slate-400"
                  placeholder="e.g. Protopic 0.1%, Zyrtec 10mg"
                  value={prescriptionsInput} onChange={e => setPrescriptionsInput(e.target.value)}
                />
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={!patientSummary.trim()} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                  Save Medical Record
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Set Future Appointment for Patient */}
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 print-hide">
          <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-2">
            <CalendarPlus className="h-5 w-5" /> Set Future Appointment
          </h3>
          <p className="text-xs text-emerald-600 mb-4">Schedule a follow-up appointment for this patient. It will appear in their journal.</p>

          {apptSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4 bg-emerald-100 border border-emerald-200 text-emerald-800 text-sm font-medium">
              <CheckSquare className="h-4 w-4" /> Appointment set successfully!
            </div>
          )}
          {apptError && (
            <div className="p-3 rounded-xl mb-4 bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{apptError}</div>
          )}

          <form onSubmit={handleSetAppointment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-emerald-800 uppercase mb-1 block">Date</label>
                <input
                  type="date"
                  value={apptDate}
                  min={getMinDate()}
                  onChange={(e) => { setApptDate(e.target.value); setApptError(""); }}
                  className="input-dark w-full bg-white border-emerald-200 text-slate-800 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-emerald-800 uppercase mb-1 block">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Follow-up consultation"
                  value={apptReason}
                  onChange={(e) => { setApptReason(e.target.value); setApptError(""); }}
                  className="input-dark w-full bg-white border-emerald-200 text-sm text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {apptDate && (
              <div>
                <label className="text-xs font-bold text-emerald-800 uppercase mb-2 block">Time Slot</label>
                {apptLoadingSlots ? (
                  <p className="text-sm text-emerald-600">Checking availability...</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const isBooked = apptBookedSlots.includes(slot);
                      const isSelected = apptTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={isBooked}
                          onClick={() => { setApptTimeSlot(slot); setApptError(""); }}
                          className="py-2 px-2 rounded-xl text-sm font-medium transition-all duration-200"
                          style={{
                            background: isBooked ? "rgba(0,0,0,0.04)" : isSelected ? "linear-gradient(135deg, #059669, #10b981)" : "white",
                            color: isBooked ? "#94a3b8" : isSelected ? "white" : "#334155",
                            border: isBooked ? "1px solid rgba(0,0,0,0.06)" : isSelected ? "2px solid #059669" : "1px solid #d1d5db",
                            cursor: isBooked ? "not-allowed" : "pointer",
                            opacity: isBooked ? 0.5 : 1,
                            textDecoration: isBooked ? "line-through" : "none",
                          }}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={apptSubmitting || !apptDate || !apptTimeSlot || !apptReason.trim()} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2">
                <CalendarPlus className="h-4 w-4" />
                {apptSubmitting ? "Setting..." : "Set Appointment"}
              </button>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start print:block">
          {/* Past Medical Records — Doctor Only */}
          <div className="glass-strong p-6 flex flex-col h-[600px] print:h-auto print:break-before-page">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" /> Past Medical Records
              </h3>
              <div className="flex items-center gap-2 print-hide">
                {recordDateFilter && (
                  <button onClick={() => setRecordDateFilter("")} className="text-xs font-semibold text-indigo-500 hover:text-indigo-600 transition px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-100">
                    Show All
                  </button>
                )}
                <div className="relative">
                  <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={recordDateFilter}
                    onChange={(e) => setRecordDateFilter(e.target.value)}
                    className="input-dark text-xs py-1.5 pl-8 pr-2 w-40 cursor-pointer bg-white"
                    style={{ fontSize: '12px' }}
                  />
                </div>
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
              {medicalRecords.length === 0 ? (
                <p className="text-slate-500">No medical records yet.</p>
              ) : (() => {
                const filtered = recordDateFilter
                  ? medicalRecords.filter(r => {
                      if (!r.createdAt) return false;
                      const d = r.createdAt.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
                      return d.toISOString().split('T')[0] === recordDateFilter;
                    })
                  : medicalRecords;
                return filtered.length === 0 ? (
                  <div className="text-center py-8">
                    <CalendarDays className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No records on this date.</p>
                    <button onClick={() => setRecordDateFilter("")} className="text-indigo-500 text-xs hover:underline mt-1">Show all records</button>
                  </div>
                ) : filtered.map((rec) => (
                  <div key={rec.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                        {formatTime(rec.createdAt)}
                      </span>
                      <span className="text-xs text-slate-400">Dr. {rec.doctorName}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Patient Summary</p>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{rec.patientSummary}</p>
                      </div>
                      {rec.privateNotes && (
                        <div className="bg-rose-50 p-3 rounded-lg border border-rose-100">
                          <p className="text-xs font-bold text-rose-700 uppercase mb-1">Private Clinical Notes</p>
                          <p className="text-sm text-rose-900 whitespace-pre-wrap">{rec.privateNotes}</p>
                        </div>
                      )}
                      {rec.prescriptions && rec.prescriptions.length > 0 && (
                        <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-700 uppercase mb-1">Prescriptions</p>
                          <p className="text-sm text-emerald-900">{rec.prescriptions.join(", ")}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Patient Journal (Now shows Emotions and Food) */}
          <div className="glass-strong p-6 flex flex-col h-[600px] print:h-auto print:break-before-page">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-sky-500" /> Patient Journal & Diet Log
            </h3>
            <div className="overflow-y-auto flex-1 space-y-4 pr-2">
              {journalEntries.length === 0 ? (
                <p className="text-slate-500">No journal entries.</p>
              ) : journalEntries.map((j) => (
                <div key={j.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:shadow-none">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-semibold text-sky-600 bg-sky-50 px-3 py-1 rounded-full">
                      {formatTime(j.createdAt || j.date)}
                    </span>
                    {j.emotion && (
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-600 uppercase">
                        Emotion: {j.emotion}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 whitespace-pre-wrap">{j.entry}</p>

                  {j.foodLog && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <p className="text-xs font-bold text-amber-800 uppercase mb-1">Food Log</p>
                      <p className="text-sm text-amber-900">{j.foodLog}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </DoctorLayout>
  );
};

export default PatientHistory;
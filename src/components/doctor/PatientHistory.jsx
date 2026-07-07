// Patient history page - full patient file with 5 tabs (SCORAD chart, logs, medical records, journal, appointments)
// Only accessible by the assigned doctor (access control check)
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import DoctorLayout from "../DoctorLayout";
import { firestore, auth, onAuthStateChanged, collection, query, where, getDocs, orderBy, getDoc, addDoc, serverTimestamp, Timestamp, doc, updateDoc } from "../../firebase/config";
import { getUserDocRef } from "../../firebase/userPaths";
import { Send, FileText, CheckSquare, Printer, Stethoscope, CalendarDays, ClipboardList, CalendarPlus, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import ScoradTrendChart from "../../features/journal/components/ScoradTrendChart";
import PastProgressLogs from "../../features/journal/components/PastProgressLogs";
import ReactCalendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

// Available time slots for appointments
const TIME_SLOTS = [
  "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
  "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM",
];

const PatientHistory = () => {
  const { patientId } = useParams(); // Get patient ID from URL

  // Core state
  const [patient, setPatient] = useState(null);
  const [journalEntries, setJournalEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Doctor and form state
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [newActionItem, setNewActionItem] = useState("");
  const [patientSummary, setPatientSummary] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [prescriptionsInput, setPrescriptionsInput] = useState("");

  // Records and filters
  const [errorMsg, setErrorMsg] = useState("");
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [recordDateFilter, setRecordDateFilter] = useState("");
  const [journalDateFilter, setJournalDateFilter] = useState("");
  const [scoradHistory, setScoradHistory] = useState([]);
  const [fullProgressLogs, setFullProgressLogs] = useState([]);
  const [activeRecordTab, setActiveRecordTab] = useState("chart");

  // Appointment scheduling state
  const [apptDate, setApptDate] = useState("");
  const [apptTimeSlot, setApptTimeSlot] = useState("");
  const [apptReason, setApptReason] = useState("");
  const [apptBookedSlots, setApptBookedSlots] = useState([]);
  const [apptLoadingSlots, setApptLoadingSlots] = useState(false);
  const [apptSubmitting, setApptSubmitting] = useState(false);
  const [apptError, setApptError] = useState("");
  const [apptSuccess, setApptSuccess] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [apptDateFilter, setApptDateFilter] = useState(null);

  // Mark appointment as completed
  const handleCompleteAppointment = async (apptId) => {
    try {
      const docRef = doc(firestore, "users", "patients", "accounts", patientId, "appointments", apptId);
      await updateDoc(docRef, { status: "completed" });
      setUpcomingAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: "completed" } : a));
    } catch (err) {
      console.error("Failed to complete appointment:", err);
      alert("Failed to mark as completed.");
    }
  };

  // Fetch doctor profile on login
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

  // Fetch all patient data once doctor profile is ready
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        // 1. Fetch patient info + access control check
        try {
          const patDoc = await getDoc(getUserDocRef("patient", patientId));
          if (patDoc.exists()) {
            const patData = patDoc.data();

            // Block access if doctor is not assigned to this patient
            if (patData.doctorId !== doctorProfile.uid) {
              setErrorMsg("Access Denied: You are not the assigned doctor for this patient.");
              setLoading(false);
              return;
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

        // 2. Fetch journal entries (with fallback if index missing)
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

        // 3. Fetch medical records (with fallback)
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

        // 4. Fetch SCORAD / track progress data for chart
        try {
          const trackSnap = await getDocs(collection(firestore, "users", "patients", "accounts", patientId, "trackProgress"));
          let tracks = trackSnap.docs.map(d => d.data());
          tracks.sort((a, b) => {
            const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp || a.dateKey || 0).getTime();
            const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp || b.dateKey || 0).getTime();
            return tA - tB;
          });
          // Convert to chart-friendly format
          const chartData = tracks.map(t => {
            const dateObj = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp || t.dateKey || 0);
            return {
              date: dateObj.toLocaleDateString("en-MY", { day: "numeric", month: "short" }),
              fullDate: dateObj,
              score: Math.round(t.scoradScore ?? t.finalPercentage ?? t.percentage ?? 0),
            };
          }).filter(t => t.score > 0);
          setScoradHistory(chartData);
          setFullProgressLogs(tracks);
        } catch (e) {
          console.error("Error fetching track progress:", e);
        }

        // 5. Fetch upcoming appointments
        try {
          const apptSnap = await getDocs(query(collection(firestore, "users", "patients", "accounts", patientId, "appointments"), where("doctorId", "==", doctorProfile.uid)));
          const now = new Date(); now.setHours(0,0,0,0);
          const appts = apptSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(a => {
            if (a.status === "cancelled" || a.status === "rejected") return false;
            const apptDate = a.date?.toDate ? a.date.toDate() : new Date(a.date);
            return apptDate >= now;
          });
          appts.sort((a,b) => {
             const dA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
             const dB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
             return dA - dB;
          });
          setUpcomingAppointments(appts);
        } catch (e) {
          console.error("Error fetching appointments:", e);
        }

      } catch (err) {
        console.error("Critical Error in fetchData:", err);
        setErrorMsg("Failed to load patient data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (patientId && doctorProfile) {
      fetchData();
    }
  }, [patientId, doctorProfile]);

  // Assign an action item task to the patient
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

  // Save a new medical record to the patient's file
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

  // Get tomorrow's date (minimum date for scheduling)
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  };

  // Check which time slots are already booked for a date
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

  // Re-check booked slots when date changes
  useEffect(() => {
    if (apptDate && doctorProfile) {
      fetchApptBookedSlots(apptDate);
      setApptTimeSlot("");
    } else {
      setApptBookedSlots([]);
      setApptTimeSlot("");
    }
  }, [apptDate, doctorProfile]);

  // Create a new appointment for this patient
  const handleSetAppointment = async (e) => {
    e.preventDefault();
    setApptError("");
    if (!apptDate) { setApptError("Please select a date."); return; }
    if (!apptTimeSlot) { setApptError("Please select a time slot."); return; }
    if (!apptReason.trim()) { setApptError("Please provide a reason."); return; }
    setApptSubmitting(true);
    try {
      const apptData = {
        patientId,
        patientName: patient?.name || "",
        patientEmail: patient?.email || "",
        doctorId: doctorProfile.uid,
        doctorName: doctorProfile.name || "Doctor",
        date: Timestamp.fromDate(new Date(apptDate)),
        timeSlot: apptTimeSlot,
        status: "approved", // Auto-approved since set by doctor
        reason: apptReason.trim(),
        setByDoctor: true,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(firestore, "users", "patients", "accounts", patientId, "appointments"), apptData);
      
      // Add to local list and sort
      setUpcomingAppointments(prev => {
        const updated = [...prev, { id: docRef.id, ...apptData }];
        return updated.sort((a,b) => {
          const dA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dA - dB;
        });
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

  // Print the page as PDF
  const exportToPDF = () => {
    window.print();
  };

  // Format timestamp to readable date
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

  // Safely join two arrays into a string
  const safeArrayJoin = (arr1, arr2) => {
    const a1 = Array.isArray(arr1) ? arr1 : [];
    const a2 = Array.isArray(arr2) ? arr2 : [];
    return [...a1, ...a2].join(", ") || "None";
  };

  return (
    <DoctorLayout title="Patient File">

      {/* Print styles */}
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

        {/* Error banner */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Patient header */}
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

        {/* Tabbed interface */}
        <div className="relative z-0 print:hidden mt-6 mb-6">
          {/* Tab buttons */}
          <div className="flex flex-wrap items-end mb-0 relative z-10 px-4 gap-1">
            <button
              onClick={() => setActiveRecordTab("chart")}
              className={`px-4 py-2.5 rounded-t-lg text-xs font-bold tracking-wide transition-all uppercase ${
                activeRecordTab === "chart" ? "bg-blue-600 text-white" : "bg-slate-200/60 text-slate-500 hover:bg-slate-200"
              }`}
            >
              PO-SCORAD CHART
            </button>
            <button
              onClick={() => setActiveRecordTab("logs")}
              className={`px-4 py-2.5 rounded-t-lg text-xs font-bold tracking-wide transition-all uppercase ${
                activeRecordTab === "logs" ? "bg-[#0D9488] text-white" : "bg-slate-200/60 text-slate-500 hover:bg-slate-200"
              }`}
            >
              PAST LOGS
            </button>
            <button
              onClick={() => setActiveRecordTab("medical_record")}
              className={`px-4 py-2.5 rounded-t-lg text-xs font-bold tracking-wide transition-all uppercase ${
                activeRecordTab === "medical_record" ? "bg-indigo-500 text-white" : "bg-slate-200/60 text-slate-500 hover:bg-slate-200"
              }`}
            >
              MEDICAL RECORD
            </button>
            <button
              onClick={() => setActiveRecordTab("journal")}
              className={`px-4 py-2.5 rounded-t-lg text-xs font-bold tracking-wide transition-all uppercase ${
                activeRecordTab === "journal" ? "bg-sky-500 text-white" : "bg-slate-200/60 text-slate-500 hover:bg-slate-200"
              }`}
            >
              PAST ENTRY JOURNAL
            </button>
            <button
              onClick={() => setActiveRecordTab("appointment")}
              className={`px-4 py-2.5 rounded-t-lg text-xs font-bold tracking-wide transition-all uppercase ${
                activeRecordTab === "appointment" ? "bg-emerald-500 text-white" : "bg-slate-200/60 text-slate-500 hover:bg-slate-200"
              }`}
            >
              SET APPOINTMENT
            </button>
          </div>

          {/* Tab content */}
          <div className="bg-white p-6 rounded-3xl rounded-tl-none shadow-sm border border-slate-100 relative group transition-all duration-500 min-h-[400px]">
            
            {/* Tab 1: SCORAD trend chart */}
            {activeRecordTab === "chart" && <ScoradTrendChart data={scoradHistory} />}
            
            {/* Tab 2: Past progress logs */}
            {activeRecordTab === "logs" && <PastProgressLogs progressData={fullProgressLogs} />}

            {/* Tab 3: Medical records (create + view past) */}
            {activeRecordTab === "medical_record" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Create new medical record form */}
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

                {/* Past medical records list */}
                <div className="glass-strong p-6 flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-indigo-500" /> Past Medical Records
                    </h3>
                    <div className="flex items-center gap-2">
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
              </div>
            )}

            {/* Tab 4: Journal entries + assign action items */}
            {activeRecordTab === "journal" && (
              <div className="flex flex-col gap-6 animate-fade-in">
                {/* Assign action item form */}
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

                {/* Past journal entries list */}
                <div className="glass-strong p-6 flex flex-col h-[600px]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-sky-500" /> Patient Journal & Diet Log
                    </h3>
                    <div className="flex items-center gap-2">
                      {journalDateFilter && (
                        <button onClick={() => setJournalDateFilter("")} className="text-xs font-semibold text-sky-500 hover:text-sky-600 transition px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-100">
                          Show All
                        </button>
                      )}
                      <div className="relative">
                        <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          value={journalDateFilter}
                          onChange={(e) => setJournalDateFilter(e.target.value)}
                          className="input-dark text-xs py-1.5 pl-8 pr-2 w-40 cursor-pointer bg-white"
                          style={{ fontSize: '12px' }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                    {journalEntries.length === 0 ? (
                      <p className="text-slate-500">No journal entries yet.</p>
                    ) : (() => {
                      const filteredJournal = journalDateFilter
                        ? journalEntries.filter(j => {
                            if (!j.createdAt && !j.date) return false;
                            const dt = j.createdAt?.toDate ? j.createdAt.toDate() : new Date(j.createdAt || j.date);
                            return dt.toISOString().split('T')[0] === journalDateFilter;
                          })
                        : journalEntries;
                      return filteredJournal.length === 0 ? (
                        <div className="text-center py-8">
                          <CalendarDays className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-slate-500 text-sm">No journal entries on this date.</p>
                          <button onClick={() => setJournalDateFilter("")} className="text-sky-500 text-xs hover:underline mt-1">Show all entries</button>
                        </div>
                      ) : filteredJournal.map((j) => (
                        <div key={j.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
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
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: Set appointment + view upcoming */}
            {activeRecordTab === "appointment" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
                {/* Left: appointment form */}
                <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 flex flex-col h-[600px]">
                  <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2 mb-2">
                    <CalendarPlus className="h-5 w-5" /> Set Future Appointment
                  </h3>
                  <p className="text-xs text-emerald-600 mb-4">Schedule a follow-up appointment for this patient. It will appear in their journal.</p>

                  <div className="overflow-y-auto flex-1 pr-2">
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

                      {/* Time slot grid (booked slots are disabled) */}
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

                      <div className="flex justify-end pt-2">
                        <button type="submit" disabled={apptSubmitting || !apptDate || !apptTimeSlot || !apptReason.trim()} className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2">
                          <CalendarPlus className="h-4 w-4" />
                          {apptSubmitting ? "Setting..." : "Set Appointment"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* Right: calendar + upcoming appointments */}
                <div className="glass-strong p-6 flex flex-col h-[600px]">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-5 w-5 text-emerald-500" /> Scheduled Appointments
                    </div>
                    {apptDateFilter && (
                      <button onClick={() => setApptDateFilter(null)} className="text-xs font-semibold text-emerald-500 hover:text-emerald-600 transition px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-100">
                        Show All
                      </button>
                    )}
                  </h3>

                  {/* Calendar with green dots on dates with appointments */}
                  <div className="mb-4 bg-white rounded-xl border border-slate-200 p-2 shadow-sm text-sm overflow-hidden" style={{ minHeight: '300px' }}>
                    <ReactCalendar
                      onChange={setApptDateFilter}
                      value={apptDateFilter}
                      className="border-0 w-full"
                      tileContent={({ date, view }) => {
                        if (view === 'month') {
                          const dtStr = date.toLocaleDateString("en-CA");
                          const hasAppt = upcomingAppointments.some(a => {
                            if (a.status === "cancelled" || a.status === "rejected") return false;
                            const aDt = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                            return aDt.toLocaleDateString("en-CA") === dtStr;
                          });
                          if (hasAppt) {
                            return <div className="flex justify-center mt-1"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div></div>;
                          }
                        }
                        return null;
                      }}
                    />
                  </div>

                  {/* Appointment cards */}
                  <div className="overflow-y-auto flex-1 space-y-4 pr-2">
                    {(() => {
                      const filtered = apptDateFilter 
                        ? upcomingAppointments.filter(a => {
                            const aDt = a.date?.toDate ? a.date.toDate() : new Date(a.date);
                            return aDt.toLocaleDateString("en-CA") === apptDateFilter.toLocaleDateString("en-CA");
                          })
                        : upcomingAppointments;

                      if (filtered.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-slate-500 text-sm font-medium">No appointments found.</p>
                          </div>
                        );
                      }

                      return filtered.map(appt => {
                        const dt = appt.date?.toDate ? appt.date.toDate() : new Date(appt.date);
                        const isCompleted = appt.status === "completed";
                        return (
                          <div key={appt.id} className={`bg-white p-5 rounded-xl border ${isCompleted ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'} shadow-sm flex flex-col gap-2 relative overflow-hidden group`}>
                            <div className={`absolute top-0 left-0 w-1.5 h-full ${isCompleted ? 'bg-slate-300' : 'bg-emerald-500'}`}></div>
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-bold px-3 py-1 rounded-lg border ${isCompleted ? 'bg-slate-100 text-slate-500 border-slate-200' : 'text-slate-800 bg-emerald-50 border-emerald-100'}`}>
                                {dt.toLocaleDateString("en-MY", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200">
                                {appt.timeSlot}
                              </span>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5 mt-2">Reason</p>
                              <p className="text-sm text-slate-700 font-medium">{appt.reason}</p>
                            </div>
                            
                            <div className="mt-3 flex justify-end">
                              {isCompleted ? (
                                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                                  <CheckCircle className="w-3.5 h-3.5" /> Completed
                                </span>
                              ) : (
                                <button 
                                  onClick={() => handleCompleteAppointment(appt.id)}
                                  className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors"
                                >
                                  <CheckSquare className="w-3.5 h-3.5" /> Mark Complete
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      });
                    })()}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </DoctorLayout>
  );
};

export default PatientHistory;
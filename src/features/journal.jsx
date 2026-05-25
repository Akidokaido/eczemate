import React, { useState, useEffect } from "react";
import { BookOpen, Printer, Sparkles } from "lucide-react";
import { auth, firestore, onAuthStateChanged, collection, addDoc, query, getDocs, orderBy, serverTimestamp, doc, updateDoc, where } from "../firebase/config";

// Sub-components
import ScoradTrendChart from "./journal/components/ScoradTrendChart";
import JournalComposer from "./journal/components/JournalComposer";
import ActionItemsSection from "./journal/components/ActionItemsSection";
import AppointmentSection from "./journal/components/AppointmentSection";
import PastEntriesSection from "./journal/components/PastEntriesSection";
import CancelApptModal from "./journal/components/CancelApptModal";

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-[#FDFBF7] gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 border-4 border-slate-100 rounded-full" />
      <div className="absolute inset-0 border-4 border-[#0D9488] rounded-full border-t-transparent animate-spin" />
    </div>
    <div className="flex flex-col items-center">
      <p className="text-[#1C1917] font-bold tracking-tight">EczeMate Journal</p>
      <p className="text-xs text-[#64748B] font-medium">Preparing your workspace...</p>
    </div>
  </div>
);

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [userId, setUserId] = useState(null);
  
  // Form State
  const [newEntry, setNewEntry] = useState("");
  const [selectedEmotion, setSelectedEmotion] = useState("calm");
  const [foodLog, setFoodLog] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [trackProgressData, setTrackProgressData] = useState([]);
  
  // UI State
  const [aiInsight, setAiInsight] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Upcoming appointments
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [cancelModalAppt, setCancelModalAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => { 
    const unsub = onAuthStateChanged(auth, (user) => { 
      if (user) setUserId(user.uid); 
    }); 
    return () => unsub(); 
  }, []);

  useEffect(() => { 
    if (userId) {
      fetchJournalEntries();
      fetchActionItems();
      fetchTrackProgress();
      fetchUpcomingAppointments();
    }
  }, [userId]);

  const fetchActionItems = async () => {
    try {
      const q = query(collection(firestore, "users", "patients", "accounts", userId, "actionItems"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setActionItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error("Error fetching action items:", err); }
  };

  const fetchJournalEntries = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, "users", "patients", "accounts", userId, "journal"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setEntries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error("Error fetching journal entries:", err); } 
    finally { setLoading(false); }
  };

  const handlePostEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.trim() || !userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const entryData = { entry: newEntry.trim(), emotion: selectedEmotion, foodLog: foodLog.trim(), createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(firestore, "users", "patients", "accounts", userId, "journal"), entryData);
      setEntries(prev => [{ id: docRef.id, ...entryData, createdAt: { toDate: () => new Date() } }, ...prev]);
      setNewEntry(""); setFoodLog(""); setSelectedEmotion("calm");
    } catch (err) { setError("Failed to post entry. Please try again."); } 
    finally { setSubmitting(false); }
  };

  const toggleActionItem = async (item) => {
    try {
      const newStatus = !item.completed;
      await updateDoc(doc(firestore, "users", "patients", "accounts", userId, "actionItems", item.id), { completed: newStatus });
      setActionItems(prev => prev.map(a => a.id === item.id ? { ...a, completed: newStatus } : a));
    } catch (err) { console.error("Failed to toggle action item", err); }
  };

  const handleAnalyzeTriggers = async () => {
    if (entries.length === 0) return;
    setIsAnalyzing(true);
    setAiInsight(null);
    try {
      const response = await fetch("/api/analyze-triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: entries.slice(0, 10) })
      });
      const data = await response.json();
      if (data.insight) setAiInsight(data.insight);
    } catch (err) { setAiInsight("Failed to analyze triggers. Please try again later."); } 
    finally { setIsAnalyzing(false); }
  };

  const fetchTrackProgress = async () => {
    const processDocs = (docs) => docs.map(d => {
      const data = d.data();
      const date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || 0);
      return {
        date: date.toLocaleDateString("en-MY", { month: 'short', day: 'numeric' }),
        fullDate: date,
        score: Math.round(data.scoradScore ?? data.finalPercentage ?? data.percentage ?? 0),
      };
    });

    try {
      const q = query(collection(firestore, "users", "patients", "accounts", userId, "trackProgress"), orderBy("timestamp", "asc"));
      const snap = await getDocs(q);
      setTrackProgressData(processDocs(snap.docs));
    } catch (err) {
      const snap = await getDocs(collection(firestore, "users", "patients", "accounts", userId, "trackProgress"));
      const arr = processDocs(snap.docs);
      setTrackProgressData(arr.sort((a, b) => a.fullDate - b.fullDate));
    }
  };

  const fetchUpcomingAppointments = async () => {
    try {
      const q = query(collection(firestore, "users", "patients", "accounts", userId, "appointments"), where("patientId", "==", userId));
      const snap = await getDocs(q);
      const now = new Date(); now.setHours(0, 0, 0, 0);
      const appts = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(a => {
          if (a.status === "cancelled" || a.status === "rejected") return false;
          const apptDate = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          return apptDate >= now;
        })
        .sort((a, b) => {
          const dA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dA - dB;
        });
      setUpcomingAppts(appts);
    } catch (err) { console.error("Error fetching upcoming appointments:", err); }
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim() || !cancelModalAppt) return;
    setCancelling(true);
    try {
      await updateDoc(doc(firestore, "users", "patients", "accounts", userId, "appointments", cancelModalAppt.id), {
        status: "cancelled", cancelReason: cancelReason.trim(),
      });
      setUpcomingAppts(prev => prev.filter(a => a.id !== cancelModalAppt.id));
      setCancelModalAppt(null); setCancelReason("");
    } catch (err) { console.error("Error cancelling appointment:", err); } 
    finally { setCancelling(false); }
  };

  const filteredEntries = selectedDate
    ? entries.filter(entry => {
        if (!entry.createdAt) return false;
        const entryDate = entry.createdAt.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt);
        return entryDate.toISOString().split('T')[0] === selectedDate;
      })
    : entries;

  const formatTime = (timestamp) => {
    if (!timestamp) return "Just now";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-MY", { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (loading && entries.length === 0) return <PageLoader />;

  return (
    <div className="flex flex-col p-4 md:p-6 animate-fade-in print:p-0 print:bg-white bg-[#FDFBF7] relative overflow-hidden" style={{ minHeight: "calc(100vh - 80px)" }}>
      {/* Background mesh */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#0D9488]/[0.04] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#F97316]/[0.03] rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between print:hidden gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-lg shadow-[#0D9488]/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-[#0D9488]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-[#1C1917] tracking-tight">Wellness Journal</h2>
                <Sparkles className="h-4 w-4 text-[#F97316] animate-pulse" />
              </div>
              <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Dashboard</p>
            </div>
          </div>
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-[#64748B] text-xs font-bold py-2.5 px-5 rounded-xl border border-slate-100 shadow-sm transition-all"
          >
            <Printer className="h-4 w-4 text-[#64748B]" /> 
            Report
          </button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8 border-b-4 border-slate-800 pb-6">
          <h1 className="text-4xl font-black text-slate-800">EczeMate Patient Record</h1>
          <p className="text-slate-500 font-bold mt-2">Generated Archive • {new Date().toLocaleDateString("en-MY", { dateStyle: 'full' })}</p>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 1: SCORAD Progress Chart          */}
        {/* ═══════════════════════════════════════════ */}
        <ScoradTrendChart data={trackProgressData} />

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 2: Daily Care & Clinical Visit     */}
        {/* ═══════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-4 print:hidden">
            <div className="w-1.5 h-6 rounded-full bg-[#0D9488]" />
            <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">Daily Care & Clinical Visit</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ActionItemsSection actionItems={actionItems} toggleActionItem={toggleActionItem} />
            <AppointmentSection upcomingAppts={upcomingAppts} onCancelClick={(appt) => { setCancelModalAppt(appt); setCancelReason(""); }} />
          </div>
        </div>

        {/* ═══════════════════════════════════════════ */}
        {/* SECTION 3: Today's Reflection & Timeline   */}
        {/* ═══════════════════════════════════════════ */}
        <div>
          <div className="flex items-center gap-2 mb-4 print:hidden">
            <div className="w-1.5 h-6 rounded-full bg-[#F97316]" />
            <h3 className="text-lg font-bold text-[#1C1917] tracking-tight">Today's Reflection & Timeline</h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block">
            {/* Write Entry */}
            <div className="lg:col-span-7">
              <JournalComposer 
                newEntry={newEntry} setNewEntry={setNewEntry}
                selectedEmotion={selectedEmotion} setSelectedEmotion={setSelectedEmotion}
                foodLog={foodLog} setFoodLog={setFoodLog}
                handlePostEntry={handlePostEntry} submitting={submitting} error={error}
              />
            </div>
            {/* Past Entries Timeline */}
            <div className="lg:col-span-5 h-full">
              <PastEntriesSection 
                loading={loading} entries={entries} filteredEntries={filteredEntries}
                selectedDate={selectedDate} setSelectedDate={setSelectedDate}
                handleAnalyzeTriggers={handleAnalyzeTriggers} isAnalyzing={isAnalyzing}
                aiInsight={aiInsight} setAiInsight={setAiInsight} formatTime={formatTime}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Global CSS Inject */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .bg-mesh, aside, .btn-gradient, .btn-ghost { display: none !important; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.1); }
      `}} />

      <CancelApptModal 
        appt={cancelModalAppt} cancelReason={cancelReason} setCancelReason={setCancelReason}
        onClose={() => setCancelModalAppt(null)} onConfirm={handleCancelAppointment} cancelling={cancelling}
      />
    </div>
  );
};

export default Journal;
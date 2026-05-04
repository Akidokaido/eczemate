import React, { useState, useEffect } from "react";
import { BookOpen, Send, Clock, Smile, Meh, Frown, Coffee, Printer, CheckCircle, CalendarDays, Calendar, XCircle, Sparkles } from "lucide-react";
import { auth, firestore, onAuthStateChanged, collection, addDoc, query, getDocs, orderBy, serverTimestamp, doc, updateDoc, where } from "../firebase/config";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const emotionsList = [
  { id: "happy", label: "Happy", icon: Smile, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-200" },
  { id: "calm", label: "Calm", icon: Meh, color: "text-sky-500", bg: "bg-sky-50", border: "border-sky-200" },
  { id: "anxious", label: "Anxious", icon: Frown, color: "text-amber-500", bg: "bg-amber-50", border: "border-amber-200" },
  { id: "frustrated", label: "Frustrated", icon: Frown, color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
  { id: "depressed", label: "Depressed", icon: Frown, color: "text-rose-500", bg: "bg-rose-50", border: "border-rose-200" },
];

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
  
  // AI Insight State
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
      const q = query(
        collection(firestore, "users", "patients", "accounts", userId, "actionItems"),
        orderBy("createdAt", "desc")
      );
      const snap = await getDocs(q);
      setActionItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Error fetching action items:", err);
    }
  };

  const fetchJournalEntries = async () => {
    setLoading(true);
    try {
      const q = query(collection(firestore, "users", "patients", "accounts", userId, "journal"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const fetchedEntries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setEntries(fetchedEntries);
    } catch (err) {
      console.error("Error fetching journal entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostEntry = async (e) => {
    e.preventDefault();
    if (!newEntry.trim()) return;
    if (!userId) { setError("You must be logged in."); return; }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const entryData = {
        entry: newEntry.trim(),
        emotion: selectedEmotion,
        foodLog: foodLog.trim(),
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(firestore, "users", "patients", "accounts", userId, "journal"), entryData);
      
      setEntries(prev => [{ id: docRef.id, ...entryData, createdAt: { toDate: () => new Date() } }, ...prev]);
      
      setNewEntry("");
      setFoodLog("");
      setSelectedEmotion("calm");
      
    } catch (err) {
      console.error(err);
      setError("Failed to post entry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActionItem = async (item) => {
    try {
      const newStatus = !item.completed;
      await updateDoc(doc(firestore, "users", "patients", "accounts", userId, "actionItems", item.id), {
        completed: newStatus
      });
      setActionItems(prev => prev.map(a => a.id === item.id ? { ...a, completed: newStatus } : a));
    } catch (err) {
      console.error("Failed to toggle action item", err);
    }
  };

  const handleAnalyzeTriggers = async () => {
    if (entries.length === 0) return;
    setIsAnalyzing(true);
    setAiInsight(null);
    try {
      const response = await fetch("/api/analyze-triggers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: entries.slice(0, 10) }) // send last 10 entries
      });
      const data = await response.json();
      if (data.insight) setAiInsight(data.insight);
    } catch (err) {
      console.error("Failed to analyze triggers:", err);
      setAiInsight("Failed to analyze triggers. Please try again later.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchTrackProgress = async () => {
    try {
      const q = query(
        collection(firestore, "users", "patients", "accounts", userId, "trackProgress"),
        orderBy("timestamp", "asc")
      );
      const snap = await getDocs(q);
      setTrackProgressData(snap.docs.map(d => {
        const data = d.data();
        const date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
        return {
          date: date.toLocaleDateString("en-MY", { month: 'short', day: 'numeric' }),
          fullDate: date,
          percentage: data.finalPercentage || 0,
        };
      }));
    } catch (err) {
      try {
        const snap = await getDocs(
          collection(firestore, "users", "patients", "accounts", userId, "trackProgress")
        );
        let arr = snap.docs.map(d => {
          const data = d.data();
          const date = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp || 0);
          return {
            date: date.toLocaleDateString("en-MY", { month: 'short', day: 'numeric' }),
            fullDate: date,
            percentage: data.finalPercentage || 0,
          };
        });
        arr.sort((a, b) => a.fullDate - b.fullDate);
        setTrackProgressData(arr);
      } catch (err2) {
        console.error("Error fetching track progress:", err2);
      }
    }
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
    return date.toLocaleDateString("en-MY", { 
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const exportToPDF = () => {
    window.print();
  };

  // --- Upcoming Appointments ---
  const fetchUpcomingAppointments = async () => {
    try {
      const q = query(
        collection(firestore, "users", "patients", "accounts", userId, "appointments"),
        where("patientId", "==", userId)
      );
      const snap = await getDocs(q);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const appts = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
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
    } catch (err) {
      console.error("Error fetching upcoming appointments:", err);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancelReason.trim() || !cancelModalAppt) return;
    setCancelling(true);
    try {
      await updateDoc(doc(firestore, "users", "patients", "accounts", userId, "appointments", cancelModalAppt.id), {
        status: "cancelled",
        cancelReason: cancelReason.trim(),
      });
      setUpcomingAppts(prev => prev.filter(a => a.id !== cancelModalAppt.id));
      setCancelModalAppt(null);
      setCancelReason("");
    } catch (err) {
      console.error("Error cancelling appointment:", err);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="flex flex-col p-6 animate-fade-in-up print:p-0 print:bg-white bg-slate-50" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-sky-100">
              <BookOpen className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>My Journal</h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Track your skin health and wellness journey</p>
            </div>
          </div>
          <button onClick={exportToPDF} className="btn-ghost flex items-center gap-2 text-sm py-2 px-4 rounded-xl border border-slate-200 bg-white shadow-sm">
            <Printer className="h-4 w-4" /> Export to PDF
          </button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-8 border-b-2 border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-slate-800">Patient Journal & Dietary Record</h1>
          <p className="text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Skin Progress Chart — Full Width Top */}
        {trackProgressData.length > 0 && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden relative">
            <div className="flex items-center justify-between mb-6">
               <div>
                 <h4 className="text-lg font-bold text-slate-800">Skin Condition Trend</h4>
                 <p className="text-sm text-slate-500">Your skin score over the past month</p>
               </div>
               {/* +4% this week mock badge */}
               <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-semibold">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                 +4% this week
               </div>
            </div>
            
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trackProgressData}>
                <defs>
                  <linearGradient id="skinGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dy={10} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ background: 'white', border: 'none', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '13px' }}
                  formatter={(value) => [`${value}%`, 'Skin Score']}
                />
                <Area type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={2.5} fill="url(#skinGradient)" activeDot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: 'white' }} />
              </AreaChart>
            </ResponsiveContainer>
            
            {/* Legend / Goal section at bottom of chart */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-50 text-sm">
               <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                 <span className="text-slate-600">Current Score: <span className="font-bold text-slate-800">{trackProgressData[trackProgressData.length - 1]?.percentage || 0}%</span></span>
               </div>
               <div className="w-px h-4 bg-slate-200"></div>
               <div className="flex items-center gap-2">
                 <span className="text-slate-500">Goal: <span className="text-slate-600">90%</span></span>
               </div>
            </div>
          </div>
        )}

        {/* Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* New Journal Entry Composer */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden relative">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                </div>
                <h3 className="text-base font-bold text-slate-800">New Journal Entry</h3>
              </div>

              {error && <div className="mb-4 p-3 rounded-xl text-sm bg-red-50 text-red-600 border border-red-100">{error}</div>}
              
              <form onSubmit={handlePostEntry} className="space-y-6">
                {/* Emotion Selector */}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-3">How are you feeling today?</p>
                  <div className="flex flex-wrap gap-2">
                    {emotionsList.map(emo => {
                      const Icon = emo.icon;
                      const isSelected = selectedEmotion === emo.id;
                      
                      // Using the soft pill styles from the image
                      const pillColors = {
                        happy: { bg: 'bg-emerald-50', text: 'text-emerald-500', activeBg: 'bg-emerald-100', border: 'border-emerald-200' },
                        calm: { bg: 'bg-sky-50', text: 'text-sky-500', activeBg: 'bg-sky-100', border: 'border-sky-200' },
                        anxious: { bg: 'bg-orange-50', text: 'text-orange-400', activeBg: 'bg-orange-100', border: 'border-orange-200' },
                        frustrated: { bg: 'bg-rose-50', text: 'text-rose-400', activeBg: 'bg-rose-100', border: 'border-rose-200' },
                        depressed: { bg: 'bg-indigo-50', text: 'text-indigo-400', activeBg: 'bg-indigo-100', border: 'border-indigo-200' }
                      };
                      
                      const colors = pillColors[emo.id] || pillColors.calm;
                      
                      return (
                        <button 
                          key={emo.id} type="button"
                          onClick={() => setSelectedEmotion(emo.id)}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${isSelected ? `${colors.activeBg} ${colors.text} ring-1 ring-${colors.text.split('-')[1]}-300` : `${colors.bg} ${colors.text} border border-transparent hover:opacity-80`}`}
                        >
                          <Icon className="h-4 w-4" /> {emo.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Food Log */}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-slate-400" /> What did you eat today?
                  </p>
                  <input 
                    type="text"
                    placeholder="e.g., Oatmeal for breakfast, salad for lunch..."
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-100 transition"
                    value={foodLog}
                    onChange={(e) => setFoodLog(e.target.value)}
                  />
                  <p className="text-xs text-slate-400 mt-2">Tracking diet helps identify potential triggers</p>
                </div>

                {/* Journal Text */}
                <div>
                  <p className="text-sm font-semibold text-slate-700 mb-2">Your Thoughts</p>
                  <textarea 
                    className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-sky-100 transition resize-none min-h-[100px]"
                    placeholder="How is your skin feeling? Any new symptoms or improvements? What's on your mind..."
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                  />
                </div>
                
                <button 
                  type="submit" 
                  disabled={submitting || !newEntry.trim()} 
                  className="w-full bg-sky-400 hover:bg-sky-500 text-white flex justify-center items-center gap-2 py-3.5 rounded-2xl disabled:opacity-50 transition-all font-semibold shadow-sm"
                >
                  <Send className="h-4 w-4" /> {submitting ? "Posting..." : "Post Entry"}
                </button>
              </form>
            </div>

            {/* Sub-grid for Action Items & Appointments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Action Items */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-sky-500" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Action Items</h3>
                  </div>
                  {actionItems.length > 0 && (
                    <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-500" /> 
                      {actionItems.filter(a => a.completed).length}/{actionItems.length} done
                    </span>
                  )}
                </div>
                
                {actionItems.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">No action items assigned.</p>
                ) : (
                  <div className="space-y-3">
                    {actionItems.map(item => (
                      <div key={item.id} className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50">
                        <button onClick={() => toggleActionItem(item)} className={`mt-0.5 rounded-md w-5 h-5 flex items-center justify-center border ${item.completed ? 'bg-emerald-400 border-emerald-400 text-white' : 'border-slate-300 text-transparent hover:border-emerald-300'}`}>
                          <CheckCircle className="h-3 w-3" />
                        </button>
                        <div>
                          <p className={`text-sm font-semibold ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.task}</p>
                          {item.doctorName && <p className="text-xs text-slate-500 mt-0.5">Assigned by Dr. {item.doctorName}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Appointments */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden flex flex-col">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-full bg-sky-50 flex items-center justify-center">
                    <CalendarDays className="h-4 w-4 text-sky-500" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 leading-tight">Upcoming<br/>Appointments</h3>
                </div>
                
                {upcomingAppts.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4 my-auto">No upcoming appointments.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppts.slice(0,2).map(appt => {
                      const apptDate = appt.date?.toDate ? appt.date.toDate() : new Date(appt.date);
                      return (
                        <div key={appt.id} className="p-4 rounded-2xl bg-slate-50">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800">Dr. {appt.doctorName || "Doctor"}</p>
                                <p className="text-xs text-slate-500">Dermatologist</p>
                              </div>
                            </div>
                            <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-md">
                              Confirmed
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-4">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5 text-slate-400" /> {apptDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </div>
                            <div className="flex items-center gap-1.5">
                               <Clock className="h-3.5 w-3.5 text-slate-400" /> {appt.timeSlot || "10:30 AM"}
                            </div>
                            <div className="flex items-center gap-1.5 col-span-2 mt-1">
                               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> Video Call
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <button className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold py-2 rounded-xl transition">
                              Join Call
                            </button>
                            <button 
                              onClick={() => { setCancelModalAppt(appt); setCancelReason(""); }}
                              className="flex-1 bg-white border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold py-2 rounded-xl transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col print:!bg-white print:!shadow-none" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              
              {/* Past Entries Header */}
              <div className="flex items-center justify-between mb-5 print:hidden flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-slate-600" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">Past Entries</h3>
                </div>
                
                <div className="flex items-center gap-2">
                  <button onClick={handleAnalyzeTriggers} disabled={isAnalyzing || entries.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition disabled:opacity-50 border border-indigo-100 shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    {isAnalyzing ? "Analyzing..." : "Analyze Triggers"}
                  </button>
                  {selectedDate && (
                    <button onClick={() => setSelectedDate("")} className="text-xs font-semibold text-sky-500 hover:text-sky-600 transition">
                      Clear
                    </button>
                  )}
                  <div className="relative flex items-center">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full"
                    />
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                      Filter
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Insight Card */}
              {aiInsight && (
                <div className="mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-4 border border-indigo-100 shadow-sm relative print:hidden animate-fade-in-up">
                  <button onClick={() => setAiInsight(null)} className="absolute top-3 right-3 text-indigo-300 hover:text-indigo-500 transition">
                    <XCircle className="h-4 w-4" />
                  </button>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900 mb-1">AI Trigger Insight</h4>
                      <p className="text-xs text-indigo-700 leading-relaxed">{aiInsight}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scrollable Entries */}
              <div className="overflow-y-auto flex-1 space-y-4 pr-1" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                {loading ? (
                  <div className="text-center p-8 text-slate-500 print:hidden">Loading your journal...</div>
                ) : entries.length === 0 ? (
                  <div className="text-center p-10 print:hidden">
                    <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">Your journal is empty.</p>
                    <p className="text-slate-400 text-sm mt-1">Write your first entry to start!</p>
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="text-center p-10 print:hidden">
                    <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 font-medium">No entries on this date.</p>
                    <p className="text-slate-400 text-sm mt-1">Try a different date.</p>
                  </div>
                ) : (
                  filteredEntries.map((entry, idx) => {
                    const emoObj = emotionsList.find(e => e.id === entry.emotion) || emotionsList[1];
                    const EmoIcon = emoObj.icon;
                    
                    const pillColors = {
                      happy: { bg: 'bg-emerald-50', text: 'text-emerald-500' },
                      calm: { bg: 'bg-sky-50', text: 'text-sky-500' },
                      anxious: { bg: 'bg-orange-50', text: 'text-orange-400' },
                      frustrated: { bg: 'bg-rose-50', text: 'text-rose-400' },
                      depressed: { bg: 'bg-indigo-50', text: 'text-indigo-400' }
                    };
                    const colors = pillColors[entry.emotion] || pillColors.calm;

                    return (
                      <div key={entry.id || idx} className="bg-slate-50 rounded-3xl p-5 print:shadow-none print:border-slate-300">
                        <div className="flex justify-between items-center mb-4">
                          <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full ${colors.bg} ${colors.text}`}>
                            <EmoIcon className="h-3.5 w-3.5" /> {emoObj.label}
                          </span>
                          <span className="text-[11px] font-medium text-slate-500">
                            {formatTime(entry.createdAt)}
                          </span>
                        </div>
                        
                        <p className="whitespace-pre-wrap leading-relaxed text-slate-800 text-sm mb-4">
                          {entry.entry}
                        </p>
                        
                        {entry.foodLog && (
                          <div className="mt-4 pt-4 border-t border-slate-200/60">
                            <div className="flex items-start gap-2">
                              <Coffee className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                              <div>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-0.5">Food Log</p>
                                <p className="text-xs text-slate-700 font-medium">{entry.foodLog}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
      
      {/* CSS for printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background: white !important; }
          .bg-mesh, aside, .btn-gradient, .btn-ghost { display: none !important; }
          .glass { background: white !important; box-shadow: none !important; backdrop-filter: none !important; }
        }
        /* Custom scrollbar for webkit */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />

      {/* Cancel Appointment Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white p-6 rounded-3xl max-w-md w-full animate-fade-in-up shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Cancel Appointment?</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
              <p className="text-sm font-bold text-slate-800">Dr. {cancelModalAppt.doctorName || "Doctor"}</p>
              <p className="text-xs text-slate-500 mt-1">
                {(cancelModalAppt.date?.toDate ? cancelModalAppt.date.toDate() : new Date(cancelModalAppt.date)).toLocaleDateString("en-MY", { day: "numeric", month: "long", year: "numeric" })}
                {cancelModalAppt.timeSlot && <span className="ml-1 font-semibold text-sky-500">• {cancelModalAppt.timeSlot}</span>}
              </p>
            </div>

            <div className="mb-6">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 block">Reason for Cancellation *</label>
              <textarea
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-red-200 transition resize-none"
                rows={3}
                placeholder="Please tell us why you need to cancel..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setCancelModalAppt(null); setCancelReason(""); }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={cancelling || !cancelReason.trim()}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white py-2.5 px-6 rounded-xl text-sm font-semibold transition"
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

export default Journal;
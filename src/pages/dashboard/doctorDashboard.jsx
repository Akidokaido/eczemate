import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { auth, firestore, onAuthStateChanged, collection, query, where, getDocs } from "../../firebase/config";
import { getUserCollectionRef } from "../../firebase/userPaths";
import { Calendar, Users, AlertCircle, Clock, ChevronRight, Activity, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const COLORS = ['#0D9488', '#F97316', '#ef4444']; // Deep Teal, Warm Coral, Red

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAppts: 0, pendingAppts: 0, patients: 0 });
  const [allAppointments, setAllAppointments] = useState([]);
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);
  const [severityData, setSeverityData] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        setLoading(true);
        // 1. Fetch Assigned Patients
        const patSnap = await getDocs(query(getUserCollectionRef("patient"), where("doctorId", "==", user.uid)));
        const patients = patSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        let allAppts = [];
        let severities = { Mild: 0, Moderate: 0, Severe: 0, Untracked: 0 };
        let alertsTemp = [];

        // 2. Loop through each patient to gather data
        for (const pat of patients) {
          const apptSnap = await getDocs(
            query(collection(firestore, "users", "patients", "accounts", pat.id, "appointments"), where("doctorId", "==", user.uid))
          );
          
          apptSnap.docs.forEach(d => {
            const data = d.data();
            if (data.status !== "cancelled") {
              allAppts.push({ id: d.id, patientId: pat.id, ...data });
            }
          });

          // Fetch latest Track Progress for severity distribution
          try {
             const trackSnap = await getDocs(collection(firestore, "users", "patients", "accounts", pat.id, "trackProgress"));
             if (!trackSnap.empty) {
                let tracks = trackSnap.docs.map(t => t.data());
                tracks.sort((a, b) => {
                   const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp || 0).getTime();
                   const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp || 0).getTime();
                   return tB - tA;
                });
                const latest = tracks[0];
                const score = latest.scoradScore || latest.finalPercentage || 0;
                const dKey = latest.dateKey;
                const latestTrackTime = latest.timestamp?.toMillis ? latest.timestamp.toMillis() : new Date(latest.timestamp || 0).getTime();
                
                if (score > 50) {
                   severities.Severe++;
                   // Check if doctor already responded with an action item after this SCORAD
                   let alertHandled = false;
                   try {
                     const actionSnap = await getDocs(collection(firestore, "users", "patients", "accounts", pat.id, "actionItems"));
                     if (!actionSnap.empty) {
                       const actions = actionSnap.docs.map(d => d.data());
                       const latestAction = actions.reduce((latest, a) => {
                         const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : new Date(a.createdAt || 0).getTime();
                         return aTime > latest ? aTime : latest;
                       }, 0);
                       if (latestAction > latestTrackTime) {
                         alertHandled = true;
                       }
                     }
                   } catch (e) { /* ignore - treat as not handled */ }
                   if (!alertHandled) {
                     alertsTemp.push({ patientId: pat.id, name: pat.name || pat.email, score: Math.round(score), date: dKey });
                   }
                } else if (score >= 26) {
                   severities.Moderate++;
                } else {
                   severities.Mild++;
                }
             } else {
                severities.Untracked++;
             }
          } catch(e) {
             console.error("Error fetching track for", pat.id);
             severities.Untracked++;
          }
        }

        const pending = allAppts.filter((a) => a.status === "pending").length;
        
        setStats({ totalAppts: allAppts.length, pendingAppts: pending, patients: patients.length });
        setAllAppointments(allAppts);
        setAlerts(alertsTemp.sort((a,b) => b.score - a.score));

        const chartData = [
           { name: "Mild (0-25)", value: severities.Mild },
           { name: "Moderate (26-50)", value: severities.Moderate },
           { name: "Severe (>50)", value: severities.Severe }
        ].filter(d => d.value > 0);
        
        setSeverityData(chartData.length ? chartData : [{ name: "No Data", value: 1 }]);
        
      } catch (err) { 
        console.error("Error building dashboard:", err); 
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Filter schedule based on selected date
  const filteredSchedule = allAppointments
    .filter(appt => {
      const apptDateStr = appt.date?.toDate ? appt.date.toDate().toISOString().split("T")[0] : new Date(appt.date).toISOString().split("T")[0];
      return apptDateStr === scheduleDate && appt.status === "approved";
    })
    .sort((a, b) => {
      const timeA = a.timeSlot ? new Date(`1970/01/01 ${a.timeSlot}`).getTime() : 0;
      const timeB = b.timeSlot ? new Date(`1970/01/01 ${b.timeSlot}`).getTime() : 0;
      return timeA - timeB;
    });

  const cards = [
    { label: "Assigned Patients", value: stats.patients, sub: "Currently under your care", icon: Users, color: "#0D9488", onClick: () => navigate("/doctor/patients") },
    { label: "Pending Approvals", value: stats.pendingAppts, sub: "Appointments to review", icon: Clock, color: "#F97316", onClick: () => navigate("/doctor/appointments") },
    { label: "High Risk Alerts", value: alerts.length, sub: "Patients requiring attention", icon: AlertCircle, color: "#ef4444", onClick: () => setShowAlertsModal(true) },
  ];

  if (loading) {
    return (
      <DoctorLayout title="Command Center">
        <div className="flex items-center justify-center h-[60vh] text-slate-400 animate-pulse">Gathering your clinical data...</div>
      </DoctorLayout>
    );
  }

  return (
    <DoctorLayout title="Command Center">
      <div className="space-y-6 animate-fade-in-up pb-8">
        
        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(({ label, value, sub, icon: Icon, color, onClick }, i) => (
            <div key={label} onClick={onClick} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
              <div className="absolute -right-6 -top-6 opacity-[0.03] transform group-hover:scale-110 transition-transform duration-500">
                 <Icon size={120} style={{ color }} />
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border" style={{ background: `${color}08`, borderColor: `${color}20` }}>
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
              {value !== null && <p className="text-4xl font-black text-slate-800 mb-1">{value}</p>}
              <p className="font-bold text-slate-600">{label}</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
           {/* Left Column: Charts (2/3) */}
          <div className="lg:col-span-2 space-y-6">

             {/* Demographics Chart */}
             <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <div className="mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="text-emerald-500 h-5 w-5"/> Patient SCORAD Distribution</h3>
                   <p className="text-xs text-slate-400 font-semibold mt-1">Based on each patient's most recent SCORAD assessment. Scores are grouped by clinical severity thresholds.</p>
                </div>

                {/* Severity Breakdown Cards */}
                {!(severityData.length > 0 && severityData[0].name === "No Data") && (
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: "Mild", range: "0 – 25", color: "#0D9488", bg: "bg-emerald-50", border: "border-emerald-100", text: "text-emerald-700" },
                      { label: "Moderate", range: "26 – 50", color: "#F97316", bg: "bg-orange-50", border: "border-orange-100", text: "text-orange-700" },
                      { label: "Severe", range: "> 50", color: "#ef4444", bg: "bg-rose-50", border: "border-rose-100", text: "text-rose-700" },
                    ].map(({ label, range, color, bg, border, text }) => {
                      const count = severityData.find(d => d.name.toLowerCase().includes(label.toLowerCase()))?.value || 0;
                      return (
                        <div key={label} className={`${bg} ${border} border rounded-xl p-3 text-center`}>
                          <p className={`text-2xl font-black ${text}`}>{count}</p>
                          <p className={`text-xs font-bold ${text} uppercase tracking-wider`}>{label}</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Score {range}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="h-[250px] w-full">
                   {severityData.length > 0 && severityData[0].name === "No Data" ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <TrendingUp className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-sm font-semibold">Not enough tracking data from patients yet.</p>
                        <p className="text-xs mt-1">Patients need to complete at least one SCORAD assessment.</p>
                      </div>
                   ) : (
                      <ResponsiveContainer width="99%" height={250}>
                        <PieChart>
                          <Pie
                            data={severityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                            label={({ name, value }) => `${value}`}
                          >
                            {severityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                             itemStyle={{ color: '#334155', fontWeight: 'bold' }}
                             formatter={(value, name) => [`${value} patient${value !== 1 ? 's' : ''}`, name]}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                   )}
                </div>
             </div>

          </div>

          {/* Right Column: Today's Schedule (1/3) */}
          <div className="lg:col-span-1 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col h-[650px]">
             <div className="bg-[#0D9488]/10 px-6 py-5 flex flex-col gap-3 border-b border-[#0D9488]/20 rounded-t-2xl">
                <div className="flex items-center justify-between">
                   <h3 className="font-bold text-[#0D9488] flex items-center gap-2"><Calendar className="h-5 w-5"/> Daily Schedule</h3>
                   <div className="relative">
                     <input 
                       type="date" 
                       value={scheduleDate}
                       onChange={(e) => setScheduleDate(e.target.value)}
                       className="text-[10px] font-bold uppercase tracking-widest bg-white border border-[#0D9488]/20 rounded-lg px-2 py-1 text-[#0D9488] cursor-pointer outline-none focus:ring-2 focus:ring-[#0D9488]/20"
                     />
                   </div>
                </div>
                <p className="text-xs font-semibold text-[#0D9488]/80">
                  {new Date(scheduleDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
             </div>
             
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {filteredSchedule.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2 mt-10">
                      <Calendar className="h-10 w-10 opacity-30" />
                      <p className="text-sm font-semibold">No appointments for this date.</p>
                   </div>
                ) : (
                   filteredSchedule.map((appt, idx) => (
                      <div key={idx} className="relative pl-6 pb-2 border-l-2 border-[#0D9488]/20 last:border-transparent">
                         <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#0D9488] ring-4 ring-white" />
                         <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl hover:border-[#0D9488]/30 transition group cursor-pointer" onClick={() => navigate(`/doctor/patient/${appt.patientId}`)}>
                            <div className="flex justify-between items-start mb-2">
                               <p className="text-xs font-black text-[#0D9488] bg-[#0D9488]/10 px-2 py-0.5 rounded uppercase tracking-wide">{appt.timeSlot || "Time TBD"}</p>
                            </div>
                            <p className="font-bold text-slate-800 text-sm">{appt.patientName || "Patient"}</p>
                            <div className="flex justify-between items-end mt-1">
                               <p className="text-xs font-semibold text-slate-500 line-clamp-1 flex-1 pr-2">{appt.reason}</p>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); navigate(`/doctor/patient/${appt.patientId}`); }}
                                 className="text-[10px] font-bold px-3 py-1 rounded-md uppercase tracking-wider bg-[#0D9488] text-white hover:bg-[#0D9488]/90 transition shadow-sm flex items-center gap-1 flex-shrink-0"
                               >
                                 View <ChevronRight className="h-3 w-3" />
                               </button>
                            </div>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>

        </div>
      </div>

      {/* High Risk Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setShowAlertsModal(false)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-rose-50 border-b border-rose-100 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-black text-rose-800 text-lg">High Risk Patients</h3>
                  <p className="text-xs font-semibold text-rose-500">SCORAD score above 50</p>
                </div>
              </div>
              <button onClick={() => setShowAlertsModal(false)} className="w-8 h-8 rounded-full bg-rose-100 hover:bg-rose-200 flex items-center justify-center text-rose-600 transition font-bold text-lg leading-none">&times;</button>
            </div>

            {/* Patient List */}
            <div className="p-4 max-h-[420px] overflow-y-auto space-y-3">
              {alerts.length === 0 ? (
                <div className="py-12 flex flex-col items-center text-slate-400">
                  <Activity className="h-10 w-10 mb-3 opacity-40" />
                  <p className="font-semibold text-sm">No high-risk patients at this time.</p>
                </div>
              ) : (
                alerts.map((alert, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 hover:border-rose-200 rounded-2xl p-4 transition group">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-rose-600 font-black text-base">{(alert.name || "?")[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{alert.name}</p>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5">Reported on {alert.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* SCORAD Badge */}
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SCORAD</p>
                        <p className="text-2xl font-black text-rose-600 leading-tight">{alert.score}</p>
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">Severe</span>
                      </div>
                      {/* View Button */}
                      <button
                        onClick={() => { setShowAlertsModal(false); navigate(`/doctor/patient/${alert.patientId}`); }}
                        className="ml-2 flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition shadow-sm"
                      >
                        View <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DoctorLayout>
  );
};

export default DoctorDashboard;
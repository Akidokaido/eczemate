import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DoctorLayout from "../../components/DoctorLayout";
import { auth, firestore, onAuthStateChanged, collection, query, where, getDocs } from "../../firebase/config";
import { getUserCollectionRef } from "../../firebase/userPaths";
import { Calendar, Users, Settings, AlertCircle, Clock, ChevronRight, Activity, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from "recharts";

const COLORS = ['#0D9488', '#F97316', '#ef4444']; // Deep Teal, Warm Coral, Red

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalAppts: 0, pendingAppts: 0, patients: 0 });
  const [allAppointments, setAllAppointments] = useState([]); // Store all for easy filtering
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);
  const [severityData, setSeverityData] = useState([]);
  const [alerts, setAlerts] = useState([]);

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
                
                if (score > 50) {
                   severities.Severe++;
                   alertsTemp.push({ patientId: pat.id, name: pat.name || pat.email, score: Math.round(score), date: dKey });
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
      return apptDateStr === scheduleDate;
    })
    .sort((a, b) => {
      const timeA = a.timeSlot ? new Date(`1970/01/01 ${a.timeSlot}`).getTime() : 0;
      const timeB = b.timeSlot ? new Date(`1970/01/01 ${b.timeSlot}`).getTime() : 0;
      return timeA - timeB;
    });

  const cards = [
    { label: "Assigned Patients", value: stats.patients, sub: "Currently under your care", icon: Users, color: "#0D9488", path: "/doctor/patients" },
    { label: "Pending Approvals", value: stats.pendingAppts, sub: "Appointments to review", icon: Clock, color: "#F97316", path: "/doctor/appointments" },
    { label: "High Risk Alerts", value: alerts.length, sub: "Patients requiring attention", icon: AlertCircle, color: "#ef4444", path: "/doctor/patients" },
    { label: "Settings", value: null, sub: "Account & prefs", icon: Settings, color: "#64748B", path: "/doctor/settings" },
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map(({ label, value, sub, icon: Icon, color, path }, i) => (
            <div key={label} onClick={() => navigate(path)} className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group">
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
          
          {/* Left Column: Charts and Alerts (2/3) */}
          <div className="lg:col-span-2 space-y-6">
             
             {/* Clinical Alerts Panel */}
             <div className="bg-white border border-rose-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-rose-50 px-6 py-4 flex items-center justify-between border-b border-rose-100">
                   <h3 className="font-bold text-rose-800 flex items-center gap-2"><AlertCircle className="h-5 w-5"/> High Priority SCORAD Alerts</h3>
                   <span className="bg-rose-200 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">{alerts.length} Active</span>
                </div>
                <div className="p-2 flex-1">
                   {alerts.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 flex flex-col items-center">
                         <Activity className="h-8 w-8 mb-2 opacity-50" />
                         <p className="text-sm font-semibold">No severe cases reported recently.</p>
                      </div>
                   ) : (
                      <div className="max-h-[250px] overflow-y-auto pr-2 custom-scrollbar p-4 space-y-3">
                         {alerts.map((alert, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:border-rose-200 transition">
                               <div>
                                  <p className="font-bold text-slate-800">{alert.name}</p>
                                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Reported on {alert.date}</p>
                               </div>
                               <div className="flex items-center gap-4">
                                  <div className="text-right">
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">SCORAD</p>
                                     <p className="text-xl font-black text-rose-600">{alert.score}</p>
                                  </div>
                                  <button onClick={() => navigate(`/doctor/patient/${alert.patientId}`)} className="bg-rose-50 text-rose-600 p-2 rounded-lg hover:bg-rose-100 transition">
                                     <ChevronRight size={20} />
                                  </button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </div>
             </div>

             {/* Demographics Chart */}
             <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><TrendingUp className="text-emerald-500 h-5 w-5"/> Patient SCORAD Distribution</h3>
                </div>
                <div className="h-[250px] w-full">
                   {severityData.length > 0 && severityData[0].name === "No Data" ? (
                      <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold">Not enough tracking data from patients yet.</div>
                   ) : (
                      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
                          >
                            {severityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                             itemStyle={{ color: '#334155', fontWeight: 'bold' }}
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
                               <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${appt.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : appt.status === 'completed' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
                                  {appt.status}
                               </span>
                            </div>
                            <p className="font-bold text-slate-800 text-sm">{appt.patientName || "Patient"}</p>
                            <p className="text-xs font-semibold text-slate-500 mt-1 line-clamp-1">{appt.reason}</p>
                         </div>
                      </div>
                   ))
                )}
             </div>
          </div>

        </div>
      </div>
    </DoctorLayout>
  );
};

export default DoctorDashboard;
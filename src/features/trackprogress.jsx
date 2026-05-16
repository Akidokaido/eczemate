import { useState, useEffect } from "react";
import { Hand, Droplet, Moon, Activity, Flame, Apple, Pill, Plus, X, CheckCircle, Edit3, ChevronDown, HelpCircle, Sparkles, MessageSquare, Calendar, AlertTriangle, Heart, Shield, Sun, User, Clock, ChevronRight, Zap } from "lucide-react";
import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import BodyMap from "../components/shared/BodyMap";

const SCORAD_AREA_MAP = {
  head: 4.5, neck: 4.5, chest: 9, abs: 4.5, obliques: 4.5,
  "upper-back": 6, trapezius: 3, "lower-back": 9,
  deltoids: 4, biceps: 3, triceps: 3, forearm: 4, hands: 4,
  gluteal: 9, quadriceps: 8, hamstring: 8, calves: 6, tibialis: 4, feet: 4,
};

const calculateSCORADArea = (selectedParts) => {
  let area = 0;
  selectedParts.forEach(part => {
    area += (SCORAD_AREA_MAP[part] || 0);
  });
  return Math.min(area, 100);
};

const Chip = ({ label, active, removable, onClick, onRemove, disabled }) => (
  <div
    onClick={disabled ? undefined : onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
      disabled ? "cursor-default opacity-70" : "cursor-pointer"
    } ${
      active
        ? "bg-[#0D9488]/10 border-[#0D9488] text-[#0D9488]"
        : "bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200"
    }`}
  >
    {label}
    {removable && !disabled && (
      <X
        size={14}
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="hover:text-red-500"
      />
    )}
  </div>
);

const SliderRow = ({ label, value, setValue, max = 3, disabled }) => {
  const ratio = max > 0 ? value / max : 0;
  
  const accentColor = ratio > 0.66 ? "accent-red-500" : ratio > 0.33 ? "accent-orange-500" : "accent-emerald-500";
  const textColor = ratio > 0.66 ? "text-red-600" : ratio > 0.33 ? "text-orange-600" : "text-emerald-600";
  const bgColor = ratio > 0.66 ? "bg-red-50" : ratio > 0.33 ? "bg-orange-50" : "bg-emerald-50";

  return (
    <div className="space-y-1 mb-4">
      <div className="flex justify-between text-sm text-slate-600 font-medium group relative">
        <span className="flex items-center gap-1 cursor-help" title={`Rate intensity from 0 (None) to ${max} (Severe)`}>
          {label}
        </span>
        <span className={`${bgColor} px-2 py-0.5 rounded ${textColor} font-bold transition-colors`}>
          {value} / {max}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className={`w-full ${accentColor} transition-colors duration-300`}
        disabled={disabled}
      />
      <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mt-1">
        <span>None</span>
        <span>Severe</span>
      </div>
    </div>
  );
};

const CollapsibleSection = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-sm overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3 text-xl font-bold text-slate-800">
          {icon}
          {title}
        </div>
        <div className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown size={24} />
        </div>
      </button>
      
      <div 
        className={`transition-all duration-300 ease-in-out origin-top ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        } overflow-hidden`}
      >
        <div className="p-5 pt-0 border-t border-slate-100">
          {children}
        </div>
      </div>
    </div>
  );
};

const getRecommendations = (score, skin, itch, sleep, triggers, foods, medications) => {
  const recs = [];
  const urgent = [];

  if (score > 50) {
    urgent.push("Book an appointment with your dermatologist as soon as possible.");
    urgent.push("Consider visiting urgent care if symptoms are worsening rapidly.");
    if (medications.length === 0) urgent.push("You have no medications logged — consult your doctor about a treatment plan.");
  } else if (score >= 26) {
    urgent.push("Schedule a follow-up appointment to review your treatment plan.");
    if (medications.filter(m => m.status === 'ongoing').length === 0) urgent.push("No active medications logged — discuss options with your doctor.");
  }

  if (skin.dryness >= 2) recs.push("Apply a thick emollient moisturizer at least 2–3 times today, especially after bathing.");
  if (skin.redness >= 2) recs.push("Use a cold compress on inflamed areas for 10–15 minutes to reduce redness.");
  if (skin.oozing >= 2) recs.push("Keep oozing areas clean and dry. Apply antiseptic cream and cover with a sterile dressing.");
  if (skin.scratch >= 2) recs.push("Trim your nails short and consider wearing cotton gloves at night to prevent scratching.");
  if (skin.lichenification >= 2) recs.push("Discuss prescription-strength treatment for thickened skin areas with your doctor.");
  if (itch >= 7) recs.push("Take a lukewarm oatmeal bath to soothe severe itching. Avoid hot water.");
  if (itch >= 5) recs.push("Consider an antihistamine before bedtime to manage itching.");
  if (sleep >= 6) recs.push("Use breathable cotton bedsheets and keep your bedroom cool (18–20°C) for better sleep.");
  if (triggers.includes("Heat") || triggers.includes("Sweat")) recs.push("Stay in cool environments and wear loose, breathable clothing today.");
  if (triggers.includes("Stress")) recs.push("Practice relaxation techniques — try 10 minutes of deep breathing or meditation.");
  if (triggers.includes("Dust")) recs.push("Vacuum your living space and use hypoallergenic pillow covers.");
  if (foods.length > 0) recs.push(`Monitor your reaction to today's dietary triggers: ${foods.join(", ")}.`);
  if (recs.length === 0) recs.push("Keep up your current skincare routine — your symptoms are well managed!");

  return { urgent, recs };
};

const getAiInsight = (score, skin, itch, sleep) => {
  if (score > 50) return "Your SCORAD score indicates severe eczema. This level of severity typically requires medical intervention. Your symptoms suggest active inflammation that may benefit from prescription-strength topical corticosteroids or immunomodulators. Please prioritize seeing your dermatologist.";
  if (score >= 40) return "Your eczema is in the moderate-to-severe range. The combination of your clinical signs suggests ongoing inflammation. Focus on consistent moisturizing, trigger avoidance, and consider discussing a step-up in your treatment plan with your doctor.";
  if (score >= 26) return "Your SCORAD indicates moderate eczema. While manageable, your symptoms would benefit from a structured care routine. Pay attention to your identified triggers and maintain regular moisturizing to prevent flare-ups.";
  if (score >= 10) return "Your eczema is mild but still present. Continue your current management and pay attention to patterns — tracking your triggers and diet will help you identify what causes flare-ups over time.";
  return "Great news! Your SCORAD score is very low, indicating minimal eczema activity. Keep up your current skincare routine and continue monitoring for any changes.";
};


const InsightCard = ({ scoradScore, onClose, setActiveTab }) => {
  let classification = "";
  let description = "";
  let buttonText = "";
  let buttonAction = () => {};

  const isSevereOrModerate = scoradScore >= 26;

  if (scoradScore > 50) {
    classification = "Severe";
    description = "Your SCORAD indicates severe eczema. We strongly recommend seeking medical attention and booking an appointment with your dermatologist.";
  } else if (scoradScore >= 26) {
    classification = "Moderate";
    description = "Your SCORAD indicates moderate eczema. We recommend consulting your dermatologist to review your treatment plan.";
  } else {
    classification = "Mild";
    description = "Your SCORAD indicates mild eczema. Keep up your current management routine!";
  }

  if (isSevereOrModerate) {
    buttonText = "Seek Help — Book Appointment";
    buttonAction = () => { setActiveTab("appointment"); onClose(); };
  } else {
    buttonText = "Ask AI";
    buttonAction = () => { setActiveTab("ai-chat"); onClose(); };
  }

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold mb-2 text-[#1C1917]">SCORAD Result</h2>
        <div className={`text-6xl font-black my-4 ${scoradScore > 50 ? 'text-red-500' : scoradScore >= 26 ? 'text-[#F97316]' : 'text-[#0D9488]'}`}>{Math.round(scoradScore)}</div>
        <div className="text-xl font-bold text-[#1C1917]">{classification}</div>
        <p className="text-sm text-[#64748B] mt-4 leading-relaxed">{description}</p>
        <div className="flex flex-col gap-3 mt-8">
          <button onClick={buttonAction} className={`text-white font-semibold px-4 py-3 rounded-xl transition duration-200 w-full shadow-sm ${isSevereOrModerate ? 'bg-[#F97316] hover:bg-[#ea580c]' : 'bg-[#0D9488] hover:bg-[#0f766e]'}`}>
            {buttonText}
          </button>
          <button onClick={onClose} className="bg-slate-100 text-[#64748B] font-semibold px-4 py-3 rounded-xl hover:bg-slate-200 transition duration-200 w-full">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function TrackProgress({ setActiveSection }) {
  const [skin, setSkin] = useState({ redness: 0, swelling: 0, oozing: 0, scratch: 0, lichenification: 0, dryness: 0 });
  const [itch, setItch] = useState(0);
  const [sleep, setSleep] = useState(0);
  const [affectedAreas, setAffectedAreas] = useState([]);
  const [showBSAInfo, setShowBSAInfo] = useState(false);
  const [showSCORADInfo, setShowSCORADInfo] = useState(false);

  const defaultTriggers = ["Heat", "Sweat", "Dust", "Stress"];
  const defaultFoods = ["Seafood", "Eggs", "Dairy", "Peanuts"];

  const [activeTriggers, setActiveTriggers] = useState([]);
  const [activeFoods, setActiveFoods] = useState([]);
  const [customTriggers, setCustomTriggers] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [newFood, setNewFood] = useState("");

  const [medications, setMedications] = useState([]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [newMedStatus, setNewMedStatus] = useState("ongoing");

  const [showInsight, setShowInsight] = useState(false);
  const [scoradScore, setScoradScore] = useState(0);

  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [existingDocId, setExistingDocId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  const toggle = (item, list, setList) => setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  const addCustom = (value, list, setList, reset) => {
    if (!value.trim()) return;
    if (!list.includes(value)) setList([...list, value]);
    reset("");
  };

  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    setMedications([...medications, {
      id: Date.now().toString(),
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      frequency: newMedFreq.trim(),
      status: newMedStatus
    }]);
    setNewMedName(""); setNewMedDosage(""); setNewMedFreq(""); setNewMedStatus("ongoing");
  };

  const removeMedication = (id) => {
    setMedications(medications.filter(m => m.id !== id));
  };

  const populateFromDoc = (data) => {
    setSkin(data.skinCondition || { redness: 0, swelling: 0, oozing: 0, scratch: 0, lichenification: 0, dryness: 0 });
    setItch(data.itch ?? 0);
    setSleep(data.sleep ?? 0);
    setAffectedAreas(data.affectedAreas || []);

    const envTriggers = data.triggers?.environmental || [];
    const foodTriggers = data.triggers?.food || [];
    setActiveTriggers(envTriggers.filter(t => defaultTriggers.includes(t)));
    setCustomTriggers(envTriggers.filter(t => !defaultTriggers.includes(t)));
    setActiveFoods(foodTriggers.filter(f => defaultFoods.includes(f)));
    setCustomFoods(foodTriggers.filter(f => !defaultFoods.includes(f)));

    if (Array.isArray(data.medications)) {
      setMedications(data.medications.map(m => typeof m === 'string' ? { id: Math.random().toString(), name: m, dosage: "", frequency: "", status: "ongoing" } : m));
    }
    setScoradScore(data.scoradScore ?? data.finalPercentage ?? 0);
  };

  useEffect(() => {
    const checkExisting = async () => {
      const user = getAuth().currentUser;
      if (!user) { setCheckingSubmission(false); return; }
      try {
        const q = query(collection(db, "users", "patients", "accounts", user.uid, "trackProgress"), where("dateKey", "==", todayKey()));
        const snap = await getDocs(q);
        if (!snap.empty) {
          setExistingDocId(snap.docs[0].id);
          populateFromDoc(snap.docs[0].data());
          setHasSubmittedToday(true);
        }
      } catch (err) { console.error(err); } finally { setCheckingSubmission(false); }
    };
    checkExisting();
  }, []);

  const handleSubmit = async () => {
    const user = getAuth().currentUser;
    if (!user) return alert("You need to be logged in.");

    const A = calculateSCORADArea(affectedAreas);
    const B = skin.redness + skin.swelling + skin.oozing + skin.scratch + skin.lichenification + skin.dryness;
    const C = itch + sleep;
    const calculatedScorad = (A / 5) + (7 * B / 2) + C;

    const payload = {
      skinCondition: skin,
      itch,
      sleep,
      affectedAreas,
      scoradScore: calculatedScorad,
      percentage: calculatedScorad, 
      triggers: {
        environmental: [...activeTriggers, ...customTriggers],
        food: [...activeFoods, ...customFoods],
      },
      medications,
      timestamp: new Date(),
      dateKey: todayKey(),
    };

    try {
      if (existingDocId) {
        await updateDoc(doc(db, "users", "patients", "accounts", user.uid, "trackProgress", existingDocId), payload);
      } else {
        const docRef = await addDoc(collection(db, "users", "patients", "accounts", user.uid, "trackProgress"), payload);
        setExistingDocId(docRef.id);
      }
      setScoradScore(calculatedScorad);
      setHasSubmittedToday(true);
      setIsEditing(false);
      setShowInsight(true);
    } catch (error) {
      alert(`Error saving your progress: ${error.message}`);
    }
  };

  if (checkingSubmission) return <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center animate-pulse text-slate-500">Checking today's entry…</div>;

  /* ───────── SUBMITTED READ-ONLY VIEW ───────── */
  if (hasSubmittedToday && !isEditing) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] p-4 lg:p-8 text-slate-800 flex justify-center font-sans">
        <div className="max-w-6xl w-full space-y-6 animate-fade-in-up mt-6">
          
          {/* HERO SECTION */}
          <div className={`rounded-2xl shadow-md p-8 lg:p-10 text-white relative overflow-hidden flex flex-col lg:flex-row items-center justify-between transition-colors duration-500 ${
            scoradScore > 50 ? 'bg-gradient-to-br from-red-600 to-rose-500' :
            scoradScore >= 26 ? 'bg-gradient-to-br from-orange-500 to-amber-500' :
            'bg-gradient-to-br from-teal-600 to-emerald-500'
          }`}>
             {/* Background glow */}
             <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 blur-3xl rounded-full pointer-events-none" />
             
             <div className="relative z-10 text-center lg:text-left flex flex-col items-center lg:items-start">
                <p className="text-white/80 font-medium mb-1.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Good morning, {getAuth().currentUser?.displayName?.split(' ')[0] || "Patient"}</h1>
                <p className="text-white/80 mt-3 text-sm sm:text-base max-w-md leading-relaxed">Your health log for today has been successfully recorded. You're doing great!</p>
                
                <button onClick={() => setIsEditing(true)} className="mt-8 bg-white/20 hover:bg-white/30 transition backdrop-blur-md px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm">
                   <Edit3 size={16} /> Edit Today's Log
                </button>
             </div>
             
             {/* SCORAD Gauge */}
             <div className="mt-10 lg:mt-0 flex items-center gap-6 relative z-10">
                <div className="relative flex items-center justify-center">
                   <svg className="w-36 h-36 sm:w-40 sm:h-40 transform -rotate-90">
                      <circle cx="80" cy="80" r="65" className="stroke-white/20" strokeWidth="10" fill="none" />
                      <circle cx="80" cy="80" r="65" className="stroke-white transition-all duration-1000 ease-out" strokeWidth="10" fill="none" strokeDasharray={408} strokeDashoffset={408 - (scoradScore / 103) * 408} strokeLinecap="round" />
                   </svg>
                   <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-4xl sm:text-5xl font-black">{Math.round(scoradScore)}</span>
                      <span className="text-[10px] text-white/80 font-bold uppercase tracking-widest mt-1">SCORAD</span>
                   </div>
                </div>
                <div className="flex flex-col gap-3">
                   <div className="bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/20 shadow-sm">
                      <span className="text-[10px] text-white/80 block mb-0.5 uppercase tracking-widest font-bold">Severity</span>
                      <span className="text-lg font-bold">{scoradScore > 50 ? "Severe" : scoradScore >= 26 ? "Moderate" : "Mild"}</span>
                   </div>
                   {scoradScore > 50 && (
                     <div className="bg-white text-red-600 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle size={14}/> Action Needed
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* AI INSIGHT CARD */}
          <div className="bg-white rounded-2xl p-5 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] transition duration-300">
             <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-teal-400 to-emerald-400" />
             <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0 text-teal-600 group-hover:scale-110 transition duration-300">
                   <Sparkles size={24} />
                </div>
                <div>
                   <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">AI Wellness Insight</h3>
                   <p className="text-slate-700 text-sm leading-relaxed font-medium">{getAiInsight(scoradScore, skin, itch, sleep)}</p>
                </div>
             </div>
              {scoradScore >= 26 ? (
                <button onClick={() => setActiveSection("appointment")} className="flex-shrink-0 bg-[#F97316] hover:bg-[#ea580c] text-white font-semibold px-6 py-2.5 rounded-full transition shadow-md shadow-orange-200/50 flex items-center gap-2 text-sm w-full md:w-auto justify-center">
                  Seek Help <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={() => setActiveSection("ai-chat")} className="flex-shrink-0 bg-[#0D9488] hover:bg-[#0f766e] text-white font-semibold px-6 py-2.5 rounded-full transition shadow-md shadow-teal-200/50 flex items-center gap-2 text-sm w-full md:w-auto justify-center">
                  Ask AI <ChevronRight size={16} />
                </button>
              )}
           </div>

          {/* QUICK STATS ROW */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {[
               { label: "Itch Level", val: `${itch}/10`, icon: Droplet, col: "text-sky-500", bg: "bg-sky-50" },
               { label: "Sleep Loss", val: `${sleep}/10`, icon: Moon, col: "text-indigo-500", bg: "bg-indigo-50" },
               { label: "Affected BSA", val: `${Math.round(calculateSCORADArea(affectedAreas))}%`, icon: Activity, col: "text-rose-500", bg: "bg-rose-50" },
               { label: "Days Streak", val: "3 Days", icon: Flame, col: "text-orange-500", bg: "bg-orange-50" }
             ].map((s, i) => (
               <div key={i} className="bg-white rounded-2xl p-5 shadow-[0_2px_4px_-1px_rgba(0,0,0,0.03)] border border-slate-100 hover:-translate-y-1 transition duration-300">
                  <div className="flex items-center gap-3 mb-3">
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.bg} ${s.col}`}><s.icon size={16}/></div>
                     <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">{s.label}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-800">{s.val}</div>
               </div>
             ))}
          </div>

          {/* 60/40 SPLIT CONTENT */}
          <div className="flex flex-col lg:flex-row gap-6">
             
             {/* LEFT COLUMN (60%) */}
             <div className="flex-[3] space-y-6">
                {/* Clinical Signs */}
                <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                   <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Hand size={18} className="text-teal-600" />
                        <h3 className="font-bold text-slate-800">Clinical Signs</h3>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensity</span>
                   </div>
                   <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      {[
                        { l: "Redness", v: skin.redness }, { l: "Swelling", v: skin.swelling },
                        { l: "Oozing/Crusts", v: skin.oozing }, { l: "Scratch Marks", v: skin.scratch },
                        { l: "Skin Thickening", v: skin.lichenification }, { l: "Dryness", v: skin.dryness },
                      ].map(({ l, v }) => (
                        <div key={l} className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-slate-700">{l}</span>
                            <span className="font-bold text-[11px] text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">{v}/3</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-1000 ease-out ${v === 0 ? 'w-0' : v === 1 ? 'w-1/3 bg-emerald-400' : v === 2 ? 'w-2/3 bg-amber-400' : 'w-full bg-red-400'}`}></div>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>

                {/* Triggers & Diet */}
                {([...activeTriggers, ...customTriggers, ...activeFoods, ...customFoods].length > 0) && (
                  <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                     <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                        <Zap size={18} className="text-orange-500" />
                        <h3 className="font-bold text-slate-800">Triggers & Diet</h3>
                     </div>
                     <div className="p-6 flex gap-2.5 overflow-x-auto custom-scrollbar pb-6">
                        {[...activeTriggers, ...customTriggers].map(t => (
                          <span key={t} className="whitespace-nowrap px-4 py-1.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-full border border-blue-100">{t}</span>
                        ))}
                        {[...activeFoods, ...customFoods].map(f => (
                          <span key={f} className="whitespace-nowrap px-4 py-1.5 bg-orange-50 text-orange-600 text-sm font-semibold rounded-full border border-orange-100">{f}</span>
                        ))}
                     </div>
                  </div>
                )}
                {/* Medications */}
                <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
                   <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
                      <Pill size={18} className="text-indigo-500" />
                      <h3 className="font-bold text-slate-800">Medications</h3>
                   </div>
                   <div className="p-4 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar">
                      {medications.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-6 font-medium">No medications logged today.</p>
                      ) : (
                        medications.map(m => (
                          <div key={m.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full shadow-sm ${m.status === 'ongoing' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-300'}`} />
                                <div>
                                   <p className="font-bold text-slate-800 text-sm">{m.name}</p>
                                   <p className="text-xs text-slate-500 font-medium mt-0.5">{m.dosage || "Daily"}</p>
                                </div>
                             </div>
                             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{m.frequency || "As needed"}</span>
                          </div>
                        ))
                      )}
                   </div>
                </div>
             </div>

             {/* RIGHT COLUMN (40%) */}
             <div className="flex-[2] space-y-6 flex flex-col">
                {/* Body Map */}
                <div className="bg-white rounded-2xl shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden flex flex-col flex-1 min-h-[380px]">
                   <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User size={18} className="text-slate-600" />
                        <h3 className="font-bold text-slate-800">Affected Areas</h3>
                      </div>
                      <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-md">{Math.round(calculateSCORADArea(affectedAreas))}% BSA</span>
                   </div>
                   <div className="flex-1 flex justify-center items-center p-4 bg-[#FAFAF9] relative">
                      <BodyMap selectedParts={affectedAreas} readOnly />
                   </div>
                </div>

              </div>
          </div>
        </div>
      </div>
    );
  }

  /* ───────── EDITABLE FORM VIEW ───────── */
  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 flex items-center justify-center">
      <div className="max-w-7xl w-full space-y-6 animate-fade-in-up">
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{isEditing ? "Edit SCORAD Evaluation" : "Daily SCORAD Evaluation"}</h1>
            <p className="text-sm text-slate-500 mt-1">Fill out the sections below to track your symptoms today.</p>
          </div>
          {isEditing && (
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 px-4 py-2 rounded-xl transition">
              <X size={16} /> Cancel
            </button>
          )}
        </div>

        <CollapsibleSection title="1. Intensity (Clinical Signs)" icon={<Hand className="text-sky-500" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
            <SliderRow label="Redness (Erythema)" value={skin.redness} max={3} setValue={(v) => setSkin({ ...skin, redness: v })} />
            <SliderRow label="Swelling / Papulation" value={skin.swelling} max={3} setValue={(v) => setSkin({ ...skin, swelling: v })} />
            <SliderRow label="Oozing / Crusts" value={skin.oozing} max={3} setValue={(v) => setSkin({ ...skin, oozing: v })} />
            <SliderRow label="Scratch Marks" value={skin.scratch} max={3} setValue={(v) => setSkin({ ...skin, scratch: v })} />
            <SliderRow label="Skin Thickening" value={skin.lichenification} max={3} setValue={(v) => setSkin({ ...skin, lichenification: v })} />
            <SliderRow label="Dryness (non-inflamed area)" value={skin.dryness} max={3} setValue={(v) => setSkin({ ...skin, dryness: v })} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="2. Subjective Symptoms" icon={<Moon className="text-sky-500" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
            <SliderRow label="Itchiness" value={itch} max={10} setValue={setItch} />
            <SliderRow label="Sleep Loss" value={sleep} max={10} setValue={setSleep} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="3. Extent (Affected Areas)" icon={<Activity className="text-sky-500" />}>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex justify-center shadow-inner mt-4">
            <BodyMap selectedParts={affectedAreas} onTogglePart={(part) => setAffectedAreas(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part])} />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="4. Triggers" icon={<Flame className="text-orange-500" />} defaultOpen={false}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {[ 
              { title: "Environmental", icon: <Flame size={16}/>, items: defaultTriggers, active: activeTriggers, setActive: setActiveTriggers, custom: customTriggers, setCustom: setCustomTriggers, input: newTrigger, setInput: setNewTrigger, color: "orange" },
              { title: "Dietary", icon: <Apple size={16}/>, items: defaultFoods, active: activeFoods, setActive: setActiveFoods, custom: customFoods, setCustom: setCustomFoods, input: newFood, setInput: setNewFood, color: "emerald" }
            ].map((section) => (
              <div key={section.title} className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className={`bg-${section.color}-50 text-${section.color}-600 px-5 py-3 font-bold flex items-center gap-2 border-b border-${section.color}-100 rounded-t-2xl`}>{section.icon} {section.title}</div>
                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {section.items.map((i) => <Chip key={i} label={i} active={section.active.includes(i)} onClick={() => toggle(i, section.active, section.setActive)} />)}
                    {section.custom.map((i) => <Chip key={i} label={i} active={section.active.includes(i)} removable onClick={() => toggle(i, section.active, section.setActive)} onRemove={() => section.setCustom(section.custom.filter(x => x !== i))} />)}
                  </div>
                  <div className="flex gap-2">
                    <input value={section.input} onChange={(e) => section.setInput(e.target.value)} placeholder="Add custom trigger..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100" />
                    <button onClick={() => addCustom(section.input, section.custom, section.setCustom, section.setInput)} className="bg-slate-800 text-white px-4 rounded-xl hover:bg-slate-700 transition"><Plus size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="5. Medications" icon={<Pill className="text-indigo-500" />} defaultOpen={false}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-4">
            {medications.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {medications.map(med => (
                  <div key={med.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative group">
                    <button onClick={() => removeMedication(med.id)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={16}/></button>
                    <p className="font-bold text-slate-800">{med.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{med.dosage || "No dosage"} • {med.frequency || "No frequency"}</p>
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-1 rounded-md uppercase ${med.status === 'ongoing' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>{med.status}</span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Add Medication</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <input value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="Medication Name (e.g., Protopic)" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                <input value={newMedDosage} onChange={(e) => setNewMedDosage(e.target.value)} placeholder="Dosage (e.g., 0.1%)" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                <input value={newMedFreq} onChange={(e) => setNewMedFreq(e.target.value)} placeholder="Frequency (e.g., Twice daily)" className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm" />
                <select value={newMedStatus} onChange={(e) => setNewMedStatus(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none">
                  <option value="ongoing">Ongoing</option>
                  <option value="stopped">Stopped</option>
                </select>
              </div>
              <button onClick={handleAddMedication} className="w-full bg-indigo-50 text-indigo-600 font-bold py-2.5 rounded-xl hover:bg-indigo-100 transition border border-indigo-100 flex items-center justify-center gap-2"><Plus size={16}/> Add Medication</button>
            </div>
          </div>
        </CollapsibleSection>

        <div className="pt-2 flex justify-end gap-4">
          <button onClick={handleSubmit} className="bg-sky-500 hover:bg-sky-600 text-white px-10 py-3.5 rounded-2xl font-bold shadow-md shadow-sky-200 transition-all flex items-center gap-2">
            <CheckCircle size={20} /> {isEditing ? "Update SCORAD Log" : "Submit SCORAD Log"}
          </button>
        </div>

      </div>
    </div>
  );
}
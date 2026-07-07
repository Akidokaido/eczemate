// TrackProgress - main component for the daily PO-SCORAD evaluation
// Manages all state, data fetching, photo uploads, and form submission
// Uses sub-components: ReadOnlyView, InsightCard, TrackFormComponents, scoradUtils
import { useState, useEffect } from "react";
import { Hand, Moon, Activity, Flame, Apple, Pill, Plus, X, CheckCircle } from "lucide-react";
import { db } from "../../firebase/config";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import BodyMap from "../../components/shared/BodyMap";

// Import sub-components
import { calculateSCORADArea, todayKey } from "./scoradUtils";
import { Chip, SliderRow, CollapsibleSection } from "./TrackFormComponents";
import InsightCard from "./InsightCard";
import ReadOnlyView from "./ReadOnlyView";

export default function TrackProgress({ setActiveSection }) {
  // Skin condition sliders (0-3 each)
  const [skin, setSkin] = useState({ redness: 0, swelling: 0, oozing: 0, scratch: 0, lichenification: 0, dryness: 0 });
  const [itch, setItch] = useState(0);      // Itch level (0-10)
  const [sleep, setSleep] = useState(0);     // Sleep loss (0-10)
  const [affectedAreas, setAffectedAreas] = useState([]); // Selected body parts
  const [photos, setPhotos] = useState({});              // Photo URLs by body part
  const [filesToUpload, setFilesToUpload] = useState({}); // Pending file uploads
  const [showBSAInfo, setShowBSAInfo] = useState(false);
  const [showSCORADInfo, setShowSCORADInfo] = useState(false);

  // Default trigger/food options
  const defaultTriggers = ["Heat", "Sweat", "Dust", "Stress"];
  const defaultFoods = ["Seafood", "Eggs", "Dairy", "Peanuts"];

  // Active selections and custom additions
  const [activeTriggers, setActiveTriggers] = useState([]);
  const [activeFoods, setActiveFoods] = useState([]);
  const [customTriggers, setCustomTriggers] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [newFood, setNewFood] = useState("");

  // Medications state
  const [savedMedications, setSavedMedications] = useState([]);
  const [medications, setMedications] = useState([]);
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFreq, setNewMedFreq] = useState("");
  const [newMedStatus, setNewMedStatus] = useState("ongoing");

  // Handle photo upload from BodyMap - store preview URL and file for later upload
  const handlePhotoUpload = (partId, file, url) => {
    setPhotos(prev => ({ ...prev, [partId]: url }));
    if (file) setFilesToUpload(prev => ({ ...prev, [partId]: file }));
  };

  // SCORAD score and submission state
  const [showInsight, setShowInsight] = useState(false);
  const [scoradScore, setScoradScore] = useState(0);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [existingDocId, setExistingDocId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  // Toggle an item in a list (add/remove)
  const toggle = (item, list, setList) => setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);

  // Save custom triggers/foods/meds to Firestore user profile
  const updateSavedToFirestore = async (field, newArray) => {
    const user = getAuth().currentUser;
    if (user) {
      await updateDoc(doc(db, "users", "patients", "accounts", user.uid), {
        [field]: newArray
      }).catch(err => console.error("Error saving:", err));
    }
  };

  // Add a custom trigger or food to the list and save to Firestore
  const addCustom = (val, list, setList, setInput, field) => {
    if (val.trim() && !list.includes(val) && !defaultTriggers.includes(val) && !defaultFoods.includes(val)) {
      const newList = [...list, val.trim()];
      setList(newList);
      setInput("");
      updateSavedToFirestore(field, newList);
    }
  };

  // Remove a custom trigger or food
  const removeCustom = (val, list, setList, field) => {
    const newList = list.filter(x => x !== val);
    setList(newList);
    updateSavedToFirestore(field, newList);
  };

  // Add a new medication to saved list
  const handleAddMedication = () => {
    if (!newMedName.trim()) return;
    const newMed = {
      id: Date.now().toString(),
      name: newMedName.trim(),
      dosage: newMedDosage.trim(),
      frequency: newMedFreq.trim(),
      status: newMedStatus
    };
    const newList = [...savedMedications, newMed];
    setSavedMedications(newList);
    setMedications([...medications, newMed]);
    setNewMedName("");
    setNewMedDosage("");
    setNewMedFreq("");
    setNewMedStatus("ongoing");
    updateSavedToFirestore("savedMedications", newList);
  };

  // Delete a medication from saved list
  const removeSavedMedication = (id) => {
    const newList = savedMedications.filter(m => m.id !== id);
    setSavedMedications(newList);
    setMedications(medications.filter(m => m.id !== id));
    updateSavedToFirestore("savedMedications", newList);
  };

  // Toggle a medication as active/inactive for today
  const toggleMedicationActive = (med) => {
    if (medications.some(m => m.id === med.id)) {
      setMedications(medications.filter(m => m.id !== med.id));
    } else {
      setMedications([...medications, med]);
    }
  };

  // Populate form state from a Firestore document (used when loading existing entry)
  const populateFromDoc = (data) => {
    setSkin(data.skinCondition || { redness: 0, swelling: 0, oozing: 0, scratch: 0, lichenification: 0, dryness: 0 });
    setItch(data.itch ?? 0);
    setSleep(data.sleep ?? 0);
    setAffectedAreas(data.affectedAreas || []);
    setPhotos(data.photos || {});

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

  // Check if today's entry already exists on mount
  useEffect(() => {
    const checkExisting = async () => {
      const user = getAuth().currentUser;
      if (!user) { setCheckingSubmission(false); return; }
      try {
        // Load saved custom triggers/foods/meds from user profile
        const userDoc = await getDoc(doc(db, "users", "patients", "accounts", user.uid));
        if (userDoc.exists()) {
          const ud = userDoc.data();
          if (ud.savedEnvTriggers) setCustomTriggers(ud.savedEnvTriggers);
          if (ud.savedFoodTriggers) setCustomFoods(ud.savedFoodTriggers);
          if (ud.savedMedications) setSavedMedications(ud.savedMedications);
        }

        // Check if there's already a trackProgress entry for today
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

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submit the form - uploads photos to Cloudinary then saves everything to Firestore
  const handleSubmit = async () => {
    const user = getAuth().currentUser;
    if (!user) return alert("You need to be logged in.");

    setIsSubmitting(true);
    let finalPhotos = { ...photos };

    // Upload photo files to Cloudinary
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      
      const uploadPromises = Object.entries(filesToUpload).map(async ([partId, file]) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData
        });
        
        if (!response.ok) {
          throw new Error("Failed to upload image to Cloudinary");
        }
        
        const data = await response.json();
        finalPhotos[partId] = data.secure_url; // Replace temp URL with permanent one
      });
      
      if (uploadPromises.length > 0) {
        await Promise.all(uploadPromises);
      }
    } catch (err) {
      alert(`Error uploading photos: ${err.message}`);
      setIsSubmitting(false);
      return;
    }

    // Calculate PO-SCORAD score: A/5 + 7B/2 + C
    const A = calculateSCORADArea(affectedAreas);
    const B = skin.redness + skin.swelling + skin.oozing + skin.scratch + skin.lichenification + skin.dryness;
    const C = itch + sleep;
    const calculatedScorad = (A / 5) + (7 * B / 2) + C;

    // Build the data payload
    const payload = {
      skinCondition: skin,
      itch,
      sleep,
      affectedAreas,
      scoradScore: calculatedScorad,
      percentage: calculatedScorad, 
      photos: finalPhotos,
      triggers: {
        environmental: [...activeTriggers, ...customTriggers],
        food: [...activeFoods, ...customFoods],
      },
      medications,
      timestamp: new Date(),
      dateKey: todayKey(),
    };

    // Save to Firestore (update if exists, create if new)
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
      setPhotos(finalPhotos);
      setFilesToUpload({});
    } catch (error) {
      alert(`Error saving your progress: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state while checking if today's entry exists
  if (checkingSubmission) return <div className="min-h-screen bg-[#FDFBF7] p-6 flex items-center justify-center animate-pulse text-slate-500">Checking today's entry…</div>;

  // Show the insight popup after submission
  {showInsight && <InsightCard scoradScore={scoradScore} onClose={() => setShowInsight(false)} setActiveTab={setActiveSection} />}

  // SUBMITTED VIEW - show read-only dashboard
  if (hasSubmittedToday && !isEditing) {
    return (
      <>
        {showInsight && <InsightCard scoradScore={scoradScore} onClose={() => setShowInsight(false)} setActiveTab={setActiveSection} />}
        <ReadOnlyView
          scoradScore={scoradScore} skin={skin} itch={itch} sleep={sleep}
          affectedAreas={affectedAreas} photos={photos}
          activeTriggers={activeTriggers} customTriggers={customTriggers}
          activeFoods={activeFoods} customFoods={customFoods}
          medications={medications}
          setIsEditing={setIsEditing} setActiveSection={setActiveSection}
        />
      </>
    );
  }

  // EDIT FORM VIEW - form for filling in daily log
  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 text-slate-900 flex items-center justify-center">
      <div className="max-w-7xl w-full space-y-6 animate-fade-in-up">
        
        {/* Page header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{isEditing ? "Edit PO-SCORAD Evaluation" : "Daily PO-SCORAD Evaluation"}</h1>
            <p className="text-sm text-slate-500 mt-1">Fill out the sections below to track your symptoms today.</p>
          </div>
          {isEditing && (
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 bg-slate-100 px-4 py-2 rounded-xl transition">
              <X size={16} /> Cancel
            </button>
          )}
        </div>

        {/* Section 1: Clinical Signs (6 sliders) */}
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

        {/* Section 2: Itch and Sleep sliders */}
        <CollapsibleSection title="2. Subjective Symptoms" icon={<Moon className="text-sky-500" />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100 mt-4">
            <SliderRow label="Itchiness" value={itch} max={10} setValue={setItch} />
            <SliderRow label="Sleep Loss" value={sleep} max={10} setValue={setSleep} />
          </div>
        </CollapsibleSection>

        {/* Section 3: Body Map for selecting affected areas */}
        <CollapsibleSection title="3. Extent (Affected Areas)" icon={<Activity className="text-sky-500" />}>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 flex justify-center shadow-inner mt-4">
            <BodyMap selectedParts={affectedAreas} photos={photos} onPhotoUpload={handlePhotoUpload} onTogglePart={(part) => setAffectedAreas(prev => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part])} />
          </div>
        </CollapsibleSection>

        {/* Section 4: Triggers (environmental + dietary) */}
        <CollapsibleSection title="4. Triggers" icon={<Flame className="text-orange-500" />} defaultOpen={false}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {[ 
              { title: "Environmental", icon: <Flame size={16}/>, items: defaultTriggers, active: activeTriggers, setActive: setActiveTriggers, custom: customTriggers, setCustom: setCustomTriggers, input: newTrigger, setInput: setNewTrigger, color: "orange", field: "savedEnvTriggers" },
              { title: "Dietary", icon: <Apple size={16}/>, items: defaultFoods, active: activeFoods, setActive: setActiveFoods, custom: customFoods, setCustom: setCustomFoods, input: newFood, setInput: setNewFood, color: "emerald", field: "savedFoodTriggers" }
            ].map((section) => (
              <div key={section.title} className="bg-white border border-slate-200 rounded-2xl shadow-sm">
                <div className={`bg-${section.color}-50 text-${section.color}-600 px-5 py-3 font-bold flex items-center gap-2 border-b border-${section.color}-100 rounded-t-2xl`}>{section.icon} {section.title}</div>
                <div className="p-5 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {section.items.map((i) => <Chip key={i} label={i} active={section.active.includes(i)} onClick={() => toggle(i, section.active, section.setActive)} />)}
                    {section.custom.map((i) => <Chip key={i} label={i} active={section.active.includes(i)} removable onClick={() => toggle(i, section.active, section.setActive)} onRemove={() => removeCustom(i, section.custom, section.setCustom, section.field)} />)}
                  </div>
                  <div className="flex gap-2">
                    <input value={section.input} onChange={(e) => section.setInput(e.target.value)} placeholder="Add custom trigger..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-100" />
                    <button onClick={() => addCustom(section.input, section.custom, section.setCustom, section.setInput, section.field)} className="bg-slate-800 text-white px-4 rounded-xl hover:bg-slate-700 transition"><Plus size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Section 5: Medications */}
        <CollapsibleSection title="5. Medications" icon={<Pill className="text-indigo-500" />} defaultOpen={false}>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mt-4">
            <p className="text-sm text-slate-500 mb-4">Tap a medication to mark it as taken today. Click the X to permanently delete it from your saved list.</p>
            {/* Saved medications grid */}
            {savedMedications.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                {savedMedications.map(med => {
                  const isActive = medications.some(m => m.id === med.id);
                  return (
                    <div key={med.id} onClick={() => toggleMedicationActive(med)} className={`cursor-pointer border rounded-xl p-4 relative group transition-all ${isActive ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                      <button onClick={(e) => { e.stopPropagation(); removeSavedMedication(med.id); }} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><X size={16}/></button>
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-bold ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>{med.name}</p>
                        {isActive && <CheckCircle size={16} className="text-indigo-500" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{med.dosage || "No dosage"} • {med.frequency || "No frequency"}</p>
                      <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-1 rounded-md uppercase ${med.status === 'ongoing' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-600'}`}>{med.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Add medication form */}
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

        {/* Submit button */}
        <div className="pt-2 flex justify-end gap-4">
          <button onClick={handleSubmit} disabled={isSubmitting} className={`px-10 py-3.5 rounded-2xl font-bold shadow-md transition-all flex items-center gap-2 ${isSubmitting ? 'bg-slate-400 text-white cursor-not-allowed shadow-none' : 'bg-sky-500 hover:bg-sky-600 text-white shadow-sky-200'}`}>
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Saving & Uploading...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                {isEditing ? "Update PO-SCORAD Log" : "Submit PO-SCORAD Log"}
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}

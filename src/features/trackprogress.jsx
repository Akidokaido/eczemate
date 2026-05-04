import { useState, useEffect } from "react";
import { Hand, Droplet, Moon, Zap, Flame, Apple, Plus, X, CheckCircle, Edit3 } from "lucide-react";
import { db } from "../firebase/config";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const Chip = ({ label, active, removable, onClick, onRemove, disabled }) => (
  <div
    onClick={disabled ? undefined : onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm border transition-all duration-200 ${
      disabled ? "cursor-default opacity-70" : "cursor-pointer"
    } ${
      active
        ? "bg-sky-50 border-sky-500 text-sky-700"
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

const SliderRow = ({ label, value, setValue, max = 5, disabled }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm text-slate-600">
      <span>{label}</span>
      <span>{value}</span>
    </div>

    <input
      type="range"
      min="0"
      max={max}
      value={value}
      onChange={(e) => setValue(Number(e.target.value))}
      className="w-full accent-sky-500"
      disabled={disabled}
    />
    <div className="flex justify-between text-xs text-slate-400">
      <span>0</span>
      <span>{max}</span>
    </div>
  </div>
);

const InsightCard = ({ finalPercentage, onClose, setActiveTab }) => {
  let classification = "";
  let description = "";
  let buttonText = "";
  let buttonAction = () => {};

  if (finalPercentage >= 80) {
    classification = "Severe";
    description = "Your skin condition is severe. We recommend seeking medical attention as soon as possible.";
    buttonText = "Seek help";
    buttonAction = () => {
      setActiveTab("appointment");
      onClose();
    };
  } else if (finalPercentage >= 50) {
    classification = "Moderate";
    description = "Your skin condition is moderate. Consider following up with your healthcare provider.";
    buttonText = "Want to know more?";
    buttonAction = () => {
      setActiveTab("ai-chat");
      onClose();
    };
  } else {
    classification = "Good";
    description = "Your skin condition is doing great! Keep up the good work!";
    buttonText = "Want to know more?";
    buttonAction = () => {
      setActiveTab("ai-chat");
      onClose();
    };
  }

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full text-center">
        <h2 className="text-2xl font-semibold mb-4">Progress Insight</h2>
        <div className="text-4xl font-bold text-sky-500">{finalPercentage}%</div>
        <div className="text-xl font-medium mt-2">{classification}</div>
        <p className="text-sm text-slate-500 mt-4">{description}</p>

        <div className="flex justify-between gap-4 mt-6">
          <button
            onClick={buttonAction}
            className="bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition duration-200 w-full"
          >
            {buttonText}
          </button>

          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 w-full"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── helper: today as YYYY-MM-DD ─── */
const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function TrackProgress({ setActiveSection }) {
  const [skin, setSkin] = useState({ dryness: 0, redness: 0, oozing: 0, scratch: 0 });
  const [itch, setItch] = useState(1);
  const [sleep, setSleep] = useState(4);
  const [pain, setPain] = useState(0);

  const defaultTriggers = ["Heat", "Sweat", "Dust", "Stress"];
  const defaultFoods = ["Seafood", "Eggs", "Dairy", "Peanuts"];

  const [activeTriggers, setActiveTriggers] = useState([]);
  const [activeFoods, setActiveFoods] = useState([]);
  const [customTriggers, setCustomTriggers] = useState([]);
  const [customFoods, setCustomFoods] = useState([]);
  const [newTrigger, setNewTrigger] = useState("");
  const [newFood, setNewFood] = useState("");

  const [medications, setMedications] = useState([]);
  const [newMedication, setNewMedication] = useState("");

  const [showInsight, setShowInsight] = useState(false);
  const [finalPercentage, setFinalPercentage] = useState(0);

  /* ── submission-once state ── */
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [existingDocId, setExistingDocId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);

  const toggle = (item, list, setList) =>
    setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);

  const addCustom = (value, list, setList, reset) => {
    if (!value.trim()) return;
    if (!list.includes(value)) setList([...list, value]);
    reset("");
  };

  /* ── populate form from a saved doc ── */
  const populateFromDoc = (data) => {
    setSkin(data.skinCondition || { dryness: 0, redness: 0, oozing: 0, scratch: 0 });
    setItch(data.itch ?? 1);
    setSleep(data.sleep ?? 4);
    setPain(data.pain ?? 0);

    const envTriggers = data.triggers?.environmental || [];
    const foodTriggers = data.triggers?.food || [];
    setActiveTriggers(envTriggers.filter(t => defaultTriggers.includes(t)));
    setCustomTriggers(envTriggers.filter(t => !defaultTriggers.includes(t)));
    setActiveFoods(foodTriggers.filter(f => defaultFoods.includes(f)));
    setCustomFoods(foodTriggers.filter(f => !defaultFoods.includes(f)));

    setMedications(data.medications || []);
    setFinalPercentage(data.finalPercentage ?? 0);
  };

  /* ── check for today's existing submission on mount ── */
  useEffect(() => {
    const checkExisting = async () => {
      const user = getAuth().currentUser;
      if (!user) { setCheckingSubmission(false); return; }

      try {
        const today = todayKey();
        const colRef = collection(db, "users", "patients", "accounts", user.uid, "trackProgress");
        const q = query(colRef, where("dateKey", "==", today));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          setExistingDocId(docSnap.id);
          populateFromDoc(docSnap.data());
          setHasSubmittedToday(true);
        }
      } catch (err) {
        console.error("Error checking existing submission:", err);
      } finally {
        setCheckingSubmission(false);
      }
    };
    checkExisting();
  }, []);

  /* ── submit / update handler ── */
  const handleSubmit = async () => {
    const user = getAuth().currentUser;
    if (!user) { alert("You need to be logged in to submit your progress."); return; }

    const skinConditionScore = (skin.dryness + skin.redness + skin.oozing + skin.scratch) / 4;
    const skinPercentage = Math.round((skinConditionScore / 5) * 100);
    const itchPercentage = (itch / 5) * 100;
    const sleepPercentage = (sleep / 5) * 100;
    const painPercentage = (pain / 5) * 100;

    const calcPercentage = Math.round(
      (skinPercentage + itchPercentage + sleepPercentage + painPercentage) / 4
    );

    const payload = {
      skinCondition: { dryness: skin.dryness, redness: skin.redness, oozing: skin.oozing, scratch: skin.scratch },
      itch,
      sleep,
      pain,
      finalPercentage: calcPercentage,
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
        // update existing
        const docRef = doc(db, "users", "patients", "accounts", user.uid, "trackProgress", existingDocId);
        await updateDoc(docRef, payload);
      } else {
        // create new
        const docRef = await addDoc(
          collection(db, "users", "patients", "accounts", user.uid, "trackProgress"),
          payload
        );
        setExistingDocId(docRef.id);
      }

      setFinalPercentage(calcPercentage);
      setHasSubmittedToday(true);
      setIsEditing(false);
      setShowInsight(true);
    } catch (error) {
      console.error("Error saving progress:", error);
      alert(`Error saving your progress: ${error.message}`);
    }
  };

  /* ── loading state ── */
  if (checkingSubmission) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p className="text-slate-500 text-sm animate-pulse">Checking today's entry…</p>
      </div>
    );
  }

  const formDisabled = hasSubmittedToday && !isEditing;

  /* ───────── SUBMITTED READ-ONLY VIEW ───────── */
  if (hasSubmittedToday && !isEditing) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900 flex items-center justify-center">
        <div className="max-w-5xl w-full bg-white p-8 rounded-lg shadow-lg space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle size={22} className="text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Today's Progress Submitted</h1>
                <p className="text-sm text-slate-500">You have already recorded your symptoms for today.</p>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 bg-sky-500 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-sky-600 transition duration-200"
            >
              <Edit3 size={16} />
              Edit Submission
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {[
              { title: "Skin", icon: <Hand size={18} />, values: [
                { l: "Dryness", v: skin.dryness },
                { l: "Redness", v: skin.redness },
                { l: "Oozing / Scabs", v: skin.oozing },
                { l: "Scratch Marks", v: skin.scratch },
              ]},
              { title: "Itch", icon: <Droplet size={18} />, big: itch },
              { title: "Sleep", icon: <Moon size={18} />, big: sleep },
              { title: "Pain", icon: <Zap size={18} />, big: pain || "-" },
            ].map((card) => (
              <div key={card.title} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-sky-500 text-white px-4 py-2 flex items-center gap-2">
                  {card.icon} {card.title}
                </div>
                <div className="p-4 space-y-2 text-center">
                  {card.values ? card.values.map(({ l, v }) => (
                    <div key={l} className="flex justify-between text-sm text-slate-600">
                      <span>{l}</span><span className="font-medium">{v}/5</span>
                    </div>
                  )) : (
                    <div className="text-5xl font-bold text-slate-700">{card.big}</div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Triggers summary */}
          {([...activeTriggers, ...customTriggers].length > 0 || [...activeFoods, ...customFoods].length > 0) && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Triggers</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {[
                  { title: "Environmental", icon: <Flame size={18} />, items: [...activeTriggers, ...customTriggers] },
                  { title: "Food", icon: <Apple size={18} />, items: [...activeFoods, ...customFoods] },
                ].map((s) => s.items.length > 0 && (
                  <div key={s.title} className="bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="bg-sky-500 text-white px-4 py-2 flex items-center gap-2">{s.icon} {s.title}</div>
                    <div className="p-4 flex flex-wrap gap-2">
                      {s.items.map(i => <Chip key={i} label={i} active disabled />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Medications summary */}
          {medications.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-3">Medications</h2>
              <div className="flex flex-wrap gap-2">
                {medications.map(m => <Chip key={m} label={m} active disabled />)}
              </div>
            </div>
          )}

          {/* Score */}
          <div className="text-center pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">Overall Score</p>
            <p className="text-4xl font-bold text-sky-500">{finalPercentage}%</p>
          </div>
        </div>
      </div>
    );
  }

  /* ───────── EDITABLE FORM VIEW ───────── */
  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900 flex items-center justify-center">
      <div className="max-w-5xl w-full bg-white p-6 rounded-lg shadow-lg space-y-10">
        {/* Title */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">
            {isEditing ? "Edit Your Symptoms" : "Track Your Symptoms"}
          </h1>
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
            >
              <X size={16} /> Cancel Edit
            </button>
          )}
        </div>

        {/* Symptoms Sliders */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[
            { title: "Skin", icon: <Hand size={18} />, body: (
              <>
                <SliderRow label="Dryness" value={skin.dryness} setValue={(v) => setSkin({ ...skin, dryness: v })} />
                <SliderRow label="Redness" value={skin.redness} setValue={(v) => setSkin({ ...skin, redness: v })} />
                <SliderRow label="Oozing / Scabs" value={skin.oozing} setValue={(v) => setSkin({ ...skin, oozing: v })} />
                <SliderRow label="Scratch Marks" value={skin.scratch} setValue={(v) => setSkin({ ...skin, scratch: v })} />
              </>
            ) },
            { title: "Itch", icon: <Droplet size={18} />, body: (
              <>
                <div className="text-6xl font-bold">{itch}</div>
                <input type="range" min="0" max="5" value={itch} onChange={(e) => setItch(+e.target.value)} className="w-full accent-sky-500" />
              </>
            ) },
            { title: "Sleep", icon: <Moon size={18} />, body: (
              <>
                <div className="text-6xl font-bold">{sleep}</div>
                <input type="range" min="0" max="5" value={sleep} onChange={(e) => setSleep(+e.target.value)} className="w-full accent-sky-500" />
              </>
            ) },
            { title: "Pain", icon: <Zap size={18} />, body: (
              <>
                <div className="text-6xl font-bold">{pain || "-"}</div>
                <input type="range" min="0" max="5" value={pain} onChange={(e) => setPain(+e.target.value)} className="w-full accent-sky-500" />
              </>
            ) },
          ].map((card) => (
            <div key={card.title} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-sky-500 text-white px-4 py-2 flex items-center gap-2">
                {card.icon} {card.title}
              </div>
              <div className="p-4 space-y-4 text-center">{card.body}</div>
            </div>
          ))}
        </div>

        {/* Triggers Section */}
        <h1 className="text-xl font-semibold">Triggers</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[ 
            { title: "Environmental Triggers", icon: <Flame size={18} />, items: defaultTriggers, active: activeTriggers, setActive: setActiveTriggers, custom: customTriggers, setCustom: setCustomTriggers, input: newTrigger, setInput: setNewTrigger },
            { title: "Food Triggers", icon: <Apple size={18} />, items: defaultFoods, active: activeFoods, setActive: setActiveFoods, custom: customFoods, setCustom: setCustomFoods, input: newFood, setInput: setNewFood }
          ].map((section) => (
            <div key={section.title} className="bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="bg-sky-500 text-white px-4 py-2 flex items-center gap-2">
                {section.icon} {section.title}
              </div>
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                  {section.items.map((i) => (
                    <Chip
                      key={i}
                      label={i}
                      active={section.active.includes(i)}
                      onClick={() => toggle(i, section.active, section.setActive)}
                    />
                  ))}
                  {section.custom.map((i) => (
                    <Chip
                      key={i}
                      label={i}
                      active={section.active.includes(i)}
                      removable
                      onClick={() => toggle(i, section.active, section.setActive)}
                      onRemove={() => section.setCustom(section.custom.filter((x) => x !== i))}
                    />
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    value={section.input}
                    onChange={(e) => section.setInput(e.target.value)}
                    placeholder="Add custom"
                    className="flex-1 border border-slate-300 rounded-md px-3 py-1 text-sm"
                  />
                  <button
                    onClick={() => addCustom(section.input, section.custom, section.setCustom, section.setInput)}
                    className="bg-sky-500 text-white px-3 rounded-md"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Medications Section */}
        <h1 className="text-xl font-semibold">Medications</h1>
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="bg-sky-500 text-white px-4 py-2 flex items-center gap-2">
            <Flame size={18} /> Medications
          </div>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {medications.map((med) => (
                <Chip
                  key={med}
                  label={med}
                  removable
                  onRemove={() => setMedications(medications.filter((m) => m !== med))}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Add medication"
                className="flex-1 border border-slate-300 rounded-md px-3 py-1 text-sm"
              />
              <button
                onClick={() => addCustom(newMedication, medications, setMedications, setNewMedication)}
                className="bg-sky-500 text-white px-3 rounded-md"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Submit / Update Button */}
        <div className="flex justify-center gap-4">
          {isEditing && (
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-400 text-white px-8 py-3 rounded-lg mt-8 font-semibold hover:bg-gray-500 transition duration-200"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSubmit}
            className="bg-sky-500 text-white px-8 py-3 rounded-lg mt-8 font-semibold hover:bg-sky-600 transition duration-200"
          >
            {isEditing ? "Update Submission" : "Submit"}
          </button>
        </div>

        {/* Show InsightCard when progress is submitted */}
        {showInsight && <InsightCard finalPercentage={finalPercentage} onClose={() => setShowInsight(false)} setActiveTab={setActiveSection} />}
      </div>
    </div>
  );
}
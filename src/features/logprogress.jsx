import React, { useState } from "react";
import SkinLevel from "../components/skinlevel";
import { Activity } from "lucide-react";

const LogProgress = () => {
  const [frontAreas, setFrontAreas] = useState([]);
  const [backAreas, setBackAreas] = useState([]);
  const [showSkinLevel, setShowSkinLevel] = useState(false);

  const frontBodyParts = {
    Head: ["Head", "Neck"],
    Body: ["Chest", "Abdomen (Stomach Area)", "Genital Area"],
    Arms: ["Shoulders", "Upper Arms", "Forearms", "Hands"],
    Legs: ["Upper Leg (Thigh)", "Knee", "Shin (Lower Leg)", "Feet"],
  };
  const backBodyParts = {
    Head: ["Head", "Neck"],
    Body: ["Upper Back", "Lower Back", "Buttocks"],
    Arms: ["Shoulders", "Back of Upper Arms", "Back of Forearms", "Back of Hands"],
    Legs: ["Back of Upper Legs (Hamstrings)", "Back of Knees (Popliteal Area)", "Calves", "Back of Feet"],
  };

  const toggle = (setter) => (part) => setter((prev) => prev.includes(part) ? prev.filter((i) => i !== part) : [...prev, part]);

  const handleNext = () => {
    if (frontAreas.length === 0 && backAreas.length === 0) { alert("Please select at least one affected area."); return; }
    setShowSkinLevel(true);
  };

  const renderBodyParts = (parts, selected, onToggle) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {Object.keys(parts).map((category) => (
        <div key={category} className="glass p-4 space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-sky-600">{category}</div>
          {parts[category].map((part) => (
            <div key={part} onClick={() => onToggle(part)}
              className={`cursor-pointer text-xs py-2 px-3 rounded-lg text-center transition-all duration-200 ${
                selected.includes(part) ? "text-white shadow-md" : "hover:bg-gray-50"
              }`}
              style={selected.includes(part)
                ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }
                : { background: "white", color: "var(--text-secondary)", border: "1px solid rgba(0,0,0,0.06)" }
              }
            >{part}</div>
          ))}
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in-up">
      <div className="glass-strong p-8 space-y-6">
        <div className="flex items-center gap-3 pb-4" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-50">
            <Activity className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Symptom Tracker</h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Select affected body areas</p>
          </div>
        </div>

        {!showSkinLevel ? (
          <>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Front Body</h4>
              {renderBodyParts(frontBodyParts, frontAreas, toggle(setFrontAreas))}
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Back Body</h4>
              {renderBodyParts(backBodyParts, backAreas, toggle(setBackAreas))}
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={handleNext} className="btn-gradient flex items-center gap-2">Next Step</button>
            </div>
          </>
        ) : (
          <SkinLevel frontAreas={frontAreas} backAreas={backAreas} onBack={() => setShowSkinLevel(false)} />
        )}
      </div>
    </div>
  );
};

export default LogProgress;

import { useState } from "react";
import Body from "react-muscle-highlighter";

export default function BodyMap({ selectedParts, onTogglePart, readOnly = false }) {
  const [view, setView] = useState("front");

  // Format the part name for display (e.g., "lower-back" -> "Lower Back")
  const formatName = (name) => {
    return name
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const bodyData = selectedParts.map((part) => ({
    slug: part,
    color: "#0ea5e9", // Tailwind sky-500
  }));

  const handleBodyPartClick = (part) => {
    if (!readOnly && onTogglePart && part.slug) {
      onTogglePart(part.slug);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {/* View Toggle */}
      <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-lg">
        <button
          onClick={() => setView("front")}
          className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${
            view === "front" ? "bg-white shadow-sm text-sky-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Front
        </button>
        <button
          onClick={() => setView("back")}
          className={`px-4 py-1 text-sm font-medium rounded-md transition-colors ${
            view === "back" ? "bg-white shadow-sm text-sky-600" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Back
        </button>
      </div>

      <div className="relative flex justify-center items-center">
        <Body
          data={bodyData}
          side={view}
          gender="male"
          onBodyPartPress={handleBodyPartClick}
          scale={1.2}
          defaultFill="#e2e8f0" // Tailwind slate-200
        />
        {!readOnly && (
          <p className="text-xs text-slate-400 text-center mt-2 absolute w-full -bottom-6">
            Click on a body part to {selectedParts.length > 0 ? "toggle" : "select"}
          </p>
        )}
      </div>

    </div>
  );
}

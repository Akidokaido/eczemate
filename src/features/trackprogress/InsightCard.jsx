// InsightCard - popup modal that shows after submitting PO-SCORAD log
// Shows the score, severity classification, and a call-to-action button
import { AlertTriangle } from "lucide-react";

export default function InsightCard({ scoradScore, onClose, setActiveTab }) {
  let classification = "";
  let description = "";
  let buttonText = "";
  let buttonAction = () => {};

  const isSevereOrModerate = scoradScore >= 26;

  // Classify the score into severity levels
  if (scoradScore > 50) {
    classification = "Severe";
    description = "Your PO-SCORAD indicates severe eczema. We strongly recommend seeking medical attention and booking an appointment with your dermatologist.";
  } else if (scoradScore >= 26) {
    classification = "Moderate";
    description = "Your PO-SCORAD indicates moderate eczema. We recommend consulting your dermatologist to review your treatment plan.";
  } else {
    classification = "Mild";
    description = "Your PO-SCORAD indicates mild eczema. Keep up your current management routine!";
  }

  // Severe/moderate → suggest booking appointment, mild → suggest AI chat
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
        <h2 className="text-2xl font-bold mb-2 text-[#1C1917]">PO-SCORAD Result</h2>
        {/* Big score number - color changes by severity */}
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
}

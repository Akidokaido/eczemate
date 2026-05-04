import React, { useState, useEffect } from "react";
import DoctorLayout from "./DoctorLayout";
import { auth, firestore, onAuthStateChanged, doc, getDoc, updateDoc, setDoc } from "../firebase/config";
import { getUserDocRef } from "../firebase/userPaths";
import { Save, CheckCircle } from "lucide-react";

const Settings = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const userDoc = await getDoc(getUserDocRef("doctor", user.uid));
        if (userDoc.exists()) { setEmail(userDoc.data().email || user.email); setName(userDoc.data().name || ""); }
        const docDoc = await getDoc(doc(firestore, "doctors", user.uid));
        if (docDoc.exists()) { setSpecialty(docDoc.data().specialty || ""); if (!name && docDoc.data().name) setName(docDoc.data().name); }
      } catch (err) { console.error("Error:", err); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    const user = auth.currentUser; if (!user) return;
    setSaving(true); setMessage(null);
    try {
      await updateDoc(getUserDocRef("doctor", user.uid), { name, email });
      await setDoc(
        doc(firestore, "doctors", user.uid),
        { name, email, specialty },
        { merge: true }
      );
      setMessage("Settings updated successfully!");
    } catch (err) { setMessage("Failed to save."); }
    finally { setSaving(false); }
  };

  return (
    <DoctorLayout title="Settings">
      <div className="max-w-lg animate-fade-in-up">
        <div className="glass-strong p-8 space-y-6">
          <h3 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Account Settings</h3>
          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-dark" placeholder="Your name" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-dark" placeholder="doctor@email.com" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>Specialty</label>
                <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="input-dark" placeholder="e.g. Dermatology" />
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm flex items-center gap-2 ${message.includes("success") ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                  {message.includes("success") && <CheckCircle className="h-4 w-4" />} {message}
                </div>
              )}

              <button onClick={handleSave} disabled={saving} className="btn-gradient w-full flex items-center justify-center gap-2 py-3">
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Update Settings"}
              </button>
            </div>
          )}
        </div>
      </div>
    </DoctorLayout>
  );
};

export default Settings;

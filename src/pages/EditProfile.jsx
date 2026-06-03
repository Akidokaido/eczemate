import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, updateProfile } from "firebase/auth";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { auth, db, firestore } from "../firebase/config";
import { findUserByUid, getUserDocRef } from "../firebase/userPaths";
import { User, Save, ArrowLeft, CheckCircle, Stethoscope } from "lucide-react";

const EditProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { navigate("/login"); return; }
      setUser(u);

      // Load from proper user subcollection
      const foundUser = await findUserByUid(u.uid);
      if (foundUser) {
        const { data, role } = foundUser;
        setProfile({ ...data, role });
        setName(data.name || "");
        setPhone(data.phone || "");

        // If doctor, load specialty directly from account doc
        if (role === "doctor") {
          setSpecialty(data.specialty || "");
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Update the role-based account collection
      const updateData = { name, phone };
      if (profile?.role === "doctor") {
        updateData.specialty = specialty;
      }
      await updateDoc(getUserDocRef(profile.role, user.uid), updateData);
      
      // Update Firebase Auth display name
      await updateProfile(user, { displayName: name });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  const handleBack = () => {
    if (!profile) { navigate(-1); return; }
    if (profile.role === "doctor") navigate("/doctor/dashboard");
    else if (profile.role === "admin") navigate("/admin/dashboard");
    else navigate("/patient/dashboard");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="w-10 h-10 border-4 border-[#0D9488]/20 border-t-[#0D9488] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0FDFA] via-[#F8FAFC] to-[#E8F4F0] flex flex-col">
      {/* Top bar */}
      <div className="w-full border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 py-4 flex items-center gap-4">
        <button onClick={handleBack} className="flex items-center gap-2 text-[#64748B] hover:text-[#0D9488] transition font-semibold text-sm">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <span className="text-sm text-slate-300">|</span>
        <span className="text-sm font-bold text-[#1C1917]">Edit Profile</span>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 w-full max-w-md p-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0D9488] to-[#06B6D4] flex items-center justify-center shadow-lg mb-3">
              <User className="h-10 w-10 text-white" />
            </div>
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-widest">
              {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1)} Account
            </span>
            <span className="text-sm text-slate-400 mt-1">{user?.email}</span>
          </div>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wide">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/10 outline-none text-sm text-[#1C1917] bg-[#F8FAFC] transition"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wide">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +60 12-345 6789"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/10 outline-none text-sm text-[#1C1917] bg-[#F8FAFC] transition"
              />
            </div>

            {/* Email (read-only) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[#64748B] uppercase tracking-wide">Email</label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl border border-slate-100 text-sm text-slate-400 bg-slate-50 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400">Email cannot be changed here.</span>
            </div>

            {/* Specialty — Doctor only */}
            {profile?.role === "doctor" && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#64748B] uppercase tracking-wide flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-[#0D9488]" />
                  Specialty
                </label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="e.g. Dermatology"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-[#0D9488] focus:ring-2 focus:ring-[#0D9488]/10 outline-none text-sm text-[#1C1917] bg-[#F8FAFC] transition"
                />
              </div>
            )}

            {saved && (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <CheckCircle className="h-4 w-4" /> Profile saved successfully!
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-[#0D9488] to-[#06B6D4] text-white font-bold text-sm shadow-md hover:shadow-lg hover:opacity-90 transition disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase/config";
import { signOut } from "firebase/auth";
import { getDocs, deleteDoc, updateDoc } from "firebase/firestore";
import { getUserCollectionRef, getUserDocRef } from "../../firebase/userPaths";
import { UserCog, Trash2, ArrowLeft, LogOut, CheckCircle, XCircle, Clock, ShieldCheck, ShieldX } from "lucide-react";

const TABS = [
  { key: "pending", label: "Pending", icon: Clock, color: "#f59e0b" },
  { key: "approved", label: "Approved", icon: ShieldCheck, color: "#10b981" },
  { key: "rejected", label: "Rejected", icon: ShieldX, color: "#ef4444" },
];

const ManageDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchDoctors = async () => {
    setLoading(true);
    const snap = await getDocs(getUserCollectionRef("doctor"));
    setDoctors(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    await updateDoc(getUserDocRef("doctor", id), { status });
    fetchDoctors();
  };

  const deleteDoctor = async (id) => {
    if (!confirm("Delete this doctor permanently?")) return;
    await deleteDoc(getUserDocRef("doctor", id));
    fetchDoctors();
  };

  useEffect(() => { fetchDoctors(); }, []);

  const filtered = doctors.filter((d) => (d.status || "pending") === activeTab);
  const counts = {
    pending: doctors.filter((d) => (d.status || "pending") === "pending").length,
    approved: doctors.filter((d) => d.status === "approved").length,
    rejected: doctors.filter((d) => d.status === "rejected").length,
  };

  const getBadgeClass = (status) => {
    if (status === "approved") return "badge badge-approved";
    if (status === "rejected") return "badge badge-rejected";
    return "badge badge-pending";
  };

  const formatDate = (ts) => {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-mesh" />
      <div className="relative z-10 max-w-7xl mx-auto p-8 animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate("/admin/dashboard")} className="btn-ghost text-sm py-2 px-4 flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
          <button onClick={async () => { await signOut(auth); navigate("/login"); }} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>

        <h2 className="text-2xl font-bold mb-6" style={{ color: "var(--text-primary)" }}>Manage Doctors</h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {TABS.map(({ key, label, icon: Icon, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
              style={{
                background: activeTab === key ? `${color}14` : "white",
                color: activeTab === key ? color : "var(--text-muted)",
                border: `1px solid ${activeTab === key ? `${color}40` : "var(--border-subtle)"}`,
                boxShadow: activeTab === key ? `0 2px 8px ${color}18` : "var(--shadow-sm)",
              }}
            >
              <Icon className="h-4 w-4" />
              {label}
              {counts[key] > 0 && (
                <span
                  className="ml-1 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: activeTab === key ? `${color}20` : "rgba(0,0,0,0.06)",
                    color: activeTab === key ? color : "var(--text-muted)",
                  }}
                >
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Doctor List */}
        <div className="glass-strong p-6 space-y-3">
          {loading ? (
            <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10">
              <UserCog className="h-10 w-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
              <p style={{ color: "var(--text-secondary)" }}>No {activeTab} doctors found.</p>
            </div>
          ) : (
            filtered.map((d, i) => (
              <div key={d.id} className="glow-card p-4 flex justify-between items-center animate-fade-in-up" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-50">
                    <UserCog className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{d.name || "Unnamed"}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{d.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Registered: {formatDate(d.createdAt)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={getBadgeClass(d.status || "pending")}>
                    {(d.status || "pending").charAt(0).toUpperCase() + (d.status || "pending").slice(1)}
                  </span>

                  {(d.status || "pending") === "pending" && (
                    <>
                      <button onClick={() => updateStatus(d.id, "approved")} className="btn-success flex items-center gap-1 text-xs py-1.5 px-3">
                        <CheckCircle className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={() => updateStatus(d.id, "rejected")} className="btn-danger flex items-center gap-1 text-xs py-1.5 px-3">
                        <XCircle className="h-3 w-3" /> Reject
                      </button>
                    </>
                  )}

                  {d.status === "approved" && (
                    <button onClick={() => deleteDoctor(d.id)} className="btn-danger flex items-center gap-1 text-xs py-1.5 px-3">
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  )}

                  {d.status === "rejected" && (
                    <>
                      <button onClick={() => updateStatus(d.id, "approved")} className="btn-success flex items-center gap-1 text-xs py-1.5 px-3">
                        <CheckCircle className="h-3 w-3" /> Approve
                      </button>
                      <button onClick={() => deleteDoctor(d.id)} className="btn-danger flex items-center gap-1 text-xs py-1.5 px-3">
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageDoctors;
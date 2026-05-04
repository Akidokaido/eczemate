import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { getDocs } from "firebase/firestore";
import { auth } from "../../firebase/config";
import { getUserCollectionRef } from "../../firebase/userPaths";
import { LayoutDashboard, Users, UserCog, LogOut, Shield, Clock } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      const snap = await getDocs(getUserCollectionRef("doctor"));
      const pending = snap.docs
        .map((d) => d.data())
        .filter((u) => !u.status || u.status === "pending");
      setPendingCount(pending.length);
    };
    fetchPendingCount();
  }, []);

  const handleLogout = async () => { await signOut(auth); navigate("/login"); };

  const navItems = [
    { path: "/adminDashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/admin/patients", label: "Manage Patients", icon: Users },
    { path: "/admin/doctors", label: "Manage Doctors", icon: UserCog },
    { path: "/admin/appointments", label: "Manage Appointments", icon: Clock },
  ];

  const cards = [
    { label: "Patients", desc: "Manage patient accounts", icon: Users, color: "#6366f1", path: "/admin/patients" },
    { label: "Doctors", desc: "Manage doctor accounts", icon: UserCog, color: "#06b6d4", path: "/admin/doctors" },
    { label: "Appointments", desc: "Manage & cancel bookings", icon: Clock, color: "#8b5cf6", path: "/admin/appointments" },
    {
      label: "Pending Approvals",
      desc: pendingCount > 0 ? `${pendingCount} doctor${pendingCount > 1 ? "s" : ""} awaiting approval` : "No pending approvals",
      icon: Clock,
      color: "#f59e0b",
      path: "/admin/doctors",
      badge: pendingCount,
    },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-mesh" />

      <aside className="relative z-10 w-64 glass-strong flex flex-col" style={{ borderRadius: 0, borderTop: "none", borderBottom: "none", borderLeft: "none" }}>
        <div className="p-6" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="EczeMate+" className="h-8" />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button key={path} onClick={() => navigate(path)}
                className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  isActive ? "bg-sky-50 text-sky-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}>
                <Icon className="h-4 w-4" /> {label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="relative z-10 flex-1 flex flex-col">
        <header className="glass-strong flex items-center justify-between px-8 py-4" style={{ borderRadius: 0, borderTop: "none", borderRight: "none" }}>
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Admin Dashboard</h2>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </header>

        <main className="p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            {cards.map(({ label, desc, icon: Icon, color, path, badge }, i) => (
              <div key={label} onClick={() => navigate(path)} className="glow-card p-6 cursor-pointer animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  {badge > 0 && (
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: `${color}18`, color }}>
                      {badge}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>{label}</h3>
                <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>{desc}</p>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
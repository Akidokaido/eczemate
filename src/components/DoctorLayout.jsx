import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/config";
import { LayoutDashboard, Calendar, Users, Activity, FileText, Settings, LogOut } from "lucide-react";

const DoctorLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => { await signOut(auth); navigate("/login"); };

  const navItems = [
    { path: "/doctorDashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/doctor/appointments", label: "Appointments", icon: Calendar },
    { path: "/doctor/patients", label: "Patients", icon: Users },
    { path: "/doctor/settings", label: "Settings", icon: Settings },
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
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </header>
        <main className="p-8 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DoctorLayout;
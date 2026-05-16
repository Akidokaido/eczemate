import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, getDocs } from "firebase/firestore";
import { auth } from "../../firebase/config";
import { getUserDocRef, getUserCollectionRef } from "../../firebase/userPaths";
import { LayoutDashboard, Users, UserCog, Shield, Clock, X } from "lucide-react";
import Header from "../../components/shared/Header";
import Footer from "../../components/shared/Footer";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingCount, setPendingCount] = useState(0);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const snap = await getDoc(getUserDocRef("admin", currentUser.uid));
        if (snap.exists()) setProfile({ ...snap.data(), role: "admin" });
      }
    });
    return () => unsub();
  }, []);

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

  const navItems = [
    { id: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "/admin/patients", label: "Patients", icon: Users },
    { id: "/admin/doctors", label: "Doctors", icon: UserCog },
    { id: "/admin/appointments", label: "Appointments", icon: Clock },
  ];

  const cards = [
    { label: "Patients", desc: "Manage patient accounts", icon: Users, color: "#0D9488", path: "/admin/patients" },
    { label: "Doctors", desc: "Manage doctor accounts", icon: UserCog, color: "#F97316", path: "/admin/doctors" },
    { label: "Appointments", desc: "Manage & cancel bookings", icon: Clock, color: "#64748B", path: "/admin/appointments" },
    {
      label: "Pending Approvals",
      desc: pendingCount > 0 ? `${pendingCount} doctor${pendingCount > 1 ? "s" : ""} awaiting approval` : "No pending approvals",
      icon: Clock,
      color: "#ef4444",
      path: "/admin/doctors",
      badge: pendingCount,
    },
  ];

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-mesh" />

      {/* Shared Header with Tabs */}
      <Header 
        user={user} 
        profile={profile} 
        isDashboard={true} 
        tabs={navItems}
        activeSection={location.pathname}
        setActiveSection={(path) => navigate(path)}
      />

      <div className="flex flex-1">
        <div className="relative z-10 flex-1 flex flex-col min-w-0">
          <header className="px-8 py-4 border-b border-slate-100 bg-white/50">
             <h2 className="text-xl font-bold text-[#1C1917]">Admin Dashboard</h2>
          </header>

          <main className="p-8 flex-1 w-full overflow-auto">
            <div className="max-w-7xl mx-auto">
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
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
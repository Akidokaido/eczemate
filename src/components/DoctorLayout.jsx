// DoctorLayout - wrapper layout for all doctor-side pages
// Includes the shared Header with doctor-specific navigation tabs and a standard layout structure
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, firestore } from "../firebase/config";
import { getUserDocRef } from "../firebase/userPaths";
import { LayoutDashboard, Calendar, Users, LogOut, Menu, X } from "lucide-react";
import Header from "./shared/Header";
import Footer from "./shared/Footer";

const DoctorLayout = ({ children, title }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = getUserDocRef("doctor", currentUser.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) setProfile({ ...snap.data(), role: "doctor" });
      }
    });
    return () => unsub();
  }, []);

  const navItems = [
    { id: "/doctor/Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "/doctor/appointments", label: "Appointments", icon: Calendar },
    { id: "/doctor/patients", label: "Patients", icon: Users },
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
        {/* Main Content Area */}
        <div className="relative z-10 flex-1 flex flex-col min-w-0">
          <header className="px-4 sm:px-8 py-4 border-b border-slate-100 bg-white/50">
             <h2 className="text-lg sm:text-xl font-bold truncate text-slate-800">{title}</h2>
          </header>
          <main className="p-4 sm:p-8 flex-1 w-full overflow-auto">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default DoctorLayout;
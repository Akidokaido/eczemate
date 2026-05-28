import React, { useEffect, useState } from "react";
import { Heart, Shield, Droplets, Mail, MapPin, ExternalLink, BookOpen, Activity, Bot, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/config";
import { findUserByUid } from "../../firebase/userPaths";

const QUICK_LINKS = [
  { label: "Journal",        icon: BookOpen,  tab: "journal" },
  { label: "Track Progress", icon: Activity,  tab: "track" },
  { label: "AI Chat",        icon: Bot,       tab: "ai-chat" },
  { label: "Book Appointment", icon: Calendar, tab: "appointment" },
];

const Footer = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setLoggedIn(!!user);
      if (user) {
        const result = await findUserByUid(user.uid);
        if (result) setRole(result.role);
      } else {
        setRole(null);
      }
    });
    return unsub;
  }, []);

  const handleQuickLink = (tab) => {
    if (loggedIn) {
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "doctor") {
        navigate("/doctor/dashboard");
      } else {
        navigate("/patient/dashboard", { state: { activeTab: tab } });
      }
    } else {
      if (window.location.pathname === "/") {
        const el = document.getElementById("features");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      } else {
        navigate("/#features");
      }
    }
  };

  return (
    <footer className="relative z-10 bg-white border-t border-slate-100 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8">

          {/* Logo & Info */}
          <div className="md:col-span-1 space-y-6">
            <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition pt-2 pb-4" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
               <img src="/images/logo.png" alt="Eczemate Logo" className="h-12 sm:h-14 w-auto object-contain scale-[3] origin-left" />
            </div>
            <p className="text-sm text-[#64748B] leading-relaxed max-w-xs">
              Your intelligent companion for eczema management. Track, journal, and connect with professionals to regain control over your skin health.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-lg bg-[#FDFBF7] border border-slate-100 flex items-center justify-center hover:bg-[#0D9488]/10 transition-colors group cursor-pointer">
                <Heart className="h-4 w-4 text-[#64748B] group-hover:text-[#0D9488]" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#FDFBF7] border border-slate-100 flex items-center justify-center hover:bg-[#0D9488]/10 transition-colors group cursor-pointer">
                <Shield className="h-4 w-4 text-[#64748B] group-hover:text-[#0D9488]" />
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#FDFBF7] border border-slate-100 flex items-center justify-center hover:bg-[#0D9488]/10 transition-colors group cursor-pointer">
                <Droplets className="h-4 w-4 text-[#64748B] group-hover:text-[#0D9488]" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-bold text-[#1C1917] uppercase tracking-widest mb-6">Quick Links</h4>
            <ul className="space-y-4">
              {QUICK_LINKS.map(({ label, icon: Icon, tab }) => (
                <li key={label}>
                  <button
                    onClick={() => handleQuickLink(tab)}
                    className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0D9488] transition-colors group"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#0D9488]/50 group-hover:text-[#0D9488] transition-colors" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Disclaimer */}
          <div className="md:col-span-1">
            <h4 className="text-sm font-bold text-[#1C1917] uppercase tracking-widest mb-6">Get in Touch</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-[#0D9488] mt-0.5" />
                <span className="text-sm text-[#64748B]">support@eczemate.plus</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-[#0D9488] mt-0.5" />
                <span className="text-sm text-[#64748B]">Kuala Lumpur, Malaysia</span>
              </li>
            </ul>

            {/* Medical Disclaimer */}
            <div className="mt-8 p-4 bg-orange-50 border border-orange-100 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#F97316]/10 rounded-full blur-xl pointer-events-none" />
              <p className="text-[10px] font-bold text-[#F97316] uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                 <Shield size={12} /> Medical Disclaimer
              </p>
              <p className="text-[10px] text-orange-800 leading-relaxed font-medium">
                EczeMate+ is an educational tool and does not provide professional medical advice. Always consult with a certified dermatologist for treatment.
              </p>
            </div>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs text-[#64748B] font-medium">
            © {new Date().getFullYear()} EczeMate+. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-[#64748B] hover:text-[#1C1917] transition-colors font-medium">Privacy Policy</a>
            <a href="#" className="text-xs text-[#64748B] hover:text-[#1C1917] transition-colors font-medium">Terms of Service</a>
            <a href="#" className="text-xs text-[#64748B] hover:text-[#1C1917] transition-colors font-medium flex items-center gap-1">
              Doc Portal <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

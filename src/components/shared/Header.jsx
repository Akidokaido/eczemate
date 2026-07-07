// Header - top navigation bar used on both landing page and dashboard
// Shows logo, nav links (or dashboard tabs), and user avatar dropdown
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Menu, ChevronDown, Pencil } from "lucide-react";
import { auth, signOut } from "../../firebase/config";

const Header = ({ user, profile, isDashboard = false, tabs = [], activeSection, setActiveSection, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sign out and redirect to home
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Navigate to edit profile page
  const handleEditProfile = () => {
    setDropdownOpen(false);
    navigate("/edit-profile");
  };

  return (
    <header className={`relative z-50 w-full transition-all duration-300 ${isDashboard ? "bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-sm" : "bg-transparent"}`} 
            style={isDashboard ? { borderRadius: 0 } : {}}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-4">
          {onMenuClick && (
            <button className="md:hidden text-slate-500 hover:text-slate-800 p-1" onClick={onMenuClick}>
              <Menu className="h-6 w-6" />
            </button>
          )}
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition" onClick={() => navigate("/")}>
            <img 
              src="/images/logo.png" 
              alt="EczeMate Logo" 
              className="h-12 sm:h-14 w-auto object-contain scale-[3] origin-left" 
            />
          </div>
        </div>

        {/* Dynamic Center Section */}
        <div className="flex-1 flex justify-center">
          {isDashboard ? (
            <div className="hidden lg:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl border border-slate-100">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeSection === id
                      ? "bg-white text-[#0D9488] shadow-sm border border-slate-100"
                      : "text-[#64748B] hover:text-[#1C1917] hover:bg-white/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: "About", section: "about" },
                { label: "Features", section: "features" },
                { label: "Educational Resources", section: "educational-resources" },
              ].map(({ label, section }) => (
                <button
                  key={label}
                  onClick={() => {
                    if (section) {
                      if (window.location.pathname === "/") {
                        setTimeout(() => {
                          document.getElementById(section)?.scrollIntoView({ behavior: "smooth" });
                        }, 50);
                      } else {
                        navigate(`/#${section}`);
                      }
                    }
                  }}
                  className="text-sm font-semibold text-[#64748B] hover:text-[#0D9488] transition"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Action Section */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {!isDashboard && (
                <button 
                  onClick={() => navigate(profile?.role === "doctor" ? "/doctor/dashboard" : "/patient/dashboard")}
                  className="btn-ghost text-xs py-2 px-4 hidden sm:block"
                >
                  Go to Dashboard
                </button>
              )}
              {isDashboard && profile && (
                <div className="hidden sm:flex flex-col items-end border-r border-slate-200 pr-4">
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                    {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)} Portal
                  </span>
                  <span className="text-sm font-bold text-[#1C1917] leading-tight">{profile.name || profile.email}</span>
                </div>
              )}

              {/* Avatar Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-1.5 group"
                  aria-label="User menu"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D9488] to-[#06B6D4] flex items-center justify-center shadow-md group-hover:shadow-lg transition">
                    <User className="h-4 w-4 text-white" />
                  </div>
                  <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-xs font-bold text-[#64748B] uppercase tracking-widest">
                        {profile?.role?.charAt(0).toUpperCase() + profile?.role?.slice(1) || "User"}
                      </p>
                      <p className="text-sm font-semibold text-[#1C1917] truncate mt-0.5">
                        {profile?.name || user?.email}
                      </p>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <button
                        onClick={handleEditProfile}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-[#1C1917] hover:bg-[#0D9488]/5 hover:text-[#0D9488] transition"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Profile
                      </button>
                      <div className="h-px bg-slate-100 mx-3" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => navigate("/login")} className="btn-ghost text-sm py-2 px-5">Log In</button>
              <button onClick={() => navigate("/signup")} className="btn-gradient text-sm py-2 px-5 hidden sm:block">Sign Up</button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Tabs (only for dashboard) */}
      {isDashboard && tabs.length > 0 && (
        <div className="lg:hidden border-t border-slate-100 bg-white/50 overflow-x-auto flex items-center gap-1 px-4 py-2 scrollbar-hide">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all flex-shrink-0 ${
                activeSection === id
                  ? "bg-[#0D9488]/10 text-[#0D9488] border border-[#0D9488]/20 shadow-sm"
                  : "text-[#64748B] hover:text-[#1C1917]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};

export default Header;

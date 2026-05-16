import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { LogOut, User, Menu } from "lucide-react";
import { auth, signOut } from "../../firebase/config";

const Header = ({ user, profile, isDashboard = false, tabs = [], activeSection, setActiveSection, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
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
          <div className="flex items-center gap-4 cursor-pointer hover:opacity-80 transition" onClick={() => navigate("/")}>
            <img 
              src="/images/logo.png" 
              alt="EczeMate+" 
              className="h-10 w-auto object-contain" 
            />
            {isDashboard && profile && (
              <div className="hidden sm:flex flex-col border-l border-slate-200 pl-4">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest">
                  {profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)} Portal
                </span>
                <span className="text-sm font-bold text-[#1C1917] leading-tight">{profile.name || profile.email}</span>
              </div>
            )}
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
              {["Features", "About", "How it Works"].map((item) => (
                <button key={item} className="text-sm font-semibold text-[#64748B] hover:text-[#0D9488] transition">
                  {item}
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
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition border border-transparent hover:border-red-100"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
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

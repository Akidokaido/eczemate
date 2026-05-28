import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Droplets, Heart, Shield, ArrowRight, Zap, Users, BookOpen, 
  Activity, Sun, Target, Coffee, Moon, Search, FileText, Download, Play, MessageSquare, Phone,
  Star, CheckCircle, Sparkles, Stethoscope, LineChart, X
} from "lucide-react";
import { auth, onAuthStateChanged, getDoc } from "../firebase/config";
import { getUserDocRef } from "../firebase/userPaths";
import Header from "../components/shared/Header";
import Footer from "../components/shared/Footer";

const Home = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        for (const role of ["patient", "doctor", "admin"]) {
          const snap = await getDoc(getUserDocRef(role, currentUser.uid));
          if (snap.exists()) {
            setProfile({ ...snap.data(), role });
            break;
          }
        }
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const hash = window.location.hash?.replace("#", "");
    if (hash) {
      setTimeout(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
      }, 150);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans text-[#1C1917] bg-[#FDFBF7]">
      <Header user={user} profile={profile} />

      <main className="flex-1 w-full space-y-32 pb-32">
        
        {/* HERO SECTION */}
        <section className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 pt-16 lg:pt-32 flex flex-col items-center text-center">
          
          {/* Organic Background Shapes */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-[#0D9488]/10 blur-3xl rounded-full mix-blend-multiply opacity-70 pointer-events-none -translate-y-1/4" />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-[#F97316]/5 blur-3xl rounded-full mix-blend-multiply opacity-60 pointer-events-none" />

          <div className="space-y-8 animate-fade-in-up relative z-10 max-w-4xl">
            <h1 className="text-5xl sm:text-6xl lg:text-[5rem] font-extrabold tracking-tight text-[#1C1917] leading-[1.05]">
              Healing begins with <span className="text-[#0D9488]">understanding.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-[#64748B] leading-relaxed max-w-2xl mx-auto">
              Track your flare-ups, uncover hidden triggers, and connect with dermatologists on a platform designed to bring clarity to your eczema journey.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button onClick={() => navigate("/signup")} className="bg-[#F97316] hover:bg-[#ea580c] text-white font-bold py-4 px-8 rounded-full shadow-[0_8px_20px_rgba(249,115,22,0.25)] hover:shadow-[0_12px_25px_rgba(249,115,22,0.35)] hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2">
                Start Your Journey <ArrowRight size={18} />
              </button>
              <button onClick={() => navigate("/login")} className="bg-white hover:bg-slate-50 text-[#1C1917] font-bold py-4 px-8 rounded-full border border-slate-200 shadow-sm hover:shadow-md transition-all flex items-center gap-2">
                I have an account
              </button>
            </div>
          </div>
        </section>


        {/* PROBLEM / SOLUTION SPLIT */}
        <section id="about" className="max-w-7xl mx-auto px-6 lg:px-8 scroll-mt-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100">
            {/* The Problem */}
            <div className="bg-slate-50 p-12 lg:p-20 flex flex-col justify-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 flex items-center justify-center text-[#64748B] mb-8">
                <Search size={24} />
              </div>
              <h2 className="text-3xl font-extrabold text-[#1C1917] mb-6">The invisible struggle of eczema.</h2>
              <p className="text-lg text-[#64748B] leading-relaxed mb-8">
                Unpredictable flare-ups, endless trial-and-error with skincare products, and the frustration of not knowing what triggers your skin. Managing eczema can feel like navigating a maze blindfolded.
              </p>
              <ul className="space-y-4">
                {["Scattered medical records", "Unidentified dietary triggers", "Difficulty tracking symptom severity"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#64748B] font-medium">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500"><X size={12} /></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* The Solution */}
            <div className="bg-[#0D9488] text-white p-12 lg:p-20 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full mix-blend-overlay" />
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-8 relative z-10 backdrop-blur-sm">
                <Sparkles size={24} />
              </div>
              <h2 className="text-3xl font-extrabold mb-6 relative z-10">Clarity and control, finally.</h2>
              <p className="text-lg text-teal-50 leading-relaxed mb-8 relative z-10">
                EczeMate brings everything into focus. Log your symptoms, let AI analyze your patterns, and share precise, standardized data with your dermatologist for better treatment outcomes.
              </p>
              <ul className="space-y-4 relative z-10">
                {["Standardized SCORAD tracking", "AI-powered trigger identification", "Direct clinical connectivity"].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white font-medium">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white"><CheckCircle size={14} /></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* FEATURES BENTO GRID */}
        <section id="features" className="max-w-7xl mx-auto px-6 lg:px-8 scroll-mt-24">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-[#1C1917]">Everything you need to heal.</h2>
            <p className="text-lg text-[#64748B]">A complete suite of tools designed specifically for eczema management.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* AI Box (Large) */}
            <div className="md:col-span-2 md:row-span-2 bg-white rounded-3xl p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-xl transition-all duration-500 group overflow-hidden relative flex flex-col justify-between">
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-[#0D9488]/10 to-transparent blur-2xl rounded-tl-full transition-transform duration-700 group-hover:scale-150" />
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#0D9488]/10 flex items-center justify-center text-[#0D9488] mb-6">
                  <Zap size={28} />
                </div>
                <h3 className="text-2xl font-extrabold text-[#1C1917] mb-3">AI Wellness Insights</h3>
                <p className="text-[#64748B] text-lg leading-relaxed max-w-md">Our advanced AI Chatbot acts as your personal health detective. It analyzes your daily logs to uncover hidden triggers and provides personalized, actionable health tips.</p>
              </div>
              <button className="self-start mt-8 bg-slate-50 hover:bg-[#0D9488]/10 text-[#0D9488] font-bold px-6 py-3 rounded-full transition-colors flex items-center gap-2">Try the Chatbot <ArrowRight size={16}/></button>
            </div>
            
            {/* Tracking Box */}
            <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F97316]/10 flex items-center justify-center text-[#F97316] mb-5">
                  <LineChart size={24} />
                </div>
                <h3 className="text-xl font-bold text-[#1C1917] mb-2">SCORAD Tracking</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">Clinically validated severity scoring to accurately measure your skin health.</p>
              </div>
            </div>
            
            {/* Journal Box */}
            <div className="bg-[#1C1917] rounded-3xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white mb-5 backdrop-blur-md">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Daily Journal</h3>
                <p className="text-slate-400 text-sm leading-relaxed">Document photos, diet, and treatments to keep a comprehensive history.</p>
              </div>
            </div>
            
            {/* Doctor Box (Wide) */}
            <div className="md:col-span-3 bg-white rounded-3xl p-8 sm:p-10 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-2xl bg-[#0D9488] flex items-center justify-center text-white flex-shrink-0 shadow-lg shadow-[#0D9488]/30">
                   <Stethoscope size={32} />
                 </div>
                 <div>
                   <h3 className="text-2xl font-bold text-[#1C1917] mb-2">Connect with Dermatologists</h3>
                   <p className="text-[#64748B] text-lg">Share your progress reports instantly and book appointments directly through the platform.</p>
                 </div>
              </div>
              <button className="bg-[#1C1917] hover:bg-black text-white font-bold py-4 px-8 rounded-full transition-colors whitespace-nowrap">Find a Doctor</button>
            </div>
          </div>
        </section>

        {/* TYPES OF ECZEMA */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-[#1C1917]">Types of Eczema</h2>
            <p className="text-lg text-[#64748B]">Understanding your specific condition is crucial for determining the most effective treatment approach.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { type: "Type 1", name: "Atopic Dermatitis", color: "teal", icon: Droplets, items: ["Most common form of eczema", "Often starts in childhood", "Linked to asthma and hay fever", "Weakened skin barrier"] },
              { type: "Type 2", name: "Contact Dermatitis", color: "orange", icon: Shield, items: ["Reaction to touching a substance", "Allergic or irritant triggers", "Metals, soaps, or cosmetics", "Usually localized to contact area"] },
              { type: "Type 3", name: "Seborrheic Dermatitis", color: "rose", icon: Zap, items: ["Affects areas with many oil glands", "Scalp, face, and chest", "Causes flaky, yellowish scales", "Commonly known as dandruff"] }
            ].map((card) => (
              <div key={card.name} className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-50 hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-2 transition-all duration-500 group">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-6 transition-colors ${card.color === 'teal' ? 'bg-[#0D9488]/10 text-[#0D9488]' : card.color === 'orange' ? 'bg-[#F97316]/10 text-[#F97316]' : 'bg-rose-100 text-rose-600'}`}>
                   {card.type} <card.icon size={12} />
                </div>
                <h3 className="text-2xl font-extrabold text-[#1C1917] mb-6">{card.name}</h3>
                <ul className="space-y-4">
                  {card.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#64748B] font-medium group-hover:text-slate-700 transition-colors">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${card.color === 'teal' ? 'bg-[#0D9488]' : card.color === 'orange' ? 'bg-[#F97316]' : 'bg-rose-400'}`} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* MANAGING ECZEMA */}
        <section className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-[#1C1917]">Managing Eczema</h2>
            <p className="text-lg text-[#64748B]">Holistic management involves multiple aspects of daily life to reduce flare-ups.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { icon: Droplets, title: "Skincare Routine", desc: "Daily moisturizing with thick emollients within 3 minutes of bathing." },
              { icon: Target, title: "Trigger Avoidance", desc: "Identifying and avoiding harsh soaps, scratchy fabrics, or specific foods." },
              { icon: BookOpen, title: "Medications", desc: "Consistent use of prescribed topical treatments as directed." },
              { icon: Search, title: "Symptom Tracking", desc: "Regularly logging SCORAD metrics to monitor progress." },
              { icon: Heart, title: "Regular Check-ups", desc: "Working closely with dermatologists to refine your plan." },
              { icon: Sun, title: "Mental Health", desc: "Managing stress and anxiety, which exacerbate flare-ups." }
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-50 hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                <div className="w-12 h-12 rounded-2xl bg-[#FDFBF7] border border-slate-100 flex items-center justify-center text-[#0D9488] mb-5">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-extrabold text-[#1C1917] mb-2">{title}</h3>
                <p className="text-[#64748B] text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* EDUCATIONAL RESOURCES */}
        <section id="educational-resources" className="max-w-7xl mx-auto px-6 lg:px-8 scroll-mt-24">
          <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl font-extrabold text-[#1C1917]">Educational Resources</h2>
            <p className="text-lg text-[#64748B]">Access helpful materials to learn more about eczema management and healthy living.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: FileText, title: "Eczema Guide", desc: "A comprehensive guide to understanding symptoms and treatments.", action: "Read Article", actionIcon: Download, url: "https://nationaleczema.org/eczema/types-of-eczema/atopic-dermatitis/" },
              { icon: Coffee, title: "Diet & Triggers", desc: "Learn how nutrition impacts inflammation and identifying trigger foods.", action: "Read Article", actionIcon: Download, url: "https://nationaleczema.org/diet-nutrition/" },
              { icon: Play, title: "Video Tutorials", desc: "Watch experts demonstrate proper bathing and moisturizing techniques.", action: "Watch Video", actionIcon: Play, url: "https://www.youtube.com/watch?v=30yogUkbdFc" },
              { icon: Shield, title: "Skincare Tips", desc: "Tips for choosing the right moisturizers, soaps, and laundry detergents.", action: "Read Article", actionIcon: Download, url: "https://www.aad.org/public/diseases/eczema/childhood/treating/skin-care" }
            ].map(({ icon: Icon, title, desc, action, actionIcon: ActionIcon, url }, i) => (
              <div key={title} className="bg-white rounded-3xl p-8 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:border-[#0D9488]/20 hover:shadow-xl transition-all duration-300 group">
                 <div className="flex items-start gap-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 bg-[#FDFBF7] border border-slate-100 text-[#0D9488] group-hover:scale-110 transition-transform duration-300">
                      <Icon size={26} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#1C1917] mb-1">{title}</h3>
                      <p className="text-[#64748B] text-sm leading-relaxed">{desc}</p>
                    </div>
                 </div>
                 <a href={url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 flex items-center gap-2 text-sm font-bold text-[#F97316] hover:text-white bg-[#F97316]/10 hover:bg-[#F97316] px-5 py-3 rounded-full transition-colors w-full sm:w-auto justify-center">
                    <ActionIcon size={18} /> {action}
                 </a>
              </div>
            ))}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
};

export default Home;
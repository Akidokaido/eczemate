import React from "react";
import { useNavigate } from "react-router-dom";
import { Droplets, Heart, Shield, ArrowRight, Zap, Users, BookOpen } from "lucide-react";

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: "var(--bg-primary)" }}>
      <div className="bg-mesh" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <img src="/images/logo.png" alt="EczeMate+" className="h-9" />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/login")} className="btn-ghost text-sm py-2 px-5">Log In</button>
          <button onClick={() => navigate("/signup")} className="btn-gradient text-sm py-2 px-5">Sign Up</button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-24 lg:pt-24 lg:pb-32">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
          <div className="flex flex-col space-y-8 animate-fade-in-up">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600 border border-sky-100">
                <Zap className="h-4 w-4" />
                AI-Powered Eczema Management
              </div>

              <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl leading-[1.1]" style={{ color: "var(--text-primary)" }}>
                Your <span className="gradient-text">eczema buddy</span> for life
              </h1>

              <p className="text-lg leading-relaxed sm:text-xl" style={{ color: "var(--text-secondary)" }}>
                Track symptoms, journal your skin health, chat with AI, and connect
                with dermatologists — all in one beautiful platform.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate("/signup")} className="btn-gradient flex items-center gap-2 text-base py-4 px-8">
                Get Started Free <ArrowRight className="h-5 w-5" />
              </button>
              <button onClick={() => navigate("/login")} className="btn-ghost flex items-center gap-2 text-base py-4 px-8">
                I have an account
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-6 pt-2">
              {[
                { icon: Shield, text: "Dermatologist Tested" },
                { icon: Heart, text: "Gentle on Skin" },
                { icon: Droplets, text: "Deep Hydration" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
                  <Icon className="h-4 w-4 text-sky-500" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Cards */}
          <div className="relative" style={{ animation: "fadeInUp 0.8s ease-out forwards", animationDelay: "200ms" }}>
            <div className="grid grid-cols-2 gap-4 stagger">
              {[
                { icon: Zap, title: "AI Chatbot", desc: "Get instant eczema advice from our AI", color: "#6366f1" },
                { icon: BookOpen, title: "Journal", desc: "Track your daily skin health", color: "#06b6d4" },
                { icon: Heart, title: "Symptom Log", desc: "Monitor severity over time", color: "#8b5cf6" },
                { icon: Users, title: "Doctor Connect", desc: "Book appointments with specialists", color: "#10b981" },
              ].map(({ icon: Icon, title, desc, color }, i) => (
                <div key={title} className="glow-card p-6 space-y-3 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-24 grid gap-8 sm:grid-cols-3">
          {[
            { value: "94%", label: "Reported Improvement" },
            { value: "50K+", label: "Happy Users" },
            { value: "15+", label: "Years of Research" },
          ].map(({ value, label }) => (
            <div key={label} className="glow-card p-8 text-center">
              <div className="text-4xl font-extrabold gradient-text">{value}</div>
              <div className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
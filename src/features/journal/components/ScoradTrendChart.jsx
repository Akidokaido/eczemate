import React, { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Sparkles, Target } from "lucide-react";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100 animate-fade-in">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
          <p className="text-sm font-bold text-[#1C1917]">Score: {payload[0].value}</p>
        </div>
      </div>
    );
  }
  return null;
};

const ScoradTrendChart = ({ data }) => {
  const [showTip, setShowTip] = useState(false);
  if (!data || data.length === 0) return null;

  const currentScore = data[data.length - 1]?.score || 0;
  const isImproving = data.length > 1 ? currentScore < data[data.length - 2].score : true;

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 print:hidden relative overflow-hidden group hover:shadow-md transition-all duration-500">
      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0D9488]/[0.04] rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-bold text-[#1C1917] tracking-tight">Eczema Severity Journey</h4>
            <Sparkles className="h-3.5 w-3.5 text-[#0D9488] animate-pulse" />
          </div>
          <p className="text-xs text-[#64748B] font-medium">Tracking your SCORAD index improvements</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${isImproving ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-slate-50 text-[#64748B]'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isImproving ? 'bg-[#0D9488] animate-pulse' : 'bg-slate-400'}`} />
            {isImproving ? 'Condition Improving' : 'Monitoring Trends'}
          </div>
          {/* ? Info button */}
          <div className="relative">
            <button
              onClick={() => setShowTip(v => !v)}
              onBlur={() => setShowTip(false)}
              className="w-5 h-5 rounded-full bg-slate-100 hover:bg-[#0D9488]/10 text-slate-400 hover:text-[#0D9488] text-[10px] font-black flex items-center justify-center transition-all border border-slate-200 hover:border-[#0D9488]/20 focus:outline-none"
            >
              ?
            </button>
            {showTip && (
              <div className="absolute right-0 top-7 z-50 w-64 bg-slate-900 text-white text-xs rounded-2xl p-4 shadow-2xl animate-fade-in">
                <p className="font-bold mb-1">
                  {isImproving ? '✅ Condition Improving' : '👀 Monitoring Trends'}
                </p>
                <p className="text-slate-300 leading-relaxed">
                  {isImproving
                    ? 'Your SCORAD score has decreased compared to your last assessment. Keep up the good work!'
                    : 'Your score has stayed the same or increased. Try tracking your diet and triggers more closely.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="h-[220px] w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="skinGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0D9488" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#0D9488" stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(0,0,0,0.03)" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dy={15} 
            />
            <YAxis 
              domain={[0, 100]} 
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} 
              axisLine={false} 
              tickLine={false} 
              dx={-5} 
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#0D9488', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <Area 
              type="monotone" 
              dataKey="score" 
              stroke="#0D9488" 
              strokeWidth={3} 
              fill="url(#skinGradient)" 
              animationDuration={1500}
              activeDot={{ r: 6, fill: '#0D9488', strokeWidth: 3, stroke: 'white' }} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-6 pt-5 border-t border-slate-50 text-sm relative z-10">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
             <Sparkles className="h-4 w-4 text-[#0D9488]" />
           </div>
           <div>
             <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Current Score</p>
             <p className="text-base font-bold text-[#1C1917] leading-tight">{currentScore}</p>
           </div>
         </div>

         <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>

         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-xl bg-[#F97316]/10 flex items-center justify-center">
             <Target className="h-4 w-4 text-[#F97316]" />
           </div>
           <div>
             <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Target Goal</p>
             <p className="text-base font-bold text-[#1C1917] leading-tight">{"< 25"}</p>
           </div>
         </div>
      </div>
    </div>
  );
};

export default ScoradTrendChart;

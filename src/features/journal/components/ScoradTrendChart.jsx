import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Sparkles, Target } from "lucide-react";

const ScoradTrendChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  const currentScore = data[data.length - 1]?.score || 0;
  const isImproving = data.length > 1 ? currentScore < data[data.length - 2].score : true;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden relative overflow-hidden group hover:shadow-md transition-all duration-500">
      {/* Decorative background element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0D9488]/[0.04] rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-5 gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-lg font-bold text-[#1C1917] tracking-tight flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[#0D9488]" /> SCORAD Trend
            </h4>
            <Sparkles className="h-3.5 w-3.5 text-[#0D9488] animate-pulse" />
          </div>
          <p className="text-xs text-[#64748B] font-medium">Tracking your eczema severity over time</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${isImproving ? 'bg-[#0D9488]/10 text-[#0D9488]' : 'bg-slate-50 text-[#64748B]'}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isImproving ? 'bg-[#0D9488] animate-pulse' : 'bg-slate-400'}`} />
            {isImproving ? 'Condition Improving' : 'Monitoring Trends'}
          </div>
        </div>
      </div>

      {/* Severity Legend */}
      <div className="flex items-center gap-4 text-xs font-bold mb-4 relative z-10">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span> Mild (0–25)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> Moderate (26–50)</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Severe (&gt;50)</span>
      </div>
      
      {/* Chart */}
      <div className="h-56 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
              tickLine={false} 
              axisLine={false} 
            />
            <YAxis 
              domain={[0, 103]} 
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} 
              tickLine={false} 
              axisLine={false} 
              width={30}
            />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
              formatter={(val) => [`${val}`, 'SCORAD Score']}
            />
            <ReferenceLine y={25} stroke="#86efac" strokeDasharray="4 4" strokeWidth={1.5} />
            <ReferenceLine y={50} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="#0D9488"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                const color = payload.score > 50 ? '#ef4444' : payload.score > 25 ? '#f59e0b' : '#10b981';
                return <circle key={cx} cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />;
              }}
              activeDot={{ r: 7, stroke: '#0D9488', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Bottom Stats */}
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 mt-6 pt-5 border-t border-slate-50 text-sm relative z-10">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-xl bg-[#0D9488]/10 flex items-center justify-center">
             <Sparkles className="h-4 w-4 text-[#0D9488]" />
           </div>
           <div>
             <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Current Score</p>
             <p className={`text-base font-bold leading-tight ${currentScore > 50 ? 'text-rose-600' : currentScore > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>{currentScore}</p>
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

         <div className="w-px h-6 bg-slate-100 hidden sm:block"></div>

         <div className="flex items-center gap-3">
           <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${currentScore > 50 ? 'bg-rose-100' : currentScore > 25 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
             <div className={`w-3 h-3 rounded-full ${currentScore > 50 ? 'bg-rose-500' : currentScore > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
           </div>
           <div>
             <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Severity</p>
             <p className={`text-base font-bold leading-tight ${currentScore > 50 ? 'text-rose-600' : currentScore > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
               {currentScore > 50 ? 'Severe' : currentScore > 25 ? 'Moderate' : 'Mild'}
             </p>
           </div>
         </div>
      </div>
    </div>
  );
};

export default ScoradTrendChart;

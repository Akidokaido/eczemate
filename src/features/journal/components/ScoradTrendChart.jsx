import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, Sparkles, Target, ArrowUp, ArrowDown, Minus, Calendar } from "lucide-react";
import CustomDatePickerModal from "./CustomDatePickerModal";

// Helper: Format date as YYYY-MM-DD local
const toLocalDateStr = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ScoradTrendChart = ({ data }) => {
  const [filterType, setFilterType] = useState('week'); // Default to week
  const [startDate, setStartDate] = useState(() => {
    // Default to 7 days ago so it shows the past week
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!data || data.length === 0) return null;

  // Determine range start and end dates
  let rangeStart = new Date(startDate);
  let rangeEnd = new Date(startDate);
  
  if (filterType === 'week') {
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 6); // 7 days total
  } else if (filterType === 'month') {
    rangeStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
    rangeEnd = new Date(rangeStart.getFullYear(), rangeStart.getMonth() + 1, 0);
  }

  // Generate all days in the range to force the X-Axis to show them
  const displayData = [];
  let hasDataInRange = false;
  let lastScore = 0;
  let previousScore = 0;
  
  // To compute trends, we need to gather actual recorded scores in the range
  const recordedScores = [];

  for (let d = new Date(rangeStart); d <= rangeEnd; d.setDate(d.getDate() + 1)) {
    const dStr = toLocalDateStr(d);
    // Find if data exists for this day
    const existing = data.find(item => {
      const itemDate = item.fullDate || new Date(item.date);
      return toLocalDateStr(itemDate) === dStr;
    });

    if (existing) {
      hasDataInRange = true;
      recordedScores.push(existing.score);
    }

    displayData.push({
      date: d.getDate().toString(), // Just the day number for x-axis (e.g. "18")
      fullDateStr: dStr,
      score: existing ? existing.score : null
    });
  }

  if (recordedScores.length > 0) {
    lastScore = recordedScores[recordedScores.length - 1];
  }

  // Create Header Labels
  const startLabel = rangeStart.toLocaleString('default', { month: 'short', day: 'numeric' });
  const endLabel = rangeEnd.toLocaleString('default', { month: 'short', day: 'numeric' });
  const rangeLabel = filterType === 'week' ? `${startLabel} - ${endLabel}` : rangeStart.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 print:hidden relative overflow-hidden group hover:shadow-md transition-all duration-500">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#0D9488]/[0.04] rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-5 gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-lg font-bold text-[#1C1917] tracking-tight flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-[#0D9488]" /> PO-SCORAD Trend
              </h4>
              <Sparkles className="h-3.5 w-3.5 text-[#0D9488] animate-pulse" />
            </div>
            <p className="text-xs text-[#64748B] font-medium">Tracking your eczema severity over time</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Custom Range Trigger Button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-[#0D9488]/30 px-4 py-2 rounded-xl transition-all shadow-sm"
            >
              <span className="text-xs font-bold text-slate-500">By {filterType === 'week' ? 'Week' : 'Month'}:</span>
              <span className="text-xs font-bold text-slate-800">{rangeLabel}</span>
              <Calendar className="w-3.5 h-3.5 text-[#0D9488] ml-1" />
            </button>

          </div>
        </div>

        {/* Severity Legend */}
        <div className="flex items-center gap-4 text-xs font-bold mb-4 relative z-10">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span> Mild (0–25)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> Moderate (26–50)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span> Severe (&gt;50)</span>
        </div>

        {/* Chart always renders so grid is always visible */}
        <div className="h-56 w-full relative z-10">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                domain={[0, 103]}
                ticks={[0, 25, 50, 103]}
                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                labelFormatter={(label) => `Day ${label}`}
                formatter={(val) => [`${val}`, 'PO-SCORAD Score']}
              />
              <ReferenceLine y={25} stroke="#86efac" strokeDasharray="4 4" strokeWidth={1.5} />
              <ReferenceLine y={50} stroke="#fbbf24" strokeDasharray="4 4" strokeWidth={1.5} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0D9488"
                strokeWidth={2.5}
                connectNulls={true} // Automatically connects dots over missing days
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (payload.score === null) return null; // No dot for empty days
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
              <p className={`text-base font-bold leading-tight ${!hasDataInRange ? 'text-slate-400' : lastScore > 50 ? 'text-rose-600' : lastScore > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {hasDataInRange ? lastScore : 'N/A'}
              </p>
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
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${!hasDataInRange ? 'bg-slate-100' : lastScore > 50 ? 'bg-rose-100' : lastScore > 25 ? 'bg-amber-100' : 'bg-emerald-100'}`}>
              <div className={`w-3 h-3 rounded-full ${!hasDataInRange ? 'bg-slate-300' : lastScore > 50 ? 'bg-rose-500' : lastScore > 25 ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#64748B] uppercase tracking-widest">Severity</p>
              <p className={`text-base font-bold leading-tight ${!hasDataInRange ? 'text-slate-400' : lastScore > 50 ? 'text-rose-600' : lastScore > 25 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {!hasDataInRange ? 'Not tracked' : lastScore > 50 ? 'Severe' : lastScore > 25 ? 'Moderate' : 'Mild'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CustomDatePickerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={(mode, date) => {
          setFilterType(mode);
          setStartDate(date);
        }}
        initialMode={filterType}
        initialDate={startDate}
        data={data}
      />
    </>
  );
};

export default ScoradTrendChart;

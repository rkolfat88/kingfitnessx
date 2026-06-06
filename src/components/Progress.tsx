import React, { useState } from 'react';
import { Award, TrendingUp, Sparkles, Activity, Share2, ClipboardList, CheckCircle } from 'lucide-react';

export function Progress() {
  const [showRecapModal, setShowRecapModal] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Bodyweight trend coordinates for SVG line map
  // Coords formatted for custom view box: (X, Y)
  // Weeks 1 to 5: Weight trend 184 → 182.5 → 181.2 → 179.8 → 179.0 lbs (representing cutting/composition phase)
  const weightPoints = [
    { label: 'W1', value: 184.0, x: 40, y: 30 },
    { label: 'W2', value: 182.5, x: 90, y: 50 },
    { label: 'W3', value: 181.2, x: 140, y: 65 },
    { label: 'W4', value: 179.8, x: 190, y: 85 },
    { label: 'W5', value: 179.0, x: 240, y: 95 },
  ];

  const handleShareRecap = () => {
    setCopiedNotification(true);
    setTimeout(() => {
      setCopiedNotification(false);
    }, 2000);
  };

  return (
    <div className="space-y-4 text-left animate-fade-in pb-4">
      
      {/* Title */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-gold-base font-semibold font-display">PERFORMANCE GRAPHS</p>
        <h2 className="text-3xl font-extrabold text-[#F0F0F0] tracking-tight mt-1 font-display">
          Athlete Telemetry
        </h2>
      </div>

      {/* BODYWEIGHT TREND SVG LINE CHART */}
      <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-gold-base/15 relative">
        <div className="flex items-center justify-between mb-4">
          <div className="text-left">
            <p className="text-[9px] font-mono tracking-widest text-[#909090] uppercase font-bold">COMPOSITION GRADIENT</p>
            <h3 className="text-sm font-black text-white font-display mt-0.5">Body Weight Trend</h3>
          </div>
          <span className="text-xs font-mono font-extrabold text-gold-base bg-[#C9A84C]/10 px-2 py-1 rounded">
            - 5.0 lbs (5 Weeks)
          </span>
        </div>

        {/* Custom SVG Line map drawing weightPoints */}
        <div className="relative w-full h-32 bg-[#0c0c0c] rounded-xl border border-white/5 p-2 overflow-hidden">
          {/* Accent dynamic grids in background */}
          <div className="absolute inset-x-0 top-1/4 border-b border-white/5"></div>
          <div className="absolute inset-x-0 top-2/4 border-b border-white/5"></div>
          <div className="absolute inset-x-0 top-3/4 border-b border-white/5"></div>

          <svg className="w-full h-full" viewBox="0 0 280 120">
            {/* SVG gradient fill representing area below curve */}
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#C9A84C" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Gradient Area fill */}
            <path
              d="M 40 120 L 40 30 L 90 50 L 140 65 L 190 85 L 240 95 L 240 120 Z"
              fill="url(#chartGradient)"
            />

            {/* Glowing gold Connecting Vector lines */}
            <polyline
              fill="none"
              stroke="#E8C76A"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points="40,30 90,50 140,65 190,85 240,95"
            />

            {/* Grid nodes points for hover references */}
            {weightPoints.map((pt, i) => (
              <g key={i}>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="5"
                  className="fill-black stroke-gold-base"
                  strokeWidth="2.5"
                />
                {/* Labels */}
                <text x={pt.x} y="115" fill="#505055" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {pt.label}
                </text>
                <text x={pt.x} y={pt.y - 10} fill="#F0F0F0" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                  {pt.value}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* METRIC DENSITY CARD STAT */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly tonnage volumes */}
        <div className="bg-[#1A1A1A] p-3.5 rounded-xl border border-gold-base/15">
          <p className="text-[8px] font-mono font-extrabold tracking-widest text-[#909090] uppercase leading-none">WEEKLY TONNAGE</p>
          <p className="text-xl font-black text-white leading-none mt-2 font-mono">14,850 <span className="text-xs text-[#909090]">lbs</span></p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-green-500 font-mono font-bold uppercase leading-none">
            <TrendingUp className="w-3 h-3 text-green-500" />
            +8.5% Load delta
          </div>
        </div>

        {/* Neural fatigue estimator */}
        <div className="bg-[#1A1A1A] p-3.5 rounded-xl border border-gold-base/15">
          <p className="text-[8px] font-mono font-extrabold tracking-widest text-[#909090] uppercase leading-none">ESTIMATED CNS LOAD</p>
          <p className="text-xl font-black text-gold-base leading-none mt-2 font-mono">72% <span className="text-xs text-[#909090]">lim</span></p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-gold-light font-mono font-bold uppercase leading-none">
            <Activity className="w-3 h-3" />
            Deload due in 8d
          </div>
        </div>
      </div>

      {/* PR RECORD SET LIST AND BADGES */}
      <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-gold-base/15">
        <p className="text-[9px] font-mono tracking-widest text-[#909090] uppercase font-bold mb-3">CONCENTRIC LIMITS // RECORD PB</p>
        
        <div className="space-y-2.5">
          {[
            { tag: 'SQUAT', weight: '225 lbs', volume: '1 Rep Max (Depth R1)', badge: 'Gold Crown', rank: '1' },
            { tag: 'BENCH PRESS', weight: '185 lbs', volume: '5 Rep Threshold', badge: 'Silver Eagle', rank: '2' },
            { tag: 'DEADLIFT', weight: '315 lbs', volume: '3 Rep Strict Form', badge: 'Silver Star', rank: '2' },
          ].map((pr, idx) => (
            <div
              key={idx}
              className="bg-[#121212] p-2.5 rounded-xl border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-gold-base/10 text-gold-base flex items-center justify-center font-black text-xs">
                  {pr.rank}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="text-[9px] font-mono font-extrabold text-[#909090] tracking-tight">{pr.tag}</span>
                    <span className="text-[8px] bg-gold-base/10 text-gold-base px-1 rounded-full font-mono">{pr.badge}</span>
                  </div>
                  <p className="text-xs font-bold text-[#F0F0F0] mt-1 pr-1">{pr.volume}</p>
                </div>
              </div>

              <div className="text-right shrink-0 font-mono text-xs font-extrabold text-gold-base">
                {pr.weight}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SHAREABLE RECAP BUTTON */}
      <button 
        onClick={() => setShowRecapModal(true)}
        className="w-full py-3.5 bg-gradient-to-r from-gold-base to-gold-dark text-black hover:from-gold-light hover:to-gold-base font-extrabold uppercase tracking-widest text-xs rounded-full transition duration-150 flex items-center justify-center gap-2"
      >
        <Share2 className="w-4 h-4 text-black" />
        GENERATE ATHLETE WEEKLY CARD
      </button>

      {/* Visual Weekly Recap share popup card */}
      {showRecapModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#080808] border-2 border-gold-base text-white max-w-[340px] w-full rounded-2xl p-5 text-center shadow-[0_0_30px_rgba(201,168,76,0.25)] space-y-4">
            
            {/* Athletic badge */}
            <div className="w-14 h-14 bg-[#111] border-2 border-gold-base rounded-full flex items-center justify-center mx-auto text-gold-base">
              <Award className="w-7 h-7" />
            </div>

            <div>
              <p className="text-[9px] tracking-[0.2em] text-gold-base font-extrabold uppercase font-mono">INTELLIGENT WEEKLY RECAP</p>
              <h4 className="text-lg font-black tracking-tight font-display mt-1">LEO // PERFORMANCE BRIEF</h4>
              <p className="text-[9px] font-mono text-[#7a7a7a]">WEEK 1 BASES COMPLETION</p>
            </div>

            {/* Quick highlights list */}
            <div className="bg-[#1A1A1A] p-4 rounded-xl text-left text-xs space-y-2 border border-gold-base/15">
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-[#909090] font-mono">Weekly Tonnage:</span>
                <span className="text-white font-extrabold font-mono">14,850 lbs</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-1.5">
                <span className="text-[#909090] font-mono">Readiness Peak:</span>
                <span className="text-gold-base font-extrabold font-mono">88% WHOOP</span>
              </div>
              <div className="flex justify-between pb-0.5">
                <span className="text-[#909090] font-mono">Pose Accuracy:</span>
                <span className="text-green-500 font-extrabold font-mono">✓ 94% OPTIMAL</span>
              </div>
            </div>

            <p className="text-[10px] italic text-[#909090] leading-relaxed">
              "Leo exceeded linear progressive load expectations inside Week 1 Foundations. Biomechanical tracking confirmed deep squat depth targets successfully locked."
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleShareRecap}
                className="flex-1 py-2.5 bg-gold-base text-black font-extrabold uppercase text-xs rounded-full"
              >
                {copiedNotification ? 'COPIED TO CLIPBOARD' : 'COPY RECAP'}
              </button>
              <button
                onClick={() => setShowRecapModal(false)}
                className="py-2.5 px-4 bg-[#222] text-white hover:text-red-400 text-xs font-bold uppercase rounded-full"
              >
                CLOSE
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}

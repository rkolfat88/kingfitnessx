import React from 'react';
import { Flame, Brain, Dumbbell, ShieldAlert, Award, ChevronRight } from 'lucide-react';
import { WearableStats } from '../types';

interface DashboardProps {
  wearables: WearableStats;
  streak: number;
  onNavigate: (screen: any) => void;
}

export function Dashboard({ wearables, streak, onNavigate }: DashboardProps) {
  // Compute circle circumference for 88% (or dynamic recovery score)
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (wearables.whoopReadiness / 100) * circumference;

  const getRecoveryColor = (score: number) => {
    if (score >= 80) return '#C9A84C'; // King Gold
    if (score >= 50) return '#F97316'; // Orange warning
    return '#EF4444'; // Red danger
  };

  return (
    <div className="space-y-5 animate-fade-in text-left">
      {/* Header section */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-gold-base font-semibold font-display">DASHBOARD</p>
        <h2 className="text-3xl font-extrabold text-[#F0F0F0] tracking-tight mt-1 font-display">
          Good morning, Leo
        </h2>
      </div>

      {/* Hero card: TODAY'S FOCUS */}
      <div 
        id="hero-todays-focus"
        className="relative bg-[#1A1A1A] rounded-2xl p-5 border border-gold-base/15 overflow-hidden transition-all duration-300 hover:border-gold-base/35 group"
      >
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold-base/5 rounded-full blur-3xl -mr-6 -mt-6"></div>
        
        {/* Diamond crown top-right */}
        <div className="absolute top-5 right-5 text-gold-base flex items-center justify-center">
          <div className="w-2.5 h-2.5 rotate-45 border-2 border-gold-base scale-110"></div>
        </div>

        <p className="text-[9px] tracking-[0.2em] text-[#909090] uppercase font-bold mb-1 font-mono">
          TODAY'S PLAN
        </p>
        <h3 className="text-xl font-extrabold text-[#F0F0F0] font-display">
          Hypertrophy: Push
        </h3>
        <p className="text-xs font-mono text-[#909090] mt-1.5 flex items-center gap-1.5 mb-5">
          <Dumbbell className="w-3.5 h-3.5 text-gold-base" />
          5 exercises • 55 mins
        </p>

        <button 
          id="btn-start-workout"
          onClick={() => onNavigate('active-workout')}
          className="w-full py-3 bg-[#C9A84C] hover:bg-[#E8C76A] text-[#080808] font-extrabold uppercase tracking-widest text-xs rounded-full transition-all duration-200 active:scale-95 shadow-md hover:shadow-gold-base/20"
        >
          START WORKOUT
        </button>
      </div>

      {/* Two Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* READINESS stat card */}
        <div 
          onClick={() => onNavigate('settings')}
          className="bg-[#1A1A1A] rounded-2xl p-4 border border-gold-base/15 flex flex-col items-center text-center justify-between cursor-pointer hover:border-gold-base/30 transition-all duration-200"
        >
          <p className="text-[9px] tracking-[0.15em] text-[#909090] uppercase font-bold mb-3 font-mono">
            READINESS
          </p>
          
          <div className="relative w-24 h-24 flex items-center justify-center mb-2">
            {/* SVG circular track */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-[#222] fill-transparent"
                strokeWidth="7"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="fill-transparent transition-all duration-500"
                stroke={getRecoveryColor(wearables.whoopReadiness)}
                strokeWidth="7"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-black text-[#F0F0F0] font-mono tracking-tight">
                {wearables.whoopReadiness}%
              </span>
              <span className="text-[8px] uppercase tracking-wider text-[#909090] font-bold">
                WHOOP
              </span>
            </div>
          </div>
          
          <span className="text-[10px] uppercase font-bold text-gold-base tracking-wide flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            Optimal State
          </span>
        </div>

        {/* DAY STREAK card */}
        <div 
          onClick={() => onNavigate('progress')}
          className="bg-[#1A1A1A] rounded-2xl p-4 border border-gold-base/15 flex flex-col justify-between cursor-pointer hover:border-gold-base/30 transition-all duration-200"
        >
          <div className="text-left">
            <p className="text-[9px] tracking-[0.15em] text-[#909090] uppercase font-bold mb-1 font-mono">
              DAY STREAK
            </p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-4xl font-extrabold text-gold-base font-mono leading-none">
                {streak}
              </span>
              <span className="text-xs text-[#909090] font-bold uppercase font-mono">days</span>
            </div>
          </div>

          <div className="my-3 flex items-center gap-1 bg-[#121212] p-2 rounded-lg border border-[#222]">
            <Flame className="w-4 h-4 text-gold-base fill-gold-base/10" />
            <span className="text-[9px] text-left text-gold-light uppercase tracking-wider font-extrabold font-mono">
              LEVEL 4 ATHLETE
            </span>
          </div>

          <div className="text-left">
            {/* Short gold progress underline bar */}
            <div className="w-full bg-[#222] h-1 rounded-full overflow-hidden block">
              <div 
                className="bg-gradient-to-r from-gold-base to-gold-light h-full rounded-full"
                style={{ width: `${Math.min((streak / 20) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-[8px] text-[#505050] font-bold uppercase font-mono mt-1 text-right">
              {streak}/20 to Gold Trophy
            </p>
          </div>
        </div>
      </div>

      {/* COACH INSIGHT card */}
      <div 
        onClick={() => onNavigate('coach-chat')}
        className="bg-[#1A1A1A] rounded-2xl p-4 border border-gold-base/15 cursor-pointer hover:border-gold-base/35 transition-all duration-200 flex items-start gap-3 text-left relative overflow-hidden"
      >
        <div className="w-9 h-9 min-w-[36px] bg-[#080808] border border-gold-base/30 rounded-full flex items-center justify-center font-black text-gold-base text-base tracking-tighter shadow-inner">
          K
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-[9px] tracking-[0.2em] text-[#909090] font-bold uppercase font-mono">
              COACH INSIGHT
            </p>
            <span className="text-[8px] text-gold-base uppercase tracking-wider font-bold">
              SYSTEM DELTA
            </span>
          </div>
          <p className="text-sm font-semibold text-[#F0F0F0] leading-snug">
            Your HRV is slightly suppressed today. I've scaled your workout intensity dynamically to lock-in performance without risking overuse.
          </p>
          <div className="mt-2 text-[10px] text-gold-light/90 font-bold flex items-center gap-1">
            Tap to open session brief
            <ChevronRight className="w-3 h-3 text-gold-base" />
          </div>
        </div>
      </div>

      {/* Mini overview panel: Quick actions */}
      <div className="bg-[#121212] rounded-xl p-3 border border-white/5 flex items-center justify-between text-xs text-[#909090] font-bold">
        <span className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-gold-base" />
          <span>Biomechanical Engine: Active</span>
        </span>
        <span className="text-xs text-gold-base font-display">v2.5 // PRO</span>
      </div>
    </div>
  );
}

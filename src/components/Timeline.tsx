import React, { useState } from 'react';
import { Calendar, CheckCircle2, Circle, Eye, Award, Sliders } from 'lucide-react';

interface TimelineProps {
  onSelectDayWorkout: (dayName: string) => void;
}

export function Timeline({ onSelectDayWorkout }: TimelineProps) {
  const [selectedWeek, setSelectedWeek] = useState(1);

  const TIMELINE_WEEKS = [
    {
      weekNumber: 1,
      phase: 'Foundations Block',
      descriptor: 'Biomechanics & Movement Baseline Calibration',
      status: 'In Progress',
      focus: 'RPE 7-8 target, high stability tempo, movement analysis calibration.',
      days: [
        { id: '1-1', name: 'Day 1: Legs Base', status: 'completed', focus: 'Squat focus, hip accessory dynamics', completedAt: 'Monday' },
        { id: '1-2', name: 'Day 2: Pull Volume', status: 'completed', focus: 'Deadlift rows, weighted pullups, curls', completedAt: 'Wednesday' },
        { id: '1-3', name: 'Day 3: Push Hypertrophy', status: 'active', focus: 'Incline presses, overhead traps, dips', completedAt: 'Today' },
        { id: '1-4', name: 'Day 4: Core & Condition', status: 'upcoming', focus: 'VO2 max base levels, transverse abs' },
      ],
    },
    {
      weekNumber: 2,
      phase: 'Load Volume Block',
      descriptor: 'Progressive Mechanical Tension Enrichment',
      status: 'Upcoming',
      focus: 'RPE 8-9 target, added eccentric loading, hypertrophy density.',
      days: [
        { id: '2-1', name: 'Day 1: Legs Density', status: 'upcoming', focus: 'Barbell speed trials, high hamstring volume' },
        { id: '2-2', name: 'Day 2: Pull Density', status: 'upcoming', focus: 'Rows to failures, heavy lat spreads' },
        { id: '2-3', name: 'Day 3: Push Density', status: 'upcoming', focus: 'Dumbbell volume limits, explosive overheads' },
        { id: '2-4', name: 'Day 4: Core High HRV', status: 'upcoming', focus: 'Aerobic threshold work, stability zones' },
      ],
    },
    {
      weekNumber: 3,
      phase: 'Neurological Peak Block',
      descriptor: 'Motor Unit Recruitment Peak PRs',
      status: 'Upcoming',
      focus: 'RPE 9.5-10 target, maximum CNS neural firing, compound limits.',
      days: [
        { id: '3-1', name: 'Day 1: Legs Heavy Peak', status: 'upcoming', focus: 'Squat peak targets, heavy box pins' },
        { id: '3-2', name: 'Day 2: Pull Heavy Peak', status: 'upcoming', focus: 'Deadlift mechanical peaks, speed trials' },
        { id: '3-3', name: 'Day 3: Push Heavy Peak', status: 'upcoming', focus: 'Bench press CNS thresholds' },
        { id: '3-4', name: 'Day 4: Active Recovery CNS', status: 'upcoming', focus: 'Mobility calibrations' },
      ],
    },
  ];

  const currentWeek = TIMELINE_WEEKS.find(w => w.weekNumber === selectedWeek) || TIMELINE_WEEKS[0];

  return (
    <div className="space-y-5 text-left animate-fade-in">
      
      {/* Timeline headers */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-gold-base font-semibold font-display">TRAINING PLAN TERMINAL</p>
        <h2 className="text-3xl font-extrabold text-[#F0F0F0] tracking-tight mt-1 font-display">
          Periodized Overview
        </h2>
      </div>

      {/* Week Tabs Toggles */}
      <div className="grid grid-cols-3 gap-2 bg-[#121212] p-1.5 rounded-xl border border-white/5 select-none">
        {TIMELINE_WEEKS.map((w) => (
          <button
            key={w.weekNumber}
            onClick={() => setSelectedWeek(w.weekNumber)}
            className={`py-2 px-1 text-center rounded-lg transition-all duration-150 ${
              selectedWeek === w.weekNumber
                ? 'bg-[#C9A84C] text-[#080808] font-black'
                : 'text-[#909090] text-xs font-bold hover:text-white'
            }`}
          >
            <p className="text-[10px] leading-tight font-mono">WEEK {w.weekNumber}</p>
            <p className="text-[9px] uppercase tracking-tighter mt-0.5 opacity-90 truncate font-display">
              {w.weekNumber === 1 ? 'Foundations' : w.weekNumber === 2 ? 'Volume Load' : 'CNS Peak'}
            </p>
          </button>
        ))}
      </div>

      {/* Phase Info Box */}
      <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-gold-base/15 relative overflow-hidden">
        <div className="absolute top-4 right-4 text-[9px] font-mono font-extrabold text-gold-base border border-gold-base/35 uppercase px-2 py-0.5 rounded-full">
          {currentWeek.status}
        </div>
        
        <p className="text-[9px] font-mono font-bold tracking-widest uppercase text-[#909090]">
          PHASE STRUCTURE // W{currentWeek.weekNumber}
        </p>
        <h3 className="text-lg font-black text-[#F0F0F0] mt-1 font-display leading-tight">
          {currentWeek.phase}
        </h3>
        <p className="text-xs text-gold-light font-medium mt-1 font-mono">
          {currentWeek.descriptor}
        </p>
        <div className="mt-3 text-xs text-[#909090] leading-relaxed border-t border-white/5 pt-3">
          <span className="font-bold text-[#D0D0D0] uppercase block mb-1 font-mono text-[9px] tracking-wide">Block Target Focus:</span>
          {currentWeek.focus}
        </div>
      </div>

      {/* Days Progress timeline card stack */}
      <div className="space-y-3">
        <p className="text-[10px] tracking-[0.25em] text-[#909090] font-extrabold uppercase font-mono">
          SCHEDULED DAYS DUAL MATRIX
        </p>

        <div className="relative border-l border-gold-base/15 ml-3 pl-5 space-y-4 py-1">
          {currentWeek.days.map((day) => {
            const isActive = day.status === 'active';
            const isCompleted = day.status === 'completed';

            return (
              <div 
                key={day.id}
                onClick={() => {
                  if (isActive) onSelectDayWorkout(day.name);
                }}
                className={`group relative bg-[#1A1A1A]/80 p-3.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                  isActive 
                    ? 'border-gold-base border-2 bg-[#1A1A1A] shadow-[0_0_15px_rgba(201,168,76,0.1)]' 
                    : isCompleted 
                    ? 'border-green-500/25 border opacity-75 hover:opacity-100 hover:border-gold-base/30' 
                    : 'border-white/5 hover:border-gold-base/30'
                }`}
              >
                {/* Visual Timeline Marker Node */}
                <span className="absolute -left-[27px] top-[18px] bg-[#080808] p-0.5 rounded-full z-10">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-500/10" strokeWidth={3} />
                  ) : isActive ? (
                    <span className="w-4 h-4 rounded-full border-2 border-gold-base bg-[#C9A84C] flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#080808] animate-ping"></span>
                    </span>
                  ) : (
                    <Circle className="w-4 h-4 text-[#444] fill-transparent" strokeWidth={2.5} />
                  )}
                </span>

                <div className="flex items-start justify-between gap-1.5">
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-extrabold tracking-tight ${isActive ? 'text-gold-light' : 'text-[#F0F0F0]'}`}>
                        {day.name}
                      </h4>
                      {isCompleted && (
                        <span className="text-[8px] bg-green-500/10 text-green-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                          DONE
                        </span>
                      )}
                      {isActive && (
                        <span className="text-[8px] bg-gold-base/10 text-gold-base px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider animate-pulse">
                          ACTIVE TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#808080] mt-1 pr-1 font-mono leading-relaxed">{day.focus}</p>
                  </div>
                  
                  {isActive && (
                    <span className="w-7 h-7 bg-[#C9A84C]/10 rounded-lg flex items-center justify-center text-gold-base transform group-hover:scale-105 transition">
                      <Eye className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

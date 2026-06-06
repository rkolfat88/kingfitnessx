import React, { useState, useEffect } from 'react';
import { Camera, Play, Square, RefreshCcw, CheckSquare, PlusSquare, ArrowRight, CheckCircle2, Trophy, Eye } from 'lucide-react';
import { Exercise } from '../types';

interface ActiveWorkoutProps {
  exercises: Exercise[];
  onSetToggle: (exerciseId: string, setIndex: number) => void;
  onNavigate: (screen: any) => void;
}

export function ActiveWorkout({ exercises, onSetToggle, onNavigate }: ActiveWorkoutProps) {
  const [activeExIndex, setActiveExIndex] = useState(0);
  
  // Timer states
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  const currentExercise = exercises[activeExIndex] || exercises[0];

  useEffect(() => {
    let t: any;
    if (timerActive && timerSeconds > 0) {
      t = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(t);
  }, [timerActive, timerSeconds]);

  // Hook completed set action to automatically trigger rest countdown
  const handleToggleSet = (exId: string, setIndex: number) => {
    onSetToggle(exId, setIndex);
    const wasCompleted = currentExercise.sets[setIndex].completed;
    if (!wasCompleted) {
      // Trigger dynamic athletic rest period countdown!
      setTimerSeconds(90);
      setTimerActive(true);
    }
  };

  const handleSkipTimer = () => {
    setTimerSeconds(0);
    setTimerActive(false);
  };

  const nextExercise = exercises[activeExIndex + 1];

  return (
    <div className="space-y-4 text-left animate-fade-in">
      {/* Exercise Toggle Rail */}
      <div className="flex gap-2 bg-[#121212] p-1.5 rounded-xl border border-white/5 overflow-x-auto no-scrollbar select-none whitespace-nowrap text-xs font-semibold">
        {exercises.map((ex, idx) => {
          const isSelected = activeExIndex === idx;
          const completedCount = ex.sets.filter(s => s.completed).length;
          const totalCount = ex.sets.length;
          const isExerciseCompleted = completedCount === totalCount;

          return (
            <button
              key={ex.id}
              onClick={() => {
                setActiveExIndex(idx);
                setTimerActive(false);
              }}
              className={`px-3 py-2 rounded-lg transition shrink-0 ${
                isSelected
                  ? 'bg-gold-base text-black font-extrabold'
                  : 'bg-[#1A1A1A] text-[#909090] border border-white/5 hover:border-gold-base/20'
              }`}
            >
              <span className="flex items-center gap-1.5 leading-tight">
                {isExerciseCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                {ex.name.split(' ').slice(-1)[0]}
                <span className={`text-[9px] px-1 font-mono rounded ${isSelected ? 'bg-black/10 text-black' : 'bg-black/40 text-gold-base'}`}>
                  {completedCount}/{totalCount}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Main workout arena card */}
      <div className="bg-[#1A1A1A] p-4 rounded-2xl border border-gold-base/15 relative overflow-hidden">
        {/* Decorative skeletal node icon floating */}
        <div className="absolute top-4 right-4 text-gold-base flex items-center gap-2">
          <span className="text-[9px] font-mono border border-gold-base/30 text-gold-base px-2 py-0.5 rounded-full uppercase tracking-wider">
            PLATE ID: OR4
          </span>
        </div>

        <p className="text-[9px] font-mono tracking-widest text-[#909090] uppercase font-bold">
          EXERCISE {activeExIndex + 1} OF {exercises.length}
        </p>
        <h3 className="text-xl font-extrabold text-[#F0F0F0] mt-1 font-display">
          {currentExercise.name}
        </h3>
        <p className="text-xs text-[#909090] mt-1 pr-10 font-mono">
          Target: <span className="text-gold-light font-bold">{currentExercise.targetReps}</span>
        </p>

        {/* Floating golden suggested weight pill */}
        <div className="mt-4 bg-[#B89234]/15 border border-gold-base/40 rounded-xl p-3 flex items-center justify-between text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gold-base/5 rounded-full blur-xl"></div>
          <div>
            <p className="text-[8px] uppercase tracking-widest font-mono text-gold-light font-extrabold leading-none">AI WEIGHT ADVICE</p>
            <p className="text-sm font-extrabold text-white mt-1.5 font-display flex items-center gap-1.5">
              <span>{currentExercise.suggestedWeight}</span>
            </p>
          </div>
          <div className="bg-gold-base text-[#080808] text-[9px] font-black uppercase font-mono px-2 py-1 rounded truncate leading-none">
            RPE 7.5 TARGET
          </div>
        </div>

        {/* Set checklist table logs */}
        <div className="mt-5 space-y-2.5">
          <p className="text-[9px] tracking-[0.2em] font-mono text-[#505050] font-bold">
            SET LOGGING ROWS (CHECK TO REGISTER)
          </p>

          <div className="space-y-2">
            {currentExercise.sets.map((set, setIndex) => (
              <div
                key={set.setNumber}
                onClick={() => handleToggleSet(currentExercise.id, setIndex)}
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition select-none ${
                  set.completed
                    ? 'bg-gold-base/5 border-gold-base/40 text-[#F0F0F0]'
                    : 'bg-[#121212] border-white/5 text-[#909090] hover:border-gold-base/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border transition ${
                    set.completed
                      ? 'border-gold-base bg-[#C9A84C] text-[#080808]'
                      : 'border-[#555] bg-transparent'
                  }`}>
                    {set.completed && <Trophy className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">
                    SET {set.setNumber}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono font-bold text-right">
                  <span>
                    <span className={set.completed ? 'text-white' : 'text-[#A0A0A0]'}>{set.weight}</span> lbs
                  </span>
                  <span className="text-gold-base">
                    {set.reps} reps
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rest Timer Overlay / Block */}
      {timerActive && (
        <div className="bg-[#0c0c0c] border border-gold-base/30 rounded-2xl p-4 flex items-center justify-between animate-bounce-short">
          <div className="text-left">
            <p className="text-[8px] font-mono font-extrabold tracking-widest text-gold-base uppercase">RECOVERY REST SYSTEM</p>
            <p className="text-3xl font-black text-[#F0F0F0] mt-1 font-mono leading-none">
              00:<span className="text-gold-base">{timerSeconds < 10 ? `0${timerSeconds}` : timerSeconds}</span>
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-[#909090] font-mono font-bold uppercase">ATP replenishing</span>
            <button
              onClick={handleSkipTimer}
              className="px-3 py-1.5 bg-[#222] text-[#F0F0F0] hover:text-[#080808] hover:bg-gold-base text-[10px] font-mono font-black rounded-lg transition"
            >
              SKIP
            </button>
          </div>
        </div>
      )}

      {/* Flagship Form Analysis Launcher Shortcut button */}
      <button
        onClick={() => onNavigate('form-analysis')}
        className="w-full bg-[#1A1A1A] p-3.5 border border-gold-base/20 rounded-2xl flex items-center justify-between hover:border-gold-base/50 transition duration-150"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold-base/10 border border-gold-base/40 text-gold-base rounded-full flex items-center justify-center relative">
            <Camera className="w-4 h-4 text-gold-base" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse border-2 border-[#1A1A1A]"></span>
          </div>
          <div className="text-left font-display">
            <p className="text-[9px] tracking-[0.1em] text-gold-base font-extrabold uppercase font-mono leading-none">POSE DETECTOR CAPABLE</p>
            <p className="text-sm font-black text-white mt-1 leading-none">LAUNCH LIVE FORM ANALYSIS</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-gold-base" />
      </button>

      {/* Next Up preview panel */}
      {nextExercise && (
        <div className="bg-[#121212] p-3.5 rounded-xl border border-white/5 flex items-center justify-between text-xs text-[#909090]">
          <span className="font-semibold font-mono">
            NEXT UP: <span className="text-white font-extrabold font-display">{nextExercise.name}</span>
          </span>
          <span className="text-[10px] text-gold-base uppercase font-mono font-bold tracking-wide">
            {nextExercise.sets.length} SETS
          </span>
        </div>
      )}
    </div>
  );
}

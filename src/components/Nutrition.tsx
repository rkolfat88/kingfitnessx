import React, { useState } from 'react';
import { Apple, Plus, AlertCircle, Utensils, MessageSquareText, FilePlus } from 'lucide-react';
import { Meal } from '../types';

interface NutritionProps {
  initialMeals: Meal[];
  onNavigate: (screen: any) => void;
  onSendPresetMessage: (text: string) => void;
}

export function Nutrition({ initialMeals, onNavigate, onSendPresetMessage }: NutritionProps) {
  const [meals, setMeals] = useState<Meal[]>(initialMeals);
  
  // Daily goals
  const targetCalories = 2800;
  const targetProtein = 200; // gold
  const targetCarbs = 300;
  const targetFat = 80;

  // Compute calculated values
  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat, 0);

  // Add dynamic quick meals helper
  const addQuickMeal = (mealType: 'shake' | 'chicken') => {
    let newMeal: Meal;
    if (mealType === 'shake') {
      newMeal = {
        id: `m-shake-${Date.now()}`,
        name: 'Whey Isolate Shake with Banana',
        calories: 310,
        protein: 32,
        carbs: 28,
        fat: 3,
        time: 'Just now',
      };
    } else {
      newMeal = {
        id: `m-chicken-${Date.now()}`,
        name: 'Grass-fed Lean Beef Ribeye & Jasmine Rice',
        calories: 780,
        protein: 58,
        carbs: 65,
        fat: 18,
        time: 'Just now',
      };
    }
    setMeals(prev => [...prev, newMeal]);
  };

  const proteinPct = Math.min((totalProtein / targetProtein) * 100, 100);
  const carbsPct = Math.min((totalCarbs / targetCarbs) * 100, 100);
  const fatPct = Math.min((totalFat / targetFat) * 100, 100);

  const calCircumference = 2 * Math.PI * 34;
  const calOffset = calCircumference - (Math.min(totalCalories / targetCalories, 1) * calCircumference);

  return (
    <div className="space-y-4 text-left animate-fade-in">
      
      {/* Title block */}
      <div>
        <p className="text-[10px] tracking-[0.2em] uppercase text-gold-base font-semibold font-display">NUTRITIONAL INTEL</p>
        <h2 className="text-3xl font-extrabold text-[#F0F0F0] tracking-tight mt-1 font-display">
          Macros Tracker
        </h2>
      </div>

      {/* Hero Calorie Center Circle Ring */}
      <div className="bg-[#1A1A1A] rounded-2xl p-4 border border-gold-base/15 grid grid-cols-2 gap-4 items-center relative overflow-hidden">
        {/* Circle vector */}
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="56" cy="56" r="34" className="stroke-[#222] fill-transparent" strokeWidth="6" />
            <circle
              cx="56"
              cy="56"
              r="34"
              className="fill-transparent stroke-gold-base transition-all duration-300"
              strokeWidth="6"
              strokeDasharray={calCircumference}
              strokeDashoffset={calOffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-xl font-black text-[#F0F0F0] font-mono leading-none">
              {totalCalories}
            </span>
            <span className="text-[8px] uppercase tracking-wider text-[#909090] font-extrabold mt-1">
              KCAL EATEN
            </span>
            <div className="w-6 h-0.5 bg-gold-base/30 mt-1"></div>
            <span className="text-[7px] text-[#505050] font-bold uppercase font-mono mt-0.5">
              Goal: {targetCalories}
            </span>
          </div>
        </div>

        {/* Nutritional values details */}
        <div className="space-y-3">
          {/* Protein in Gold */}
          <div>
            <div className="flex justify-between text-[10px] font-mono font-bold uppercase text-gold-light mb-1">
              <span>PROTEIN (GOLD TARGET)</span>
              <span>{totalProtein}g // {targetProtein}g</span>
            </div>
            <div className="w-full bg-[#111] h-2 rounded-full overflow-hidden border border-gold-base/5">
              <div 
                className="bg-gold-base h-full rounded-full transition-all duration-500"
                style={{ width: `${proteinPct}%` }}
              ></div>
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between text-[10px] font-mono font-semibold uppercase text-[#A0A0A0] mb-1">
              <span>CARBOHYDRATES</span>
              <span>{totalCarbs}g // {targetCarbs}g</span>
            </div>
            <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gray-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${carbsPct}%` }}
              ></div>
            </div>
          </div>

          {/* Fat */}
          <div>
            <div className="flex justify-between text-[10px] font-mono font-semibold uppercase text-[#A0A0A0] mb-1">
              <span>DIETARY FATS</span>
              <span>{totalFat}g // {targetFat}g</span>
            </div>
            <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gray-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${fatPct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* QUICK MEAL ADDERS FOR INTERACTION */}
      <div className="space-y-2 select-none">
        <p className="text-[9px] font-mono font-extrabold tracking-widest text-[#909090]">
          QUICK MACROS INJECTORS
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => addQuickMeal('shake')}
            className="p-2.5 bg-[#121212] border border-gold-base/15 rounded-xl text-left hover:border-gold-base text-xs font-bold font-mono text-white flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-gold-base" />
            <div className="truncate">
              <span className="text-gold-base shrink-0">+32g protein shake</span>
              <p className="text-[9px] text-[#505050] font-normal leading-none mt-0.5">Adds 310 kcal shake</p>
            </div>
          </button>
          
          <button
            onClick={() => addQuickMeal('chicken')}
            className="p-2.5 bg-[#121212] border border-gold-base/15 rounded-xl text-left hover:border-gold-base text-xs font-bold font-mono text-white flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-gold-base" />
            <div className="truncate">
              <span className="text-gold-base shrink-0">+58g beef jasmine rice</span>
              <p className="text-[9px] text-[#505050] font-normal leading-none mt-0.5">Adds 780 kcal meal</p>
            </div>
          </button>
        </div>
      </div>

      {/* Meal Logs section */}
      <div className="space-y-2">
        <p className="text-[9px] font-mono font-extrabold tracking-widest text-[#909090] uppercase">
          CHRONOLOGICAL MEAL LOGS ({meals.length})
        </p>

        <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
          {meals.map((meal) => (
            <div
              key={meal.id}
              className="bg-[#1A1A1A] p-3 rounded-xl border border-white/5 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#121212] flex items-center justify-center border border-[#333] shrink-0 text-gold-base">
                  <Utensils className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate pr-1">{meal.name}</h4>
                  <p className="text-[9px] text-[#808080] font-mono mt-0.5 uppercase tracking-tight">
                    {meal.time} // {meal.calories} KCAL
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0 font-mono text-[10px] font-extrabold text-gold-base">
                P: {meal.protein}g / C: {meal.carbs}g
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ASK THE NUTRITION COACH */}
      <button
        onClick={() => {
          onSendPresetMessage("Coach King, what is the best post-workout timing for my protein synthesis today?");
          onNavigate('coach-chat');
        }}
        className="w-full p-3.5 bg-gradient-to-r from-[#1A1A1A] to-[#121212] border border-gold-base/15 rounded-2xl flex items-center justify-between hover:border-gold-base/40 transition duration-150 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2.5">
          <MessageSquareText className="w-4.5 h-4.5 text-gold-base" />
          <div>
            <p className="text-[9px] tracking-wider text-[#909090] uppercase font-mono font-extrabold leading-none">PRE-SET QUERY SERVICE</p>
            <p className="text-xs font-bold text-white mt-1">"Analyze my glycemic index targets for post workout"</p>
          </div>
        </div>
        <Plus className="w-4 h-4 text-gold-base" />
      </button>

    </div>
  );
}

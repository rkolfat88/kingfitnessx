import React, { useState } from 'react';
import {
  Brain,
  Dumbbell,
  Utensils,
  Activity,
  MessageSquare,
} from 'lucide-react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import { ProtectedRoute } from './components/ProtectedRoute';

import { ScreenId, Message, WearableStats, Exercise, Meal } from './types';
import {
  INITIAL_WEARABLES,
  INITIAL_MESSAGES,
  INITIAL_EXERCISES,
  INITIAL_MEALS,
} from './mockData';

import MindScreen from './screens/MindScreen';
import { Dashboard } from './components/Dashboard';
import { FormAnalysis } from './components/FormAnalysis';
import { CoachChat } from './components/CoachChat';
import { Onboarding } from './components/Onboarding';
import { Timeline } from './components/Timeline';
import { ActiveWorkout } from './components/ActiveWorkout';
import { Nutrition } from './components/Nutrition';
import { Progress } from './components/Progress';
import { Paywall } from './components/Paywall';
import { Settings as SettingsComponent } from './components/Settings';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();
  // Mind is the first tab and entry point for new users
  const [activeScreen, setActiveScreen] = useState<ScreenId>('mind');
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [exercises, setExercises] = useState<Exercise[]>(INITIAL_EXERCISES);
  const [wearables, setWearables] = useState<WearableStats>(INITIAL_WEARABLES);
  const [streak, setStreak] = useState(12);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const handleNavigate = (screen: ScreenId) => setActiveScreen(screen);

  const handleSetToggle = (exerciseId: string, setIndex: number) => {
    setExercises(prev =>
      prev.map(ex => {
        if (ex.id !== exerciseId) return ex;
        const updatedSets = ex.sets.map((set, idx) =>
          idx !== setIndex ? set : { ...set, completed: !set.completed }
        );
        const firstUncompleted = updatedSets.findIndex(s => !s.completed);
        return {
          ...ex,
          sets: updatedSets,
          currentSetIndex: firstUncompleted === -1 ? updatedSets.length - 1 : firstUncompleted,
        };
      })
    );
  };

  const handleSendMessage = (text: string) => {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    let responseText = 'Solid work. Based on your recovery metrics today, focus on high movement efficiency with controlled tempo.';
    const lc = text.toLowerCase();
    if (lc.includes('back') || lc.includes('tight') || lc.includes('sore') || lc.includes('hurt')) {
      responseText = `I hear you. Let's dial down today's squat target by 15 lbs and focus on dynamic core bracing. Launch Live Form Analysis on your next set so I can inspect your spinal alignment.`;
    } else if (lc.includes('pr') || lc.includes('heavy') || lc.includes('max')) {
      responseText = `Your WHOOP readiness is at ${wearables.whoopReadiness}% — optimal for a PR attempt. Go for it, but keep your warm-up sets deliberate. Three ramp sets before your top attempt.`;
    } else if (lc.includes('sleep') || lc.includes('whoop') || lc.includes('hrv')) {
      responseText = `Your HRV is at ${wearables.whoopHrv}ms. Stretch your lower traps and posterior chain for 15 minutes post-session, and hit 40g of slow-digesting protein before bed for overnight recovery.`;
    } else if (lc.includes('carb') || lc.includes('eat') || lc.includes('food') || lc.includes('protein') || lc.includes('nutrition')) {
      responseText = `30–40g of fast carbs with 30g whey isolate, 45 minutes before your session. I've flagged your nutrition targets — check the Macros screen.`;
    } else if (lc.includes('rpe') || lc.includes('target')) {
      responseText = `RPE 7 means you finish the set with exactly 3 reps left in reserve. You're accelerating hard but not grinding. Keeps your CNS fresh for the next working set.`;
    }

    setTimeout(() => {
      const coachMsg: Message = {
        id: `c-${Date.now()}`,
        sender: 'coach',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, coachMsg]);
      setIsThinking(false);
    }, 1500);
  };

  const handleSendPresetMessage = (text: string) => handleSendMessage(text);

  const handleUpdateWearables = (stats: Partial<WearableStats>) =>
    setWearables(prev => ({ ...prev, ...stats }));

  const handleUpdateStreak = (val: number) => setStreak(val);
  const handleToggleUnlocked = () => setIsUnlocked(prev => !prev);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  // Bottom nav: Mind · Train · Fuel · Recover · Coach
  const navItems = [
    { id: 'mind' as ScreenId,           icon: Brain,          label: 'Mind'    },
    { id: 'active-workout' as ScreenId, icon: Dumbbell,       label: 'Train'   },
    { id: 'nutrition' as ScreenId,      icon: Utensils,       label: 'Fuel'    },
    { id: 'progress' as ScreenId,       icon: Activity,       label: 'Recover' },
    { id: 'coach-chat' as ScreenId,     icon: MessageSquare,  label: 'Coach'   },
  ];

  // Mind screen gets full-screen treatment — no app header, no padded wrapper.
  // PhaseZero and MindGym both have their own pt-12 headers and manage their
  // own scroll. The bottom nav (z-40) shows above them; PhaseZero's CTA
  // button is z-50 so it floats above the nav during onboarding.
  const isMindScreen = activeScreen === 'mind';

  return (
    <div className="min-h-screen bg-[#080808] text-[#F0F0F0] font-sans antialiased">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-50">
        <div className="absolute top-16 left-1/4 w-80 h-80 bg-[#C9A84C]/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#C9A84C]/4 rounded-full blur-[120px]" />
      </div>

      {/* Mobile-first centered layout */}
      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative">

        {/* App wordmark header — hidden on Mind (the Mind screen has its own header) */}
        {!isMindScreen && (
          <div className="shrink-0 text-center py-3 border-b border-[#C9A84C]/10 select-none bg-[#080808]/95 sticky top-0 z-30 backdrop-blur-sm">
            <p className="text-[8px] tracking-[0.35em] text-[#C9A84C] font-extrabold uppercase font-mono leading-none">
              ULTIMATE AI PERSONAL TRAINER
            </p>
            <h1 className="text-lg font-extrabold italic text-white tracking-widest mt-0.5 leading-none font-display">
              KING <span className="text-[#C9A84C]">AI</span> COACH
            </h1>
          </div>
        )}

        {/* Screen content */}
        {isMindScreen ? (
          /* Mind screen: no outer padding, no pt-5, fills flex-1 */
          <div className="flex-1 overflow-y-auto">
            <MindScreen />
          </div>
        ) : (
          /* All other screens: standard padded scroll container */
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-28">
            {activeScreen === 'dashboard' && (
              <Dashboard wearables={wearables} streak={streak} onNavigate={handleNavigate} />
            )}
            {activeScreen === 'form-analysis' && <FormAnalysis />}
            {activeScreen === 'coach-chat' && (
              <CoachChat messages={messages} onSendMessage={handleSendMessage} isThinking={isThinking} />
            )}
            {activeScreen === 'onboarding' && (
              <Onboarding
                onComplete={() => {
                  setIsUnlocked(true);
                  setActiveScreen('mind');
                }}
              />
            )}
            {activeScreen === 'timeline' && (
              <Timeline onSelectDayWorkout={() => setActiveScreen('active-workout')} />
            )}
            {activeScreen === 'active-workout' && (
              <ActiveWorkout
                exercises={exercises}
                onSetToggle={handleSetToggle}
                onNavigate={handleNavigate}
              />
            )}
            {activeScreen === 'nutrition' && (
              <Nutrition
                initialMeals={INITIAL_MEALS}
                onNavigate={handleNavigate}
                onSendPresetMessage={handleSendPresetMessage}
              />
            )}
            {activeScreen === 'progress' && <Progress />}
            {activeScreen === 'paywall' && (
              <Paywall
                isUnlocked={isUnlocked}
                onUnlockPremium={() => {
                  setIsUnlocked(true);
                  setActiveScreen('mind');
                }}
              />
            )}
            {activeScreen === 'settings' && (
              <SettingsComponent
                wearables={wearables}
                streak={streak}
                isUnlocked={isUnlocked}
                onUpdateWearables={handleUpdateWearables}
                onUpdateStreak={handleUpdateStreak}
                onToggleUnlocked={handleToggleUnlocked}
              />
            )}
          </div>
        )}

        {/* Fixed bottom navigation */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[64px] bg-[#0A0A0A]/95 border-t border-[#C9A84C]/10 px-6 flex items-center justify-between z-40 backdrop-blur-sm">
          {navItems.map(({ id, icon: Icon, label }) => {
            const active = activeScreen === id;
            return (
              <button
                key={id}
                onClick={() => handleNavigate(id)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${
                  active ? 'text-[#C9A84C] scale-110' : 'text-[#505050] hover:text-[#909090]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-wider leading-none">{label}</span>
              </button>
            );
          })}
        </div>

        {/* iOS-style home indicator line */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-1 flex justify-center items-end pb-1 pointer-events-none z-50">
          <div className="w-28 h-1 bg-[#333] rounded-full" />
        </div>

      </div>
    </div>
  );
}

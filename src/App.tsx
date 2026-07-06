import React, { useState } from 'react';
import {
  Brain, Dumbbell, Utensils, MessageSquare, Home,
  User, Settings as SettingsIcon, CreditCard, HelpCircle, LogOut,
} from 'lucide-react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';
import OnboardingChain from './components/onboarding/OnboardingChain';

import { ScreenId } from './types';
import type { TrainingDay } from './lib/coaching-engine/types';

import TodayScreen from './screens/TodayScreen';
import MindScreen from './screens/MindScreen';
import TrainScreen from './screens/TrainScreen';
import WorkoutLoggerScreen from './screens/WorkoutLoggerScreen';
import FuelScreen from './screens/FuelScreen';
import CheckinScreen from './screens/CheckinScreen';
import CoachChatScreen from './components/CoachChat';
import { Settings as SettingsComponent } from './components/Settings';
import UpgradeScreen from './screens/UpgradeScreen';

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading, isPasswordRecovery, signOut, onboardingCompleted, onboardingLoading, onboardingData, refreshOnboarding, accessState } = useAuth();
  const [activeScreen, setActiveScreen] = useState<ScreenId>('today');
  const [workoutDay, setWorkoutDay] = useState<TrainingDay | null>(null);
  const [workoutPlanId, setWorkoutPlanId] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const userInitials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() || 'K';

  // Expired trial/subscription: dashboard, progress, and history stay
  // read-only, but logging, chat, plan generation, and check-ins redirect
  // to the paywall instead of running.
  const gateOrRun = (screen: ScreenId, run: () => void) => {
    if (accessState === 'expired') {
      setActiveScreen('upgrade');
      return;
    }
    run();
  };

  const handleStartWorkout = (day: TrainingDay, planId: string | null) => {
    gateOrRun('workout-logger', () => {
      setWorkoutDay(day);
      setWorkoutPlanId(planId);
      setActiveScreen('workout-logger');
    });
  };

  const handleFinishWorkout = () => {
    setWorkoutDay(null);
    setWorkoutPlanId(null);
    setActiveScreen('active-workout');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CAFF40]/30 border-t-[#CAFF40] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || isPasswordRecovery) return <AuthScreen />;

  if (onboardingLoading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#CAFF40]/30 border-t-[#CAFF40] rounded-full animate-spin" />
      </div>
    );
  }

  if (!onboardingCompleted) {
    return <OnboardingChain onComplete={refreshOnboarding} savedData={onboardingData} />;
  }

  const navItems = [
    { id: 'today'          as ScreenId, icon: Home,          label: 'Today'  },
    { id: 'active-workout' as ScreenId, icon: Dumbbell,      label: 'Train'  },
    { id: 'nutrition'      as ScreenId, icon: Utensils,      label: 'Fuel'   },
    { id: 'mind'           as ScreenId, icon: Brain,         label: 'Mind'   },
    { id: 'coach-chat'     as ScreenId, icon: MessageSquare, label: 'Coach'  },
  ];

  // These screens manage their own full-viewport layout
  const isFullScreen = (
    activeScreen === 'today' ||
    activeScreen === 'mind' ||
    activeScreen === 'active-workout' ||
    activeScreen === 'nutrition' ||
    activeScreen === 'checkin' ||
    activeScreen === 'coach-chat' ||
    activeScreen === 'workout-logger' ||
    activeScreen === 'settings' ||
    activeScreen === 'upgrade'
  );

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans antialiased">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-50">
        <div className="absolute top-16 left-1/4 w-80 h-80 bg-[#CAFF40]/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#CAFF40]/4 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative">

        {/* Wordmark header — hidden on full-screen routes */}
        {!isFullScreen && (
          <div className="shrink-0 text-center py-2 border-b border-[#CAFF40]/10 select-none bg-[#000000]/95 sticky top-0 z-30 backdrop-blur-sm">
            <img
              src="/logo.jpg"
              alt="KFX — King Fitness Experience"
              className="h-11 w-11 mx-auto"
            />
          </div>
        )}

        {/* Screen content */}
        <div className={isFullScreen ? 'flex-1 overflow-y-auto' : 'flex-1 overflow-y-auto px-5 pt-5 pb-28'}>
          {activeScreen === 'today' && (
            <TodayScreen
              onNavigateToCheckin={() => gateOrRun('checkin', () => setActiveScreen('checkin'))}
              onNavigateToTrain={() => setActiveScreen('active-workout')}
              onNavigateToUpgrade={() => setActiveScreen('upgrade')}
              onAvatarPress={() => setShowMenu(true)}
              userInitials={userInitials}
            />
          )}
          {activeScreen === 'mind'           && <MindScreen onNavigateToCheckin={() => gateOrRun('checkin', () => setActiveScreen('checkin'))} />}
          {activeScreen === 'active-workout' && <TrainScreen onStartWorkout={handleStartWorkout} />}
          {activeScreen === 'workout-logger' && workoutDay && (
            <WorkoutLoggerScreen
              trainingDay={workoutDay}
              planId={workoutPlanId}
              onFinish={handleFinishWorkout}
            />
          )}
          {activeScreen === 'nutrition'  && <FuelScreen onNavigateToUpgrade={() => setActiveScreen('upgrade')} />}
          {activeScreen === 'checkin'    && (
            <CheckinScreen onBack={() => setActiveScreen('today')} />
          )}
          {activeScreen === 'coach-chat' && <CoachChatScreen />}
          {activeScreen === 'settings'   && <SettingsComponent onBack={() => setActiveScreen('today')} />}
          {activeScreen === 'upgrade'    && <UpgradeScreen onBack={() => setActiveScreen('today')} />}
        </div>

        {/* Bottom navigation — hidden during active workout */}
        <div className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[64px] bg-[#000000]/95 border-t border-[#CAFF40]/10 px-6 flex items-center justify-between z-40 backdrop-blur-sm transition-transform duration-200 ${activeScreen === 'workout-logger' ? 'translate-y-full' : ''}`}>
          {navItems.map(({ id, icon: Icon, label }) => {
            const active = activeScreen === id;
            return (
              <button
                key={id}
                onClick={() => id === 'coach-chat' ? gateOrRun(id, () => setActiveScreen(id)) : setActiveScreen(id)}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all duration-150 ${
                  active ? 'text-[#CAFF40] scale-110' : 'text-[#5C5C5C] hover:text-[#A0A0A0]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] uppercase font-bold tracking-wider leading-none">{label}</span>
              </button>
            );
          })}
        </div>

        {/* iOS home indicator */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-1 flex justify-center items-end pb-1 pointer-events-none z-50">
          <div className="w-28 h-1 bg-[#333] rounded-full" />
        </div>

        {/* Header menu overlay */}
        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMenu(false)}
            />
            {/* Sheet */}
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-[#141414] border-t border-[#CAFF40]/15 rounded-t-3xl pb-10 pt-2">
              {/* Handle */}
              <div className="w-10 h-1 bg-[#262626] rounded-full mx-auto mb-5" />

              {/* User header */}
              <div className="px-6 pb-4 border-b border-[#262626]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#CAFF40]/15 border border-[#CAFF40]/30 flex items-center justify-center">
                    <span className="text-sm font-black text-[#CAFF40]">{userInitials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#FFFFFF]">
                      {user?.user_metadata?.full_name || 'King'}
                    </p>
                    <p className="text-xs text-[#5C5C5C]">{user?.email}</p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="px-4 pt-2">
                {[
                  { icon: User,         label: 'Profile',      action: () => { setShowMenu(false); /* future */ } },
                  { icon: SettingsIcon, label: 'Settings',     action: () => { setShowMenu(false); setActiveScreen('settings') } },
                  { icon: CreditCard,   label: 'Subscription', action: () => { setShowMenu(false); setActiveScreen('upgrade') } },
                  { icon: HelpCircle,   label: 'Help',         action: () => { setShowMenu(false); /* future */ } },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className="w-full flex items-center gap-4 px-2 py-3.5 border-b border-[#141414] last:border-0 text-left transition-colors hover:text-[#CAFF40] active:opacity-70"
                  >
                    <item.icon className="w-4 h-4 text-[#5C5C5C]" />
                    <span className="text-sm font-semibold text-[#FFFFFF]">{item.label}</span>
                  </button>
                ))}

                {/* Sign Out — separated */}
                <div className="mt-2 pt-2 border-t border-[#141414]">
                  <button
                    onClick={async () => { setShowMenu(false); await signOut() }}
                    className="w-full flex items-center gap-4 px-2 py-3.5 text-left transition-colors active:opacity-70"
                  >
                    <LogOut className="w-4 h-4 text-[#EF4444]/70" />
                    <span className="text-sm font-semibold text-[#EF4444]/80">Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}

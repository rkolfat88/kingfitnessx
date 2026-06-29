import React, { useState } from 'react';
import { Brain, Dumbbell, Utensils, Activity, MessageSquare } from 'lucide-react';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthScreen } from './components/AuthScreen';

import { ScreenId } from './types';

import MindScreen from './screens/MindScreen';
import TrainScreen from './screens/TrainScreen';
import FuelScreen from './screens/FuelScreen';
import CheckinScreen from './screens/CheckinScreen';
import CoachChatScreen from './components/CoachChat';
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
  const [activeScreen, setActiveScreen] = useState<ScreenId>('mind');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthScreen />;

  const navItems = [
    { id: 'mind'          as ScreenId, icon: Brain,          label: 'Mind'     },
    { id: 'active-workout'as ScreenId, icon: Dumbbell,       label: 'Train'    },
    { id: 'nutrition'     as ScreenId, icon: Utensils,       label: 'Fuel'     },
    { id: 'checkin'       as ScreenId, icon: Activity,       label: 'Check-in' },
    { id: 'coach-chat'    as ScreenId, icon: MessageSquare,  label: 'Coach'    },
  ];

  // These screens manage their own full-viewport layout
  const isFullScreen = (
    activeScreen === 'mind' ||
    activeScreen === 'active-workout' ||
    activeScreen === 'nutrition' ||
    activeScreen === 'checkin' ||
    activeScreen === 'coach-chat'
  );

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F0F0F0] font-sans antialiased">
      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden select-none opacity-50">
        <div className="absolute top-16 left-1/4 w-80 h-80 bg-[#C9A84C]/4 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-[#C9A84C]/4 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[430px] mx-auto min-h-screen flex flex-col relative">

        {/* Wordmark header — hidden on full-screen routes */}
        {!isFullScreen && (
          <div className="shrink-0 text-center py-3 border-b border-[#C9A84C]/10 select-none bg-[#070B14]/95 sticky top-0 z-30 backdrop-blur-sm">
            <p className="text-[8px] tracking-[0.35em] text-[#C9A84C] font-extrabold uppercase font-mono leading-none">
              PERFORMANCE OPERATING SYSTEM
            </p>
            <h1 className="text-lg font-extrabold italic text-white tracking-widest mt-0.5 leading-none font-display">
              KFX
            </h1>
          </div>
        )}

        {/* Screen content */}
        <div className={isFullScreen ? 'flex-1 overflow-y-auto' : 'flex-1 overflow-y-auto px-5 pt-5 pb-28'}>
          {activeScreen === 'mind'          && <MindScreen onNavigateToCheckin={() => setActiveScreen('checkin')} />}
          {activeScreen === 'active-workout'&& <TrainScreen />}
          {activeScreen === 'nutrition'     && <FuelScreen />}
          {activeScreen === 'checkin'       && <CheckinScreen />}
          {activeScreen === 'coach-chat'    && <CoachChatScreen />}
          {activeScreen === 'settings'      && <SettingsComponent />}
        </div>

        {/* Bottom navigation */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-[64px] bg-[#0A0A0A]/95 border-t border-[#C9A84C]/10 px-6 flex items-center justify-between z-40 backdrop-blur-sm">
          {navItems.map(({ id, icon: Icon, label }) => {
            const active = activeScreen === id;
            return (
              <button
                key={id}
                onClick={() => setActiveScreen(id)}
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

        {/* iOS home indicator */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-1 flex justify-center items-end pb-1 pointer-events-none z-50">
          <div className="w-28 h-1 bg-[#333] rounded-full" />
        </div>

      </div>
    </div>
  );
}

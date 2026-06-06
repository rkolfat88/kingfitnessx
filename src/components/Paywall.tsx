import React, { useState } from 'react';
import { ShieldCheck, Award, Zap, Check, ChevronRight, HelpCircle, Lock } from 'lucide-react';

interface PaywallProps {
  onUnlockPremium: () => void;
  isUnlocked: boolean;
}

export function Paywall({ onUnlockPremium, isUnlocked }: PaywallProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const priceVal = billingCycle === 'monthly' ? '$19.99' : '$14.99';
  const priceSubtitle = billingCycle === 'monthly' ? 'billed month-to-month' : 'billed annually ($179.88/yr)';

  return (
    <div className="space-y-4 text-left animate-fade-in relative">
      
      {/* Crown emblem image or badge */}
      <div className="text-center py-2">
        <div className="w-12 h-12 bg-gold-base/10 text-gold-base border border-gold-base rounded-full flex items-center justify-center mx-auto shadow-lg shadow-gold-base/20">
          <Zap className="w-6 h-6 fill-current animate-pulse" />
        </div>
        <p className="text-[10px] tracking-[0.25em] text-gold-base font-extrabold uppercase mt-3 font-mono">UNLOCK ULTIMATE ACCESS</p>
        <h2 className="text-2xl font-black text-white font-display mt-0.5 uppercase tracking-tight">KING PRO ARCHITECTURE</h2>
      </div>

      {isUnlocked ? (
        <div className="bg-[#0A3D24]/80 border border-green-500/45 p-6 rounded-2xl text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6 stroke-[3]" />
          </div>
          <h3 className="text-lg font-black font-display text-white uppercase">Athletic License: Unlocked</h3>
          <p className="text-xs text-gray-300">
            You are currently configured as a **King Pro Athlete**. Fully adaptive WHOOP algorithms, live kinetic form tracking, and priority access to Coach King are active.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Feature highlights rows */}
          <div className="bg-[#1A1A1A] p-4 rounded-xl border border-gold-base/15 space-y-3.5">
            {[
              { title: 'Biomechanical Pose Overlay SDK', desc: 'Real-time joint-angle node analysis tracking deep squats, brace alignment, & lockout errors.' },
              { title: 'Personalized Adaptive Wearables Feed', desc: 'Direct WHOOP/Oura APIs connection. Autonomously re-calculates RPE set loads before every push session.' },
              { title: 'Coach King Conversational AI', desc: 'Unlimited smart discussions, personalized target adjustments, meal recipes, and direct chat guidance.' },
            ].map((feature, i) => (
              <div key={i} className="flex gap-3 text-left">
                <div className="w-5 h-5 bg-gold-base rounded-full flex items-center justify-center text-[#080808] shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[4]" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-[#F0F0F0] font-display">{feature.title}</h4>
                  <p className="text-[10px] leading-relaxed text-[#909090] mt-0.5">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Toggle Cycle tabs */}
          <div className="grid grid-cols-2 gap-2 bg-[#121212] p-1 rounded-xl border border-white/5 select-none">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`py-2 text-center text-xs font-bold rounded-lg transition duration-150 ${
                billingCycle === 'monthly' ? 'bg-[#C9A84C] text-[#080808] font-black' : 'text-[#808080]'
              }`}
            >
              MONTHLY ($19.99/MO)
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`py-2 text-center text-xs font-bold rounded-lg transition duration-150 ${
                billingCycle === 'yearly' ? 'bg-[#C9A84C] text-[#080808] font-black' : 'text-[#808080]'
              }`}
            >
              YEARLY SAVINGS ($14.99/MO)
            </button>
          </div>

          {/* Golden Trial Timeline indicators - extreme trust badge */}
          <div className="bg-[#121212] p-4 rounded-xl border border-white/5 text-left relative">
            <p className="text-[8px] tracking-widest font-mono text-gold-base font-extrabold uppercase">TRANSPARENT TRIAL PROCESS</p>
            <h4 className="text-xs font-bold text-white mt-1">14-Day Free Gold Trial</h4>
            
            <div className="relative mt-4 mb-2 h-1 bg-[#222] rounded-full">
              <div className="absolute left-0 top-0 h-full bg-gold-base w-1/2 rounded-full"></div>
              
              {/* Timeline nodes */}
              <span className="absolute left-0 -top-1 w-3 h-3 bg-gold-base rounded-full border border-black flex items-center justify-center"></span>
              <span className="absolute left-1/2 -top-1 w-3 h-3 bg-gold-base rounded-full border border-black flex items-center justify-center"></span>
              <span className="absolute right-0 -top-1 w-3 h-3 bg-[#333] rounded-full border border-black"></span>
            </div>

            <div className="flex justify-between text-[8px] font-mono font-bold uppercase text-[#707070]">
              <span className="text-gold-light">Day 0 // Activation</span>
              <span className="text-gold-light">Day 12 // Trial Reminder</span>
              <span>Day 14 // First Bill</span>
            </div>

            <p className="text-[9px] text-[#A0A0A0] mt-3 italic leading-relaxed">
              *Cancel with a single tap inside Settings. Zero dark patterns. We will send you an email reminder 2 days before the trial completes.
            </p>
          </div>

          {/* Activating Trial triggers simulation */}
          <button
            onClick={onUnlockPremium}
            className="w-full py-4 bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-extrabold uppercase tracking-widest text-xs rounded-full transition-all duration-150 shadow-[0_0_15px_rgba(201,168,76,0.1)] active:scale-95"
          >
            START 14-DAY FREE TRIAL
          </button>

          <p className="text-[9.5px] text-[#505050] text-center uppercase tracking-wide font-mono font-extrabold">
            Secure payment via Stripe · Cancel anytime in Settings
          </p>
        </div>
      )}

    </div>
  );
}

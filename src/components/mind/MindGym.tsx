import React, { useState, useEffect } from 'react';
import { Brain, Shield, Zap, Heart, ChevronRight, Target } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import ComebackProtocol from './tools/ComebackProtocol';
import TwoMinuteDoorway from './tools/TwoMinuteDoorway';
import FearAudit from './tools/FearAudit';
import SelfCompassionReset from './tools/SelfCompassionReset';

interface MindGymProps {
  mindProfile: any;
  onRefresh: () => void;
  onNavigateToCheckin?: () => void;
}

function getDailyPrimer(motivationLevel: number, identityStatement: string): string {
  if (motivationLevel <= 2) return `Floor Mode. Today's only task: show up for 2 minutes. Not to train — to prove to your nervous system that starting is still safe. "${identityStatement || 'the person you are becoming'}" shows up even on the worst days. Especially on those days.`;
  if (motivationLevel <= 4) return `Low energy is not failure — it's information. We scale back today. Shorter session, lower intensity, same commitment. The goal today is not performance. It's continuity. One more vote for "${identityStatement || 'who you are becoming'}".`;
  if (motivationLevel <= 6) return `Steady state. This is where most transformations are actually built — not in the peak days, but in the consistent middle ones. Show up, do the work, go home. "${identityStatement || 'The person you are becoming'}" doesn't need to be inspired. Just present.`;
  if (motivationLevel <= 8) return `Good energy today. Use it. Push the session. This is the day to add weight, go harder, stay longer. Your nervous system is primed. "${identityStatement || 'The person you are becoming'}" takes full advantage of days like this.`;
  return `Peak state. This is the day for the hard thing — the weight you've been avoiding, the extra set, the thing that scares you slightly. "${identityStatement || 'The person you are becoming'}" remembers this day. Make it count.`;
}

type ActiveTool = 'comeback' | 'doorway' | 'fear' | 'compassion' | null;

export default function MindGym({ mindProfile, onRefresh, onNavigateToCheckin }: MindGymProps) {
  const { user } = useAuth();
  const [todayCheckin, setTodayCheckin] = useState<any>(null);
  const [motivationLevel, setMotivationLevel] = useState(5);
  const [aiPrimer, setAiPrimer] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);

  useEffect(() => {
    loadTodayCheckin();
  }, []);

  const loadTodayCheckin = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('mind_checkins')
      .select('*')
      .eq('user_id', user.id)
      .eq('checkin_date', today)
      .single();
    if (data) {
      setTodayCheckin(data);
      setSubmitted(true);
      if (data.ai_response) setAiPrimer(data.ai_response);
    }
  };

  const getMindScore = () => mindProfile?.mind_score ?? 50;

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { label: 'Locked In', color: '#22C55E' };
    if (score >= 60) return { label: 'Building', color: '#C9A84C' };
    if (score >= 40) return { label: 'Steady', color: '#F97316' };
    return { label: 'Rebuilding', color: '#EF4444' };
  };

  const scoreInfo = getScoreLabel(getMindScore());

  const getMotivationMessage = (level: number) => {
    if (level <= 2) return { msg: "Floor Mode activated. Today's only job: show up for 2 minutes.", color: '#EF4444', mode: 'floor' };
    if (level <= 4) return { msg: "Low energy day. We scale back and protect the streak.", color: '#F97316', mode: 'scaled' };
    if (level <= 6) return { msg: "Steady state. Consistency over intensity today.", color: '#C9A84C', mode: 'steady' };
    if (level <= 8) return { msg: "Good energy. Push today's session.", color: '#22C55E', mode: 'push' };
    return { msg: "Peak state. This is the moment for the hard thing.", color: '#22C55E', mode: 'peak' };
  };

  const motivationInfo = getMotivationMessage(motivationLevel);

  const handleDailyPrimer = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const response = getDailyPrimer(motivationLevel, mindProfile?.identity_statement || '');
      setAiPrimer(response);

      // Still save the check-in to Supabase (no API needed)
      const today = new Date().toISOString().split('T')[0];
      await supabase.from('mind_checkins').upsert({
        user_id: user.id,
        checkin_date: today,
        motivation_level: motivationLevel,
        identity_vote: motivationLevel >= 3,
        ai_response: response,
      }, { onConflict: 'user_id,checkin_date' });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#070B14] pb-24">
      <div className="px-5 pt-12 pb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#8899BB] mb-1">Mind Gym</p>
        <h1 className="text-3xl font-black text-[#F0F4FF]">Mental Performance</h1>
      </div>

      <div className="px-5 space-y-4">
        {/* Mind Score Card */}
        <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#8899BB]">Mind Score</p>
            <button className="text-xs text-[#C9A84C]">Details →</button>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="26" fill="none" stroke="#1A2236" strokeWidth="6" />
                <circle
                  cx="32" cy="32" r="26" fill="none"
                  stroke={scoreInfo.color} strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 26}`}
                  strokeDashoffset={`${2 * Math.PI * 26 * (1 - getMindScore() / 100)}`}
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-[#F0F4FF]">{getMindScore()}</span>
              </div>
            </div>
            <div>
              <p className="text-xl font-black" style={{ color: scoreInfo.color }}>{scoreInfo.label}</p>
              <p className="text-xs text-[#8899BB] mt-1">"{mindProfile?.identity_statement || 'Set your identity in Phase Zero'}"</p>
            </div>
          </div>
        </div>

        {/* Daily Motivation Check */}
        {!submitted ? (
          <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-5">
            <p className="text-sm font-semibold text-[#F0F4FF] mb-1">How's your mind today?</p>
            <p className="text-xs text-[#8899BB] mb-4">Be honest. This changes your entire program.</p>

            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#445577]">Barely here</span>
              <span className="text-lg font-black" style={{ color: motivationInfo.color }}>{motivationLevel}/10</span>
              <span className="text-xs text-[#445577]">Locked in</span>
            </div>

            <input
              type="range" min="1" max="10" value={motivationLevel}
              onChange={e => setMotivationLevel(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer mb-3"
              style={{ accentColor: '#C9A84C', background: '#1A2236' }}
            />

            <div className="bg-[#070B14] rounded-xl px-3 py-2 mb-4">
              <p className="text-xs" style={{ color: motivationInfo.color }}>{motivationInfo.msg}</p>
            </div>

            <button
              onClick={handleDailyPrimer}
              disabled={loading}
              className="w-full bg-[#C9A84C] hover:bg-[#E8C76A] disabled:opacity-40 text-black font-bold py-3 rounded-xl text-sm transition-all"
            >
              {loading ? 'Getting your primer...' : "Get Today's Mental Primer"}
            </button>
          </div>
        ) : null}

        {/* AI Primer */}
        {aiPrimer && (
          <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-[#C9A84C]" />
              </div>
              <span className="text-xs font-semibold text-[#C9A84C]">Today's Mental Primer</span>
            </div>
            <p className="text-sm text-[#F0F4FF] leading-relaxed">{aiPrimer}</p>
          </div>
        )}

        {/* Check-in prompt */}
        {aiPrimer && (
          <button
            onClick={() => onNavigateToCheckin?.()}
            className="w-full bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-bold text-[#F0F4FF]">Log today's readiness</p>
              <p className="text-xs text-[#8899BB]">Adapts today's training session</p>
            </div>
            <ChevronRight className="w-4 h-4 text-[#C9A84C]" />
          </button>
        )}

        {/* Identity Statement */}
        {mindProfile?.identity_statement && (
          <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-2xl p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-2">Your Identity</p>
            <p className="text-base font-semibold text-[#F0F4FF] italic">"{mindProfile.identity_statement}"</p>
          </div>
        )}

        {/* Mind Tools */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#8899BB] mb-3">Mind Tools</p>
          <div className="space-y-2">
            {[
              { icon: Shield, label: "Comeback Protocol", desc: "For the day after you miss", color: "#3B82F6", tool: 'comeback' as ActiveTool },
              { icon: Zap, label: "2-Minute Doorway", desc: "When you can't start", color: "#22C55E", tool: 'doorway' as ActiveTool },
              { icon: Target, label: "Fear Audit", desc: "Name it to manage it", color: "#F97316", tool: 'fear' as ActiveTool },
              { icon: Heart, label: "Self-Compassion Reset", desc: "Stop punishing, start building", color: "#C9A84C", tool: 'compassion' as ActiveTool },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => setActiveTool(item.tool)}
                className="w-full bg-[#111827] border border-[#1E2D40] hover:border-[#C9A84C]/30 rounded-xl p-4 flex items-center gap-3 transition-all text-left"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                  <item.icon className="w-4 h-4" style={{ color: item.color }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#F0F4FF]">{item.label}</p>
                  <p className="text-xs text-[#8899BB]">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#445577]" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTool === 'comeback' && <ComebackProtocol onClose={() => setActiveTool(null)} />}
      {activeTool === 'doorway' && <TwoMinuteDoorway onClose={() => setActiveTool(null)} />}
      {activeTool === 'fear' && <FearAudit onClose={() => setActiveTool(null)} />}
      {activeTool === 'compassion' && <SelfCompassionReset onClose={() => setActiveTool(null)} />}
    </div>
  );
}

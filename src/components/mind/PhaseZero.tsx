import React, { useState } from 'react';
import { Brain, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PhaseZeroProps {
  mindProfile: any;
  onComplete: () => void;
}

const DAYS = [
  {
    day: 1,
    title: "The Honest Mirror",
    subtitle: "No filters. No judgment. Just truth.",
    icon: "🪞",
    color: "#C9A84C",
    questions: [
      { id: "quit_count", type: "select", question: "How many times have you started and quit a fitness program?", options: ["This is my first time", "1-2 times", "3-5 times", "More than 5 times", "I've lost count"] },
      { id: "inner_voice", type: "select", question: "When you skip a workout, the voice in your head says:", options: ["'I'll do it tomorrow'", "'I knew I couldn't do this'", "'I'm too tired, it's fine'", "'I don't even care anymore'", "'Tomorrow I restart for real'"] },
      { id: "training_reason", type: "select", question: "When you trained before, it felt like:", options: ["Punishing myself for how I look", "Building something I'm proud of", "Proving something to someone", "I don't know — I just did it", "I've never really trained consistently"] },
      { id: "belief", type: "select", question: "Honestly — do you believe you can change your body?", options: ["Yes, completely", "Most days yes", "I want to but I'm not sure", "Not really", "I've given up believing"] },
    ],
    insight: "This matters because every program you've been given was built for someone else. This one gets built around the person you actually are right now.",
  },
  {
    day: 2,
    title: "The Identity Install",
    subtitle: "You don't rise to your goals. You fall to your identity.",
    icon: "👑",
    color: "#C9A84C",
    questions: [
      { id: "current_identity", type: "select", question: "Right now, when someone asks if you work out, you say:", options: ["'Yeah I go to the gym'", "'I used to'", "'I'm trying to get back into it'", "'Not really'", "'I've been meaning to start'"] },
      { id: "future_identity", type: "text", question: "In 6 months, the person you want to be would describe themselves as:", placeholder: "e.g. 'Someone who shows up for themselves no matter what'" },
      { id: "identity_evidence", type: "text", question: "What's one thing you've done in your life that proves you can do hard things?", placeholder: "Anything counts — doesn't have to be fitness related" },
    ],
    insight: "Every action you take from here is a vote for the identity you just wrote. Not a step toward a number — a vote for a person.",
  },
  {
    day: 3,
    title: "The Two-Minute Doorway",
    subtitle: "The goal today is not exercise. The goal is to prove starting is safe.",
    icon: "🚪",
    color: "#22C55E",
    questions: [
      { id: "starting_barrier", type: "select", question: "The biggest reason you don't start when you plan to:", options: ["I'm too tired when the time comes", "I don't have enough time", "I don't feel ready", "The gym feels intimidating", "I just lose motivation out of nowhere"] },
      { id: "two_min_action", type: "select", question: "Your only task today is ONE of these. Which can you do?", options: ["Put on your gym shoes and stand up", "Do 10 bodyweight squats right now", "Walk outside for 2 minutes", "Do 5 push-ups (on your knees is fine)", "Stretch your arms above your head for 60 seconds"] },
      { id: "time_of_day", type: "select", question: "When did you read this?", options: ["Morning (before 10am)", "Midday (10am-2pm)", "Afternoon (2pm-6pm)", "Evening (6pm-10pm)", "Late night"] },
    ],
    insight: "Your nervous system learns from evidence. Right now it believes starting hurts. Today we teach it that starting is small, safe, and doable. That's the whole lesson.",
  },
  {
    day: 4,
    title: "The Fear Audit",
    subtitle: "Fear unnamed is fear in control. Fear named is fear managed.",
    icon: "🔦",
    color: "#F97316",
    questions: [
      { id: "fears", type: "multi", question: "Select every fear that applies to you (be honest):", options: ["Looking stupid or inexperienced at the gym", "Getting injured again", "Failing after telling people I'm doing this", "Finding out I'm weaker than I hoped", "Being too far gone to change", "Looking at myself in the mirror", "People judging my body"] },
      { id: "biggest_fear", type: "select", question: "The one that scares you most:", options: ["Looking stupid", "Getting injured", "Failing publicly", "Discovering my limits", "Being too far gone", "My own reflection", "Other people's judgment"] },
      { id: "past_moment", type: "text", question: "Describe one moment when you overcame something you were afraid of:", placeholder: "Anything in your life — doesn't have to be fitness" },
    ],
    insight: "Every fear you just named is solvable. We will address each one specifically. Fear is just a prediction about the future. Your past proves the prediction is often wrong.",
  },
  {
    day: 5,
    title: "The Energy Map",
    subtitle: "Not when you should train. When your body actually has something to give.",
    icon: "⚡",
    color: "#C9A84C",
    questions: [
      { id: "energy_morning", type: "select", question: "Your energy level before 10am is usually:", options: ["High — I'm a morning person", "Medium — manageable", "Low — I need time to wake up", "Very low — mornings are brutal"] },
      { id: "energy_afternoon", type: "select", question: "Your energy level from 2-5pm is usually:", options: ["High — I get a second wind", "Medium — steady", "Low — afternoon crash", "Very low — I want to nap"] },
      { id: "energy_evening", type: "select", question: "Your energy level from 6-9pm is usually:", options: ["High — evenings are my best time", "Medium — decent", "Low — I'm winding down", "Very low — I'm done by then"] },
      { id: "real_window", type: "text", question: "Be honest: when do you actually have 20 minutes that are yours?", placeholder: "e.g. '7am before the kids wake up' or '8pm after dinner'" },
    ],
    insight: "Your program will be scheduled around your actual energy, not an ideal version of your day. An honest 20 minutes beats an aspirational 60 minutes you never do.",
  },
  {
    day: 6,
    title: "The Failure Plan",
    subtitle: "You will miss a day. Here is exactly what happens: nothing bad.",
    icon: "🛡️",
    color: "#3B82F6",
    questions: [
      { id: "miss_pattern", type: "select", question: "When you've quit fitness programs before, how did it usually start?", options: ["One missed day became 'I'll restart Monday'", "Life got busy and I never came back", "I got injured and lost momentum", "I stopped seeing results and gave up", "I don't know — it just faded"] },
      { id: "inner_critic", type: "select", question: "The day after you miss a workout, the hardest thing is:", options: ["The voice saying 'you failed again'", "Feeling like I ruined my progress", "Not knowing how to get back on track", "Embarrassment about telling people", "Just feeling like giving up entirely"] },
      { id: "comeback_word", type: "text", question: "Write one sentence to yourself for the day after you miss a workout:", placeholder: "Write what you wish someone had said to you when you quit before" },
    ],
    insight: "The one rule: never miss twice. One missed day is rest. Two is a habit. We just wrote your comeback. It's already here for you when you need it.",
  },
  {
    day: 7,
    title: "The First Vote",
    subtitle: "Not a workout. A declaration of who you are becoming.",
    icon: "🔥",
    color: "#C9A84C",
    questions: [
      { id: "readiness", type: "select", question: "Right now, your mind feels:", options: ["Ready — let's do this", "Nervous but willing", "Still unsure but here", "Not really ready but trying anyway"] },
      { id: "commitment", type: "select", question: "The version of you that reads this 6 months from now will:", options: ["Thank me for starting today", "Wonder why I waited so long", "Be proud I didn't give up again", "Be exactly who I said I wanted to become"] },
      { id: "first_action", type: "text", question: "Write your first workout action today (even 5 minutes counts):", placeholder: "e.g. '10 minute walk', '5 push-ups', 'Go to the gym for any amount of time'" },
    ],
    insight: "This is your first vote. Not for results — for your identity. The person you wrote on Day 2 just showed up. That's who casts this vote.",
  },
];

function getMindCoachResponse(day: number, answers: Record<string, any>): string {
  const responses: Record<number, (a: Record<string, any>) => string> = {
    1: (a) => {
      const quitCount = a.quit_count || '';
      const belief = a.belief || '';
      if (belief.includes('given up')) return "The fact that you answered honestly already separates you from most people who open this app. You haven't given up — you're here. That's the only evidence that matters right now. Tomorrow we build on it.";
      if (quitCount.includes('lost count')) return "Every restart taught you something, even when it felt like failure. The pattern ends not with more willpower — but with a different system. That's what we're building. One that works for who you actually are.";
      if (quitCount.includes('first time')) return "Starting with no prior quits is an advantage — no bad patterns to unlearn. You get to build this right from the beginning. Tomorrow we decide who you're becoming.";
      return "Honesty is the foundation everything else gets built on. Most people lie to fitness apps and wonder why the app doesn't work. You just gave us the truth. Now we can actually help.";
    },
    2: (a) => {
      const identity = a.future_identity || '';
      const evidence = a.identity_evidence || '';
      if (identity && evidence) return `"${identity}" — that's not a goal. That's a person. And the evidence you gave proves you already know how to do hard things. Every action from here is a vote for that person. We'll remind you of this on the days you forget.`;
      if (identity) return `"${identity}" — write that somewhere you'll see it. Not on your phone. Somewhere physical. That's who casts every vote from now on.`;
      return "Identity is the engine that makes habits run automatically. You just installed yours. The next 5 days are about casting votes for the person you just described.";
    },
    3: (a) => {
      const action = a.two_min_action || '';
      if (action.includes('push-ups') || action.includes('squats')) return "You just proved to your nervous system that starting doesn't hurt. That's the entire lesson. Your body didn't resist. It never does — only the mind does. And today the mind lost.";
      if (action.includes('shoes')) return "Putting on your shoes is not a small thing. It's a signal to your entire nervous system that movement is happening. You'll be surprised how often that's the hardest part.";
      return "The two-minute doorway works because it makes saying no harder than saying yes. You just walked through it. Tomorrow we talk about what's actually standing between you and showing up.";
    },
    4: (a) => {
      const fears = a.fears || [];
      const biggest = a.biggest_fear || '';
      if (biggest.includes('stupid') || (Array.isArray(fears) && fears.includes('Looking stupid or inexperienced at the gym'))) return "Everyone at the gym is focused on themselves — not you. The people who look most confident were beginners six months ago. Fear of looking stupid has kept more people weak than any injury ever has. We're dismantling that today.";
      if (biggest.includes('injured') || biggest.includes('injury')) return "Injury fear is smart fear — it kept you alive. But it becomes a problem when it stops all movement. We'll build your program around this: gradual load, movement quality first, never ego over safety.";
      if (biggest.includes('failing publicly')) return "You told people before and it didn't work out. That memory is loud. This time, the only person who needs to know is you — until the results speak for themselves.";
      if (biggest.includes('too far gone')) return "Nobody is too far gone. That thought is your fear talking, not your biology. The human body responds to training at any age, any starting point. The research on this is unambiguous.";
      return "You named your fears. That's more self-awareness than most people bring to a decade of gym memberships. Named fears are manageable fears. Tomorrow we find your real training window.";
    },
    5: (a) => {
      const window = a.real_window || '';
      const morning = a.energy_morning || '';
      const evening = a.energy_evening || '';
      if (window) return `"${window}" — that's your window. Not the aspirational one. The real one. Your entire program gets scheduled around that. An honest 20 minutes beats a perfect 60 minutes you never do.`;
      if (morning.includes('morning person')) return "Morning training has the highest consistency rate of any time window. Your body is already primed. We'll build around this.";
      if (evening.includes('evenings are my best time')) return "Evening trainers often show the most strength. Your nervous system is warmed up from the day. We'll work with your natural rhythm.";
      return "Your energy map is now locked in. No more scheduling workouts at times your body has nothing to give. That single change eliminates one of the biggest sources of missed sessions.";
    },
    6: (a) => {
      const comeback = a.comeback_word || '';
      const pattern = a.miss_pattern || '';
      if (comeback) return `"${comeback}" — that's now your comeback protocol. It's already here waiting for you the day after you miss. The streak isn't broken by one miss. It's broken by the decision not to come back. You just made that decision in advance.`;
      if (pattern.includes('Monday')) return "The 'restart Monday' trap has ended more fitness journeys than any injury. From now on: if you miss Tuesday, you train Wednesday. Not Monday. The streak resets immediately, not at the start of the week.";
      return "The failure plan is the most important thing we've built this week. Every other app celebrates your streak. We planned for the broken one — because that's where transformations are actually won or lost.";
    },
    7: (a) => {
      const readiness = a.readiness || '';
      const action = a.first_action || '';
      if (readiness.includes('Ready')) return `This is your first vote. Not for a result — for the identity you built in Section 2. ${action ? `"${action}" — that's the declaration. Not the workout. The person.` : 'Whatever you do today, you do it as the person you decided to become.'}`;
      if (readiness.includes('Nervous')) return `Nervous and willing is the best starting point there is. It means you care. ${action ? `"${action}" — nervous people who show up anyway become the people others call disciplined.` : 'Show up nervous. That\'s what courage looks like.'}`;
      return `Seven sections ago you answered honestly. Today you cast your first vote. ${action ? `"${action}" is the beginning of the evidence.` : 'Whatever you do today counts.'} Phase Zero is complete. The real work starts now — and you're already different from the person who opened this app.`;
    },
  };

  const respFn = responses[day];
  return respFn ? respFn(answers) : "Good work today. Keep going.";
}

export default function PhaseZero({ mindProfile, onComplete }: PhaseZeroProps) {
  const { user } = useAuth();
  const currentDay = (mindProfile?.phase_zero_day ?? 0) + 1;
  const dayData = DAYS[Math.min(currentDay - 1, 6)];
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState('');

  const progress = ((currentDay - 1) / 7) * 100;

  const handleAnswer = (id: string, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const toggleMulti = (option: string) => {
    setSelectedMulti(prev =>
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const allAnswered = () => {
    for (const q of dayData.questions) {
      if (q.type === 'multi') {
        if (selectedMulti.length === 0) return false;
      } else {
        if (!answers[q.id]) return false;
      }
    }
    return true;
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    const finalAnswers = { ...answers };
    if (selectedMulti.length > 0) {
      const multiQ = dayData.questions.find(q => q.type === 'multi');
      if (multiQ) finalAnswers[multiQ.id] = selectedMulti;
    }

    try {
      // Save progress
      await supabase.from('phase_zero_progress').upsert({
        user_id: user.id,
        day_number: currentDay,
        completed: true,
        responses: finalAnswers,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,day_number' });

      const response = getMindCoachResponse(currentDay, finalAnswers);
      setAiResponse(response);

      // Update identity statement if day 2
      if (currentDay === 2 && answers.future_identity) {
        await supabase.from('mind_profiles').update({
          identity_statement: answers.future_identity,
          psychological_stage: answers.belief?.includes('not sure') || answers.belief?.includes('given up') ? 'contemplation' : 'preparation',
        }).eq('user_id', user.id);
      }

      // Advance phase zero day
      const isLastDay = currentDay === 7;
      await supabase.from('mind_profiles').update({
        phase_zero_day: currentDay,
        phase_zero_completed: isLastDay,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user.id);

      if (isLastDay) {
        setTimeout(onComplete, 3000);
      }
    } catch (err) {
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#C9A84C]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C]">Phase Zero</span>
          </div>
          <span className="text-xs text-[#8899BB]">Section {currentDay} of 7</span>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#1A2236] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C9A84C] rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 pb-32">
        {/* Day card */}
        <div className="bg-[#111827] border border-[#C9A84C]/20 rounded-2xl p-5 mb-6">
          <div className="text-4xl mb-3">{dayData.icon}</div>
          <h1 className="text-2xl font-black text-[#F0F4FF] mb-1">{dayData.title}</h1>
          <p className="text-sm text-[#8899BB] italic">{dayData.subtitle}</p>
        </div>

        {/* Questions */}
        <div className="space-y-5 mb-6">
          {dayData.questions.map((q) => (
            <div key={q.id} className="bg-[#111827] border border-[#1E2D40] rounded-2xl p-4">
              <p className="text-sm font-semibold text-[#F0F4FF] mb-3 leading-relaxed">{q.question}</p>

              {q.type === 'select' && (
                <div className="space-y-2">
                  {q.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(q.id, option)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                        answers[q.id] === option
                          ? 'bg-[#C9A84C]/10 border-[#C9A84C]/50 text-[#C9A84C] font-medium'
                          : 'bg-[#0D1117] border-[#1E2D40] text-[#8899BB] hover:border-[#C9A84C]/30'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'text' && (
                <textarea
                  placeholder={q.placeholder}
                  value={answers[q.id] || ''}
                  onChange={e => handleAnswer(q.id, e.target.value)}
                  rows={3}
                  className="w-full bg-[#0D1117] border border-[#1E2D40] rounded-xl px-4 py-3 text-sm text-[#F0F4FF] placeholder:text-[#445577] focus:border-[#C9A84C]/50 focus:outline-none resize-none transition-all"
                />
              )}

              {q.type === 'multi' && (
                <div className="flex flex-wrap gap-2">
                  {q.options?.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleMulti(option)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                        selectedMulti.includes(option)
                          ? 'bg-[#C9A84C]/10 border-[#C9A84C]/50 text-[#C9A84C]'
                          : 'bg-[#0D1117] border-[#1E2D40] text-[#8899BB] hover:border-[#C9A84C]/30'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Insight box */}
        <div className="bg-[#C9A84C]/5 border border-[#C9A84C]/20 rounded-2xl p-4 mb-6">
          <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-widest mb-2">Why this matters</p>
          <p className="text-sm text-[#8899BB] leading-relaxed">{dayData.insight}</p>
        </div>

        {/* AI Response */}
        {aiResponse && (
          <div className="bg-[#111827] border border-[#C9A84C]/30 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center">
                <Brain className="w-3.5 h-3.5 text-[#C9A84C]" />
              </div>
              <span className="text-xs font-semibold text-[#C9A84C]">Mind Coach</span>
            </div>
            <p className="text-sm text-[#F0F4FF] leading-relaxed">{aiResponse}</p>
          </div>
        )}
      </div>

      {/* Fixed CTA button — z-50 sits above the app nav bar (z-40) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#070B14]/95 backdrop-blur border-t border-[#1E2D40] px-5 py-4">
        <button
          onClick={handleComplete}
          disabled={!allAnswered() || loading}
          className="w-full bg-[#C9A84C] hover:bg-[#E8C76A] disabled:opacity-40 text-black font-bold py-4 rounded-2xl transition-all text-base flex items-center justify-center gap-2"
        >
          {loading ? (
            <span>Processing...</span>
          ) : currentDay === 7 ? (
            <><span>Build My Mind Profile</span><span className="text-lg">🧠</span></>
          ) : (
            <><span>Next Section</span><ChevronRight className="w-5 h-5" /></>
          )}
        </button>
      </div>
    </div>
  );
}

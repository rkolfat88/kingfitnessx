import Link from 'next/link'
import {
  Crown, Zap, Dumbbell, Apple, CheckSquare,
  TrendingUp, Brain, Moon, MessageSquare,
  ArrowRight, Check, X, Activity, Target
} from 'lucide-react'

const features = [
  {
    icon: MessageSquare,
    title: 'AI Coaching Chat',
    desc: 'Chat with your elite AI coach 24/7. Get personalized advice on training, nutrition, and mindset — instantly.',
  },
  {
    icon: Dumbbell,
    title: 'Custom Workout Plans',
    desc: 'AI-generated workout programs tailored to your goals, experience level, and available equipment.',
  },
  {
    icon: Apple,
    title: 'Precision Nutrition',
    desc: 'Personalized macro targets and full meal plans optimized for your exact body composition goals.',
  },
  {
    icon: CheckSquare,
    title: 'Daily Check-Ins',
    desc: 'Log your progress every day. Your AI coach analyzes the data and adapts recommendations in real time.',
  },
  {
    icon: TrendingUp,
    title: 'Progress Tracking',
    desc: 'Visualize your transformation with weight trends, adherence stats, and streak tracking over time.',
  },
  {
    icon: Brain,
    title: 'Specialist AI Agents',
    desc: 'Six specialist agents — workout, nutrition, recovery, mindset, accountability, and general coaching.',
  },
]

const stats = [
  { value: '6', label: 'AI Specialists' },
  { value: '∞', label: 'Coaching Sessions' },
  { value: '24/7', label: 'Always Available' },
  { value: '100%', label: 'Personalized' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black overflow-x-hidden w-full">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center">
            <Crown className="w-4 h-4 text-[var(--gold)]" />
          </div>
          <span className="font-bold text-white tracking-tight">King AI Coach</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors py-2 px-3"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-24 pb-12">

        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-full px-4 py-1.5 text-xs text-[var(--gold)] font-semibold uppercase tracking-widest mb-8">
          <Zap className="w-3 h-3" />
          AI Transformation Engine
        </div>

        {/* Crown */}
        <div
          className="w-20 h-20 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/25 flex items-center justify-center mb-8 animate-float"
          style={{ boxShadow: '0 0 40px rgba(201,168,76,0.18), 0 0 80px rgba(201,168,76,0.06)' }}
        >
          <Crown className="w-10 h-10 text-[var(--gold)]" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.05] mb-6 text-white">
          Transform Your Body<br />
          <span className="text-gradient-gold">With AI Coaching</span>
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-gray-400 max-w-lg mx-auto leading-relaxed mb-10">
          Get personalized workout plans, precision nutrition, and 24/7 elite AI coaching —
          all tailored to your exact goals and body.
        </p>

        {/* CTAs */}
        <div className="flex flex-row gap-3 justify-center items-center mb-16">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-bold px-7 py-3.5 rounded-xl text-sm transition-all min-h-[48px]"
            style={{ boxShadow: '0 0 30px rgba(201,168,76,0.35)' }}
          >
            Start For Free <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] text-white border border-white/10 font-semibold px-7 py-3.5 rounded-xl text-sm transition-all min-h-[48px]"
          >
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-3xl font-bold text-gradient-gold mb-1">{value}</div>
              <div className="text-xs text-gray-500 font-medium">{label}</div>
            </div>
          ))}
        </div>

      </section>

      {/* Features */}
      <section className="w-full px-6 md:px-12 lg:px-20 border-t border-white/5 flex flex-col items-center py-16">
        <div className="w-full max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--gold)] uppercase tracking-widest font-semibold mb-3">⚡ FULL COACHING SYSTEM</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Everything You Need to Transform</h2>
            <p className="text-sm text-gray-400 max-w-xl mt-4">
              A complete AI coaching platform — no guesswork, no generic plans. Just elite coaching built around you.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 mt-8">
            {features.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-surface-2 border border-border rounded-2xl p-4 text-left hover:border-gold/30 transition-all duration-200"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)' }}
                  >
                    <Icon className="w-5 h-5 text-[var(--gold)]" />
                  </div>
                  <h3 className="font-semibold text-white text-base leading-tight">{title}</h3>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="w-full px-6 md:px-12 lg:px-20 border-t border-white/5 flex flex-col items-center py-16">
        <div className="w-full max-w-2xl">
          <div className="flex flex-col items-center text-center">
            <p className="text-xs text-[var(--gold)] uppercase tracking-widest font-semibold mb-3">⚡ PRICING</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">Simple, Transparent Pricing</h2>
            <p className="text-sm text-gray-400 mt-4">Start free, upgrade when you&apos;re ready</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 w-full">

            {/* Free */}
            <div className="bg-surface-2 border border-border rounded-2xl p-6 flex flex-col">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Free</p>
              <div className="mb-6">
                <span className="text-3xl font-bold text-white">$0</span>
                <span className="text-gray-500 ml-2 text-sm">/month</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  { text: '3 AI messages per day', ok: true },
                  { text: 'View workout & nutrition plans', ok: true },
                  { text: 'Progress tracking', ok: true },
                  { text: 'Generate & regenerate plans', ok: false },
                  { text: 'Unlimited AI coaching', ok: false },
                  { text: 'Daily AI check-in & adaptation', ok: false },
                ].map(({ text, ok }) => (
                  <li key={text} className="flex items-center gap-3 text-sm">
                    {ok
                      ? <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      : <X className="w-4 h-4 text-gray-700 flex-shrink-0" />
                    }
                    <span className={ok ? 'text-gray-300' : 'text-gray-600'}>{text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="w-full text-center py-3 px-6 rounded-xl font-semibold text-sm transition-colors border border-white/10 text-white hover:bg-white/5 block"
              >
                Get Started Free
              </Link>
            </div>

            {/* King Pro */}
            <div
              className="bg-surface-2 border-2 border-gold/50 rounded-2xl p-6 relative flex flex-col"
              style={{ boxShadow: '0 0 40px rgba(201,168,76,0.07)' }}
            >
              <div
                className="absolute top-0 right-0 text-black text-xs font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-2xl"
                style={{ background: 'var(--gold)' }}
              >
                MOST POPULAR
              </div>

              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-[var(--gold)]" />
                <p className="text-xs font-bold text-[var(--gold)] uppercase tracking-widest">King Pro</p>
              </div>
              <div className="mb-1">
                <span className="text-3xl font-bold text-white">$19</span>
                <span className="text-gray-500 ml-2 text-sm">/month</span>
              </div>
              <p className="text-green-400 text-xs mb-6 font-medium">or $149/year — save $79</p>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'Unlimited AI coaching messages',
                  'Generate & regenerate all plans',
                  'Daily AI check-in & adaptation',
                  'All 6 specialist coaching agents',
                  'Priority AI responses',
                  'Cancel anytime',
                ].map((text) => (
                  <li key={text} className="flex items-center gap-3 text-sm">
                    <Check className="w-4 h-4 text-[var(--gold)] flex-shrink-0" />
                    <span className="text-gray-300">{text}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="w-full text-center py-3 px-6 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-bold text-sm transition-colors"
                style={{ boxShadow: '0 0 20px rgba(201,168,76,0.25)' }}
              >
                Start King Pro
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full px-6 border-t border-white/5 flex flex-col items-center text-center py-16">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to Transform?
          </h2>
          <p className="text-sm text-gray-500 mb-10 max-w-md text-center">
            Join thousands building their elite physique with personalized AI coaching.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-bold px-8 py-4 rounded-xl text-base transition-all min-h-[52px]"
            style={{ boxShadow: '0 0 30px rgba(201,168,76,0.35)' }}
          >
            Start Your Transformation <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-gray-700 mt-5">Free plan available · No credit card required</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 text-sm border-t border-border">
        © 2025 King AI Coach. All rights reserved.
        <p className="text-xs text-gray-600 text-center mt-2">
          King AI Coach is not a medical service. Content is for informational purposes only. Consult your doctor before starting any program.
        </p>
      </footer>

    </div>
  )
}

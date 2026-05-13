import Link from 'next/link'
import {
  MessageSquare, Dumbbell, Apple, TrendingUp,
  CheckSquare, Zap, Crown, ArrowRight, Check, X
} from 'lucide-react'

const features = [
  { icon: MessageSquare, title: 'AI Coaching Chat', desc: 'Chat with your elite AI coach 24/7. Get personalized advice on training, nutrition, and mindset.' },
  { icon: Dumbbell, title: 'Custom Workout Plans', desc: 'AI-generated workout plans tailored to your goals, experience level, and available equipment.' },
  { icon: Apple, title: 'Precision Nutrition', desc: 'Personalized macro targets and full meal plans optimized for your body and goal.' },
  { icon: CheckSquare, title: 'Daily Check-Ins', desc: 'Log your progress daily. Your AI coach analyzes your data and adjusts recommendations.' },
  { icon: TrendingUp, title: 'Progress Tracking', desc: 'Visualize your transformation with weight trends, adherence stats, and streak tracking.' },
  { icon: Zap, title: 'Intelligent Agents', desc: 'Multiple AI agents specialize in workout, nutrition, recovery, and accountability coaching.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-[var(--border)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center">
              <Crown className="w-4 h-4 text-[var(--gold)]" />
            </div>
            <span className="font-bold text-white">King AI Coach</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="text-sm bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-semibold px-4 py-2 rounded-lg transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-full px-4 py-1.5 text-xs text-[var(--gold)] font-medium mb-8">
          <Zap className="w-3 h-3" />
          AI-Powered Elite Coaching
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight mb-6 leading-none">
          Transform Your Body<br />
          <span className="text-[var(--gold)]">With AI Coaching</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Get personalized workout plans, precision nutrition, and 24/7 AI coaching tailored to your exact goals and body.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="inline-flex items-center gap-2 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-bold px-8 py-4 rounded-xl text-lg transition-all">
            Start For Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link href="/login" className="inline-flex items-center gap-2 bg-[var(--surface)] hover:bg-[var(--surface-2)] text-white border border-[var(--border)] font-semibold px-8 py-4 rounded-xl text-lg transition-all">
            Sign In
          </Link>
        </div>
        <p className="text-xs text-gray-600 mt-4">Free plan available · No credit card required</p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Everything You Need to Transform</h2>
          <p className="text-gray-500">A complete AI coaching system in one platform</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--gold)]/30 transition-all group">
              <div className="w-10 h-10 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center mb-4 group-hover:bg-[var(--gold)]/20 transition-colors">
                <Icon className="w-5 h-5 text-[var(--gold)]" />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-[var(--border)]">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-3">Simple, Transparent Pricing</h2>
          <p className="text-gray-500">Start free, upgrade when you&apos;re ready</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Free */}
          <div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Free</p>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-gray-500 ml-2">/month</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                { text: '3 AI messages per day', included: true },
                { text: 'View workout & nutrition plans', included: true },
                { text: 'Progress tracking', included: true },
                { text: 'Generate & regenerate plans', included: false },
                { text: 'Unlimited AI coaching', included: false },
                { text: 'Daily AI check-in', included: false },
              ].map(({ text, included }) => (
                <li key={text} className="flex items-center gap-3 text-sm">
                  {included
                    ? <Check className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    : <X className="w-4 h-4 text-gray-700 flex-shrink-0" />
                  }
                  <span className={included ? 'text-gray-300' : 'text-gray-600'}>{text}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="w-full text-center py-3 px-6 rounded-xl border border-[var(--border)] text-white font-semibold hover:bg-[var(--surface-2)] transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* King Pro */}
          <div className="p-8 bg-[var(--surface)] border border-[var(--gold)]/40 rounded-2xl flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[var(--gold)] text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
              MOST POPULAR
            </div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-[var(--gold)]" />
              <p className="text-sm font-semibold text-[var(--gold)] uppercase tracking-wide">King Pro</p>
            </div>
            <div className="mb-1">
              <span className="text-4xl font-bold text-white">$19</span>
              <span className="text-gray-500 ml-2">/month</span>
            </div>
            <p className="text-green-400 text-xs mb-6">or $149/year — save $79</p>
            <ul className="space-y-3 mb-8 flex-1">
              {[
                'Unlimited AI coaching messages',
                'Generate & regenerate all plans',
                'Daily AI check-in & adaptation',
                'All specialist coaching agents',
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
              className="w-full text-center py-3 px-6 rounded-xl bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-bold transition-colors"
            >
              Start King Pro
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-16 text-center border-t border-[var(--border)]">
        <Crown className="w-10 h-10 text-[var(--gold)] mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-3">Ready to Transform?</h2>
        <p className="text-gray-500 mb-8">Join thousands building their elite physique with AI coaching.</p>
        <Link href="/signup" className="inline-flex items-center gap-2 bg-[var(--gold)] hover:bg-[var(--gold-light)] text-black font-bold px-8 py-4 rounded-xl text-lg transition-all">
          Start Your Transformation <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      <footer className="border-t border-[var(--border)] px-6 py-6 text-center text-xs text-gray-700">
        © 2024 King AI Coach. All rights reserved.
      </footer>
    </div>
  )
}

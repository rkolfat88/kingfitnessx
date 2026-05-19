import Link from 'next/link'
import { Crown, Zap, Dumbbell, Apple, CheckSquare, TrendingUp, Brain, ChevronDown, Star, Shield, Users } from 'lucide-react'

const faqs = [
  { q: "How is this different from ChatGPT?", a: "King AI Coach uses 6 specialist agents with a deterministic rules engine. ChatGPT gives generic advice. Our system remembers you, adapts to your data, and uses mathematical guardrails to prevent bad recommendations." },
  { q: "Can I use this for bodybuilding prep?", a: "Yes. The system supports fat loss, muscle gain, and recomposition phases with strict macro-locked nutrition, progressive overload tracking, and recovery-aware training adjustments." },
  { q: "What is the Carnivore Protocol?", a: "A zero-carb, animal-based nutrition approach optimized for rapid fat loss and sustained energy. The system generates carnivore-specific meal plans with organ meats, fatty cuts, and proper electrolyte management." },
  { q: "How does the AI adapt my plan?", a: "Every daily check-in feeds your Recovery Score, Adherence, Momentum, and 5 other performance metrics. When patterns emerge — plateaus, overtraining, low motivation — the system adjusts your plan automatically." },
  { q: "Is my data secure?", a: "All data is encrypted and stored with Row Level Security on Supabase. Your data is never shared. Payment processing is handled by Stripe with bank-level encryption." },
  { q: "Can I cancel anytime?", a: "Yes. Cancel from your account settings with one click. No contracts, no hidden fees, no cancellation penalties." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080808] overflow-x-hidden">

      {/* ========== NAVBAR ========== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#242424]" style={{ background: 'rgba(8,8,8,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
              <Crown className="w-4 h-4 text-[#C9A84C]" />
            </div>
            <span className="text-sm font-bold text-white">King AI Coach</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[#909090] hover:text-white transition-colors">Sign In</Link>
            <Link href="/signup" className="text-sm bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-semibold px-4 py-2 rounded-xl transition-all duration-200 active:scale-95">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ========== HERO ========== */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)' }} />

        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 border border-[#C9A84C]/30 bg-[#C9A84C]/5 rounded-full px-4 py-1.5 mb-8">
            <Zap className="w-3 h-3 text-[#C9A84C]" />
            <span className="text-xs font-semibold text-[#C9A84C] uppercase tracking-widest">AI Transformation Engine</span>
          </div>

          <div className="w-20 h-20 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-8 animate-float">
            <Crown className="w-10 h-10 text-[#C9A84C]" />
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">
            Transform Your Body
          </h1>
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight mt-1" style={{ color: '#C9A84C' }}>
            With AI Coaching
          </h1>

          <p className="text-base md:text-lg text-[#909090] mt-6 leading-relaxed max-w-xl mx-auto">
            Elite coaching personalized to your physiology. 6 AI specialists, precision nutrition, and adaptive training — built for real transformations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
            <Link href="/signup" className="w-full sm:w-auto text-center bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold px-8 py-4 rounded-2xl transition-all duration-200 active:scale-95 text-base" style={{ boxShadow: '0 0 30px rgba(201,168,76,0.2)' }}>
              Start For Free →
            </Link>
            <Link href="#how" className="w-full sm:w-auto text-center bg-[#161616] border border-[#242424] hover:border-[#333333] text-white px-8 py-4 rounded-2xl transition-all duration-200 text-base">
              See How It Works
            </Link>
          </div>

          <p className="text-xs text-[#505050] mt-4">Free plan available · No credit card required</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 max-w-lg mx-auto">
            {[
              { value: '6',    label: 'AI Specialists'   },
              { value: '∞',   label: 'Coaching Sessions' },
              { value: '24/7', label: 'Always Available' },
              { value: '100%', label: 'Personalized'     },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-bold text-[#C9A84C]">{s.value}</p>
                <p className="text-xs text-[#505050] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SOCIAL PROOF BAR ========== */}
      <section className="border-y border-[#242424] bg-[#0F0F0F] py-4 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center gap-6">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 text-[#C9A84C] fill-[#C9A84C]" />
            ))}
          </div>
          <p className="text-sm text-[#909090]">Trusted by athletes worldwide</p>
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-[#505050]" />
            <span className="text-xs text-[#505050]">256-bit encrypted</span>
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">⚡ Full Coaching System</p>
            <h2 className="text-2xl md:text-4xl font-black text-white">Everything You Need to Transform</h2>
            <p className="text-sm text-[#909090] mt-3 max-w-xl mx-auto">A complete AI coaching platform — no guesswork, no generic plans. Just elite coaching built around you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Brain,       title: 'AI Coaching Chat',    desc: '24/7 specialist agents for training, nutrition, recovery, and mindset coaching.'                    },
              { icon: Dumbbell,    title: 'Custom Workouts',     desc: 'Periodized programs that adapt to your recovery, soreness, and progressive overload.'              },
              { icon: Apple,       title: 'Precision Nutrition', desc: 'Macro-locked meal plans including Carnivore Protocol. AI-verified, zero guesswork.'               },
              { icon: CheckSquare, title: 'Daily Check-Ins',     desc: 'Log metrics daily. AI analyzes trends and adjusts your plan in real-time.'                        },
              { icon: TrendingUp,  title: 'Progress Tracking',   desc: 'Weight trends, adherence scores, performance metrics, and transformation visualization.'          },
              { icon: Zap,         title: '6 Specialist Agents', desc: 'Workout, Nutrition, Recovery, Accountability, Supplement, and Holistic coaching.'                 },
            ].map(f => (
              <div key={f.title} className="bg-[#161616] border border-[#242424] rounded-2xl p-5 hover:border-[#333333] transition-all duration-200">
                <div className="w-10 h-10 rounded-xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-[#C9A84C]" />
                </div>
                <h3 className="text-base font-semibold text-white mt-4">{f.title}</h3>
                <p className="text-sm text-[#909090] mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how" className="py-20 px-4 bg-[#0F0F0F]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">How It Works</p>
            <h2 className="text-2xl md:text-4xl font-black text-white">3 Steps to Your Transformation</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { step: '01', title: 'Tell Us About You',   desc: '5-minute onboarding. Your goals, body metrics, training history, and dietary preferences.',                icon: Users      },
              { step: '02', title: 'AI Builds Your Plan', desc: 'Our engine generates personalized workout and nutrition protocols instantly — locked with math.',         icon: Brain      },
              { step: '03', title: 'Coach Adapts Daily',  desc: 'Check in daily. The AI detects patterns, adjusts plans, and coaches you through every obstacle.',         icon: TrendingUp },
            ].map(s => (
              <div key={s.step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#161616] border border-[#242424] flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-[#C9A84C]" />
                </div>
                <p className="text-xs font-semibold text-[#C9A84C] uppercase tracking-widest mb-2">Step {s.step}</p>
                <h3 className="text-lg font-semibold text-white">{s.title}</h3>
                <p className="text-sm text-[#909090] mt-2 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">Pricing</p>
            <h2 className="text-2xl md:text-4xl font-black text-white">Simple, Transparent Pricing</h2>
            <p className="text-sm text-[#909090] mt-3">Start free, upgrade when you are ready to transform.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FREE */}
            <div className="bg-[#161616] border border-[#242424] rounded-2xl p-6 md:p-8">
              <p className="text-sm font-semibold text-[#505050] uppercase tracking-widest">Free</p>
              <p className="text-4xl font-black text-white mt-2">$0<span className="text-base font-normal text-[#505050]">/month</span></p>
              <div className="mt-6 space-y-3">
                {['3 AI messages per day', 'View workout & nutrition plans', 'Progress tracking'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-[#909090] text-sm">✓</span>
                    <span className="text-sm text-[#909090]">{f}</span>
                  </div>
                ))}
                {['Generate & regenerate plans', 'Unlimited AI coaching', 'Daily AI check-in & adaptation'].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-[#505050] text-sm">✕</span>
                    <span className="text-sm text-[#505050]">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="block text-center mt-8 bg-[#161616] border border-[#242424] hover:border-[#333333] text-white py-3 rounded-2xl text-sm font-semibold transition-all">
                Get Started Free
              </Link>
            </div>

            {/* PRO */}
            <div className="bg-[#161616] border-2 border-[#C9A84C]/50 rounded-2xl p-6 md:p-8 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-black text-xs font-bold px-3 py-1 rounded-full">
                MOST POPULAR
              </div>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-[#C9A84C]" />
                <p className="text-sm font-semibold text-[#C9A84C] uppercase tracking-widest">King Pro</p>
              </div>
              <p className="text-4xl font-black text-white mt-2">$19<span className="text-base font-normal text-[#505050]">/month</span></p>
              <p className="text-xs text-green-400 mt-1">or $149/year — save $79</p>
              <div className="mt-6 space-y-3">
                {[
                  'Unlimited AI coaching messages',
                  'Generate & regenerate all plans',
                  'Daily AI check-in & adaptation',
                  'All 6 specialist coaching agents',
                  'Carnivore Protocol access',
                  'Performance score tracking',
                  'Cancel anytime',
                ].map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <span className="text-[#C9A84C] text-sm">✓</span>
                    <span className="text-sm text-[#F0F0F0]">{f}</span>
                  </div>
                ))}
              </div>
              <Link href="/signup" className="block text-center mt-8 bg-[#C9A84C] hover:bg-[#E8C76A] text-black py-3 rounded-2xl text-sm font-bold transition-all" style={{ boxShadow: '0 0 20px rgba(201,168,76,0.2)' }}>
                Start King Pro
              </Link>
              <p className="text-xs text-[#505050] text-center mt-3">Secure payment by Stripe · Cancel anytime</p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section className="py-20 px-4 bg-[#0F0F0F]">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C9A84C] mb-3">FAQ</p>
            <h2 className="text-2xl md:text-4xl font-black text-white">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-[#161616] border border-[#242424] rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-white text-sm font-semibold list-none">
                  {faq.q}
                  <ChevronDown className="w-4 h-4 text-[#505050] group-open:rotate-180 transition-transform flex-shrink-0 ml-3" />
                </summary>
                <p className="px-4 pb-4 text-sm text-[#909090] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 60%)' }} />
        <div className="relative max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mx-auto mb-6">
            <Crown className="w-8 h-8 text-[#C9A84C]" />
          </div>
          <h2 className="text-2xl md:text-4xl font-black text-white">Ready to Transform?</h2>
          <p className="text-sm text-[#909090] mt-3">Join thousands building their elite physique with personalized AI coaching.</p>
          <Link href="/signup" className="inline-block mt-8 bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold px-8 py-4 rounded-2xl transition-all text-base" style={{ boxShadow: '0 0 30px rgba(201,168,76,0.2)' }}>
            Start Your Transformation →
          </Link>
          <p className="text-xs text-[#505050] mt-3">Free plan available · No credit card required</p>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t border-[#242424] bg-[#0F0F0F] py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[#C9A84C]" />
                </div>
                <span className="text-sm font-bold text-white">King AI Coach</span>
              </div>
              <p className="text-xs text-[#505050] max-w-xs">Your elite AI transformation team. 6 specialist agents. Real results.</p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="text-xs font-semibold text-[#505050] uppercase tracking-widest mb-3">Product</p>
                <div className="space-y-2">
                  <Link href="#" className="block text-sm text-[#909090] hover:text-white transition-colors">Features</Link>
                  <Link href="#" className="block text-sm text-[#909090] hover:text-white transition-colors">Pricing</Link>
                  <Link href="#" className="block text-sm text-[#909090] hover:text-white transition-colors">FAQ</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#505050] uppercase tracking-widest mb-3">Legal</p>
                <div className="space-y-2">
                  <Link href="#" className="block text-sm text-[#909090] hover:text-white transition-colors">Privacy</Link>
                  <Link href="#" className="block text-sm text-[#909090] hover:text-white transition-colors">Terms</Link>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-[#242424]">
            <p className="text-xs text-[#505050] text-center leading-relaxed">
              ⚠️ King AI Coach provides general fitness information only. Not medical advice. Always consult a qualified healthcare professional before starting any fitness, nutrition, or supplement program.
            </p>
            <p className="text-xs text-[#505050] text-center mt-3">© 2026 King AI Coach. All rights reserved.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}

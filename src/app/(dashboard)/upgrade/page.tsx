'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Crown, Check, Zap, Brain, Dumbbell, Apple, Star, RefreshCw } from 'lucide-react'

const PRO_FEATURES = [
  { icon: Brain,    text: 'Unlimited AI coaching — no daily limits'  },
  { icon: Dumbbell, text: 'Generate & regenerate workout plans'       },
  { icon: Apple,    text: 'Personalized nutrition protocols'          },
  { icon: Zap,      text: 'Daily check-in with AI adaptation'         },
  { icon: Star,     text: 'All 6 specialist coaching agents'          },
  { icon: Check,    text: 'Carnivore Protocol access'                 },
  { icon: Check,    text: 'Cancel anytime — no contracts'             },
]

function UpgradeContent() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const reason = params.get('reason')

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res  = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        console.error('Checkout error:', data)
        setLoading(false)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-4">
            <Crown className="w-7 h-7 text-[#C9A84C]" />
          </div>
          <h1 className="text-2xl font-black text-white">Upgrade to King Pro</h1>
          <p className="text-[#505050] text-sm mt-1">Unlock your full transformation potential</p>

          {reason === 'limit' && (
            <div className="mt-3 inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-xl px-4 py-2">
              <Zap className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0" />
              <p className="text-[#C9A84C] text-xs font-medium">You&apos;ve used your 3 free messages today</p>
            </div>
          )}
          {reason === 'feature' && (
            <div className="mt-3 inline-flex items-center gap-2 bg-[#C9A84C]/10 border border-[#C9A84C]/20 rounded-xl px-4 py-2">
              <Crown className="w-3.5 h-3.5 text-[#C9A84C] flex-shrink-0" />
              <p className="text-[#C9A84C] text-xs font-medium">This feature requires King Pro</p>
            </div>
          )}
        </div>

        {/* Pricing card */}
        <div
          className="bg-[#161616] border-2 border-[#C9A84C]/40 rounded-2xl p-6 mb-4 relative"
          style={{ boxShadow: '0 0 40px rgba(201,168,76,0.07)' }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#C9A84C] text-black text-[10px] font-bold px-3 py-1 rounded-full tracking-widest uppercase">
            Most Popular
          </div>

          {/* Price */}
          <div className="text-center mb-6 pt-1">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-white">$19</span>
              <span className="text-[#505050] text-sm">/month</span>
            </div>
            <p className="text-green-400 text-xs mt-1 font-medium">or $149/year — save $79</p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-6">
            {PRO_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[#C9A84C]" />
                </div>
                <span className="text-[#F0F0F0] text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold py-3.5 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ boxShadow: loading ? 'none' : '0 0 20px rgba(201,168,76,0.25)' }}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Redirecting to Stripe…
              </>
            ) : (
              <>
                <Crown className="w-4 h-4" />
                Start King Pro Now
              </>
            )}
          </button>

          <p className="text-center text-[#505050] text-xs mt-3">
            Secure payment by Stripe · Cancel anytime
          </p>
        </div>

        {/* Free vs Pro comparison */}
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-4 mb-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[#505050] text-xs font-semibold mb-3 uppercase tracking-widest">Free</p>
              <ul className="space-y-2">
                {['3 messages/day', 'View plans only', 'No AI check-in', 'No plan generation'].map(f => (
                  <li key={f} className="text-[#505050] text-xs flex items-center gap-1.5">
                    <span className="text-red-500 text-xs">✕</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[#C9A84C] text-xs font-semibold mb-3 uppercase tracking-widest">King Pro</p>
              <ul className="space-y-2">
                {['Unlimited messages', 'Generate all plans', 'Full AI coaching', 'All 6 agents'].map(f => (
                  <li key={f} className="text-[#F0F0F0] text-xs flex items-center gap-1.5">
                    <span className="text-[#C9A84C] text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="w-full text-center text-[#505050] text-sm hover:text-[#909090] transition-colors cursor-pointer py-2"
        >
          Maybe later
        </button>

      </div>
    </div>
  )
}

export default function UpgradePage() {
  return (
    <Suspense>
      <UpgradeContent />
    </Suspense>
  )
}

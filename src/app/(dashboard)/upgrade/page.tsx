'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Crown, Check, Zap, Brain, Dumbbell, Apple, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const PRO_FEATURES = [
  { icon: Brain, text: 'Unlimited AI coaching — no daily limits' },
  { icon: Dumbbell, text: 'Generate & regenerate workout plans' },
  { icon: Apple, text: 'Personalized nutrition protocols' },
  { icon: Zap, text: 'Daily check-in with AI adaptation' },
  { icon: Star, text: 'All specialist coaching agents' },
  { icon: Check, text: 'Cancel anytime' },
]

function UpgradeContent() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const params = useSearchParams()
  const reason = params.get('reason')

  async function handleUpgrade() {
    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
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
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 mb-4">
            <Crown className="w-8 h-8 text-[var(--gold)]" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Upgrade to King Pro</h1>
          {reason === 'limit' && (
            <p className="text-[var(--gold)] text-sm bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-lg px-4 py-2 inline-block mt-2">
              You&apos;ve used your 3 free messages today
            </p>
          )}
          {reason === 'feature' && (
            <p className="text-[var(--gold)] text-sm bg-[var(--gold)]/10 border border-[var(--gold)]/20 rounded-lg px-4 py-2 inline-block mt-2">
              This feature requires King Pro
            </p>
          )}
        </div>

        {/* Pricing Card */}
        <div className="bg-[var(--surface)] border border-[var(--gold)]/30 rounded-2xl p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-[var(--gold)] text-black text-xs font-bold px-3 py-1 rounded-bl-lg">
            MOST POPULAR
          </div>

          {/* Price */}
          <div className="text-center mb-8">
            <span className="text-5xl font-bold text-white">$19</span>
            <span className="text-gray-500 ml-2">/month</span>
            <p className="text-green-400 text-sm mt-1">or $149/year — save $79</p>
          </div>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {PRO_FEATURES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-[var(--gold)]" />
                </div>
                <span className="text-gray-300 text-sm">{text}</span>
              </div>
            ))}
          </div>

          <Button
            variant="gold"
            size="lg"
            className="w-full text-base"
            loading={loading}
            onClick={handleUpgrade}
          >
            <Crown className="w-4 h-4" />
            Start King Pro Now
          </Button>

          <p className="text-center text-gray-600 text-xs mt-4">
            Secure payment by Stripe · Cancel anytime · No contracts
          </p>
        </div>

        {/* Free vs Pro comparison */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wide">Free</p>
              <ul className="space-y-1.5">
                {['3 messages/day', 'View plans only', 'No AI check-in', 'No plan generation'].map(f => (
                  <li key={f} className="text-gray-600 text-xs flex items-center gap-1.5">
                    <span className="text-red-500 text-xs">✕</span> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[var(--gold)] text-xs font-semibold mb-2 uppercase tracking-wide">King Pro</p>
              <ul className="space-y-1.5">
                {['Unlimited messages', 'Generate all plans', 'Full AI coaching', 'All features'].map(f => (
                  <li key={f} className="text-gray-300 text-xs flex items-center gap-1.5">
                    <span className="text-[var(--gold)] text-xs">✓</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.back()}
          className="w-full text-center text-gray-600 text-sm mt-4 hover:text-gray-400 transition-colors cursor-pointer"
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

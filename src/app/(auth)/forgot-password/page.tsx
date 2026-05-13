'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Crown, ArrowLeft, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 mb-4 animate-float">
            <Crown className="w-8 h-8 text-[var(--gold)]" />
          </div>
          <h1 className="text-3xl font-bold text-white">King AI Coach</h1>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          {!sent ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-2">Reset Password</h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your email and we&apos;ll send you a reset link.
              </p>
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
                <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full">
                  Send Reset Link
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Check your email</h2>
              <p className="text-gray-500 text-sm">
                We sent a password reset link to{' '}
                <span className="text-white">{email}</span>
              </p>
            </div>
          )}

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-gray-500 hover:text-white text-sm mt-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

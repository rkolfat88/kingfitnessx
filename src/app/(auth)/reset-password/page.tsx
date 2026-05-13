'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Crown, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    setDone(true)
    setTimeout(() => router.push('/login'), 2000)
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 mb-4">
            <Crown className="w-8 h-8 text-[var(--gold)]" />
          </div>
          <h1 className="text-3xl font-bold text-white">King AI Coach</h1>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8">
          {!done ? (
            <>
              <h2 className="text-xl font-semibold text-white mb-6">Set New Password</h2>
              <form onSubmit={handleUpdate} className="space-y-4">
                <Input
                  label="New Password"
                  type="password"
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Repeat password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                />
                <Button type="submit" variant="gold" size="lg" loading={loading} className="w-full">
                  Update Password
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Password updated!</h2>
              <p className="text-gray-500 text-sm">Redirecting you to login…</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

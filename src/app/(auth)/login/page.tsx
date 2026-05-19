'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Crown, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [loading,     setLoading]     = useState(false)
  const [showPass,    setShowPass]    = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    router.push('/home')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/30 mb-4">
            <Crown className="w-7 h-7 text-[#C9A84C]" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">King AI Coach</h1>
          <p className="text-[#505050] text-sm mt-1">Your elite transformation starts here</p>
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Welcome back</h2>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div>
              <label className="text-xs text-[#909090] uppercase tracking-widest mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505050]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#242424] rounded-xl text-sm text-white placeholder:text-[#505050] focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-[#909090] uppercase tracking-widest">Password</label>
                <Link href="/forgot-password" className="text-xs text-[#505050] hover:text-[#C9A84C] transition-colors">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505050]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-3 bg-[#0F0F0F] border border-[#242424] rounded-xl text-sm text-white placeholder:text-[#505050] focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#505050] hover:text-[#909090]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-[#C9A84C] hover:bg-[#E8C76A] text-black font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              style={{ boxShadow: loading ? 'none' : '0 0 20px rgba(201,168,76,0.2)' }}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[#505050] text-xs mt-5">
            No account?{' '}
            <Link href="/signup" className="text-[#C9A84C] hover:text-[#E8C76A] transition-colors font-medium">
              Start your transformation
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}

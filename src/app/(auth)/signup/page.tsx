'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Crown, User, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function SignupPage() {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const router = useRouter()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        full_name: name,
        onboarding_completed: false,
      })

      toast.success("Account created! Let's build your plan.")
      router.push('/onboarding')
      router.refresh()
    }
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
          <p className="text-[#505050] text-sm mt-1">Join thousands transforming their physique</p>
        </div>

        {/* Card */}
        <div className="bg-[#161616] border border-[#242424] rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-5">Create your account</h2>

          <form onSubmit={handleSignup} className="space-y-4">

            {/* Name */}
            <div>
              <label className="text-xs text-[#909090] uppercase tracking-widest mb-1.5 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505050]" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John King"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[#0F0F0F] border border-[#242424] rounded-xl text-sm text-white placeholder:text-[#505050] focus:outline-none focus:border-[#C9A84C]/50 transition-colors"
                />
              </div>
            </div>

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
              <label className="text-xs text-[#909090] uppercase tracking-widest mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505050]" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
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
                  Creating account…
                </span>
              ) : 'Start My Transformation'}
            </button>
          </form>

          <p className="text-center text-[#505050] text-xs mt-5">
            Already have an account?{' '}
            <Link href="/login" className="text-[#C9A84C] hover:text-[#E8C76A] transition-colors font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-[#505050] text-xs mt-4">
          Free plan available · No credit card required
        </p>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { Crown, Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function AuthScreen() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password, name)

    if (result.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  const inputClass =
    'w-full bg-[#111111] border border-[#242424] rounded-xl px-4 py-3 text-white placeholder:text-[#505050] focus:border-[#C9A84C]/50 focus:outline-none transition-colors'

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-5">
      {/* ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#C9A84C]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[390px] animate-fade-in">
        <div className="bg-[#1a1a1a] border border-[#C9A84C]/15 rounded-2xl p-6">
          {/* Crown + title */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-[#C9A84C]/10 border border-[#C9A84C]/20 flex items-center justify-center mb-4">
              <Crown className="w-7 h-7 text-[#C9A84C]" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight font-display">
              KFX
            </h1>
            <p className="text-sm text-[#505050] mt-1">
              {mode === 'login' ? 'Welcome back.' : 'Begin your reign.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full name — signup only */}
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505050]" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className={`${inputClass} pl-11`}
                />
              </div>
            )}

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505050]" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={`${inputClass} pl-11`}
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#505050]" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className={`${inputClass} pl-11`}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="text-sm text-[#EF4444] text-center">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C9A84C] text-black font-bold text-sm rounded-2xl py-3.5 mt-2 transition-all duration-150 hover:bg-[#E8C76A] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
                : (mode === 'login' ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          {/* Toggle */}
          <p className="text-center text-sm text-[#505050] mt-5">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
              className="text-[#C9A84C] font-semibold hover:text-[#E8C76A] transition-colors"
            >
              {mode === 'login' ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

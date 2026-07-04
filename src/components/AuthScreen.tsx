import React, { useEffect, useState } from 'react'
import { Crown, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

type Mode = 'login' | 'signup' | 'forgot-password' | 'forgot-sent' | 'reset-password'

const inputClass =
  'w-full bg-[#0D0D0D] border border-[#262626] rounded-xl px-4 py-3 text-[#FFFFFF] placeholder:text-[#5C5C5C] focus:border-[#CAFF40]/50 focus:outline-none transition-colors'

function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        required
        minLength={6}
        className={`${inputClass} pl-11 pr-11`}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5C5C5C] hover:text-[#A0A0A0] transition-colors"
        tabIndex={-1}
      >
        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}

export function AuthScreen() {
  const { signIn, signUp, resetPasswordForEmail, updatePassword, clearPasswordRecovery, isPasswordRecovery } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isPasswordRecovery) switchMode('reset-password')
  }, [isPasswordRecovery])

  const switchMode = (next: Mode) => {
    setMode(next)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if ((mode === 'signup' || mode === 'reset-password') && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    if (mode === 'login') {
      const result = await signIn(email, password)
      if (result.error) setError(result.error)
    } else if (mode === 'signup') {
      const result = await signUp(email, password, name)
      if (result.error) setError(result.error)
    } else if (mode === 'forgot-password') {
      const result = await resetPasswordForEmail(email)
      if (result.error) setError(result.error)
      else switchMode('forgot-sent')
    } else if (mode === 'reset-password') {
      const result = await updatePassword(password)
      if (result.error) setError(result.error)
      else clearPasswordRecovery()
    }

    setLoading(false)
  }

  const subtitle = {
    login: 'Welcome back.',
    signup: 'Begin your reign.',
    'forgot-password': 'Reset your password.',
    'forgot-sent': 'Check your email.',
    'reset-password': 'Set a new password.',
  }[mode]

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-5">
      {/* ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#CAFF40]/5 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-[390px] animate-fade-in">
        <div className="bg-[#0D0D0D] border border-[#CAFF40]/20 rounded-2xl p-6">
          {/* Crown + title */}
          <div className="flex flex-col items-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-[#CAFF40]/10 border border-[#CAFF40]/20 flex items-center justify-center mb-4">
              <Crown className="w-7 h-7 text-[#CAFF40]" />
            </div>
            <h1 className="text-2xl font-black text-[#FFFFFF] tracking-tight font-display">
              KFX
            </h1>
            <p className="text-sm text-[#A0A0A0] mt-1">{subtitle}</p>
          </div>

          {mode === 'forgot-sent' ? (
            <div className="space-y-5">
              <p className="text-sm text-[#A0A0A0] text-center leading-relaxed">
                If an account exists for that email, a reset link has been sent. Follow the
                link to set a new password.
              </p>
              <button
                onClick={() => switchMode('login')}
                className="w-full bg-[#CAFF40] text-black font-bold text-sm rounded-2xl py-3.5 transition-all duration-150 hover:bg-[#A8D930] active:scale-[0.98]"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full name — signup only */}
              {mode === 'signup' && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
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

              {/* Email — every mode except reset-password */}
              {mode !== 'reset-password' && (
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5C5C5C]" />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className={`${inputClass} pl-11`}
                  />
                </div>
              )}

              {/* Password — login, signup, reset-password */}
              {mode !== 'forgot-password' && (
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  placeholder={mode === 'reset-password' ? 'New password' : 'Password'}
                />
              )}

              {/* Confirm password — signup, reset-password */}
              {(mode === 'signup' || mode === 'reset-password') && (
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder={mode === 'reset-password' ? 'Confirm new password' : 'Confirm password'}
                />
              )}

              {/* Forgot password link — login only */}
              {mode === 'login' && (
                <div className="text-right -mt-1">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot-password')}
                    className="text-xs text-[#A0A0A0] hover:text-[#CAFF40] transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-sm text-[#EF4444] text-center">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#CAFF40] text-black font-bold text-sm rounded-2xl py-3.5 mt-2 transition-all duration-150 hover:bg-[#A8D930] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {mode === 'login' && (loading ? 'Signing in…' : 'Sign In')}
                {mode === 'signup' && (loading ? 'Creating account…' : 'Create Account')}
                {mode === 'forgot-password' && (loading ? 'Sending…' : 'Send Reset Link')}
                {mode === 'reset-password' && (loading ? 'Updating…' : 'Update Password')}
              </button>

              {/* Back to sign in — forgot-password only */}
              {mode === 'forgot-password' && (
                <button
                  type="button"
                  onClick={() => switchMode('login')}
                  className="w-full text-center text-sm text-[#A0A0A0] hover:text-[#CAFF40] transition-colors"
                >
                  Back to Sign In
                </button>
              )}
            </form>
          )}

          {/* Login / signup toggle */}
          {(mode === 'login' || mode === 'signup') && (
            <p className="text-center text-sm text-[#A0A0A0] mt-5">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[#CAFF40] font-semibold hover:text-[#A8D930] transition-colors"
              >
                {mode === 'login' ? 'Create Account' : 'Sign In'}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

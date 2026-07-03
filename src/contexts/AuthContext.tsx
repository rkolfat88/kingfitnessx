import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

export interface OnboardingRecord {
  age?: number
  gender?: string
  weight_kg?: number
  height_cm?: number
  goal?: string
  experience?: string
  days_per_week?: number
  equipment?: string
  injuries?: string[]
  protocol?: string
  onboarding_completed?: boolean
}

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isPasswordRecovery: boolean
  onboardingData: OnboardingRecord | null
  onboardingCompleted: boolean
  onboardingLoading: boolean
  refreshOnboarding: () => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  clearPasswordRecovery: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)
  const [onboardingData, setOnboardingData] = useState<OnboardingRecord | null>(null)
  const [onboardingCompleted, setOnboardingCompleted] = useState(false)
  const [onboardingLoading, setOnboardingLoading] = useState(true)

  const loadOnboarding = useCallback(async (userId: string) => {
    setOnboardingLoading(true)
    const { data } = await supabase
      .from('onboarding_data')
      .select('age,gender,weight_kg,height_cm,goal,experience,days_per_week,equipment,injuries,protocol,onboarding_completed')
      .eq('user_id', userId)
      .maybeSingle()
    setOnboardingData(data ?? null)
    setOnboardingCompleted(data?.onboarding_completed === true)
    setOnboardingLoading(false)
  }, [])

  const refreshOnboarding = useCallback(async () => {
    if (user) await loadOnboarding(user.id)
  }, [user, loadOnboarding])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setSession(session)
      setLoading(false)
      if (session?.user) {
        loadOnboarding(session.user.id)
      } else {
        setOnboardingLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true)
        setUser(session?.user ?? null)
        setSession(session)
        setLoading(false)
        if (session?.user) {
          loadOnboarding(session.user.id)
        } else {
          setOnboardingData(null)
          setOnboardingCompleted(false)
          setOnboardingLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [loadOnboarding])

  const signUp = async (email: string, password: string, name: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }

    if (data.user) {
      await supabase.from('user_profiles').upsert({
        id: data.user.id,
        full_name: name,
        onboarding_completed: false,
      })
    }

    return { error: null }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    })
    if (error) return { error: error.message }
    return { error: null }
  }

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { error: error.message }
    return { error: null }
  }

  const clearPasswordRecovery = () => setIsPasswordRecovery(false)

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isPasswordRecovery,
        onboardingData,
        onboardingCompleted,
        onboardingLoading,
        refreshOnboarding,
        signUp,
        signIn,
        signOut,
        resetPasswordForEmail,
        updatePassword,
        clearPasswordRecovery,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

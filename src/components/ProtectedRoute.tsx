import React from 'react'
import { Crown } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { AuthScreen } from './AuthScreen'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex items-center justify-center">
        <Crown className="w-8 h-8 text-[#CAFF40] animate-spin" style={{ animationDuration: '1.5s' }} />
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return <>{children}</>
}

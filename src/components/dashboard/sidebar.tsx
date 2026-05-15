'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { UserProfile } from '@/types'
import {
  MessageSquare, Dumbbell, Apple, CheckSquare,
  TrendingUp, LogOut, Crown, Menu, X, Zap, Settings
} from 'lucide-react'
import { useState } from 'react'

const navItems = [
  { href: '/chat', label: 'AI Coach', icon: MessageSquare },
  { href: '/workout', label: 'Workout Plan', icon: Dumbbell },
  { href: '/nutrition', label: 'Nutrition', icon: Apple },
  { href: '/check-in', label: 'Daily Check-In', icon: CheckSquare },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  profile: UserProfile | null
  userEmail: string
}

export function Sidebar({ profile, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-[var(--border)]">
        <Link href="/chat" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[var(--gold)]/10 border border-[var(--gold)]/30 flex items-center justify-center">
            <Crown className="w-5 h-5 text-[var(--gold)]" />
          </div>
          <span className="font-bold text-white text-sm">King AI Coach</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
              pathname === href
                ? 'bg-[var(--gold)]/10 text-[var(--gold)] border border-[var(--gold)]/20'
                : 'text-gray-400 hover:bg-[var(--surface-2)] hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Upgrade banner / Pro badge */}
      {profile?.subscription_tier === 'pro' ? (
        <div className="px-4 pb-3">
          <button
            type="button"
            onClick={async () => {
              const res = await fetch('/api/stripe/portal', { method: 'POST' })
              const data = await res.json()
              if (data.url) window.location.href = data.url
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 hover:bg-[var(--gold)]/20 transition-all cursor-pointer"
          >
            <Crown className="w-4 h-4 text-[var(--gold)] flex-shrink-0" />
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-[var(--gold)]">King Pro</p>
              <p className="text-xs text-gray-500">Manage subscription</p>
            </div>
            <Settings className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          </button>
        </div>
      ) : (
        <div className="px-4 pb-3">
          <Link
            href="/upgrade"
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--gold)]/10 border border-[var(--gold)]/20 hover:bg-[var(--gold)]/20 transition-all"
          >
            <Zap className="w-4 h-4 text-[var(--gold)] flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[var(--gold)]">Upgrade to King Pro</p>
              <p className="text-xs text-gray-500">Unlimited coaching</p>
            </div>
          </Link>
        </div>
      )}

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--gold)]/10 border border-[var(--gold)]/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-[var(--gold)]">
              {profile?.full_name?.[0]?.toUpperCase() ?? userEmail[0]?.toUpperCase() ?? '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white truncate">
              {profile?.full_name ?? 'User'}
            </p>
            <p className="text-xs text-gray-600 truncate">{userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-400 transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 bg-[var(--surface)] border border-[var(--border)] rounded-lg flex items-center justify-center text-white cursor-pointer"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/80"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        'fixed top-0 left-0 h-full w-64 bg-[var(--surface)] border-r border-[var(--border)] z-40',
        'transition-transform duration-300 ease-in-out',
        'lg:translate-x-0',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        <SidebarContent />
      </aside>
    </>
  )
}

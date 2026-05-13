'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Dumbbell, Apple, TrendingUp, MessageSquare } from 'lucide-react'
import type { UserProfile } from '@/types'

const navItems = [
  { href: '/home',      label: 'Home',      icon: Home          },
  { href: '/workout',   label: 'Training',  icon: Dumbbell      },
  { href: '/nutrition', label: 'Nutrition', icon: Apple         },
  { href: '/progress',  label: 'Progress',  icon: TrendingUp    },
  { href: '/chat',      label: 'Coach',     icon: MessageSquare },
]

interface BottomNavProps {
  profile: UserProfile | null
  userEmail: string
}

export function BottomNav({ profile, userEmail }: BottomNavProps) {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--border)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[56px]',
                isActive ? 'text-[var(--gold)]' : 'text-gray-600 hover:text-gray-400'
              )}
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                {isActive && (
                  <div className="absolute inset-0 bg-[var(--gold)]/10 rounded-lg -m-1" />
                )}
                <Icon className={cn('w-5 h-5 relative z-10', isActive && 'text-[var(--gold)]')} />
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-[var(--gold)]' : 'text-gray-600'
              )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

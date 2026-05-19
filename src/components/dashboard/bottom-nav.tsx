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
  profile:   UserProfile | null
  userEmail: string
}

export function BottomNav({ profile: _profile, userEmail: _userEmail }: BottomNavProps) {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#242424] pb-[env(safe-area-inset-bottom)]"
      style={{ background: 'rgba(8,8,8,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all duration-200 min-w-[52px] active:scale-95',
                isActive ? 'text-[#C9A84C]' : 'text-[#505050] hover:text-[#909090]'
              )}
            >
              <div className="relative w-6 h-6 flex items-center justify-center">
                {isActive && (
                  <div className="absolute inset-0 bg-[#C9A84C]/10 rounded-lg -m-1" />
                )}
                <Icon className={cn('w-5 h-5 relative z-10', isActive && 'text-[#C9A84C]')} />
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-[#C9A84C]' : 'text-[#505050]'
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

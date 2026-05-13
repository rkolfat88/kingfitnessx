import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/dashboard/bottom-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-black">
      <main className="bottom-nav-padding min-h-screen">
        {children}
      </main>
      <div className="fixed bottom-[72px] left-0 right-0 z-40 text-xs text-gray-600 text-center px-4 py-2 bg-[var(--surface)] border-t border-[var(--border)]">
        ⚠️ King AI Coach provides general fitness information only. Not medical advice. Always consult a qualified healthcare professional, doctor, or therapist before starting any fitness, nutrition, or supplement program. DYOR.
      </div>
      <BottomNav profile={profile} userEmail={user.email ?? ''} />
    </div>
  )
}

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
        <div className="text-xs text-[#404040] text-center px-4 py-3 border-t border-[#1a1a1a]">
          ⚠️ King AI Coach provides general fitness information only. Not medical advice. Always consult a qualified healthcare professional before starting any fitness, nutrition, or supplement program.
        </div>
      </main>
      <BottomNav profile={profile} userEmail={user.email ?? ''} />
    </div>
  )
}

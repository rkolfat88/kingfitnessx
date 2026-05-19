// import { redirect } from 'next/navigation'  // TODO: Re-enable auth before production launch
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/dashboard/bottom-nav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // TODO: Re-enable auth before production launch
  let user = null
  let profile = null

  try {
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    user = authData.user

    // if (!user) redirect('/login')  // bypassed for testing

    if (user) {
      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      profile = data
    }
  } catch {
    // Allow render without session during testing
  }

  return (
    <div className="min-h-screen bg-black">
      <main className="bottom-nav-padding min-h-screen">
        {children}
        <div className="text-xs text-[#404040] text-center px-4 py-3 border-t border-[#1a1a1a]">
          ⚠️ King AI Coach provides general fitness information only. Not medical advice. Always consult a qualified healthcare professional before starting any fitness, nutrition, or supplement program.
        </div>
      </main>
      <BottomNav profile={profile} userEmail={user?.email ?? ''} />
    </div>
  )
}

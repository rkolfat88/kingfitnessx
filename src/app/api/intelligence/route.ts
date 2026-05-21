import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [
      { data: alerts },
      { data: scores },
    ] = await Promise.all([
      supabase
        .from('intelligence_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('performance_scores')
        .select('*')
        .eq('user_id', user.id)
        .order('score_date', { ascending: true })
        .limit(30),
    ])

    return NextResponse.json({ alerts: alerts ?? [], scores: scores ?? [] })
  } catch (error) {
    console.error('Intelligence fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch intelligence data' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { alert_id } = await request.json()

    await supabase
      .from('intelligence_alerts')
      .update({ is_read: true })
      .eq('id', alert_id)
      .eq('user_id', user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Intelligence update error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

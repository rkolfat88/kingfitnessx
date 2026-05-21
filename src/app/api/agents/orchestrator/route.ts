import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { classifyIntent } from '@/lib/agents/orchestrator'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { message } = await request.json()
    const agentType = await classifyIntent(message)

    return NextResponse.json({ agentType })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to classify intent' }, { status: 500 })
  }
}

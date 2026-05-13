import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { aiModel } from '@/lib/openai'
import { buildCheckinAnalysisPrompt } from '@/lib/agents/prompts'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const today = new Date().toISOString().split('T')[0]

    const analysisPrompt = buildCheckinAnalysisPrompt(body)
    const { text: aiContent } = await generateText({
      model: aiModel,
      maxOutputTokens: 500,
      prompt: analysisPrompt,
      temperature: 0.7,
    })

    let aiData = null
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) aiData = JSON.parse(jsonMatch[0])
    } catch {}

    const { data: checkin, error } = await supabase
      .from('daily_checkins')
      .upsert({
        user_id: user.id,
        date: today,
        ...body,
        ai_response: aiData,
      }, { onConflict: 'user_id,date' })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ checkin })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Failed to save check-in' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: checkins } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .limit(30)

    return NextResponse.json({ checkins: checkins || [] })
  } catch (error) {
    console.error('Check-in fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch check-ins' }, { status: 500 })
  }
}

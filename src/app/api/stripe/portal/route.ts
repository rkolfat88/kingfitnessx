import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl) {
      console.error('Stripe portal error: NEXT_PUBLIC_APP_URL is not set')
      return NextResponse.json({ error: 'Server misconfiguration: missing APP_URL' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const stripeMessage = (error as { message?: string })?.message ?? 'Unknown error'
    const stripeType    = (error as { type?: string })?.type ?? ''
    const stripeCode    = (error as { code?: string })?.code ?? ''
    console.error('Stripe portal error:', stripeType, stripeCode, stripeMessage)
    console.error('Stripe portal error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json(
      { error: 'Failed to open billing portal', detail: stripeMessage, type: stripeType, code: stripeCode },
      { status: 500 }
    )
  }
}

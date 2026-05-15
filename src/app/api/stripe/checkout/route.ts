import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function POST() {
  try {
    // Guard: required env vars
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
    if (!appUrl) {
      console.error('Stripe checkout error: NEXT_PUBLIC_APP_URL is not set')
      return NextResponse.json({ error: 'Server misconfiguration: missing APP_URL' }, { status: 500 })
    }
    if (!priceId) {
      console.error('Stripe checkout error: NEXT_PUBLIC_STRIPE_PRO_PRICE_ID is not set')
      return NextResponse.json({ error: 'Server misconfiguration: missing price ID' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, full_name')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.full_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${appUrl}/chat?upgraded=true`,
      cancel_url: `${appUrl}/upgrade`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    console.error('Stripe checkout error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)))
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}

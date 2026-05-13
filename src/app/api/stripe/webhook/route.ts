import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  async function getUserIdByCustomer(customerId: string): Promise<string | null> {
    const { data } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()
    return data?.id ?? null
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const customerId = session.customer as string
      const userId = await getUserIdByCustomer(customerId)
      if (userId) {
        await supabase
          .from('user_profiles')
          .update({ subscription_tier: 'pro', subscription_status: 'active' })
          .eq('id', userId)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const userId = await getUserIdByCustomer(customerId)
      if (userId) {
        const isActive = ['active', 'trialing'].includes(subscription.status)
        const periodEnd = subscription.items.data[0]?.current_period_end
          ?? (subscription as unknown as { current_period_end: number }).current_period_end

        await supabase
          .from('user_profiles')
          .update({
            subscription_tier: isActive ? 'pro' : 'free',
            subscription_status: subscription.status,
            subscription_end_date: new Date(periodEnd * 1000).toISOString(),
          })
          .eq('id', userId)

        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: subscription.id,
            stripe_price_id: subscription.items.data[0]?.price.id,
            status: subscription.status,
            current_period_end: new Date(periodEnd * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const userId = await getUserIdByCustomer(customerId)
      if (userId) {
        await supabase
          .from('user_profiles')
          .update({ subscription_tier: 'free', subscription_status: 'canceled' })
          .eq('id', userId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY

if (!stripeKey || stripeKey === 'sk_test_placeholder') {
  console.warn('[stripe] WARNING: STRIPE_SECRET_KEY is not set or is still the placeholder value. All Stripe API calls will fail.')
}

export const stripe = new Stripe(stripeKey ?? 'sk_test_placeholder', {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      messagesPerDay: 3,
      canGeneratePlans: false,
      canAccessAgents: false,
      canCheckIn: false,
    },
  },
  pro: {
    name: 'King Pro',
    price: 19,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ?? '',
    limits: {
      messagesPerDay: Infinity,
      canGeneratePlans: true,
      canAccessAgents: true,
      canCheckIn: true,
    },
  },
}

export type Plan = keyof typeof PLANS

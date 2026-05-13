import { PLANS } from './stripe'
import type { SubscriptionTier } from '@/types'

export function canUseFeature(
  tier: SubscriptionTier,
  feature: keyof typeof PLANS.pro.limits
): boolean {
  const plan = PLANS[tier] ?? PLANS.free
  const limit = plan.limits[feature]
  if (typeof limit === 'boolean') return limit
  return limit === Infinity || limit > 0
}

export function getDailyMessageLimit(tier: SubscriptionTier): number {
  return tier === 'pro' ? Infinity : PLANS.free.limits.messagesPerDay
}

export function isProUser(tier: SubscriptionTier): boolean {
  return tier === 'pro'
}

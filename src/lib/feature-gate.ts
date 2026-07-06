// Trial / subscription gating. Pure function — no I/O. The caller (AuthContext)
// supplies the user_profiles row; trial_ends_at itself is only ever written
// server-side (see POST /api/account/start-trial in server.js).
export type AccessState = 'subscribed' | 'trialing' | 'expired';

export interface AccessProfile {
  is_pro: boolean | null;
  trial_ends_at: string | null;
}

export function getAccessState(profile: AccessProfile | null): AccessState {
  // Build-time kill switch — set VITE_DISABLE_TRIAL_GATE=true while Stripe
  // checkout isn't fully wired (no real price IDs yet, see CLAUDE.md) so
  // trial expiry doesn't strand users on a paywall that 500s. Flip off once
  // Stripe is ready to actually charge.
  if (import.meta.env.VITE_DISABLE_TRIAL_GATE === 'true') return 'subscribed';
  if (!profile) return 'expired';
  if (profile.is_pro) return 'subscribed';
  if (profile.trial_ends_at && new Date(profile.trial_ends_at).getTime() > Date.now()) {
    return 'trialing';
  }
  return 'expired';
}

// Whole days remaining in the trial, or null if there's no trial to speak of.
export function daysLeftInTrial(profile: AccessProfile | null): number | null {
  if (!profile?.trial_ends_at) return null;
  const msLeft = new Date(profile.trial_ends_at).getTime() - Date.now();
  if (msLeft <= 0) return 0;
  return Math.ceil(msLeft / (24 * 60 * 60 * 1000));
}

// Actions gated to subscribed/trialing users only. Everything else
// (dashboard, progress, history) stays visible in read-only form on expiry.
export type GatedAction = 'log' | 'chat' | 'plan_generation' | 'checkin';

export function canPerform(_action: GatedAction, state: AccessState): boolean {
  return state !== 'expired';
}

import { test, expect } from '@playwright/test';

// KFX Smoke Test Suite
// Run: npx playwright test
// Report: npx playwright show-report tests/report

const SUPABASE_URL = 'https://pdctqjrcsuldbgsijqpb.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkY3RxanJjc3VsZGJnc2lqcXBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1ODk5NjksImV4cCI6MjA5NDE2NTk2OX0.TFrG-NkhMaXFA3Zt2o3QypSmJOmpDdc9mvjGzIAngDo';

test.describe('KFX Production Smoke Tests', () => {

  test('1 · Site loads with correct KFX branding', async ({ page }) => {
    const res = await page.goto('/', { waitUntil: 'networkidle' });
    expect(res?.status()).toBe(200);
    // Unauthenticated visitors see the auth screen — it should show KFX, not old "King AI Coach"
    await expect(page.locator('h1').filter({ hasText: 'KFX' })).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=King AI Coach')).toHaveCount(0);
  });

  test('2 · Auth page renders sign-in / sign-up form', async ({ page }) => {
    await page.goto('/');
    // App should either show auth screen or logged-in content
    // If not logged in, should see email input
    const emailInput = page.locator('input[type="email"]');
    const hasAuth = await emailInput.count() > 0;
    if (hasAuth) {
      await expect(emailInput.first()).toBeVisible();
    } else {
      // Already past auth — check nav tabs are visible
      await expect(page.locator('[data-testid="nav-bar"], nav, [role="navigation"]').first()).toBeVisible();
    }
  });

  test('3 · Supabase auth endpoint is reachable', async ({ request }) => {
    const res = await request.get(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: ANON_KEY },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.version).toBeTruthy();
  });

  test('4 · Core DB tables exist', async ({ request }) => {
    const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
    for (const table of ['onboarding_data', 'nutrition_plans', 'daily_checkins', 'user_profiles']) {
      const r = await request.get(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, { headers });
      expect(r.status(), `Table ${table} should exist (HTTP 200)`).toBe(200);
    }
  });

  test('5 · Schema migration: critical new tables exist', async ({ request }) => {
    const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
    const criticalTables = ['mind_profiles', 'training_plans', 'protocol_streaks'];
    const missing: string[] = [];
    for (const table of criticalTables) {
      const r = await request.get(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=0`, { headers });
      if (r.status() !== 200) missing.push(table);
    }
    expect(missing, `Missing tables (run supabase/migrations/001_complete_schema.sql): ${missing.join(', ')}`).toHaveLength(0);
  });

  test('6 · Schema migration: onboarding_data has required columns', async ({ request }) => {
    const headers = { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` };
    const cols = ['experience', 'equipment', 'injuries', 'protocol', 'onboarding_completed'];
    const missing: string[] = [];
    for (const col of cols) {
      const r = await request.get(`${SUPABASE_URL}/rest/v1/onboarding_data?select=${col}&limit=0`, { headers });
      if (r.status() !== 200) missing.push(col);
    }
    expect(missing, `Missing columns in onboarding_data: ${missing.join(', ')}`).toHaveLength(0);
  });

  test('7 · /api/chat endpoint exists and responds', async ({ request }) => {
    // Without an auth token this should return 401 or similar, but NOT 404/500
    const res = await request.post('https://www.kingfitnessx.com/api/chat', {
      data: { message: 'smoke test', history: [] },
      headers: { 'Content-Type': 'application/json' },
    });
    // 401 (no token) or 200 (if auth not enforced) — anything except 404/500
    expect(res.status(), '/api/chat should be routed (not 404)').not.toBe(404);
    expect(res.status(), '/api/chat should not crash (not 500)').not.toBe(500);
  });

});

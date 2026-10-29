/**
 * E2E Test Suite 10: Electronic Verification, System Health & Software Licensing
 * Covers: Public QR electronic report verification (/verify/[id]), anti-forgery guards,
 * backend health/ready endpoints, hardware machine ID (HWID), and offline license activation.
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('Electronic Verification, System Health & Licensing', { tags: ['licensing', 'verify', 'health'] }, () => {
  test('public verification: validates legitimate patient report and displays verification stamp', async ({ app, agent, screen }) => {
    // Open verification page with a valid sample ID
    await app.open('/verify/sample-valid-uuid-001');

    await expect(screen.getByText('التحقق الإلكتروني من التقرير الطبي')).toBeVisible();
    await expect(screen.getByText('تقرير طبي معتمد وأصلي')).toBeVisible();
    await expect(screen.getByText(/اسم المريض/)).toBeVisible();
    await expect(screen.getByText(/تاريخ الفحص/)).toBeVisible();
    await expect(screen.getByText(/الفحوصات المنجزة/)).toBeVisible();
  });

  test('anti-forgery alert: warns user when scanning an invalid, tampered, or canceled sample ID', async ({ app, screen }) => {
    // Open verification page with a nonexistent or tampered ID
    await app.open('/verify/fake-tampered-id-999');

    await expect(screen.getByText('لم يتم العثور على التقرير')).toBeVisible();
    await expect(screen.getByText(/الرمز الممسوح غير مسجل في قاعدة بيانات المختبر/)).toBeVisible();
  });

  test('system health endpoints: verifies backend readiness and database connectivity', async ({ app, screen }) => {
    await app.open('/health');
    await expect(screen.getByText(/status/)).toBeVisible();

    await app.open('/ready');
    await expect(screen.getByText(/ready/)).toBeVisible();
  });

  test('licensing & HWID: displays machine hardware fingerprint and validates activation key format', async ({ app, agent, screen }) => {
    await app.open('/license');

    await expect(screen.getByText('ترخيص وتفعيل النظام')).toBeVisible();
    await expect(screen.getByText('بصمة الجهاز (Machine HWID)')).toBeVisible();

    await agent.act('enter invalid license activation key {key}', { params: { key: 'INVALID-KEY-1234' } });
    await agent.act('click Activate License (تفعيل الترخيص)');

    await expect(screen.getByText('مفتاح التفعيل غير صالح')).toBeVisible();
  });
});

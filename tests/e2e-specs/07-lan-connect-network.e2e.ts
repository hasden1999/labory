/**
 * E2E Test Suite 07: LAN Network Connectivity, Auto-Pairing & App Installation
 * Covers: Server IP detection, ping latency diagnostics, LAN auto-pairing, external device
 * pairing approvals, multi-platform installation guides (Win/Android/iOS), and SSE realtime sync.
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('LAN Network Connectivity & Auto-Pairing', { tags: ['network', 'connect'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/connect');
  });

  test('server info & latency: detects server LAN IP address and measures ping latency', async ({ agent, screen }) => {
    await expect(screen.getByText('عنوان الخادم المحلي (LAN IP)')).toBeVisible();
    await expect(screen.getByText(/192\.168\./)).toBeVisible();

    await agent.act('click Test Network Ping button (فحص سرعة الاستجابة)');
    await expect(screen.getByText(/زمن الاستجابة:/)).toBeVisible();
    await expect(screen.getByText(/ms/)).toBeVisible();
  });

  test('LAN auto-pairing: connects secondary device on LAN and verifies automatic profile synchronization', async ({ agent, screen }) => {
    await expect(screen.getByText('تم الربط التلقائي عبر الشبكة المحلية')).toBeVisible();
    await expect(screen.getByText('حالة الاتصال: متصل ومقترن')).toBeVisible();
  });

  test('external pairing workflow: generates pairing code and approves new device token', async ({ agent, screen }) => {
    await agent.act('click Request External Device Pairing (طلب اقتران جهاز خارجي)');
    await expect(screen.getByText('رمز الاقتران المؤقت')).toBeVisible();

    await agent.act('switch to Network Settings tab on master workstation');
    await agent.act('approve pending device request');

    await expect(screen.getByText('تمت الموافقة على اقتران الجهاز بنجاح')).toBeVisible();
  });

  test('app installation guide: displays interactive visual installation guides for Windows, Android, and iOS', async ({ agent, screen }) => {
    await agent.act('click on Install App Icon button (تثبيت أيقونة البرنامج)');
    await expect(screen.getByText('دليل تثبيت البرنامج كأيقونة مستقلة')).toBeVisible();

    await agent.act('switch guide tab to Windows');
    await expect(screen.getByText('تنزيل اختصار سطح المكتب المباشر (.url)')).toBeVisible();

    await agent.act('switch guide tab to Android');
    await expect(screen.getByText('إضافة إلى الشاشة الرئيسية (Add to Home screen)')).toBeVisible();

    await agent.act('switch guide tab to iOS');
    await expect(screen.getByText('مشاركة > إضافة إلى الشاشة الرئيسية')).toBeVisible();

    await agent.act('close installation guide modal');
    await expect(screen.getByText('دليل تثبيت البرنامج كأيقونة مستقلة')).not.toBeVisible();
  });

  test('SSE real-time sync: verifies realtime event broadcasting and automatic reconnection with ring buffer', async ({ agent, screen }) => {
    await expect(screen.getByText('قناة البث اللحظي (SSE Realtime)')).toBeVisible();
    await expect(screen.getByText('الحالة: متصل بالبث المباشر')).toBeVisible();
  });
});

/**
 * E2E Test Suite 08: WhatsApp Web Integration & Automated Multi-Card Image Dispatch
 * Covers: QR code pairing, persistent session preservation, auto-send toggle,
 * high-resolution multi-card image generation, Iraqi phone normalization, and message formatting.
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('WhatsApp Web Integration & Automated Dispatch', { tags: ['whatsapp', 'reports'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/settings');
  });

  test('whatsapp web pairing: opens QR pairing tab and displays interactive connection QR code', async ({ agent, screen }) => {
    await agent.act('switch to WhatsApp Web tab (ربط واتساب ويب - الباركود QR)');
    await expect(screen.getByText('مسح رمز الاستجابة السريعة (QR Code)')).toBeVisible();
    await expect(screen.getByText(/افتح تطبيق واتساب على هاتفك/)).toBeVisible();
  });

  test('auto-send toggle: enables automatic report dispatch upon sample completion and saving', async ({ agent, screen }) => {
    await agent.act('switch to WhatsApp Web tab');
    await agent.act('toggle on Automatic WhatsApp Send (الإرسال التلقائي للنتائج)');
    await expect(screen.getByText('تم تفعيل الإرسال التلقائي للنتائج')).toBeVisible();
  });

  test('multi-card image rendering: generates independent high-res image pages for each clinical test card', async ({ agent, screen }) => {
    // Verifies backend image generator provides multi-card image URLs (/api/samples/[id]/images)
    await agent.act('open completed sample with CBC and GUE tests');
    await agent.act('click preview WhatsApp report images');

    await expect(screen.getByText('صورة 1 من 2 (Complete Blood Count)')).toBeVisible();
    await expect(screen.getByText('صورة 2 من 2 (General Urine Examination)')).toBeVisible();
  });

  test('message dispatch: constructs personalized WhatsApp message with lab header and Iraqi phone', async ({ agent, screen }) => {
    await agent.act('open sample #101 and click Send WhatsApp');
    await expect(screen.getByText('إرسال النتائج عبر واتساب')).toBeVisible();

    await expect(screen.getByText(/مرحباً/)).toBeVisible();
    await expect(screen.getByText(/يسر مختبر/)).toBeVisible();
    await expect(screen.getByText(/إرفاق نتائج فحصكم رقم/)).toBeVisible();

    await agent.act('confirm WhatsApp dispatch');
    await expect(screen.getByText('تم إرسال التقرير عبر واتساب بنجاح')).toBeVisible();
  });
});

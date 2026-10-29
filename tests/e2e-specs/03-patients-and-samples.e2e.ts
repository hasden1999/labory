/**
 * E2E Test Suite 03: Patient Records, Sample Lifecycle & Delta Checks
 * Covers: Patient search, historical visits modal, sample status transitions,
 * sample rejection with clinical causes, delta check warnings, and report reprint.
 */

import { test, describe, beforeEach } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('Patient Records & Sample Lifecycle', { tags: ['patients', 'samples'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/patients');
  });

  test('patient search: searches patient by name, phone, or sample barcode code', async ({ agent, screen }) => {
    await agent.act('type {searchTerm} in the patient search box', { params: { searchTerm: 'حيدر' } });
    await expect(screen.getByText(/حيدر/)).toBeVisible();

    await agent.act('clear search and type Iraqi phone number {phone}', { params: { phone: '07701239988' } });
    await expect(screen.getByText('07701239988')).toBeVisible();
  });

  test('visit history modal: opens patient profile and verifies visit counter and past samples list', async ({ agent, screen }) => {
    await agent.act('click on patient profile or visit history button for the first patient');
    await expect(screen.getByText('سجل زيارات المريض')).toBeVisible();
    await expect(screen.getByText(/عدد الزيارات الكلي/)).toBeVisible();
    await expect(screen.getByText(/الفحوصات السابقة/)).toBeVisible();

    await agent.act('close visit history modal');
    await expect(screen.getByText('سجل زيارات المريض')).not.toBeVisible();
  });

  test('sample status lifecycle: advances sample from PENDING to IN_PROGRESS to COMPLETED', async ({ agent, screen }) => {
    await agent.act('filter samples by status Pending (قيد الانتظار)');
    await expect(screen.getByText('قيد الانتظار')).toBeVisible();

    await agent.act('enter results for the pending sample');
    await expect(screen.getByText('قيد الفحص')).toBeVisible();

    await agent.act('mark all results verified and click Complete (مكتمل)');
    await expect(screen.getByText('مكتمل')).toBeVisible();
  });

  test('sample rejection: rejects compromised sample with clinical cause and notes', async ({ agent, screen }) => {
    await agent.act('click reject sample button on sample #2');
    await expect(screen.getByText('رفض العينة')).toBeVisible();

    await agent.act('select rejection reason: Hemolyzed (عينة متحللة) and add note: Blood lysed during collection');
    await agent.act('confirm sample rejection');

    await expect(screen.getByText('تم رفض العينة')).toBeVisible();
    await expect(screen.getByText('مرفوضة')).toBeVisible();
    await expect(screen.getByText('عينة متحللة')).toBeVisible();
  });

  test('delta check warning: triggers historical delta check alert when result deviates drastically from previous visit', async ({ agent, screen }) => {
    // Patient has previous Creatinine = 1.0 mg/dL. Current is 3.8 mg/dL (> 250% delta)
    await agent.act('open results entry for patient with previous visit history');
    await agent.act('enter Creatinine result value 3.8');

    await expect(screen.getByText(/Delta Check/)).toBeVisible();
    await expect(screen.getByText(/تغير سريري كبير مقارنة بالزيارة السابقة/)).toBeVisible();
    await expect(screen.getByText('القراءة السابقة: 1.0')).toBeVisible();
  });

  test('reprint & WhatsApp: re-prints previous official report and dispatches via WhatsApp', async ({ agent, screen }) => {
    await agent.act('click Print button on completed visit');
    await expect(screen.getByText('جاري فتح التقرير للطباعة...')).toBeVisible();

    await agent.act('click WhatsApp button on completed visit');
    await expect(screen.getByText('إرسال تقرير المريض')).toBeVisible();
  });
});

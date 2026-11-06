# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T09:39:21.220Z
- Total: 12
- Passed: 11
- Failed: 1
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| intake | opens the intake workspace | PASS | 4964 ms |
| intake | save is disabled until name, age, sex, and a test are present | PASS | 3569 ms |
| intake | registers patient demographics and Iraqi phone | PASS | 5759 ms |
| intake | searches the catalog and adds CBC with its EDTA tube badge | PASS | 2833 ms |
| intake | adds a chemistry test and renders an inline result input | PASS | 1797 ms |
| intake | enters a critical glucose value and surfaces a panic/flag | PASS | 950 ms |
| intake | opens and closes the specialized CBC form from the results grid | FAIL | 30807 ms |
| intake | applies a 10% discount and recalculates the net total | PASS | 816 ms |
| intake | saves the order (F9) and shows the success toast | PASS | 6858 ms |
| intake | persists the new order in the patients registry | PASS | 10696 ms |
| intake | opens the new patient file and shows the saved order | PASS | 32 ms |
| intake | resets the workspace with F1 (new patient) | PASS | 8153 ms |

## Diagnostics / Notes
- Intake: added catalog row -> CBC Complete Blood Count (CBC) فورمة 15,000 IQD
- Intake: added catalog row -> FBS Fasting Blood Sugar (FBS) 5,000 IQD
- Intake: critical value 450 triggered the PANIC banner.
- Intake: created sample #2029 for مريض اختبار آلي 278894
- Patients: مريض اختبار آلي 278894 is searchable in the registry.

## Failures

### intake / opens and closes the specialized CBC form from the results grid
```
TimeoutError: Waiting failed: 30000ms exceeded
    at new WaitTask (D:\lab\node_modules\puppeteer-core\src\common\WaitTask.ts:82:28)
    at IsolatedWorld.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Realm.ts:74:22)
    at CdpFrame.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:789:36)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2928:29)
    at UiHarness.waitForModal (D:\lab\tests\ui-e2e\harness.ts:379:21)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\intake.ts:150:16)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:462:7)
    at async Object.run (D:\lab\tests\ui-e2e\suites\intake.ts:148:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:125:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-37-58-955Z\FAIL-intake-opens-and-closes-the-specialized-CBC-form-from-the-results-grid.png
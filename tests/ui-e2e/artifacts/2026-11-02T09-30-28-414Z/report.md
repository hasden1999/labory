# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T09:33:52.839Z
- Total: 11
- Passed: 5
- Failed: 6
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| intake | opens the intake workspace | PASS | 12897 ms |
| intake | save is disabled until name, age, sex, and a test are present | PASS | 1327 ms |
| intake | registers patient demographics and Iraqi phone | FAIL | 9536 ms |
| intake | searches the catalog and adds CBC with its EDTA tube badge | PASS | 3024 ms |
| intake | adds a chemistry test and renders an inline result input | PASS | 2237 ms |
| intake | enters a critical glucose value and surfaces a panic/flag | FAIL | 1280 ms |
| intake | applies a 10% discount and recalculates the net total | PASS | 836 ms |
| intake | saves the order (F9) and shows the success toast | FAIL | 90622 ms |
| intake | persists the new order in the patients registry | FAIL | 66967 ms |
| intake | opens the new patient file and shows the saved order | FAIL | 200 ms |
| intake | resets the workspace with F1 (new patient) | FAIL | 4927 ms |

## Diagnostics / Notes
- Intake: added catalog row -> CBC Complete Blood Count (CBC) فورمة 15,000 IQD
- Intake: added catalog row -> FBS Fasting Blood Sugar (FBS) 5,000 IQD
- Intake: critical value 450 triggered the panic/critical alert.

## Failures

### intake / registers patient demographics and Iraqi phone
```
Error: Patient name mismatch: 
    at <anonymous> (D:\lab\tests\ui-e2e\suites\intake.ts:92:47)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:400:7)
    at async Object.run (D:\lab\tests\ui-e2e\suites\intake.ts:74:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:125:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-30-28-414Z\FAIL-intake-registers-patient-demographics-and-Iraqi-phone.png

### intake / enters a critical glucose value and surfaces a panic/flag
```
Error: Result progress counter did not reach 2/2
    at <anonymous> (D:\lab\tests\ui-e2e\suites\intake.ts:133:15)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:400:7)
    at async Object.run (D:\lab\tests\ui-e2e\suites\intake.ts:116:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:125:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-30-28-414Z\FAIL-intake-enters-a-critical-glucose-value-and-surfaces-a-panic-flag.png

### intake / saves the order (F9) and shows the success toast
```
TimeoutError: Waiting failed: 90000ms exceeded
    at new WaitTask (D:\lab\node_modules\puppeteer-core\src\common\WaitTask.ts:82:28)
    at IsolatedWorld.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Realm.ts:74:22)
    at CdpFrame.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:789:36)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2928:29)
    at UiHarness.waitForText (D:\lab\tests\ui-e2e\harness.ts:127:21)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\intake.ts:149:16)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:400:7)
    at async Object.run (D:\lab\tests\ui-e2e\suites\intake.ts:147:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:125:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-30-28-414Z\FAIL-intake-saves-the-order-F9-and-shows-the-success-toast.png

### intake / persists the new order in the patients registry
```
TimeoutError: Waiting failed: 60000ms exceeded
    at new WaitTask (D:\lab\node_modules\puppeteer-core\src\common\WaitTask.ts:82:28)
    at IsolatedWorld.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Realm.ts:74:22)
    at CdpFrame.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:789:36)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2928:29)
    at UiHarness.waitForText (D:\lab\tests\ui-e2e\harness.ts:127:21)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\intake.ts:161:16)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:400:7)
    at async Object.run (D:\lab\tests\ui-e2e\suites\intake.ts:157:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:125:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-30-28-414Z\FAIL-intake-persists-the-new-order-in-the-patients-registry.png

### intake / opens the new patient file and shows the saved order
```
Error: Could not click the patient row
    at <anonymous> (D:\lab\tests\ui-e2e\suites\intake.ts:181:26)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:400:7)
    at async Object.run (D:\lab\tests\ui-e2e\suites\intake.ts:167:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:125:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-30-28-414Z\FAIL-intake-opens-the-new-patient-file-and-shows-the-saved-order.png

### intake / resets the workspace with F1 (new patient)
```
Error: F1 did not clear the form (value: مريض مؤقت)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\intake.ts:196:24)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:400:7)
    at async Object.run (D:\lab\tests\ui-e2e\suites\intake.ts:187:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:125:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-30-28-414Z\FAIL-intake-resets-the-workspace-with-F1-new-patient-.png
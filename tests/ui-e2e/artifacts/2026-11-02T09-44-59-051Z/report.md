# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T09:50:25.668Z
- Total: 8
- Passed: 6
- Failed: 2
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| settings | opens the catalog and searches for a test | PASS | 26946 ms |
| settings | filters the catalog by specialty | PASS | 2278 ms |
| settings | opens and cancels the add-test dialog | PASS | 1258 ms |
| settings | switches between the four settings workspaces | PASS | 94217 ms |
| settings | saves the report design settings | FAIL | 82076 ms |
| settings | renders the network/system panel and its four sections | FAIL | 71841 ms |
| settings | opens the WhatsApp pairing tab without connecting | PASS | 26270 ms |
| settings | renders the system/license workspace on /license | PASS | 11606 ms |

## Diagnostics / Notes
- Settings: WhatsApp tab opened; pairing was intentionally not started to avoid external side effects.

## Failures

### settings / saves the report design settings
```
TimeoutError: Waiting failed: 60000ms exceeded
    at new WaitTask (D:\lab\node_modules\puppeteer-core\src\common\WaitTask.ts:82:28)
    at IsolatedWorld.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Realm.ts:74:22)
    at CdpFrame.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:789:36)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2928:29)
    at UiHarness.waitForText (D:\lab\tests\ui-e2e\harness.ts:137:21)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\settings.ts:55:14)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:521:7)
    at async runSettingsSuite (D:\lab\tests\ui-e2e\suites\settings.ts:51:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:148:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-44-59-051Z\FAIL-settings-saves-the-report-design-settings.png

### settings / renders the network/system panel and its four sections
```
Error: Network status details are missing
    at <anonymous> (D:\lab\tests\ui-e2e\suites\settings.ts:66:65)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:521:7)
    at async runSettingsSuite (D:\lab\tests\ui-e2e\suites\settings.ts:58:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:148:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-44-59-051Z\FAIL-settings-renders-the-network-system-panel-and-its-four-sections.png
# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T10:08:25.561Z
- Total: 8
- Passed: 7
- Failed: 1
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| settings | opens the catalog and searches for a test | PASS | 17580 ms |
| settings | filters the catalog by specialty | PASS | 1774 ms |
| settings | opens and cancels the add-test dialog | PASS | 988 ms |
| settings | switches between the four settings workspaces | PASS | 17358 ms |
| settings | saves the report design settings | PASS | 14685 ms |
| settings | renders the network/system panel and its four sections | FAIL | 38948 ms |
| settings | opens the WhatsApp pairing tab without connecting | PASS | 9434 ms |
| settings | renders the system/license workspace on /license | PASS | 5084 ms |

## Diagnostics / Notes
- Settings: WhatsApp tab opened; pairing was intentionally not started to avoid external side effects.

## Failures

### settings / renders the network/system panel and its four sections
```
TimeoutError: Waiting failed: 30000ms exceeded
    at new WaitTask (D:\lab\node_modules\puppeteer-core\src\common\WaitTask.ts:82:28)
    at IsolatedWorld.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Realm.ts:74:22)
    at CdpFrame.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:789:36)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2928:29)
    at UiHarness.waitForText (D:\lab\tests\ui-e2e\harness.ts:137:21)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\settings.ts:78:16)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:545:7)
    at async runSettingsSuite (D:\lab\tests\ui-e2e\suites\settings.ts:67:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:148:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-06-30-136Z\FAIL-settings-renders-the-network-system-panel-and-its-four-sections.png
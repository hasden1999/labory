# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T09:59:12.335Z
- Total: 9
- Passed: 8
- Failed: 1
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| global | sidebar navigation reaches every main section | FAIL | 94330 ms |
| global | theme toggle switches and persists | PASS | 96529 ms |
| global | login page validates required fields | PASS | 6138 ms |
| global | login page reports an error for invalid credentials without hanging | PASS | 9587 ms |
| global | guest entry link reaches the dashboard | PASS | 10592 ms |
| global | F1 clears the intake form | PASS | 8902 ms |
| global | F2 barcode action never crashes the workspace | PASS | 5235 ms |
| global | public verification page is reachable without authentication | PASS | 8894 ms |
| global | readiness and health probes return JSON without errors | PASS | 4057 ms |

## Diagnostics / Notes
- Login: invalid credentials are rejected with a visible message.
- Global: F2 barcode produced 0 window(s), modal=true.

## Failures

### global / sidebar navigation reaches every main section
```
TimeoutError: Waiting failed: 30000ms exceeded
    at new WaitTask (D:\lab\node_modules\puppeteer-core\src\common\WaitTask.ts:82:28)
    at IsolatedWorld.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Realm.ts:74:22)
    at CdpFrame.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:789:36)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2928:29)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\global.ts:19:21)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:541:7)
    at async runGlobalSuite (D:\lab\tests\ui-e2e\suites\global.ts:14:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:158:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-55-02-714Z\FAIL-global-sidebar-navigation-reaches-every-main-section.png
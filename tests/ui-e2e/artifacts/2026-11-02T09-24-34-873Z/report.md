# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T09:28:42.547Z
- Total: 84
- Passed: 61
- Failed: 23
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| routes | / loads | PASS | 32041 ms |
| routes | / has no uncaught page errors | PASS | 1 ms |
| routes | / controls are named | FAIL | 3735 ms |
| routes | / has no failed internal API calls | PASS | 1 ms |
| routes | /patients loads | PASS | 32140 ms |
| routes | /patients has no uncaught page errors | PASS | 0 ms |
| routes | /patients controls are named | FAIL | 1044 ms |
| routes | /patients has no failed internal API calls | PASS | 0 ms |
| routes | /samples loads | PASS | 16882 ms |
| routes | /samples has no uncaught page errors | PASS | 1 ms |
| routes | /samples controls are named | FAIL | 620 ms |
| routes | /samples has no failed internal API calls | PASS | 0 ms |
| routes | /results loads | PASS | 18680 ms |
| routes | /results has no uncaught page errors | PASS | 0 ms |
| routes | /results controls are named | FAIL | 208 ms |
| routes | /results has no failed internal API calls | PASS | 0 ms |
| routes | /financials loads | PASS | 13133 ms |
| routes | /financials has no uncaught page errors | PASS | 0 ms |
| routes | /financials controls are named | FAIL | 380 ms |
| routes | /financials has no failed internal API calls | PASS | 0 ms |
| routes | /debts loads | PASS | 5620 ms |
| routes | /debts has no uncaught page errors | PASS | 0 ms |
| routes | /debts controls are named | FAIL | 322 ms |
| routes | /debts has no failed internal API calls | PASS | 0 ms |
| routes | /expenses loads | PASS | 12243 ms |
| routes | /expenses has no uncaught page errors | PASS | 0 ms |
| routes | /expenses controls are named | FAIL | 274 ms |
| routes | /expenses has no failed internal API calls | PASS | 0 ms |
| routes | /doctors loads | PASS | 17581 ms |
| routes | /doctors has no uncaught page errors | PASS | 0 ms |
| routes | /doctors controls are named | FAIL | 294 ms |
| routes | /doctors has no failed internal API calls | PASS | 0 ms |
| routes | /dashboard loads | PASS | 8773 ms |
| routes | /dashboard has no uncaught page errors | PASS | 0 ms |
| routes | /dashboard controls are named | FAIL | 223 ms |
| routes | /dashboard has no failed internal API calls | PASS | 0 ms |
| routes | /devices loads | PASS | 8887 ms |
| routes | /devices has no uncaught page errors | PASS | 0 ms |
| routes | /devices controls are named | FAIL | 391 ms |
| routes | /devices has no failed internal API calls | PASS | 0 ms |
| routes | /inventory loads | PASS | 5423 ms |
| routes | /inventory has no uncaught page errors | PASS | 0 ms |
| routes | /inventory controls are named | FAIL | 280 ms |
| routes | /inventory has no failed internal API calls | PASS | 0 ms |
| routes | /catalog loads | PASS | 4913 ms |
| routes | /catalog has no uncaught page errors | PASS | 0 ms |
| routes | /catalog controls are named | FAIL | 403 ms |
| routes | /catalog has no failed internal API calls | PASS | 0 ms |
| routes | /settings loads | PASS | 7005 ms |
| routes | /settings has no uncaught page errors | PASS | 0 ms |
| routes | /settings controls are named | FAIL | 439 ms |
| routes | /settings has no failed internal API calls | PASS | 0 ms |
| routes | /staff loads | PASS | 6722 ms |
| routes | /staff has no uncaught page errors | PASS | 0 ms |
| routes | /staff controls are named | FAIL | 422 ms |
| routes | /staff has no failed internal API calls | PASS | 0 ms |
| routes | /license loads | PASS | 10699 ms |
| routes | /license has no uncaught page errors | PASS | 1 ms |
| routes | /license controls are named | FAIL | 278 ms |
| routes | /license has no failed internal API calls | PASS | 0 ms |
| routes | /connect loads | PASS | 8200 ms |
| routes | /connect has no uncaught page errors | PASS | 0 ms |
| routes | /connect controls are named | FAIL | 585 ms |
| routes | /connect has no failed internal API calls | PASS | 0 ms |
| routes | /login loads | PASS | 3749 ms |
| routes | /login has no uncaught page errors | PASS | 0 ms |
| routes | /login controls are named | FAIL | 361 ms |
| routes | /login has no failed internal API calls | PASS | 0 ms |
| routes | /showcase loads | PASS | 3837 ms |
| routes | /showcase has no uncaught page errors | PASS | 0 ms |
| routes | /showcase controls are named | FAIL | 615 ms |
| routes | /showcase has no failed internal API calls | PASS | 0 ms |
| routes | /ready loads | FAIL | 4057 ms |
| routes | /ready has no uncaught page errors | PASS | 0 ms |
| routes | /ready controls are named | FAIL | 178 ms |
| routes | /ready has no failed internal API calls | PASS | 0 ms |
| routes | /health loads | FAIL | 1478 ms |
| routes | /health has no uncaught page errors | PASS | 0 ms |
| routes | /health controls are named | FAIL | 239 ms |
| routes | /health has no failed internal API calls | PASS | 0 ms |
| routes | /verify/nonexistent loads | PASS | 2152 ms |
| routes | /verify/nonexistent has no uncaught page errors | PASS | 0 ms |
| routes | /verify/nonexistent controls are named | FAIL | 249 ms |
| routes | /verify/nonexistent has no failed internal API calls | PASS | 0 ms |

## Diagnostics / Notes
- /samples: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /samples: hydration warning -> There was an error while hydrating this Suspense boundary. Switched to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /financials: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /financials: hydration warning -> There was an error while hydrating this Suspense boundary. Switched to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /expenses: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /expenses: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /doctors: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /doctors: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /dashboard: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /dashboard: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /settings: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /settings: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /license: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /license: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error

## Failures

### routes / / controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--controls-are-named.png

### routes / /patients controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--patients-controls-are-named.png

### routes / /samples controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--samples-controls-are-named.png

### routes / /results controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--results-controls-are-named.png

### routes / /financials controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--financials-controls-are-named.png

### routes / /debts controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--debts-controls-are-named.png

### routes / /expenses controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--expenses-controls-are-named.png

### routes / /doctors controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--doctors-controls-are-named.png

### routes / /dashboard controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--dashboard-controls-are-named.png

### routes / /devices controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--devices-controls-are-named.png

### routes / /inventory controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--inventory-controls-are-named.png

### routes / /catalog controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--catalog-controls-are-named.png

### routes / /settings controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--settings-controls-are-named.png

### routes / /staff controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--staff-controls-are-named.png

### routes / /license controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--license-controls-are-named.png

### routes / /connect controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--connect-controls-are-named.png

### routes / /login controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--login-controls-are-named.png

### routes / /showcase controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--showcase-controls-are-named.png

### routes / /ready loads
```
Error: Document title is missing
    at <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:56:54)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:40:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--ready-loads.png

### routes / /ready controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--ready-controls-are-named.png

### routes / /health loads
```
Error: Document title is missing
    at <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:56:54)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:40:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--health-loads.png

### routes / /health controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--health-controls-are-named.png

### routes / /verify/nonexistent controls are named
```
ReferenceError: __name is not defined
    at evaluate (evaluate at UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:2:10164), <anonymous>:0:20)
    at ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:449:34)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:75:27)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:386:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:72:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-24-34-873Z\FAIL-routes--verify-nonexistent-controls-are-named.png
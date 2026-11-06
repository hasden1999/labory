# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3210
- Date: 2026-11-03T19:37:53.945Z
- Total: 140
- Passed: 127
- Failed: 13
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| routes | / loads | FAIL | 121159 ms |
| routes | / has no uncaught page errors | PASS | 19 ms |
| routes | / controls are named | FAIL | 77494 ms |
| routes | / has no failed internal API calls | PASS | 1 ms |
| routes | /patients loads | FAIL | 120476 ms |
| routes | /patients has no uncaught page errors | PASS | 5 ms |
| routes | /patients controls are named | FAIL | 8944 ms |
| routes | /patients has no failed internal API calls | PASS | 0 ms |
| routes | /samples loads | PASS | 31219 ms |
| routes | /samples has no uncaught page errors | PASS | 0 ms |
| routes | /samples controls are named | PASS | 36 ms |
| routes | /samples has no failed internal API calls | PASS | 1 ms |
| routes | /results loads | PASS | 9424 ms |
| routes | /results has no uncaught page errors | PASS | 0 ms |
| routes | /results controls are named | PASS | 6 ms |
| routes | /results has no failed internal API calls | PASS | 0 ms |
| routes | /financials loads | PASS | 21663 ms |
| routes | /financials has no uncaught page errors | PASS | 1 ms |
| routes | /financials controls are named | PASS | 4 ms |
| routes | /financials has no failed internal API calls | PASS | 0 ms |
| routes | /debts loads | PASS | 38590 ms |
| routes | /debts has no uncaught page errors | PASS | 0 ms |
| routes | /debts controls are named | PASS | 55 ms |
| routes | /debts has no failed internal API calls | PASS | 0 ms |
| routes | /expenses loads | PASS | 18486 ms |
| routes | /expenses has no uncaught page errors | PASS | 0 ms |
| routes | /expenses controls are named | PASS | 16 ms |
| routes | /expenses has no failed internal API calls | PASS | 0 ms |
| routes | /doctors loads | PASS | 36877 ms |
| routes | /doctors has no uncaught page errors | PASS | 0 ms |
| routes | /doctors controls are named | PASS | 4 ms |
| routes | /doctors has no failed internal API calls | FAIL | 347 ms |
| routes | /dashboard loads | PASS | 14983 ms |
| routes | /dashboard has no uncaught page errors | PASS | 0 ms |
| routes | /dashboard controls are named | PASS | 4 ms |
| routes | /dashboard has no failed internal API calls | PASS | 0 ms |
| routes | /devices loads | PASS | 34533 ms |
| routes | /devices has no uncaught page errors | PASS | 0 ms |
| routes | /devices controls are named | PASS | 13 ms |
| routes | /devices has no failed internal API calls | PASS | 0 ms |
| routes | /inventory loads | PASS | 17930 ms |
| routes | /inventory has no uncaught page errors | PASS | 0 ms |
| routes | /inventory controls are named | PASS | 3 ms |
| routes | /inventory has no failed internal API calls | PASS | 0 ms |
| routes | /catalog loads | PASS | 31795 ms |
| routes | /catalog has no uncaught page errors | PASS | 0 ms |
| routes | /catalog controls are named | PASS | 51 ms |
| routes | /catalog has no failed internal API calls | PASS | 0 ms |
| routes | /settings loads | PASS | 24368 ms |
| routes | /settings has no uncaught page errors | PASS | 0 ms |
| routes | /settings controls are named | PASS | 20 ms |
| routes | /settings has no failed internal API calls | PASS | 0 ms |
| routes | /staff loads | PASS | 10663 ms |
| routes | /staff has no uncaught page errors | PASS | 0 ms |
| routes | /staff controls are named | FAIL | 913 ms |
| routes | /staff has no failed internal API calls | PASS | 0 ms |
| routes | /license loads | PASS | 36970 ms |
| routes | /license has no uncaught page errors | PASS | 0 ms |
| routes | /license controls are named | FAIL | 313 ms |
| routes | /license has no failed internal API calls | PASS | 0 ms |
| routes | /connect loads | PASS | 19885 ms |
| routes | /connect has no uncaught page errors | PASS | 0 ms |
| routes | /connect controls are named | PASS | 12 ms |
| routes | /connect has no failed internal API calls | PASS | 0 ms |
| routes | /login loads | PASS | 16006 ms |
| routes | /login has no uncaught page errors | PASS | 0 ms |
| routes | /login controls are named | PASS | 14 ms |
| routes | /login has no failed internal API calls | PASS | 0 ms |
| routes | /showcase loads | PASS | 9744 ms |
| routes | /showcase has no uncaught page errors | PASS | 0 ms |
| routes | /showcase controls are named | PASS | 4 ms |
| routes | /showcase has no failed internal API calls | PASS | 0 ms |
| routes | /ready loads | PASS | 32517 ms |
| routes | /ready has no uncaught page errors | PASS | 0 ms |
| routes | /ready has no failed internal API calls | PASS | 0 ms |
| routes | /health loads | PASS | 32282 ms |
| routes | /health has no uncaught page errors | PASS | 0 ms |
| routes | /health has no failed internal API calls | PASS | 0 ms |
| routes | /verify/nonexistent loads | PASS | 24918 ms |
| routes | /verify/nonexistent has no uncaught page errors | PASS | 0 ms |
| routes | /verify/nonexistent controls are named | PASS | 13 ms |
| routes | /verify/nonexistent has no failed internal API calls | PASS | 0 ms |
| intake | opens the intake workspace | PASS | 18377 ms |
| intake | save is disabled until name, age, sex, and a test are present | PASS | 2737 ms |
| intake | registers patient demographics and Iraqi phone | PASS | 3698 ms |
| intake | searches the catalog and adds CBC with its EDTA tube badge | PASS | 3161 ms |
| intake | adds a chemistry test and renders an inline result input | PASS | 2024 ms |
| intake | enters a critical glucose value and surfaces a panic/flag | PASS | 1033 ms |
| intake | opens and closes the specialized CBC form from the results grid | PASS | 3085 ms |
| intake | applies a 10% discount and recalculates the net total | PASS | 2627 ms |
| intake | saves the order (F9) and shows the success toast | PASS | 6621 ms |
| intake | persists the new order in the patients registry | PASS | 12099 ms |
| intake | opens the new patient file and shows the saved order | PASS | 80 ms |
| intake | resets the workspace with F1 (new patient) | FAIL | 8701 ms |
| patients | opens the registry and finds the newly created patient | PASS | 9345 ms |
| patients | opens the patient file and displays demographics and results | PASS | 2144 ms |
| patients | switches between registry quick filters | PASS | 12001 ms |
| patients | opens and cancels the edit-patient dialog | PASS | 3054 ms |
| patients | updates the patient phone number and persists it | FAIL | 7865 ms |
| patients | opens the sample-delete confirmation and cancels it safely | PASS | 3286 ms |
| patients | opens the patient-visits dialog | PASS | 2233 ms |
| patients | opens the settle-account dialog and cancels it | FAIL | 22431 ms |
| patients | writes and saves a result from the patient file | FAIL | 63294 ms |
| patients | does not crash when opening the final report action | PASS | 3666 ms |
| financials | opens the cashier dashboard | PASS | 17053 ms |
| financials | switches period filters | PASS | 10846 ms |
| financials | switches movement-type filters | PASS | 8631 ms |
| financials | switches between debts and referring doctors | PASS | 4288 ms |
| financials | searches cash movements | PASS | 1547 ms |
| financials | opens the expense dialog and validates empty input | PASS | 6761 ms |
| financials | creates an operating expense and shows it in the ledger | PASS | 2889 ms |
| financials | opens the referring-doctor dialog and validates empty input | PASS | 4881 ms |
| financials | creates a referring doctor with a commission rate | PASS | 5090 ms |
| financials | opens a debt settlement dialog without submitting | PASS | 2619 ms |
| settings | opens the catalog and searches for a test | PASS | 24735 ms |
| settings | filters the catalog by specialty | PASS | 6943 ms |
| settings | opens and cancels the add-test dialog | PASS | 2612 ms |
| settings | switches between the four settings workspaces | PASS | 39975 ms |
| settings | saves the report design settings | PASS | 21538 ms |
| settings | renders the network/system panel and its four sections | PASS | 15844 ms |
| settings | opens the WhatsApp pairing tab without connecting | PASS | 20929 ms |
| settings | renders the system/license workspace on /license | PASS | 8252 ms |
| devices | opens the devices and inventory workspace | PASS | 14180 ms |
| devices | switches inventory filters | PASS | 7520 ms |
| devices | searches inventory by reagent or test code | PASS | 1303 ms |
| devices | opens and cancels the add-device dialog | PASS | 2774 ms |
| devices | opens and cancels the add-inventory dialog | PASS | 3004 ms |
| devices | opens the device connection guide and closes it | PASS | 2996 ms |
| devices | runs a device connectivity check without crashing | PASS | 5117 ms |
| devices | opens the delete-device confirmation and cancels it | FAIL | 2414 ms |
| devices | opens an inventory package and cancels it | PASS | 2131 ms |
| global | sidebar navigation reaches every main section | PASS | 35114 ms |
| global | theme toggle switches and persists | PASS | 93032 ms |
| global | login page validates required fields | PASS | 128237 ms |
| global | login page reports an error for invalid credentials without hanging | PASS | 43112 ms |
| global | guest entry link reaches the dashboard | PASS | 42221 ms |
| global | F1 clears the intake form | FAIL | 70012 ms |
| global | F2 barcode action never crashes the workspace | PASS | 37547 ms |
| global | public verification page is reachable without authentication | PASS | 37133 ms |
| global | readiness and health probes return JSON without errors | PASS | 11571 ms |

## Interactive control inventory

Total: 269 buttons, 79 links, 50 inputs across 17 page loads.

| Route | Buttons | Links | Inputs |
| --- | --- | --- | --- |
| /samples | 9 | 5 | 1 |
| /results | 9 | 5 | 1 |
| /financials | 13 | 5 | 2 |
| /debts | 13 | 5 | 2 |
| /expenses | 13 | 5 | 2 |
| /doctors | 13 | 5 | 2 |
| /dashboard | 13 | 5 | 2 |
| /devices | 7 | 5 | 1 |
| /inventory | 7 | 5 | 1 |
| /catalog | 37 | 5 | 1 |
| /settings | 86 | 6 | 24 |
| /staff | 19 | 6 | 4 |
| /license | 19 | 6 | 4 |
| /connect | 8 | 3 | 1 |
| /login | 3 | 1 | 2 |
| /showcase | 0 | 7 | 0 |
| /verify/nonexistent | 0 | 0 | 0 |

## Diagnostics / Notes
- /patients: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /patients: hydration warning -> There was an error while hydrating this Suspense boundary. Switched to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /samples: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /samples: hydration warning -> There was an error while hydrating this Suspense boundary. Switched to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /results: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /results: hydration warning -> There was an error while hydrating this Suspense boundary. Switched to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /financials: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /financials: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /debts: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /debts: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /expenses: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /expenses: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /doctors: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /doctors: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /doctors: HTTP 404 /api/settings
- /doctors: HTTP 404 /api/doctors
- /doctors: HTTP 404 /api/samples
- /doctors: HTTP 404 /api/network/events?token=&lastEventId=0
- /dashboard: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /dashboard: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /catalog: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /catalog: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /settings: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /settings: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /settings: 13 input(s) without placeholder/label/name (input[range], input[range], input[range], input[range], input[text], input[text], input[text], input[text], input[text], input[text], input[text], input[text], textarea[])
- /staff: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /staff: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /license: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /license: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /connect: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /connect: hydration warning -> There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /login: HTTP 403 /api/network/pair
- /verify/nonexistent: page exposes no interactive controls (status-only screen).
- Intake: added catalog row -> CBC Complete Blood Count (CBC) فورمة 15,000 IQD
- Intake: added catalog row -> FBS Fasting Blood Sugar (FBS) 5,000 IQD
- Intake: critical value 450 triggered the PANIC banner.
- Intake: created sample #2028 for مريض اختبار آلي 871477
- Patients: مريض اختبار آلي 871477 is searchable in the registry.
- Patients: final report action opened 0 window(s).
- Financials: doctors tab does not render the commission column while empty.
- Financials: created referring doctor د. اختبار آلي 71507
- Settings: WhatsApp tab opened; pairing was intentionally not started to avoid external side effects.
- Devices: connectivity check invoked; network result depends on the configured analyzer.
- Global: all five sidebar destinations are reachable.
- FINDING: invalid login did not show a visible error message within 2s (web mode has no /api/auth/login route).
- Global: F2 barcode produced 0 window(s), modal=true.
- FINDING: /verify/nonexistent stays on "جاري التحقق..." with no result or error state.

## Failures

### routes / / loads
```
TimeoutError: Navigation timeout of 120000 ms exceeded
    at new Deferred (D:\lab\node_modules\puppeteer-core\src\util\Deferred.ts:73:28)
    at Deferred.create (D:\lab\node_modules\puppeteer-core\src\util\Deferred.ts:29:12)
    at new LifecycleWatcher (D:\lab\node_modules\puppeteer-core\src\cdp\LifecycleWatcher.ts:148:42)
    at CdpFrame.goto (D:\lab\node_modules\puppeteer-core\src\cdp\Frame.ts:163:21)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.goto (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:1648:35)
    at UiHarness.goto (D:\lab\tests\ui-e2e\harness.ts:111:38)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:44:35)
    at UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:13)
    at runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:41:14)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-routes--loads.png

### routes / / controls are named
```
Error: Execution context was destroyed, most likely because of a navigation.
    at rewriteError (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:531:11)
    at async ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:447:7)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:510:23)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:81:29)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:78:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-routes--controls-are-named.png

### routes / /patients loads
```
TimeoutError: Navigation timeout of 120000 ms exceeded
    at new Deferred (D:\lab\node_modules\puppeteer-core\src\util\Deferred.ts:73:28)
    at Deferred.create (D:\lab\node_modules\puppeteer-core\src\util\Deferred.ts:29:12)
    at new LifecycleWatcher (D:\lab\node_modules\puppeteer-core\src\cdp\LifecycleWatcher.ts:148:42)
    at CdpFrame.goto (D:\lab\node_modules\puppeteer-core\src\cdp\Frame.ts:163:21)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.goto (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:1648:35)
    at UiHarness.goto (D:\lab\tests\ui-e2e\harness.ts:111:38)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:44:35)
    at UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:13)
    at runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:41:14)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-routes--patients-loads.png

### routes / /patients controls are named
```
Error: Execution context was destroyed, most likely because of a navigation.
    at rewriteError (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:531:11)
    at async ExecutionContext.#evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:447:7)
    at async ExecutionContext.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\ExecutionContext.ts:292:12)
    at async IsolatedWorld.evaluate (D:\lab\node_modules\puppeteer-core\src\cdp\IsolatedWorld.ts:194:12)
    at async CdpFrame.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:484:12)
    at async CdpPage.evaluate (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2218:12)
    at async UiHarness.controlsInventory (D:\lab\tests\ui-e2e\harness.ts:510:23)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:81:29)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:78:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-routes--patients-controls-are-named.png

### routes / /doctors has no failed internal API calls
```
Error: HTTP 5xx responses:
500 /api/expenses
    at <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:119:17)
    at UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:13)
    at runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:103:14)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-routes--doctors-has-no-failed-internal-API-calls.png

### routes / /staff controls are named
```
Error: Unnamed buttons (1): (empty)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:85:19)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:78:7)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-routes--staff-controls-are-named.png

### routes / /license controls are named
```
Error: Unnamed buttons (1): (empty)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:85:19)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:78:7)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-routes--license-controls-are-named.png

### intake / resets the workspace with F1 (new patient)
```
Error: Node is detached from document
    at CdpElementHandle.assertConnectedElement (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:1418:13)
    at async CdpElementHandle.isIntersectingViewport (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:1454:5)
    at async CdpElementHandle.<anonymous> (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:176:16)
    at async CdpElementHandle.scrollIntoViewIfNeeded (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:1429:7)
    at async CdpElementHandle.click (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:765:5)
    at async CdpElementHandle.<anonymous> (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:186:22)
    at async UiHarness.clickText (D:\lab\tests\ui-e2e\harness.ts:269:5)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\intake.ts:219:7)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async Object.run (D:\lab\tests\ui-e2e\suites\intake.ts:213:5)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-intake-resets-the-workspace-with-F1-new-patient-.png

### patients / updates the patient phone number and persists it
```
Error: Updated phone number is not visible after save
    at <anonymous> (D:\lab\tests\ui-e2e\suites\patients.ts:53:46)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runPatientsSuite (D:\lab\tests\ui-e2e\suites\patients.ts:46:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:135:9)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-patients-updates-the-patient-phone-number-and-persists-it.png

### patients / opens the settle-account dialog and cancels it
```
TimeoutError: Waiting failed: 20000ms exceeded
    at new WaitTask (D:\lab\node_modules\puppeteer-core\src\common\WaitTask.ts:82:28)
    at IsolatedWorld.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Realm.ts:74:22)
    at CdpFrame.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:789:36)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2928:29)
    at UiHarness.waitForModal (D:\lab\tests\ui-e2e\harness.ts:482:21)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\patients.ts:88:16)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runPatientsSuite (D:\lab\tests\ui-e2e\suites\patients.ts:86:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:135:9)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-patients-opens-the-settle-account-dialog-and-cancels-it.png

### patients / writes and saves a result from the patient file
```
TimeoutError: Waiting failed: 60000ms exceeded
    at new WaitTask (D:\lab\node_modules\puppeteer-core\src\common\WaitTask.ts:82:28)
    at IsolatedWorld.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Realm.ts:74:22)
    at CdpFrame.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:789:36)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2928:29)
    at UiHarness.waitForText (D:\lab\tests\ui-e2e\harness.ts:137:21)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\patients.ts:105:16)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runPatientsSuite (D:\lab\tests\ui-e2e\suites\patients.ts:99:5)
    at async main (D:\lab\tests\ui-e2e\run.ts:135:9)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-patients-writes-and-saves-a-result-from-the-patient-file.png

### devices / opens the delete-device confirmation and cancels it
```
Error: Delete-device confirmation was not shown
    at <anonymous> (D:\lab\tests\ui-e2e\suites\devices.ts:74:53)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runDevicesSuite (D:\lab\tests\ui-e2e\suites\devices.ts:70:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:153:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-devices-opens-the-delete-device-confirmation-and-cancels-it.png

### global / F1 clears the intake form
```
Error: Node is detached from document
    at CdpElementHandle.assertConnectedElement (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:1418:13)
    at async CdpElementHandle.isIntersectingViewport (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:1454:5)
    at async CdpElementHandle.<anonymous> (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:176:16)
    at async CdpElementHandle.scrollIntoViewIfNeeded (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:1429:7)
    at async CdpElementHandle.click (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:765:5)
    at async CdpElementHandle.<anonymous> (D:\lab\node_modules\puppeteer-core\src\api\ElementHandle.ts:186:22)
    at async UiHarness.clickText (D:\lab\tests\ui-e2e\harness.ts:269:5)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\global.ts:89:5)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runGlobalSuite (D:\lab\tests\ui-e2e\suites\global.ts:83:3)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-03T19-07-51-561Z\FAIL-global-F1-clears-the-intake-form.png
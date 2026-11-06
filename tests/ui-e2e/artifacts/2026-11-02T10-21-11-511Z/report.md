# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T10:34:58.974Z
- Total: 140
- Passed: 131
- Failed: 9
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| routes | / loads | PASS | 24140 ms |
| routes | / has no uncaught page errors | PASS | 1 ms |
| routes | / controls are named | PASS | 12 ms |
| routes | / has no failed internal API calls | PASS | 0 ms |
| routes | /patients loads | PASS | 26317 ms |
| routes | /patients has no uncaught page errors | PASS | 0 ms |
| routes | /patients controls are named | PASS | 24 ms |
| routes | /patients has no failed internal API calls | PASS | 0 ms |
| routes | /samples loads | PASS | 14230 ms |
| routes | /samples has no uncaught page errors | PASS | 0 ms |
| routes | /samples controls are named | PASS | 9 ms |
| routes | /samples has no failed internal API calls | PASS | 0 ms |
| routes | /results loads | PASS | 9635 ms |
| routes | /results has no uncaught page errors | PASS | 0 ms |
| routes | /results controls are named | PASS | 24 ms |
| routes | /results has no failed internal API calls | PASS | 0 ms |
| routes | /financials loads | PASS | 7018 ms |
| routes | /financials has no uncaught page errors | PASS | 0 ms |
| routes | /financials controls are named | PASS | 12 ms |
| routes | /financials has no failed internal API calls | PASS | 0 ms |
| routes | /debts loads | PASS | 8106 ms |
| routes | /debts has no uncaught page errors | PASS | 1 ms |
| routes | /debts controls are named | PASS | 4 ms |
| routes | /debts has no failed internal API calls | PASS | 0 ms |
| routes | /expenses loads | PASS | 4305 ms |
| routes | /expenses has no uncaught page errors | PASS | 0 ms |
| routes | /expenses controls are named | PASS | 5 ms |
| routes | /expenses has no failed internal API calls | PASS | 0 ms |
| routes | /doctors loads | PASS | 5549 ms |
| routes | /doctors has no uncaught page errors | PASS | 0 ms |
| routes | /doctors controls are named | PASS | 6 ms |
| routes | /doctors has no failed internal API calls | PASS | 0 ms |
| routes | /dashboard loads | PASS | 7663 ms |
| routes | /dashboard has no uncaught page errors | PASS | 0 ms |
| routes | /dashboard controls are named | PASS | 8 ms |
| routes | /dashboard has no failed internal API calls | PASS | 1 ms |
| routes | /devices loads | PASS | 5546 ms |
| routes | /devices has no uncaught page errors | PASS | 0 ms |
| routes | /devices controls are named | PASS | 5 ms |
| routes | /devices has no failed internal API calls | PASS | 0 ms |
| routes | /inventory loads | PASS | 11278 ms |
| routes | /inventory has no uncaught page errors | PASS | 0 ms |
| routes | /inventory controls are named | PASS | 4 ms |
| routes | /inventory has no failed internal API calls | PASS | 0 ms |
| routes | /catalog loads | PASS | 12158 ms |
| routes | /catalog has no uncaught page errors | PASS | 0 ms |
| routes | /catalog controls are named | PASS | 20 ms |
| routes | /catalog has no failed internal API calls | PASS | 0 ms |
| routes | /settings loads | PASS | 10297 ms |
| routes | /settings has no uncaught page errors | PASS | 1 ms |
| routes | /settings controls are named | PASS | 14 ms |
| routes | /settings has no failed internal API calls | PASS | 0 ms |
| routes | /staff loads | PASS | 4102 ms |
| routes | /staff has no uncaught page errors | PASS | 1 ms |
| routes | /staff controls are named | FAIL | 534 ms |
| routes | /staff has no failed internal API calls | PASS | 0 ms |
| routes | /license loads | PASS | 20451 ms |
| routes | /license has no uncaught page errors | PASS | 0 ms |
| routes | /license controls are named | FAIL | 304 ms |
| routes | /license has no failed internal API calls | PASS | 0 ms |
| routes | /connect loads | PASS | 6519 ms |
| routes | /connect has no uncaught page errors | PASS | 0 ms |
| routes | /connect controls are named | PASS | 4 ms |
| routes | /connect has no failed internal API calls | PASS | 0 ms |
| routes | /login loads | PASS | 6093 ms |
| routes | /login has no uncaught page errors | PASS | 0 ms |
| routes | /login controls are named | PASS | 4 ms |
| routes | /login has no failed internal API calls | PASS | 0 ms |
| routes | /showcase loads | PASS | 3556 ms |
| routes | /showcase has no uncaught page errors | PASS | 0 ms |
| routes | /showcase controls are named | PASS | 5 ms |
| routes | /showcase has no failed internal API calls | PASS | 0 ms |
| routes | /ready loads | PASS | 31844 ms |
| routes | /ready has no uncaught page errors | PASS | 0 ms |
| routes | /ready has no failed internal API calls | PASS | 0 ms |
| routes | /health loads | PASS | 32188 ms |
| routes | /health has no uncaught page errors | PASS | 0 ms |
| routes | /health has no failed internal API calls | PASS | 0 ms |
| routes | /verify/nonexistent loads | PASS | 3051 ms |
| routes | /verify/nonexistent has no uncaught page errors | PASS | 0 ms |
| routes | /verify/nonexistent controls are named | PASS | 3 ms |
| routes | /verify/nonexistent has no failed internal API calls | PASS | 0 ms |
| intake | opens the intake workspace | PASS | 6832 ms |
| intake | save is disabled until name, age, sex, and a test are present | PASS | 2603 ms |
| intake | registers patient demographics and Iraqi phone | PASS | 3432 ms |
| intake | searches the catalog and adds CBC with its EDTA tube badge | PASS | 2964 ms |
| intake | adds a chemistry test and renders an inline result input | PASS | 1930 ms |
| intake | enters a critical glucose value and surfaces a panic/flag | PASS | 1335 ms |
| intake | opens and closes the specialized CBC form from the results grid | PASS | 3340 ms |
| intake | applies a 10% discount and recalculates the net total | PASS | 2541 ms |
| intake | saves the order (F9) and shows the success toast | PASS | 6543 ms |
| intake | persists the new order in the patients registry | PASS | 24009 ms |
| intake | opens the new patient file and shows the saved order | PASS | 53 ms |
| intake | resets the workspace with F1 (new patient) | FAIL | 30251 ms |
| patients | opens the registry and finds the newly created patient | PASS | 19885 ms |
| patients | opens the patient file and displays demographics and results | PASS | 2115 ms |
| patients | switches between registry quick filters | PASS | 11858 ms |
| patients | opens and cancels the edit-patient dialog | PASS | 3055 ms |
| patients | updates the patient phone number and persists it | FAIL | 8223 ms |
| patients | opens the sample-delete confirmation and cancels it safely | PASS | 2971 ms |
| patients | opens the patient-visits dialog | PASS | 2130 ms |
| patients | opens the settle-account dialog and cancels it | FAIL | 22346 ms |
| patients | writes and saves a result from the patient file | FAIL | 63043 ms |
| patients | does not crash when opening the final report action | PASS | 3579 ms |
| financials | opens the cashier dashboard | PASS | 4767 ms |
| financials | switches period filters | PASS | 9930 ms |
| financials | switches movement-type filters | PASS | 7390 ms |
| financials | switches between debts and referring doctors | PASS | 4201 ms |
| financials | searches cash movements | PASS | 1479 ms |
| financials | opens the expense dialog and validates empty input | PASS | 4808 ms |
| financials | creates an operating expense and shows it in the ledger | PASS | 2826 ms |
| financials | opens the referring-doctor dialog and validates empty input | PASS | 4732 ms |
| financials | creates a referring doctor with a commission rate | FAIL | 35101 ms |
| financials | opens a debt settlement dialog without submitting | PASS | 2543 ms |
| settings | opens the catalog and searches for a test | PASS | 15423 ms |
| settings | filters the catalog by specialty | PASS | 6732 ms |
| settings | opens and cancels the add-test dialog | PASS | 2548 ms |
| settings | switches between the four settings workspaces | PASS | 22992 ms |
| settings | saves the report design settings | PASS | 16241 ms |
| settings | renders the network/system panel and its four sections | PASS | 13484 ms |
| settings | opens the WhatsApp pairing tab without connecting | PASS | 8926 ms |
| settings | renders the system/license workspace on /license | PASS | 5414 ms |
| devices | opens the devices and inventory workspace | PASS | 8374 ms |
| devices | switches inventory filters | PASS | 7397 ms |
| devices | searches inventory by reagent or test code | PASS | 1268 ms |
| devices | opens and cancels the add-device dialog | PASS | 2649 ms |
| devices | opens and cancels the add-inventory dialog | PASS | 2583 ms |
| devices | opens the device connection guide and closes it | PASS | 2144 ms |
| devices | runs a device connectivity check without crashing | PASS | 5098 ms |
| devices | opens the delete-device confirmation and cancels it | FAIL | 2314 ms |
| devices | opens an inventory package and cancels it | PASS | 2091 ms |
| global | sidebar navigation reaches every main section | PASS | 18695 ms |
| global | theme toggle switches and persists | PASS | 68719 ms |
| global | login page validates required fields | PASS | 7310 ms |
| global | login page reports an error for invalid credentials without hanging | PASS | 7214 ms |
| global | guest entry link reaches the dashboard | PASS | 4571 ms |
| global | F1 clears the intake form | FAIL | 7737 ms |
| global | F2 barcode action never crashes the workspace | PASS | 8612 ms |
| global | public verification page is reachable without authentication | PASS | 10518 ms |
| global | readiness and health probes return JSON without errors | PASS | 2276 ms |

## Interactive control inventory

Total: 310 buttons, 89 links, 70 inputs across 19 page loads.

| Route | Buttons | Links | Inputs |
| --- | --- | --- | --- |
| / | 34 | 5 | 19 |
| /patients | 9 | 5 | 1 |
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
| /staff | 18 | 6 | 4 |
| /license | 18 | 6 | 4 |
| /connect | 8 | 3 | 1 |
| /login | 3 | 1 | 2 |
| /showcase | 0 | 7 | 0 |
| /verify/nonexistent | 0 | 0 | 0 |

## Diagnostics / Notes
- /: hydration warning -> Text content does not match server-rendered HTML.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
- /: hydration warning -> There was an error while hydrating this Suspense boundary. Switched to client rendering.
See more info here: https://nextjs.org/docs/messages/react-hydration-error
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
- Intake: added catalog row -> CBC Complete Blood Count فورمة 15,000 IQD
- Intake: added catalog row -> FBS Fasting Blood Sugar (FBS) 5,000 IQD
- Intake: critical value 450 triggered the PANIC banner.
- Intake: created sample #2030 for مريض اختبار آلي 871445
- Patients: مريض اختبار آلي 871445 is searchable in the registry.
- Patients: final report action opened 0 window(s).
- Financials: doctors tab does not render the commission column while empty.
- Settings: WhatsApp tab opened; pairing was intentionally not started to avoid external side effects.
- Devices: connectivity check invoked; network result depends on the configured analyzer.
- Global: all five sidebar destinations are reachable.
- Login: invalid credentials are rejected with a visible message.
- Global: F2 barcode produced 0 window(s), modal=true.
- FINDING: /verify/nonexistent stays on "جاري التحقق..." with no result or error state.

## Failures

### routes / /staff controls are named
```
Error: Unnamed buttons (1): (empty)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:85:19)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:78:7)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-21-11-511Z\FAIL-routes--staff-controls-are-named.png

### routes / /license controls are named
```
Error: Unnamed buttons (1): (empty)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\routes.ts:85:19)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runRouteSuite (D:\lab\tests\ui-e2e\suites\routes.ts:78:7)
    at async main (D:\lab\tests\ui-e2e\run.ts:119:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-21-11-511Z\FAIL-routes--license-controls-are-named.png

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
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-21-11-511Z\FAIL-intake-resets-the-workspace-with-F1-new-patient-.png

### patients / updates the patient phone number and persists it
```
Error: Updated phone number is not visible after save
    at <anonymous> (D:\lab\tests\ui-e2e\suites\patients.ts:53:46)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runPatientsSuite (D:\lab\tests\ui-e2e\suites\patients.ts:46:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:135:9)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-21-11-511Z\FAIL-patients-updates-the-patient-phone-number-and-persists-it.png

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
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-21-11-511Z\FAIL-patients-opens-the-settle-account-dialog-and-cancels-it.png

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
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-21-11-511Z\FAIL-patients-writes-and-saves-a-result-from-the-patient-file.png

### financials / creates a referring doctor with a commission rate
```
TimeoutError: Waiting failed: 30000ms exceeded
    at new WaitTask (D:\lab\node_modules\puppeteer-core\src\common\WaitTask.ts:82:28)
    at IsolatedWorld.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Realm.ts:74:22)
    at CdpFrame.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Frame.ts:789:36)
    at CdpFrame.<anonymous> (D:\lab\node_modules\puppeteer-core\src\util\decorators.ts:63:21)
    at CdpPage.waitForFunction (D:\lab\node_modules\puppeteer-core\src\api\Page.ts:2928:29)
    at UiHarness.waitForText (D:\lab\tests\ui-e2e\harness.ts:137:21)
    at <anonymous> (D:\lab\tests\ui-e2e\suites\financials.ts:92:14)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runFinancialsSuite (D:\lab\tests\ui-e2e\suites\financials.ts:86:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:143:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-21-11-511Z\FAIL-financials-creates-a-referring-doctor-with-a-commission-rate.png

### devices / opens the delete-device confirmation and cancels it
```
Error: Delete-device confirmation was not shown
    at <anonymous> (D:\lab\tests\ui-e2e\suites\devices.ts:74:53)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:570:7)
    at async runDevicesSuite (D:\lab\tests\ui-e2e\suites\devices.ts:70:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:153:7)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-21-11-511Z\FAIL-devices-opens-the-delete-device-confirmation-and-cancels-it.png

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
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T10-21-11-511Z\FAIL-global-F1-clears-the-intake-form.png
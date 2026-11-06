# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T09:40:44.058Z
- Total: 11
- Passed: 9
- Failed: 1
- Skipped: 1

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| patients | opens the registry and finds the newly created patient | PASS | 7203 ms |
| patients | opens the patient file and displays demographics and results | PASS | 439 ms |
| patients | switches between registry quick filters | PASS | 3496 ms |
| patients | opens and cancels the edit-patient dialog | PASS | 1381 ms |
| patients | updates the patient phone number and persists it | FAIL | 671 ms |
| patients | opens the sample-delete confirmation and cancels it safely | PASS | 1266 ms |
| patients | opens the patient-visits dialog | PASS | 546 ms |
| patients | opens the settle-account dialog and cancels it | PASS | 499 ms |
| patients | writes and saves a result from the patient file | SKIP | 0 ms |
| patients | writes and saves a result from the patient file | PASS | 36 ms |
| patients | does not crash when opening the final report action | PASS | 1264 ms |

## Diagnostics / Notes
- Patients: final report action opened 1 window(s).

## Failures

### patients / updates the patient phone number and persists it
```
Error: Input not found by placeholder: 07701234567
    at UiHarness.fillPlaceholder (D:\lab\tests\ui-e2e\harness.ts:273:26)
    at async <anonymous> (D:\lab\tests\ui-e2e\suites\patients.ts:49:5)
    at async UiHarness.check (D:\lab\tests\ui-e2e\harness.ts:466:7)
    at async runPatientsSuite (D:\lab\tests\ui-e2e\suites\patients.ts:46:3)
    at async main (D:\lab\tests\ui-e2e\run.ts:135:9)
```
Screenshot: D:\lab\tests\ui-e2e\artifacts\2026-11-02T09-40-21-099Z\FAIL-patients-updates-the-patient-phone-number-and-persists-it.png
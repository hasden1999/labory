# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T09:43:15.819Z
- Total: 10
- Passed: 10
- Failed: 0
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| patients | opens the registry and finds the newly created patient | PASS | 10843 ms |
| patients | opens the patient file and displays demographics and results | PASS | 433 ms |
| patients | switches between registry quick filters | PASS | 3380 ms |
| patients | opens and cancels the edit-patient dialog | PASS | 1384 ms |
| patients | updates the patient phone number and persists it | PASS | 6290 ms |
| patients | opens the sample-delete confirmation and cancels it safely | PASS | 1227 ms |
| patients | opens the patient-visits dialog | PASS | 401 ms |
| patients | opens the settle-account dialog and cancels it | PASS | 824 ms |
| patients | writes and saves a result from the patient file | PASS | 2046 ms |
| patients | does not crash when opening the final report action | PASS | 9857 ms |

## Diagnostics / Notes
- Patients: final report action opened 1 window(s).
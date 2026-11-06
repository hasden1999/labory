# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T10:06:08.092Z
- Total: 9
- Passed: 9
- Failed: 0
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| global | sidebar navigation reaches every main section | PASS | 38908 ms |
| global | theme toggle switches and persists | PASS | 88510 ms |
| global | login page validates required fields | PASS | 8833 ms |
| global | login page reports an error for invalid credentials without hanging | PASS | 10459 ms |
| global | guest entry link reaches the dashboard | PASS | 5285 ms |
| global | F1 clears the intake form | PASS | 14962 ms |
| global | F2 barcode action never crashes the workspace | PASS | 7226 ms |
| global | public verification page is reachable without authentication | PASS | 7292 ms |
| global | readiness and health probes return JSON without errors | PASS | 3207 ms |

## Diagnostics / Notes
- Global: all five sidebar destinations are reachable.
- Login: invalid credentials are rejected with a visible message.
- Global: F2 barcode produced 0 window(s), modal=true.
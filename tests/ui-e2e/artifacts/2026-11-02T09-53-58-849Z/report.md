# Labryo UI E2E Report

- Base URL: http://127.0.0.1:3100
- Date: 2026-11-02T09:54:42.539Z
- Total: 9
- Passed: 9
- Failed: 0
- Skipped: 0

| Suite | Test | Result | Duration |
| --- | --- | --- | --- |
| devices | opens the devices and inventory workspace | PASS | 15125 ms |
| devices | switches inventory filters | PASS | 5524 ms |
| devices | searches inventory by reagent or test code | PASS | 1309 ms |
| devices | opens and cancels the add-device dialog | PASS | 938 ms |
| devices | opens and cancels the add-inventory dialog | PASS | 956 ms |
| devices | opens the device connection guide and closes it | PASS | 432 ms |
| devices | runs a device connectivity check without crashing | PASS | 3099 ms |
| devices | opens the delete-device confirmation and cancels it | PASS | 5340 ms |
| devices | opens an inventory package and cancels it | PASS | 4384 ms |

## Diagnostics / Notes
- Devices: connectivity check invoked; network result depends on the configured analyzer.
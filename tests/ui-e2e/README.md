# UI E2E Suite (Puppeteer)

Real browser tests for Labryo LIMS. They drive the actual Next.js UI with a real
Chrome/Edge instance, verify every route and workspace, exercise the critical
business flows (intake, results, cashier, catalog, devices), and audit every
visible button/link/input.

By default the runner starts its own Next.js dev server against a throwaway copy
of the data store, so the real lab data is never touched. Point it at an already
running instance with `E2E_BASE_URL` (then that instance's data is used).

## Run

```powershell
# Full suite against a fresh isolated dev server
npx tsx tests/ui-e2e/run.ts

# Against an already running instance (isolated test copy on :3100 is recommended)
$env:E2E_BASE_URL="http://127.0.0.1:3100"
npx tsx tests/ui-e2e/run.ts

# Only some suites
$env:E2E_SUITES="intake,patients"
npx tsx tests/ui-e2e/run.ts

# Reuse an existing patient instead of creating one
$env:E2E_PATIENT_NAME="مريض اختبار آلي 278894"
npx tsx tests/ui-e2e/run.ts
```

Environment variables:

| Variable | Default | Meaning |
| --- | --- | --- |
| `E2E_BASE_URL` | — | Use an existing server instead of spawning one |
| `E2E_SUITES` | all | Comma-separated: `routes,intake,patients,financials,settings,devices,global` |
| `E2E_PATIENT_NAME` | — | Patient to exercise in the patients suite (skips intake dependency) |
| `E2E_PORT` | `3210` | Port for the runner-managed dev server |
| `E2E_HEADLESS` | `1` | Set `0` to watch the browser |
| `E2E_CHROME_PATH` | auto | Override the Chrome/Edge executable |
| `LABRYO_E2E_DATA_DIR` | temp | Directory for the isolated data copy |

Artifacts (Markdown + JSON report, screenshots on failure, `next-dev.log`) are
written to `tests/ui-e2e/artifacts/<timestamp>/`.

## What is covered

- **routes**: all 21 routes (including aliases and JSON probes), page content,
  document title, uncaught errors, failed API calls, and a control inventory.
- **intake**: patient demographics, catalog search, CBC tube badge, FBS critical
  value/PANIC banner, CBC specialized form, discount, save (F9), persistence, F1 reset.
- **patients**: registry filters, patient file, edit dialog, delete confirmation,
  visits dialog, settlement dialog, result saving, final report action.
- **financials**: period/movement filters, expense creation, referring doctor,
  debts/doctors tabs, settlement dialog.
- **settings**: catalog search/filters, add-test dialog, all report designer tabs,
  design save, network/system sections, WhatsApp tab, license/system page.
- **devices**: inventory filters/search, add device/reagent dialogs, connection
  guide, connectivity check, delete/open-package confirmations.
- **global**: sidebar navigation, theme persistence, login validation and invalid
  credentials, guest entry, F1/F2 shortcuts, verification page, readiness probes.

## Notes

- Dev-mode hydration warnings are recorded as diagnostics, not failures, because
  they do not stop the app but are real defects (number formatting mismatch
  between server and client).
- Clicks use real mouse events (required by Next.js links). Fixed toast overlays
  are dismissed before clicking so they cannot swallow toolbar clicks.

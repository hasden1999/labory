# AGENT BRIEF: D_CATALOG_UI (Agent D - Test Catalog & Reference Ranges UI)

## 1. Goal
Implement **Item 3** (Fix invisible Save button in "Multiple Reference Ranges" test form, sticky footer, draft commit, dirty state warning, and Ctrl+S).

---

## 2. Owned Files
- `apps/web/src/app/catalog/page.tsx` (Test & Panel management page and modals)

---

## 3. Forbidden Files
- `apps/server/*`
- `packages/reports/*`
- `packages/domain/*`
- Patient or Doctor files

---

## 4. Key Requirements & Implementation Steps

### 1. Sticky Footer & Layout Architecture
- In `showTestModal` in `apps/web/src/app/catalog/page.tsx`:
  - Enforce a fixed/max modal height: `max-height: 90vh` (or `85vh`).
  - Use `display: flex; flex-direction: column;`.
  - Header: fixed (`flex-shrink: 0`).
  - Modal Form Body: scrollable (`flex: 1 1 auto; overflow-y: auto; padding-right: 8px;`).
  - Footer: ALWAYS visible sticky footer (`flex-shrink: 0; border-top: 1px solid var(--border-color); padding-top: 12px; background: inherit;`).
  - The Save and Cancel buttons must NEVER be pushed off-screen, regardless of how many reference ranges (8+) or whether inline range-editing is open.

### 2. Single-Transaction Draft Workflow
- Adding or editing reference ranges keeps all edits in a local state draft (`referenceRanges`).
- Clicking "Save Test" commits the test definition and all its reference ranges in ONE transaction.
- When an inline range is being edited, the main "Save Test" button remains visible and functional (auto-committing or prompting the pending draft row).

### 3. Dirty-State Guard & Keyboard Shortcut
- Show an "unsaved changes" badge if any fields or ranges have been modified.
- Warn before closing a dirty form (via `ConfirmModal`).
- Implement `Ctrl+S` / `Cmd+S` keyboard shortcut to trigger form submission from anywhere inside the modal.

---

## 5. Acceptance Criteria
1. Verified at 1366x768 resolution.
2. Verified at 125% and 150% Windows display scaling.
3. Verified in RTL interface mode.
4. Save button remains permanently visible and functional with 8+ ranges.
5. Persisting a test correctly saves all its reference ranges.
6. Passes `npm run typecheck` and `npm run check:scope -- data` (or web scope).

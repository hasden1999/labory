# AGENT BRIEF: C_DOCTORS (Agent C - Referring Doctors)

## 1. Goal
Implement **Item 4** (Referring doctors management, offline CRUD, deactivation, and self-contained `ReferringDoctorSelect` component).

---

## 2. Owned Files
- `apps/web/src/app/doctors/page.tsx` (Doctor management page)
- `apps/web/src/app/api/doctors/route.ts`
- `apps/web/src/app/api/doctors/[id]/route.ts`
- `apps/web/src/components/common/ReferringDoctorSelect.tsx` (Self-contained select component)
- `apps/web/src/app/settings/page.tsx` (Link/tab to referring doctors only)
- `apps/web/src/lib/serverStore.ts` (Doctors CRUD & SQLite sync)
- `apps/web/src/lib/sqliteSync.ts` (Prisma doctor sync)

---

## 3. Forbidden Files
- `apps/web/src/app/page.tsx` (Integration will mount the component)
- `apps/web/src/app/api/samples/[id]/print/route.ts`
- `apps/web/src/app/catalog/page.tsx`

---

## 4. Key Requirements & Implementation Steps

### 1. Management Screen (`/doctors`)
- Reachable from Settings (`/settings` -> Doctors link or navigation button).
- Features:
  - Search by name, phone, or specialty.
  - Add new doctor (name, specialty, phone, clinic address, commission percent).
  - Edit doctor details.
  - Deactivate / Activate toggle (`isActive`):
    - Deactivated doctors remain associated with historical samples.
    - Deactivated doctors are hidden from new order selection.
  - Delete: Hard delete is ONLY permitted if the doctor has 0 associated samples (`sampleCount === 0`). Otherwise, suggest deactivation.

### 2. Standalone `ReferringDoctorSelect` Component
- Create `apps/web/src/components/common/ReferringDoctorSelect.tsx`:
  - Typeahead searchable combobox with clean keyboard navigation.
  - Shows only active doctors (`isActive !== false`).
  - Optional: empty selection allowed.
  - Inline "+ Add New Doctor" quick action modal/popover that creates the doctor on the fly and immediately selects them.
  - Stable React state (no remounting/losing focus).

### 3. API & Offline Persistence
- Support full offline capability via `serverStore.ts` & SQLite WAL synchronization.
- Ensure `isActive` field is properly read, updated, and saved in SQLite.

---

## 5. Acceptance Criteria
1. Add, edit, activate/deactivate work smoothly offline.
2. Hard delete is blocked if samples exist with this doctor.
3. `ReferringDoctorSelect` is ready to mount into registration forms.
4. Passes `npm run typecheck` and `npm run check:scope -- core` (or web scope).

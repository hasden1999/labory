# Original User Request

## 2026-08-31T20:00:54Z

Full-scale overhaul and production-grade implementation of the Labryo Clinical Laboratory Information System (LIS) based on international diagnostic standards (Epic Beaker, Cerner PathNet, Orchard Harvest, SCC SoftLab).

Requested team structure: Hierarchical multi-agent team: Lead Supervisor overseeing specialized feature subagents, granular sub-subagents, and an independent QA/Code Reviewer verifying all deliverables.

Working directory: d:\lab\apps\web
Integrity mode: development

## Requirements

### R1. Universal Visual A4 Form Designer & Custom Report Print Engine
- Deliver a live visual form designer allowing laboratory administrators to customize 100% of the printed A4 medical report.
- Support both **Pre-Printed Paper (Letterhead Mode)** with custom top/bottom millimeter margin adjustments, and **Digital Header Mode** (logo upload, alignment, doctor licenses, accreditation badges).
- Provide 5 standard clinical report templates: Classic Hospital, Modern Gradient Tech, Executive Luxury, Compact Dual-Column, and Specialized Multi-Part.
- Include dynamic verification QR codes on reports linking to online validation.

### R2. Specialized Clinical Result Entry Workstations
- Build dedicated, high-speed clinical workstations for major laboratory departments:
  - **G.U.E Workstation**: 3-part layout (Physical, Chemical, Microscopic HPF) with simultaneous multi-crystal selection matrix (Ca. Oxalate, Uric Acid, Triple Phosphate, Amorphous) and microorganism selectors.
  - **G.S.E Workstation**: Stool physical characteristics, occult blood (FOBT), parasites/ova, and microscopic findings.
  - **Hematology & CBC Workstation**: Complete blood count parameters with visual normal/abnormal badges.
  - **Clinical Chemistry & Endocrinology Workstation**: Grid-based numeric entry with instant abnormal/panic value flagging.
  - **Microbiology & Antibiogram Workstation**: Organism isolation and antibiotic sensitivity matrix (Sensitive / Intermediate / Resistant).

### R3. Clinical Intelligence, Auto-Calculations & Delta Check Engine
- Implement automatic clinical formula calculations in real-time during result entry (e.g. eGFR via CKD-EPI/MDRD, LDL via Friedewald equation, Indirect Bilirubin, Anion Gap).
- Provide historical **Delta Check** alerts when a patient's current result deviates significantly from their prior visit.
- Support one-click direct WhatsApp report delivery and PDF generation.

### R4. Fast Patient Intake & Reception Modernization
- Modernize the patient intake screen with keyboard-first navigation (Tab/Enter/hotkeys), patient search autocomplete with historical visit preview, barcode label generation, and comprehensive financial discount / referring doctor commission tracking.

### R5. Independent QA & Multi-Tier Verification Protocol
- An independent review agent must execute end-to-end static analysis, Next.js build verification (npm run build:web with exit code 0), and check all clinical forms and print outputs against the requirements.

## Acceptance Criteria

### Form Designer & Print Engine
- [ ] Changing report template, margins, header styles, or colors in Settings instantly reflects in the live preview and in the /api/samples/[id]/print route.
- [ ] Letterhead mode successfully hides digital headers and applies the user-defined top margin for pre-printed paper.
- [ ] Verification QR code renders cleanly on printed A4 reports.

### Clinical Workstations
- [ ] G.U.E workstation allows selecting multiple crystals simultaneously (e.g. Calcium Oxalate ++ and Uric Acid +) and persists all values cleanly.
- [ ] G.S.E, CBC, Chemistry, and Microbiology workstations allow rapid data entry and display appropriate reference ranges.
- [ ] Results saved via workstations update the sample status to READY and generate printable reports without API errors.

### Build & Code Integrity
- [ ] npm run build:web in d:\lab executes successfully with 0 errors and all dynamic/static routes generated.
- [ ] No Character Encoding / Mojibake distortion in Arabic text across all interfaces.
- [ ] All code changes reviewed and approved by the QA/Reviewer agent before final delivery.

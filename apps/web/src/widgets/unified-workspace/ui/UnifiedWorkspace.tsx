'use client';

import React, { useState, useCallback, useMemo } from 'react';
import nextDynamic from 'next/dynamic';
import PatientCardPanel from './PatientCardPanel';
import CatalogCartPanel from './CatalogCartPanel';
import ResultsGridPanel from './ResultsGridPanel';
import UnifiedActionBar from './UnifiedActionBar';
import { UnifiedWorkspaceReturn } from '../model/types';
import { useUnifiedWorkspace } from '../model/useUnifiedWorkspace';
import {
  FlaskConical,
  Bell,
  HelpCircle,
  RotateCcw,
} from 'lucide-react';
import { useLab } from '../../../components/LabContext';

// Specialized Workstation Modals (Hoisted at module level with SSR disabled for optimal performance)
const UrineFormModal = nextDynamic(() => import('../../../components/UrineFormModal'), { ssr: false });
const GseModal = nextDynamic(() => import('../../../components/workstations/GseModal'), { ssr: false });
const CbcModal = nextDynamic(() => import('../../../components/workstations/CbcModal'), { ssr: false });
const SemenFormModal = nextDynamic(() => import('../../../components/workstations/SemenFormModal'), { ssr: false });
const ChemistryModal = nextDynamic(() => import('../../../components/workstations/ChemistryModal'), { ssr: false });
const MicrobiologyModal = nextDynamic(() => import('../../../components/workstations/MicrobiologyModal'), { ssr: false });

type SpecialModalType = 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'CHEMISTRY' | 'MICROBIOLOGY' | null;

interface UnifiedWorkspaceProps {
  workspace?: UnifiedWorkspaceReturn;
}

/**
 * UnifiedWorkspace (English LTR Clinical Pro Max Design System)
 * Strictly conforms to professional clinical ergonomic standards:
 * - 100vh full-screen single-viewport layout with ZERO page scroll (overflow: hidden)
 * - Pure LTR directionality (Left-to-Right)
 * - 3 side-by-side white clinical cards:
 *     1) Left (Col 1 - 28%): Patient Demographics & Registration
 *     2) Center (Col 2 - 36%): Test Catalog & Cart Basket
 *     3) Right (Col 3 - 36%): Clinical Results & Workstations Grid
 * - Centered bottom floating pill dock with shortcut keys (F1, F2, F9, F10)
 */
export default function UnifiedWorkspace({ workspace: propWorkspace }: UnifiedWorkspaceProps) {
  const defaultWorkspace = useUnifiedWorkspace();
  const workspace = propWorkspace || defaultWorkspace;
  const { labProfile } = useLab();

  // Active Specialized Workstation Modal state
  const [activeSpecialModal, setActiveSpecialModal] = useState<SpecialModalType>(null);

  const handleOpenSpecialModal = useCallback((type: 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'CHEMISTRY' | 'MICROBIOLOGY') => {
    setActiveSpecialModal(type);
  }, []);

  const handleCloseSpecialModal = useCallback(() => {
    setActiveSpecialModal(null);
  }, []);

  // Helper to locate target test item in current results
  const findTargetResultItem = useCallback((matcher: (code: string, name: string) => boolean) => {
    const entries = Object.values(workspace.results);
    return entries.find((e) => {
      const c = (e.testCode || '').toUpperCase().trim();
      const n = (e.testName || '').toLowerCase().trim();
      return matcher(c, n);
    });
  }, [workspace.results]);

  // Construct synthetic sample context for modals that expect a Sample object
  const syntheticSample = useMemo(() => {
    return {
      id: workspace.patient.id || 'new-intake',
      sampleNumber: 'INTAKE',
      patient: {
        name: workspace.patient.name || 'Walk-in Patient',
        gender: workspace.patient.gender,
        ageYears: workspace.patient.ageYears,
        ageMonths: workspace.patient.ageMonths,
        ageDays: workspace.patient.ageDays,
      },
      tests: Object.values(workspace.results).map((r) => ({
        id: r.testId,
        testId: r.testId,
        resultValue: r.value,
        isAbnormal: r.status === 'HIGH' || r.status === 'LOW' || r.status === 'PANIC',
        test: {
          id: r.testId,
          code: r.testCode,
          name: r.testName,
          category: r.category,
        },
      })),
    };
  }, [workspace.patient, workspace.results]);

  return (
    <div
      dir="ltr"
      style={{
        height: '100vh',
        width: '100vw',
        maxHeight: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#edf2f7',
        color: '#0f172a',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        userSelect: 'none',
        position: 'relative',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Sleek Top Header (LTR) */}
      <header
        style={{
          height: '46px',
          flexShrink: 0,
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(8px)',
          zIndex: 30,
          boxSizing: 'border-box',
        }}
      >
        {/* Left side: Lab Name & Medical Icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(13, 148, 136, 0.3)',
            }}
          >
            <FlaskConical size={18} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1
              style={{
                fontSize: '15px',
                fontWeight: 900,
                color: '#0f172a',
                margin: 0,
                letterSpacing: '-0.2px',
              }}
            >
              {labProfile?.labName || 'Laboratory Information System (LIMS)'}
            </h1>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '9999px',
                background: '#f0fdfa',
                color: '#0f766e',
                border: '1px solid #99f6e4',
              }}
            >
              LIMS PRO
            </span>
          </div>
        </div>

        {/* Right side: Quick F1 Reset & Status Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick F1 Reset in Header */}
          <button
            type="button"
            onClick={() => workspace.resetPatient()}
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#0f766e',
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              padding: '5px 11px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Reset console and register new patient (F1)"
          >
            <RotateCcw size={13} />
            <span>New Patient (F1)</span>
          </button>

          {/* Status Badges */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              borderLeft: '1px solid #e2e8f0',
              paddingLeft: '10px',
            }}
          >
            <div
              style={{
                minWidth: '22px',
                height: '22px',
                padding: '0 6px',
                borderRadius: '9999px',
                background: '#475569',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Number of tests selected in cart"
            >
              {workspace.selectedTests.length}
            </div>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Notifications"
            >
              <Bell size={16} />
            </button>
            <button
              type="button"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#64748b',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Shortcuts Guide"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Main 3-Column Clinical Workspace (Strictly 100% Fit with ZERO page scroll) */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '10px 20px 62px 20px',
          display: 'grid',
          gridTemplateColumns: '28% 36% 36%',
          gap: '14px',
          alignItems: 'stretch',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Col 1 (Left): Patient Card Panel */}
        <div style={{ height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <PatientCardPanel workspace={workspace} />
        </div>

        {/* Col 2 (Center): Test Catalog & Cart Panel */}
        <div style={{ height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CatalogCartPanel workspace={workspace} />
        </div>

        {/* Col 3 (Right): Results Grid Panel */}
        <div style={{ height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ResultsGridPanel
            workspace={workspace}
            onOpenSpecialModal={handleOpenSpecialModal}
          />
        </div>
      </main>

      {/* 3. Bottom Centered Floating Action Dock */}
      <UnifiedActionBar workspace={workspace} />

      {/* 4. Specialized Clinical Workstation Modals */}
      {/* 4.1 URINE ANALYSIS MODAL */}
      {activeSpecialModal === 'GUE' && (
        <UrineFormModal
          isOpen={activeSpecialModal === 'GUE'}
          onClose={handleCloseSpecialModal}
          patientName={workspace.patient.name || 'Walk-in Patient'}
          sampleNumber="INTAKE"
          initialData={
            (() => {
              const item = findTargetResultItem((c, n) => c === 'GUE' || n.includes('urine') || n.includes('إدرار'));
              return item?.value || '';
            })()
          }
          onApply={(formattedResult: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c === 'GUE' || n.includes('urine') || n.includes('إدرار'));
            if (item) {
              workspace.updateResultValue(item.testId, formattedResult);
            }
          }}
        />
      )}

      {/* 4.2 GSE (STOOL) ANALYSIS MODAL */}
      {activeSpecialModal === 'GSE' && (
        <GseModal
          isOpen={activeSpecialModal === 'GSE'}
          onClose={handleCloseSpecialModal}
          sample={syntheticSample}
          initialValue={
            (() => {
              const item = findTargetResultItem((c, n) => c === 'GSE' || n.includes('stool') || n.includes('خروج') || n.includes('براز'));
              return item?.value || '';
            })()
          }
          onSave={(serialized: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c === 'GSE' || n.includes('stool') || n.includes('خروج') || n.includes('براز'));
            if (item) {
              workspace.updateResultValue(item.testId, serialized);
            }
          }}
        />
      )}

      {/* 4.3 CBC ANALYSIS MODAL */}
      {activeSpecialModal === 'CBC' && (
        <CbcModal
          isOpen={activeSpecialModal === 'CBC'}
          onClose={handleCloseSpecialModal}
          sample={syntheticSample}
          initialValue={
            (() => {
              const item = findTargetResultItem((c, n) => c === 'CBC' || n.includes('cbc') || n.includes('blood count'));
              return item?.value || '';
            })()
          }
          onSave={(serialized: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c === 'CBC' || n.includes('cbc') || n.includes('blood count'));
            if (item) {
              workspace.updateResultValue(item.testId, serialized);
            }
          }}
        />
      )}

      {/* 4.4 SEMEN FLUID ANALYSIS (SFA) MODAL */}
      {activeSpecialModal === 'SFA' && (
        <SemenFormModal
          isOpen={activeSpecialModal === 'SFA'}
          onClose={handleCloseSpecialModal}
          patientName={workspace.patient.name || 'Walk-in Patient'}
          sampleNumber="INTAKE"
          initialData={
            (() => {
              const item = findTargetResultItem(
                (c, n) =>
                  c === 'SFA' ||
                  c === 'SEMEN' ||
                  n.includes('semen') ||
                  n.includes('seminal') ||
                  n.includes('منوي')
              );
              return item?.value || '';
            })()
          }
          onApply={(formattedResult: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem(
              (c, n) =>
                c === 'SFA' ||
                c === 'SEMEN' ||
                n.includes('semen') ||
                n.includes('seminal') ||
                n.includes('منوي')
            );
            if (item) {
              workspace.updateResultValue(item.testId, formattedResult);
            }
          }}
        />
      )}

      {/* 4.5 CHEMISTRY WORKSTATION MODAL */}
      {activeSpecialModal === 'CHEMISTRY' && (
        <ChemistryModal
          isOpen={activeSpecialModal === 'CHEMISTRY'}
          onClose={handleCloseSpecialModal}
          sample={syntheticSample}
          initialValue={
            (() => {
              const item = findTargetResultItem((c, n) => c.includes('CHOL') || c.includes('CREAT') || c.includes('UREA') || n.includes('chemistry'));
              return item?.value || '';
            })()
          }
          onSave={async (serialized: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c.includes('CHOL') || c.includes('CREAT') || c.includes('UREA') || n.includes('chemistry'));
            if (item) {
              workspace.updateResultValue(item.testId, serialized);
            }
          }}
        />
      )}

      {/* 4.6 MICROBIOLOGY WORKSTATION MODAL */}
      {activeSpecialModal === 'MICROBIOLOGY' && (
        <MicrobiologyModal
          isOpen={activeSpecialModal === 'MICROBIOLOGY'}
          onClose={handleCloseSpecialModal}
          sample={syntheticSample}
          initialValue={
            (() => {
              const item = findTargetResultItem((c, n) => c.includes('CULTURE') || n.includes('culture') || n.includes('مزرعة'));
              return item?.value || '';
            })()
          }
          onSave={async (serialized: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c.includes('CULTURE') || n.includes('culture') || n.includes('مزرعة'));
            if (item) {
              workspace.updateResultValue(item.testId, serialized);
            }
          }}
        />
      )}
    </div>
  );
}

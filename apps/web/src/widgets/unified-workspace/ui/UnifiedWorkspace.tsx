'use client';

import React, { useState, useCallback, useMemo } from 'react';
import nextDynamic from 'next/dynamic';
import ReceptionSidebar from './ReceptionSidebar';
import ReceptionHeader from './ReceptionHeader';
import PatientCardPanel from './PatientCardPanel';
import CatalogCartPanel from './CatalogCartPanel';
import ResultsGridPanel from './ResultsGridPanel';
import UnifiedActionBar from './UnifiedActionBar';
import { UnifiedWorkspaceReturn } from '../model/types';
import { useUnifiedWorkspace } from '../model/useUnifiedWorkspace';
import { useShiftNavigation } from '../lib/useShiftNavigation';

// Specialized Workstation Modals (SSR disabled for performance)
const UrineFormModal = nextDynamic(() => import('../../../components/UrineFormModal'), { ssr: false });
const GseModal = nextDynamic(() => import('../../../components/workstations/GseModal'), { ssr: false });
const CbcModal = nextDynamic(() => import('../../../components/workstations/CbcModal'), { ssr: false });
const SemenFormModal = nextDynamic(() => import('../../../components/workstations/SemenFormModal'), { ssr: false });
const ChemistryModal = nextDynamic(() => import('../../../components/workstations/ChemistryModal'), { ssr: false });
const MicrobiologyModal = nextDynamic(() => import('../../../components/workstations/MicrobiologyModal'), { ssr: false });
const AmhFormModal = nextDynamic(() => import('../../../components/workstations/AmhFormModal'), { ssr: false });
const BhcgFormModal = nextDynamic(() => import('../../../components/workstations/BhcgFormModal'), { ssr: false });

type SpecialModalType = 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'AMH' | 'BHCG' | 'CHEMISTRY' | 'MICROBIOLOGY' | null;

interface UnifiedWorkspaceProps {
  workspace?: UnifiedWorkspaceReturn;
}

export default function UnifiedWorkspace({ workspace: propWorkspace }: UnifiedWorkspaceProps) {
  const defaultWorkspace = useUnifiedWorkspace();
  const workspace = propWorkspace || defaultWorkspace;

  // Active Specialized Workstation Modal state
  const [activeSpecialModal, setActiveSpecialModal] = useState<SpecialModalType>(null);
  const [targetSpecialTestId, setTargetSpecialTestId] = useState<string | null>(null);

  // Wire Shift navigation hook (disabled if modal is open)
  useShiftNavigation({
    enabled: activeSpecialModal === null,
  });

  const handleOpenSpecialModal = useCallback((type: 'GUE' | 'GSE' | 'CBC' | 'SFA' | 'CHEMISTRY' | 'MICROBIOLOGY', testId?: string) => {
    setActiveSpecialModal(type);
    setTargetSpecialTestId(testId || null);
  }, []);

  const handleCloseSpecialModal = useCallback(() => {
    setActiveSpecialModal(null);
    setTargetSpecialTestId(null);
  }, []);

  // Helper to locate target test item in current results
  const findTargetResultItem = useCallback(
    (matcher: (code: string, name: string) => boolean) => {
      if (targetSpecialTestId && workspace.results[targetSpecialTestId]) {
        return workspace.results[targetSpecialTestId];
      }
      const entries = Object.values(workspace.results);
      return entries.find((e) => {
        const c = (e.testCode || e.testId || '').toUpperCase().trim();
        const n = (e.testName || '').toLowerCase().trim();
        return matcher(c, n);
      });
    },
    [workspace.results, targetSpecialTestId]
  );

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
      dir="rtl"
      style={{
        height: '100vh',
        width: '100vw',
        maxHeight: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#eef2f5',
        color: '#14202b',
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Sections Sidebar on the RIGHT edge (RTL) */}
      <ReceptionSidebar />

      {/* 2. Main Reception Workspace Area */}
      <div
        style={{
          flex: 1,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {/* Top Header Bar with Quick Action Buttons & Status */}
        <ReceptionHeader workspace={workspace} />

        {/* Panels Container (Right to Left: Patient -> Tests -> Results) */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            gap: '12px',
            padding: '12px',
            overflow: 'hidden',
            boxSizing: 'border-box',
            minHeight: 0,
          }}
        >
          {/* Panel 1: Patient (~312px) */}
          <PatientCardPanel workspace={workspace} />

          {/* Panel 2: Tests (Flexible) */}
          <CatalogCartPanel
            workspace={workspace}
            onOpenSpecialModal={handleOpenSpecialModal}
          />

          {/* Panel 3: Results (~588px, collapses to 68px strip when no test is selected) */}
          <ResultsGridPanel
            workspace={workspace}
            onOpenSpecialModal={handleOpenSpecialModal}
          />
        </div>

        {/* 3. Bottom Action Bar */}
        <UnifiedActionBar workspace={workspace} />
      </div>

      {/* 4. Specialized Workstation Modals */}
      {/* 4.1 URINE (GUE) MODAL */}
      {activeSpecialModal === 'GUE' && (
        <UrineFormModal
          isOpen={activeSpecialModal === 'GUE'}
          onClose={handleCloseSpecialModal}
          patientName={workspace.patient.name || 'Walk-in Patient'}
          sampleNumber="INTAKE"
          initialData={
            (() => {
              const item = findTargetResultItem((c, n) => c === 'GUE' || c.includes('URINE') || n.includes('urine') || n.includes('إدرار') || n.includes('ادرار') || n.includes('بول'));
              return item?.value || '';
            })()
          }
          onApply={(formattedResult: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c === 'GUE' || c.includes('URINE') || n.includes('urine') || n.includes('إدرار') || n.includes('ادرار') || n.includes('بول'));
            if (item) {
              workspace.updateResultValue(item.testId, formattedResult);
            }
          }}
        />
      )}

      {/* 4.2 STOOL (GSE) MODAL */}
      {activeSpecialModal === 'GSE' && (
        <GseModal
          isOpen={activeSpecialModal === 'GSE'}
          onClose={handleCloseSpecialModal}
          sample={syntheticSample}
          initialValue={
            (() => {
              const item = findTargetResultItem((c, n) => c === 'GSE' || c.includes('STOOL') || n.includes('stool') || n.includes('خروج') || n.includes('براز') || n.includes('غائط'));
              return item?.value || '';
            })()
          }
          onSave={(serialized: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c === 'GSE' || c.includes('STOOL') || n.includes('stool') || n.includes('خروج') || n.includes('براز') || n.includes('غائط'));
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
              const item = findTargetResultItem((c, n) => c === 'CBC' || n.includes('cbc') || n.includes('blood count') || n.includes('صورة دم') || n.includes('تعداد دم'));
              return item?.value || '';
            })()
          }
          onSave={(serialized: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c === 'CBC' || n.includes('cbc') || n.includes('blood count') || n.includes('صورة دم') || n.includes('تعداد دم'));
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
                  n.includes('منوي') ||
                  n.includes('سائل منوي')
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
                n.includes('منوي') ||
                n.includes('سائل منوي')
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

      {/* 4.7 ANTI-MULLERIAN HORMONE (AMH) MODAL */}
      {activeSpecialModal === 'AMH' && (
        <AmhFormModal
          isOpen={activeSpecialModal === 'AMH'}
          onClose={handleCloseSpecialModal}
          patientName={workspace.patient.name || 'Walk-in Patient'}
          patientGender={workspace.patient.gender}
          patientAge={workspace.patient.ageYears !== '' ? workspace.patient.ageYears : undefined}
          initialData={
            (() => {
              const item = findTargetResultItem((c, n) => c === 'AMH' || c.includes('AMH') || n.includes('anti-mullerian') || n.includes('mullerian') || n.includes('amh') || n.includes('مخزون'));
              return item?.value || '';
            })()
          }
          onApply={(formattedResult: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c === 'AMH' || c.includes('AMH') || n.includes('anti-mullerian') || n.includes('mullerian') || n.includes('amh') || n.includes('مخزون'));
            if (item) {
              workspace.updateResultValue(item.testId, formattedResult);
            }
          }}
        />
      )}

      {/* 4.8 TOTAL BETA-HCG MODAL */}
      {activeSpecialModal === 'BHCG' && (
        <BhcgFormModal
          isOpen={activeSpecialModal === 'BHCG'}
          onClose={handleCloseSpecialModal}
          patientName={workspace.patient.name || 'Walk-in Patient'}
          patientGender={workspace.patient.gender}
          patientAge={workspace.patient.ageYears !== '' ? workspace.patient.ageYears : undefined}
          initialData={
            (() => {
              const item = findTargetResultItem((c, n) => c === 'BHCG' || c === 'B-HCG' || c === 'HCG' || n.includes('beta-hcg') || n.includes('b-hcg') || n.includes('β-hcg') || n.includes('حمل رقمي') || (n.includes('hcg') && !n.includes('rapid')));
              return item?.value || '';
            })()
          }
          onApply={(formattedResult: string) => {
            handleCloseSpecialModal();
            const item = findTargetResultItem((c, n) => c === 'BHCG' || c === 'B-HCG' || c === 'HCG' || n.includes('beta-hcg') || n.includes('b-hcg') || n.includes('β-hcg') || n.includes('حمل رقمي') || (n.includes('hcg') && !n.includes('rapid')));
            if (item) {
              workspace.updateResultValue(item.testId, formattedResult);
            }
          }}
        />
      )}
    </div>
  );
}

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import nextDynamic from 'next/dynamic';
import PatientCardPanel from './PatientCardPanel';
import CatalogCartPanel from './CatalogCartPanel';
import ResultsGridPanel from './ResultsGridPanel';
import UnifiedActionBar from './UnifiedActionBar';
import { UnifiedWorkspaceReturn } from '../model/types';
import { useUnifiedWorkspace } from '../model/useUnifiedWorkspace';
import { useShiftNavigation } from '../lib/useShiftNavigation';
import Link from 'next/link';
import {
  FlaskConical,
  Bell,
  HelpCircle,
  RotateCcw,
  Menu,
  X,
  FileText,
  Activity,
  Users,
  LayoutDashboard,
  TrendingUp,
  Package,
  Layers,
  Cpu,
  Settings as SettingsIcon,
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
  // Navigation Drawer state for all system sections
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Wire Shift navigation hook (disabled if modal or drawer is open)
  useShiftNavigation({
    enabled: activeSpecialModal === null && !isDrawerOpen,
  });

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

  // All 10 Application Modules for Drawer Menu
  const drawerNavItems = [
    { href: '/', label: 'الاستقبال والكونسول الموحد', sub: 'Intake & Reception', icon: FlaskConical },
    { href: '/results', label: 'إدخال وتدقيق النتائج', sub: 'Results Entry & Workstations', icon: FileText },
    { href: '/samples', label: 'سجل العينات والأرشيف', sub: 'Sample Registry', icon: Activity },
    { href: '/patients', label: 'دليل وأرشيف المرضى', sub: 'Patients Directory', icon: Users },
    { href: '/dashboard', label: 'المؤشرات والإحصائيات', sub: 'Clinical Dashboard', icon: LayoutDashboard },
    { href: '/financials', label: 'الصندوق والمركز المالي', sub: 'Financial Center & Safe', icon: TrendingUp },
    { href: '/inventory', label: 'المخزون والكواشف', sub: 'Inventory & Reagents', icon: Package },
    { href: '/catalog', label: 'كتالوج التحاليل والأسعار', sub: 'Test Catalog', icon: Layers },
    { href: '/devices', label: 'أجهزة التحليل والربط', sub: 'LIS Analyzers ASTM/HL7', icon: Cpu },
    { href: '/settings', label: 'إعدادات النظام والطباعة', sub: 'System Settings', icon: SettingsIcon },
  ];

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
      {/* 1. Sleek Top Header (LTR) with Navigation Menu Drawer */}
      <header
        style={{
          height: '46px',
          flexShrink: 0,
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(8px)',
          zIndex: 30,
          boxSizing: 'border-box',
        }}
      >
        {/* Left side: Quick F1 Reset & Status Icons */}
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
            title="إعادة تعيين النموذج وبدء مريض جديد (F1)"
          >
            <RotateCcw size={13} />
            <span>مريض جديد (F1)</span>
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

        {/* Right side: Navigation Drawer Button & Lab Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          </div>

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

          {/* Menu Drawer Toggle Button */}
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            style={{
              padding: '6px 10px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 800,
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
            title="فتح قائمة أقسام المختبر والتنقل"
          >
            <Menu size={16} color="#0284c7" />
            <span>الأقسام (Modules)</span>
          </button>
        </div>
      </header>

      {/* 2. Main 3-Column Clinical Workspace Reordered (Strictly Right: Patient, Center: Catalog, Left: Results) */}
      <main
        style={{
          flex: 1,
          minHeight: 0,
          padding: '10px 20px 62px 20px',
          display: 'grid',
          gridTemplateColumns: '36% 36% 28%',
          gap: '14px',
          alignItems: 'stretch',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        {/* Left Column (36%): Clinical Results Grid */}
        <div style={{ height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ResultsGridPanel
            workspace={workspace}
            onOpenSpecialModal={handleOpenSpecialModal}
          />
        </div>

        {/* Center Column (36%): Test Catalog & Cart Panel */}
        <div style={{ height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <CatalogCartPanel
            workspace={workspace}
            onOpenSpecialModal={handleOpenSpecialModal}
          />
        </div>

        {/* Right Column (28%): Patient Demographics & Registration */}
        <div style={{ height: '100%', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <PatientCardPanel workspace={workspace} />
        </div>
      </main>

      {/* 3. Bottom Centered Floating Action Dock */}
      <UnifiedActionBar workspace={workspace} />

      {/* 4. Slide-Over Navigation Drawer for All System Modules */}
      {isDrawerOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          {/* Dark Backdrop Overlay */}
          <div
            onClick={() => setIsDrawerOpen(false)}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.45)',
              backdropFilter: 'blur(3px)',
              transition: 'opacity 0.2s ease',
            }}
          />

          {/* Slide-out White Drawer Card */}
          <div
            style={{
              position: 'relative',
              width: '320px',
              maxWidth: '85vw',
              height: '100%',
              backgroundColor: '#ffffff',
              boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1001,
              animation: 'drawerSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #06b6d4 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <FlaskConical size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                    LABRYO LIMS
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    أقسام منظومة المختبر
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body: 10 Modules List */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              {drawerNavItems.map((item) => {
                const isCurrent = item.href === '/';
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsDrawerOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      textDecoration: 'none',
                      backgroundColor: isCurrent ? '#f0fdfa' : 'transparent',
                      color: isCurrent ? '#0f766e' : '#334155',
                      border: isCurrent ? '1px solid #99f6e4' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '7px',
                        backgroundColor: isCurrent ? '#ccfbf1' : '#f1f5f9',
                        color: isCurrent ? '#0f766e' : '#64748b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: isCurrent ? 800 : 700, lineHeight: 1.2 }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                        {item.sub}
                      </div>
                    </div>

                    {isCurrent && (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '9999px',
                          backgroundColor: '#0d9488',
                          color: '#fff',
                        }}
                      >
                        Active
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #f1f5f9',
                backgroundColor: '#f8fafc',
                fontSize: '11px',
                color: '#64748b',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Version 1.3.1 Pro</span>
              <span style={{ fontWeight: 800, color: '#0d9488' }}>منظومة المختبر السريري</span>
            </div>
          </div>
        </div>
      )}

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

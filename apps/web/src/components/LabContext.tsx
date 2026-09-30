'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api';

export interface LabProfile {
  labName: string;
  labSubtitle: string;
  doctorName: string;
  doctorTitle: string;
  labLicense: string;
  whatsappNumber: string;
  currency: string;
  address: string;
  phone: string;
  reportHeader: string;
  reportFooter: string;
  reportTemplate: 'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED' | 'PREPRINTED' | 'BLANK_WHITE';
  headerMode?: 'DIGITAL' | 'PREPRINTED';
  topMarginMm?: number;
  bottomMarginMm?: number;
  leftMarginMm?: number;
  rightMarginMm?: number;
  primaryColor?: string;
  enableQrCode?: boolean;
  qrCodePosition?: 'HEADER' | 'FOOTER';
  accreditationBadge?: string;
  logoPath?: string;
  logoUrl?: string;
  isConfigured: boolean;
  serverBaseUrl?: string;
  detectedLanIp?: string;
  detectedPort?: number;
  detectedLanUrl?: string;

  // Sheet Elements & Watermark Customization
  showLabName?: boolean;
  labNameFontSize?: number;
  labNameColor?: string;
  labNameAlignment?: 'RIGHT' | 'CENTER' | 'LEFT';
  labNameStyle?: 'DEFAULT' | 'BOLD' | 'MODERN_BADGE' | 'ELEGANT_BORDER';
  showLabSubtitle?: boolean;
  showContactInfo?: boolean;
  showDoctorInfo?: boolean;
  showPatientBox?: boolean;
  showReportBorder?: boolean;
  showFooter?: boolean;
  showFooterSignature?: boolean;
  enableWatermark?: boolean;
  watermarkType?: 'TEXT' | 'IMAGE';
  watermarkText?: string;
  watermarkImage?: string;
  watermarkOpacity?: number;
  watermarkAngle?: number;
  watermarkSize?: number;
  watermarkColor?: string;
  fontFamily?: 'Tajawal' | 'Cairo' | 'IBM Plex Sans Arabic' | 'Almarai' | 'System';
  fontSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
  installedVersion?: string;

  // Milestone: Two-Tab Form Design System (Visual Styling & Columns Layout)
  formBgColor?: string;
  headerBgColor?: string;
  headerTextColor?: string;
  textColor?: string;
  borderColor?: string;
  reportTitleFontSize?: number;
  testNameFontSize?: number;
  resultValueFontSize?: number;
  unitFontSize?: number;
  refRangeFontSize?: number;
  testNameFontWeight?: 'normal' | 'bold';
  resultValueFontWeight?: 'normal' | 'bold';
  tableColumns?: FormTableColumn[];
  groupByCategory?: boolean;
  tableRowBorders?: boolean;
  tableZebraStriping?: boolean;
  tableRowSpacing?: 'COMPACT' | 'COMFORTABLE' | 'RELAXED';
}

export interface FormTableColumn {
  id: 'testName' | 'result' | 'unit' | 'refRange' | 'notes';
  label: string;
  visible: boolean;
  align: 'left' | 'center' | 'right';
}

export const DEFAULT_TABLE_COLUMNS: FormTableColumn[] = [
  { id: 'testName', label: 'INVESTIGATION (اسم التحليل)', visible: true, align: 'left' },
  { id: 'result', label: 'RESULT (النتيجة)', visible: true, align: 'left' },
  { id: 'unit', label: 'UNIT (الوحدة)', visible: true, align: 'left' },
  { id: 'refRange', label: 'REFERENCE RANGE (المعدل الطبيعي)', visible: true, align: 'left' },
  { id: 'notes', label: 'NOTES (الملاحظات السريرية)', visible: false, align: 'left' },
];

const DEFAULT_LAB_PROFILE: LabProfile = {
  labName: '',
  labSubtitle: '',
  doctorName: '',
  doctorTitle: 'استشاري التحليلات المرضية والمخبرية',
  labLicense: '',
  whatsappNumber: '',
  currency: 'د.ع',
  address: '',
  phone: '',
  reportHeader: '',
  reportFooter: 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية.',
  reportTemplate: 'CLASSIC',
  headerMode: 'DIGITAL',
  topMarginMm: 15,
  bottomMarginMm: 15,
  leftMarginMm: 12,
  rightMarginMm: 12,
  primaryColor: '#0284c7',
  enableQrCode: true,
  qrCodePosition: 'HEADER',
  accreditationBadge: 'ISO 15189 Certified Lab',
  isConfigured: false,
  serverBaseUrl: '',
  fontFamily: 'Tajawal',
  fontSize: 'MEDIUM',
  showLabName: true,
  labNameFontSize: 22,
  labNameColor: '#0284c7',
  labNameAlignment: 'RIGHT',
  labNameStyle: 'DEFAULT',
  showLabSubtitle: true,
  showContactInfo: true,
  showDoctorInfo: true,
  showPatientBox: true,
  showReportBorder: true,
  showFooter: true,
  showFooterSignature: true,
  enableWatermark: false,
  watermarkType: 'TEXT',
  watermarkText: '',
  watermarkOpacity: 0.08,
  watermarkAngle: -30,
  watermarkSize: 46,
  watermarkColor: '#0f172a',
  logoUrl: '',

  // Form Design Defaults
  formBgColor: '#ffffff',
  headerBgColor: '#0284c7',
  headerTextColor: '#ffffff',
  textColor: '#0f172a',
  borderColor: '#e2e8f0',
  reportTitleFontSize: 20,
  testNameFontSize: 12,
  resultValueFontSize: 12,
  unitFontSize: 11,
  refRangeFontSize: 11,
  testNameFontWeight: 'bold',
  resultValueFontWeight: 'normal',
  tableColumns: DEFAULT_TABLE_COLUMNS,
  groupByCategory: false,
  tableRowBorders: true,
  tableZebraStriping: false,
  tableRowSpacing: 'COMFORTABLE',
};

interface LabContextType {
  labProfile: LabProfile;
  updateLabProfile: (profile: Partial<LabProfile>, syncRemote?: boolean) => Promise<void>;
  showSetupModal: boolean;
  setShowSetupModal: (show: boolean) => void;
  openSetupWizard: () => void;
  dismissSetupWizard: () => Promise<void>;
}

const LabContext = createContext<LabContextType>({
  labProfile: DEFAULT_LAB_PROFILE,
  updateLabProfile: async () => {},
  showSetupModal: false,
  setShowSetupModal: () => {},
  openSetupWizard: () => {},
  dismissSetupWizard: async () => {},
});

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [labProfile, setLabProfile] = useState<LabProfile>(DEFAULT_LAB_PROFILE);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Check local storage first
    let localConfigured = false;
    try {
      const savedProfile = localStorage.getItem('lab_profile_settings');
      const setupCompleted = localStorage.getItem('lab_setup_completed') === 'true';
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        localConfigured = Boolean(parsed.isConfigured || setupCompleted || (parsed.labName && parsed.labName.trim().length > 0));
        setLabProfile({ ...DEFAULT_LAB_PROFILE, ...parsed, isConfigured: localConfigured });
      } else if (setupCompleted) {
        localConfigured = true;
      }
    } catch (e) {
      console.warn('Could not read lab profile from localStorage:', e);
    }

    // 2. Sync from backend settings API
    apiRequest('/settings')
      .then((remote) => {
        if (remote) {
          const isConfig = Boolean(
            remote.isConfigured === true ||
            localConfigured ||
            (typeof window !== 'undefined' && localStorage.getItem('lab_setup_completed') === 'true') ||
            (remote.labName && remote.labName.trim().length > 0)
          );
          
          if (isConfig && typeof window !== 'undefined') {
            try {
              localStorage.setItem('lab_setup_completed', 'true');
            } catch (e) {}
          }
          
          setLabProfile((prev) => {
            const merged: LabProfile = {
              ...prev,
              ...remote,
              isConfigured: isConfig,
              tableColumns: (remote.tableColumns && Array.isArray(remote.tableColumns) && remote.tableColumns.length > 0)
                ? remote.tableColumns
                : (prev.tableColumns || DEFAULT_TABLE_COLUMNS),
            };
            return merged;
          });

          // Auto open Onboarding Setup Wizard if not yet configured!
          if (!isConfig) {
            setShowSetupModal(true);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        setIsInitialized(true);
      });
  }, []);


  const updateLabProfile = async (newFields: Partial<LabProfile>, syncRemote = true) => {
    const updated: LabProfile = {
      ...labProfile,
      ...newFields,
      isConfigured: true,
    };

    setLabProfile(updated);

    // Save to localStorage
    try {
      localStorage.setItem('lab_profile_settings', JSON.stringify(updated));
      localStorage.setItem('lab_setup_completed', 'true');
    } catch (e) {
      console.warn('Failed to save lab profile to localStorage:', e);
    }

    // Sync to backend API
    if (syncRemote) {
      try {
        await apiRequest('/settings', 'POST', {
          ...updated,
          isConfigured: true,
        });
      } catch (err) {
        console.warn('Failed to sync settings to server:', err);
      }
    }
  };

  const dismissSetupWizard = async () => {
    setShowSetupModal(false);
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('lab_setup_completed', 'true');
        const saved = localStorage.getItem('lab_profile_settings');
        if (saved) {
          const parsed = JSON.parse(saved);
          localStorage.setItem('lab_profile_settings', JSON.stringify({ ...parsed, isConfigured: true }));
        }
      }
      setLabProfile((prev) => ({ ...prev, isConfigured: true }));
      await apiRequest('/settings', 'POST', {
        isConfigured: true,
      });
    } catch (e) {
      console.warn('Failed to dismiss setup wizard cleanly:', e);
    }
  };

  const openSetupWizard = () => setShowSetupModal(true);

  return (
    <LabContext.Provider
      value={{
        labProfile,
        updateLabProfile,
        showSetupModal,
        setShowSetupModal,
        openSetupWizard,
        dismissSetupWizard,
      }}
    >
      {children}
    </LabContext.Provider>
  );
}

export function useLab() {
  return useContext(LabContext);
}

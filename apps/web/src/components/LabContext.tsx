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
  reportTemplate: 'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'PREPRINTED' | 'BLANK_WHITE';
  logoPath?: string;
  isConfigured: boolean;
}

const DEFAULT_LAB_PROFILE: LabProfile = {
  labName: 'مختبر الرضا للتحليلات الطبية التخصصية',
  labSubtitle: 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل',
  doctorName: 'د. أحمد الرضا',
  doctorTitle: 'استشاري التحليلات المرضية والمناعة السريرية',
  labLicense: 'MOH-IQ-2026-8842',
  whatsappNumber: '07701234567',
  currency: 'د.ع',
  address: 'بغداد - شارع الأطباء - مقابل المجمع الطبي الرئيسي',
  phone: '07701234567 / 07801234567',
  reportHeader: 'مختبر الرضا للتحليلات الطبية التخصصية',
  reportFooter: 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً دون الحاجة لتوقيع يدوي.',
  reportTemplate: 'CLASSIC',
  isConfigured: false,
};

interface LabContextType {
  labProfile: LabProfile;
  updateLabProfile: (profile: Partial<LabProfile>, syncRemote?: boolean) => Promise<void>;
  showSetupModal: boolean;
  setShowSetupModal: (show: boolean) => void;
  openSetupWizard: () => void;
}

const LabContext = createContext<LabContextType>({
  labProfile: DEFAULT_LAB_PROFILE,
  updateLabProfile: async () => {},
  showSetupModal: false,
  setShowSetupModal: () => {},
  openSetupWizard: () => {},
});

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [labProfile, setLabProfile] = useState<LabProfile>(DEFAULT_LAB_PROFILE);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // 1. Check local storage first
    try {
      const savedProfile = localStorage.getItem('lab_profile_settings');

      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        setLabProfile({ ...DEFAULT_LAB_PROFILE, ...parsed, isConfigured: true });
      }
    } catch (e) {
      console.warn('Could not read lab profile from localStorage:', e);
    }

    // 2. Sync from backend settings API
    apiRequest('/settings')
      .then((remote) => {
        if (remote && remote.labName) {
          setLabProfile((prev) => {
            const merged: LabProfile = {
              ...prev,
              labName: remote.labName || prev.labName,
              labSubtitle: remote.labSubtitle || prev.labSubtitle,
              doctorName: remote.doctorName || prev.doctorName,
              doctorTitle: remote.doctorTitle || prev.doctorTitle,
              labLicense: remote.labLicense || prev.labLicense,
              whatsappNumber: remote.whatsappNumber || prev.whatsappNumber,
              currency: remote.currency || prev.currency,
              address: remote.address || prev.address,
              phone: remote.phone || prev.phone,
              reportHeader: remote.reportHeader || prev.reportHeader,
              reportFooter: remote.reportFooter || prev.reportFooter,
              reportTemplate: (remote.reportTemplate || prev.reportTemplate || 'CLASSIC') as any,
            };
            return merged;
          });
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
          labName: updated.labName,
          labSubtitle: updated.labSubtitle,
          doctorName: updated.doctorName,
          doctorTitle: updated.doctorTitle,
          labLicense: updated.labLicense,
          whatsappNumber: updated.whatsappNumber,
          currency: updated.currency,
          address: updated.address,
          phone: updated.phone,
          reportHeader: updated.reportHeader,
          reportFooter: updated.reportFooter,
          reportTemplate: updated.reportTemplate,
        });
      } catch (err) {
        console.warn('Failed to sync settings to server:', err);
      }
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
      }}
    >
      {children}
    </LabContext.Provider>
  );
}

export function useLab() {
  return useContext(LabContext);
}

'use client';

import React from 'react';
import { ToastProvider } from './Toast';
import { ThemeProvider } from './ThemeContext';
import { LabProvider } from './LabContext';
import LabOnboardingModal from './LabOnboardingModal';
import TrialLockGuard from './TrialLockGuard';
import NetworkSyncProvider from './NetworkSyncProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LabProvider>
        <ToastProvider>
          <NetworkSyncProvider>
            <TrialLockGuard>
              {children}
              <LabOnboardingModal />
            </TrialLockGuard>
          </NetworkSyncProvider>
        </ToastProvider>
      </LabProvider>
    </ThemeProvider>
  );
}

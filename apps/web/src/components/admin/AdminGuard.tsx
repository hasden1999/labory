'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminUser, getAdminUser, isAdminAuthenticated, removeAdminAuth } from '../../lib/adminAuth';

interface AdminContextType {
  adminUser: AdminUser | null;
  logout: () => void;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType>({
  adminUser: null,
  logout: () => {},
  isLoading: true,
});

export const useAdmin = () => useContext(AdminContext);

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const user = getAdminUser();
    const authenticated = isAdminAuthenticated();

    if (isLoginPage) {
      if (authenticated && user) {
        router.replace('/admin');
      } else {
        setIsLoading(false);
      }
      return;
    }

    if (!authenticated || !user) {
      removeAdminAuth();
      router.replace('/admin/login');
    } else {
      setAdminUser(user);
      setIsLoading(false);
    }
  }, [pathname, isLoginPage, router]);

  const logout = () => {
    removeAdminAuth();
    router.replace('/admin/login');
  };

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div
        dir="rtl"
        style={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #090d16 0%, #0f172a 100%)',
          color: '#f8fafc',
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '3px solid rgba(13, 148, 136, 0.2)',
            borderTopColor: '#0d9488',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '15px', fontWeight: 800, color: '#f8fafc' }}>
            التحقق من صلاحيات إدارة النظام العليا
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            جاري تأمين جلسة الإدارة المشفرة...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminContext.Provider value={{ adminUser, logout, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
}

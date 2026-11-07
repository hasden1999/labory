'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import dynamicImport from 'next/dynamic';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import NetworkSettingsPanel from '../../components/network/NetworkSettingsPanel';
import {
  Layout,
  Layers,
  Settings as SettingsIcon,
  Search,
  Plus,
  Check,
  X,
  Trash2,
  Download,
  RefreshCw,
  ShieldCheck,
  Users,
  Database,
} from 'lucide-react';
import { toEnglishDigits } from '../../lib/formatters';
import { catalogCache } from '../../lib/catalogCache';
import type { ReferenceRangeItem } from '../../components/catalog/ReferenceRangesEditor';

const PaperDesignerV2 = dynamicImport(() => import('../../components/workspace/PaperDesignerV2'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
      جاري تحميل مصمم الفورمات والورق...
    </div>
  ),
});

const ReferenceRangesEditor = dynamicImport(() => import('../../components/catalog/ReferenceRangesEditor'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
      جاري تحميل محرر المعدلات الطبيعية والشرائح...
    </div>
  ),
});

function UnifiedSettingsCatalogView({
  initialTab = 'PAPER_DESIGN',
}: {
  initialTab?: 'PAPER_DESIGN' | 'CATALOG' | 'WHATSAPP' | 'SYSTEM';
}) {
  const toast = useToast();
  const { labProfile, updateLabProfile } = useLab();
  const currency = labProfile?.currency || 'د.ع';

  const [activeTab, setActiveTab] = useState<'PAPER_DESIGN' | 'CATALOG' | 'WHATSAPP' | 'SYSTEM'>(initialTab);

  // Catalog State
  const [tests, setTests] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = catalogCache.getTests();
      if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    }
    return [];
  });
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editRefRange, setEditRefRange] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [deletingTestId, setDeletingTestId] = useState<string | null>(null);

  // Add Test Modal
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Biochemistry');
  const [newPrice, setNewPrice] = useState('10000');
  const [newUnit, setNewUnit] = useState('mg/dL');
  const [newRef, setNewRef] = useState('');
  const [newRanges, setNewRanges] = useState<ReferenceRangeItem[]>([]);
  const [newCriticalLow, setNewCriticalLow] = useState('');
  const [newCriticalHigh, setNewCriticalHigh] = useState('');
  const [showNewRangesEditor, setShowNewRangesEditor] = useState(false);

  // Reference Ranges Editor Modal State
  const [rangesModalTest, setRangesModalTest] = useState<any | null>(null);
  const [activeRanges, setActiveRanges] = useState<ReferenceRangeItem[]>([]);
  const [activeCriticalLow, setActiveCriticalLow] = useState<string>('');
  const [activeCriticalHigh, setActiveCriticalHigh] = useState<string>('');
  const [savingRanges, setSavingRanges] = useState<boolean>(false);

  // System Tab State (Staff, Backup, Updater, License, WhatsApp Web)
  const [staffList, setStaffList] = useState<any[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('فني مختبر');
  const [updaterState, setUpdaterState] = useState<any>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupList, setBackupList] = useState<{ fileName: string; sizeBytes: number; createdAt: string }[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [restoringBackupFile, setRestoringBackupFile] = useState<string | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<any>(null);

  // WhatsApp Web QR Pairing & Auto-Send State
  const [waStatus, setWaStatus] = useState<{
    connected: boolean;
    status: 'DISCONNECTED' | 'PAIRING' | 'CONNECTED';
    user?: string;
    userName?: string;
    qrDataUrl?: string;
    hasSavedSession?: boolean;
  }>({
    connected: false,
    status: 'DISCONNECTED',
  });
  const [waLoading, setWaLoading] = useState(false);
  const [waAutoSend, setWaAutoSend] = useState<boolean>(Boolean(labProfile?.whatsappAutoSendEnabled));
  const wasActivelyScanningQrRef = useRef<boolean>(false);
  const hasNotifiedWaConnectRef = useRef<boolean>(false);

  useEffect(() => {
    if (labProfile?.whatsappAutoSendEnabled !== undefined) {
      setWaAutoSend(Boolean(labProfile.whatsappAutoSendEnabled));
    }
  }, [labProfile?.whatsappAutoSendEnabled]);

  const fetchWaStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/whatsapp/status', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setWaStatus((prev) => {
        const wasConnected = prev.connected;
        const nowConnected = Boolean(data?.connected);
        const qrPresent = Boolean(data?.qrDataUrl || data?.qr);

        if (!nowConnected && qrPresent) {
          wasActivelyScanningQrRef.current = true;
        }

        // Only notify once when the user actively scanned a QR code to link a new session
        if (
          !wasConnected &&
          nowConnected &&
          wasActivelyScanningQrRef.current &&
          !hasNotifiedWaConnectRef.current
        ) {
          hasNotifiedWaConnectRef.current = true;
          wasActivelyScanningQrRef.current = false;
          toast.success('تم ربط حساب واتساب ويب بنجاح وحفظ الجلسة دائماً ✓');
        }
        return {
          connected: nowConnected,
          status: data?.status || (nowConnected ? 'CONNECTED' : 'DISCONNECTED'),
          user: data?.user,
          userName: data?.userName,
          qrDataUrl: data?.qrDataUrl || data?.qr,
          hasSavedSession: Boolean(data?.hasSavedSession),
        };
      });
    } catch {}
  }, [toast]);

  const handleConnectWhatsApp = async (forceRestart = false, silent = false) => {
    setWaLoading(true);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRestart }),
      });
      const data = await res.json();
      const qrUrl = data?.qrDataUrl || data?.qr;
      if (!data?.connected && qrUrl) {
        wasActivelyScanningQrRef.current = true;
        hasNotifiedWaConnectRef.current = false;
      }
      setWaStatus({
        connected: Boolean(data?.connected),
        status: data?.status || 'PAIRING',
        user: data?.user,
        userName: data?.userName,
        qrDataUrl: qrUrl,
        hasSavedSession: Boolean(data?.hasSavedSession),
      });
      if (!silent) {
        if (data?.connected) {
          toast.success('حساب واتساب ويب متصل ونشط بالفعل ✓');
        } else if (qrUrl) {
          toast.info('تم توليد الباركود (QR) — امسحه من تطبيق واتساب في هاتفك للربط');
        } else {
          toast.info('جاري تجهيز اتصال واتساب، سيظهر الرمز خلال ثوانٍ معدودة...');
        }
      }
    } catch (err: any) {
      if (!silent) {
        toast.error(err?.message || 'تعذر بدء جلسة ربط واتساب ويب');
      }
    } finally {
      setWaLoading(false);
    }
  };

  const handleLogoutWhatsApp = async () => {
    setWaLoading(true);
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
      wasActivelyScanningQrRef.current = false;
      hasNotifiedWaConnectRef.current = false;
      setWaStatus({
        connected: false,
        status: 'DISCONNECTED',
        user: undefined,
        userName: undefined,
        qrDataUrl: undefined,
        hasSavedSession: false,
      });
      toast.info('تم فصل حساب واتساب ومسح الجلسة المحفوظة');
    } catch (err: any) {
      toast.error(err?.message || 'تعذر فصل حساب واتساب');
    } finally {
      setWaLoading(false);
    }
  };

  const handleToggleWaAutoSend = async (nextVal: boolean) => {
    setWaAutoSend(nextVal);
    try {
      updateLabProfile({ whatsappAutoSendEnabled: nextVal });
      await apiRequest('/settings', 'POST', { whatsappAutoSendEnabled: nextVal });
      if (nextVal) {
        toast.success('تم تفعيل الإرسال التلقائي للنتائج عبر واتساب فور اكتمالها وحفظها ✓');
      } else {
        toast.info('تم إيقاف الإرسال التلقائي عبر واتساب');
      }
    } catch (err: any) {
      toast.error(err?.message || 'تعذر حفظ إعداد الإرسال التلقائي');
    }
  };

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await apiRequest('/tests');
      const list = Array.isArray(res)
        ? res
        : (res?.tests && Array.isArray(res.tests) ? res.tests : []);
      setTests(list);
      if (list.length > 0) {
        catalogCache.update(list);
      }
    } catch (err: any) {
      toast.error(err.message || 'تعذر تحميل دليل التحاليل');
    } finally {
      setLoadingCatalog(false);
    }
  }, [toast]);

  const fetchBackupToken = useCallback(async (): Promise<string> => {
    const sessRes = await fetch('/api/backup/session', { cache: 'no-store' });
    const sessJson = await sessRes.json().catch(() => ({}));
    return sessJson?.token || '';
  }, []);

  const loadBackupSnapshots = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const token = await fetchBackupToken();
      const res = await fetch('/api/backup/list', {
        cache: 'no-store',
        headers: token ? { 'x-backup-token': token } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setBackupList(data);
        }
      }
    } catch {} finally {
      setLoadingBackups(false);
    }
  }, [fetchBackupToken]);

  const loadSystemData = useCallback(async () => {
    try {
      const [staffRes, licRes, verRes] = await Promise.all([
        apiRequest('/staff').catch(() => []),
        apiRequest('/license/status').catch(() => null),
        fetch('/api/version/check').then((r) => r.json()).catch(() => null),
      ]);
      setStaffList(Array.isArray(staffRes) ? staffRes : []);
      if (licRes) setLicenseStatus(licRes);
      if (verRes) setUpdaterState(verRes);
      await Promise.all([fetchWaStatus(), loadBackupSnapshots()]);
    } catch (e) {}
  }, [fetchWaStatus, loadBackupSnapshots]);

  useEffect(() => {
    fetchWaStatus();
  }, [fetchWaStatus]);

  useEffect(() => {
    const onOpenWaQr = () => {
      setActiveTab('WHATSAPP');
    };
    window.addEventListener('labryo:open-whatsapp-qr', onOpenWaQr);
    return () => window.removeEventListener('labryo:open-whatsapp-qr', onOpenWaQr);
  }, []);

  useEffect(() => {
    if (activeTab === 'CATALOG') {
      loadCatalog();
    } else if (activeTab === 'SYSTEM') {
      loadSystemData();
    } else if (activeTab === 'WHATSAPP') {
      fetchWaStatus();
    }
  }, [activeTab, loadCatalog, loadSystemData, fetchWaStatus]);

  // Automatically start generating QR barcode silently when user opens WHATSAPP or SYSTEM tab if not connected yet
  useEffect(() => {
    if (activeTab !== 'WHATSAPP' && activeTab !== 'SYSTEM') return;
    if (!waStatus.connected && !waStatus.qrDataUrl && !waLoading) {
      handleConnectWhatsApp(false, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Poll WhatsApp connection status (every 2.5s while pairing QR is active, or every 12s once connected)
  useEffect(() => {
    if (activeTab !== 'WHATSAPP' && activeTab !== 'SYSTEM' && waStatus.status !== 'PAIRING') return;
    const intervalMs = waStatus.connected ? 12000 : 2500;
    const timer = setInterval(() => {
      fetchWaStatus();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [activeTab, waStatus.status, waStatus.connected, fetchWaStatus]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    tests.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ['ALL', ...Array.from(set)];
  }, [tests]);

  const filteredTests = useMemo(() => {
    const q = catalogSearch.toLowerCase().trim();
    return tests.filter((t) => {
      if (catalogCategory !== 'ALL' && t.category !== catalogCategory) return false;
      if (!q) return true;
      return (
        (t.name || '').toLowerCase().includes(q) ||
        (t.arabicName || '').toLowerCase().includes(q) ||
        (t.code || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    });
  }, [tests, catalogSearch, catalogCategory]);

  const handleStartEditTest = (t: any) => {
    setEditingTestId(t.id);
    setEditName(t.name || '');
    setEditPrice(String(t.price ?? 0));
    setEditRefRange(t.referenceRange || t.refRangeText || t.normalRange || '');
    setEditUnit(t.unit || '');
  };

  const handleOpenRangesModal = (test: any) => {
    setRangesModalTest(test);
    let initialRanges: ReferenceRangeItem[] = [];
    if (Array.isArray(test.referenceRanges) && test.referenceRanges.length > 0) {
      initialRanges = JSON.parse(JSON.stringify(test.referenceRanges));
    } else if (
      test.normalMaleLow != null ||
      test.normalMaleHigh != null ||
      test.normalFemaleLow != null ||
      test.normalFemaleHigh != null
    ) {
      const timestamp = Date.now();
      initialRanges = [
        {
          id: `rr_m_${timestamp}`,
          label: 'رجال',
          sex: 'M',
          ageMin: 18,
          ageMax: null,
          ageUnit: 'years',
          low: test.normalMaleLow != null ? Number(test.normalMaleLow) : null,
          high: test.normalMaleHigh != null ? Number(test.normalMaleHigh) : null,
          unit: test.unit || null,
          isUserEdited: true,
          sortOrder: 0,
        },
        {
          id: `rr_f_${timestamp + 1}`,
          label: 'نساء',
          sex: 'F',
          ageMin: 18,
          ageMax: null,
          ageUnit: 'years',
          low: test.normalFemaleLow != null ? Number(test.normalFemaleLow) : null,
          high: test.normalFemaleHigh != null ? Number(test.normalFemaleHigh) : null,
          unit: test.unit || null,
          isUserEdited: true,
          sortOrder: 1,
        },
      ];
    } else if (test.refRangeLow != null || test.refRangeHigh != null) {
      initialRanges = [
        {
          id: `rr_all_${Date.now()}`,
          label: 'للجميع',
          sex: 'any',
          ageMin: 0,
          ageMax: null,
          ageUnit: 'years',
          low: test.refRangeLow != null ? Number(test.refRangeLow) : null,
          high: test.refRangeHigh != null ? Number(test.refRangeHigh) : null,
          unit: test.unit || null,
          isUserEdited: true,
          sortOrder: 0,
        },
      ];
    } else {
      const fallbackText = test.refRangeText || test.referenceRange || test.normalRange || '';
      const match = String(fallbackText).trim().match(/^([0-9.]+)\s*-\s*([0-9.]+)$/);
      if (match) {
        initialRanges = [
          {
            id: `rr_all_${Date.now()}`,
            label: 'للجميع',
            sex: 'any',
            ageMin: 0,
            ageMax: null,
            ageUnit: 'years',
            low: parseFloat(match[1]),
            high: parseFloat(match[2]),
            unit: test.unit || null,
            isUserEdited: true,
            sortOrder: 0,
          },
        ];
      } else {
        initialRanges = [
          {
            id: `rr_all_${Date.now()}`,
            label: 'للجميع',
            sex: 'any',
            ageMin: 0,
            ageMax: null,
            ageUnit: 'years',
            low: null,
            high: null,
            text: fallbackText || null,
            valueType: fallbackText ? 'text' : 'numeric',
            unit: test.unit || null,
            isUserEdited: true,
            sortOrder: 0,
          },
        ];
      }
    }
    setActiveRanges(initialRanges);
    setActiveCriticalLow(test.criticalLow != null ? String(test.criticalLow) : '');
    setActiveCriticalHigh(test.criticalHigh != null ? String(test.criticalHigh) : '');
  };

  const handleSaveRangesModal = async () => {
    if (!rangesModalTest) return;
    setSavingRanges(true);
    try {
      const maleRow = activeRanges.find((r) => r.sex === 'M' || r.label?.includes('رجال'));
      const femaleRow = activeRanges.find((r) => r.sex === 'F' || r.label?.includes('نساء'));
      const generalRow = activeRanges.find((r) => r.sex === 'any' || r.label === 'للجميع') || activeRanges[0];

      let summaryText = '';
      if (maleRow && femaleRow) {
        const mStr = maleRow.low != null || maleRow.high != null ? `${maleRow.low ?? ''} - ${maleRow.high ?? ''}` : maleRow.text || '';
        const fStr = femaleRow.low != null || femaleRow.high != null ? `${femaleRow.low ?? ''} - ${femaleRow.high ?? ''}` : femaleRow.text || '';
        summaryText = `M: ${mStr} | F: ${fStr}`;
      } else if (generalRow) {
        if (generalRow.low != null && generalRow.high != null) {
          summaryText = `${generalRow.low} - ${generalRow.high}`;
        } else if (generalRow.text) {
          summaryText = generalRow.text;
        }
      }

      const payload = {
        ...rangesModalTest,
        referenceRanges: activeRanges,
        criticalLow: activeCriticalLow !== '' ? Number(toEnglishDigits(activeCriticalLow)) : null,
        criticalHigh: activeCriticalHigh !== '' ? Number(toEnglishDigits(activeCriticalHigh)) : null,
        normalMaleLow: maleRow && maleRow.low != null ? Number(maleRow.low) : null,
        normalMaleHigh: maleRow && maleRow.high != null ? Number(maleRow.high) : null,
        normalFemaleLow: femaleRow && femaleRow.low != null ? Number(femaleRow.low) : null,
        normalFemaleHigh: femaleRow && femaleRow.high != null ? Number(femaleRow.high) : null,
        refRangeLow: generalRow && generalRow.low != null ? Number(generalRow.low) : null,
        refRangeHigh: generalRow && generalRow.high != null ? Number(generalRow.high) : null,
        refRangeText: summaryText || rangesModalTest.refRangeText || null,
        referenceRange: summaryText || rangesModalTest.referenceRange || null,
        normalRange: summaryText || rangesModalTest.normalRange || null,
      };

      await apiRequest(`/tests/${rangesModalTest.id}`, 'PUT', payload);
      toast.success(`تم حفظ المعدلات المرجعية الطبيعية لفحص (${rangesModalTest.name || rangesModalTest.code}) بنجاح`);

      setTests((prev) => {
        const nextList = prev.map((t) => (t.id === rangesModalTest.id ? { ...t, ...payload } : t));
        catalogCache.update(nextList);
        return nextList;
      });
      setRangesModalTest(null);
    } catch (err: any) {
      toast.error(err.message || 'تعذر حفظ المعدلات الطبيعية');
    } finally {
      setSavingRanges(false);
    }
  };

  const handleSaveEditTest = async (t: any) => {
    const trimmedName = editName.trim();
    if (!trimmedName) {
      toast.warning('يرجى إدخال اسم التحليل');
      return;
    }
    try {
      const cleanRef = toEnglishDigits(editRefRange || '').trim();
      const prevRef = toEnglishDigits(t.refRangeText || t.referenceRange || t.normalRange || '').trim();
      let syncedRanges = Array.isArray(t.referenceRanges) ? [...t.referenceRanges] : [];
      let nextLow = t.refRangeLow ?? null;
      let nextHigh = t.refRangeHigh ?? null;

      if (cleanRef !== prevRef) {
        if (!cleanRef) {
          syncedRanges = [];
          nextLow = null;
          nextHigh = null;
        } else {
          const numMatch = cleanRef.match(/^\s*(-?\d+(?:\.\d+)?)\s*-\s*(-?\d+(?:\.\d+)?)\s*$/);
          const parsedLow = numMatch ? Number(numMatch[1]) : null;
          const parsedHigh = numMatch ? Number(numMatch[2]) : null;
          nextLow = parsedLow;
          nextHigh = parsedHigh;
          // Protect multi-demographic reference ranges (Male/Female/Child) from being wiped out
          if (syncedRanges.length <= 1) {
            syncedRanges = [
              {
                id: syncedRanges[0]?.id || `inline-${t.id || Date.now()}`,
                label: syncedRanges[0]?.label || 'للجميع',
                sex: syncedRanges[0]?.sex || 'any',
                ageUnit: syncedRanges[0]?.ageUnit || 'years',
                ageMin: syncedRanges[0]?.ageMin ?? null,
                ageMax: syncedRanges[0]?.ageMax ?? null,
                low: parsedLow,
                high: parsedHigh,
                text: cleanRef,
              },
            ];
          }
        }
      }

      const payload = {
        ...t,
        name: trimmedName,
        price: Number(toEnglishDigits(editPrice)) || 0,
        referenceRange: cleanRef,
        refRangeText: cleanRef,
        normalRange: cleanRef,
        refRangeLow: nextLow,
        refRangeHigh: nextHigh,
        referenceRanges: syncedRanges,
        unit: editUnit,
        isUserEdited: true,
      };
      await apiRequest(`/tests/${t.id}`, 'PUT', payload);
      toast.success(`تم تحديث التحليل (${t.code || trimmedName}) بنجاح`);
      setEditingTestId(null);
      setTests((prev) => {
        const nextList = prev.map((item) => (item.id === t.id ? { ...item, ...payload } : item));
        catalogCache.update(nextList);
        return nextList;
      });
      await loadCatalog();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حفظ تعديل التحليل');
    }
  };

  const handleDeleteTest = async (t: any) => {
    const confirmMsg = `هل أنت متأكد من حذف التحليل "${t.name}" (${t.code || 'بدون كود'}) من الكتالوج؟\n\nلن يؤثر ذلك على نتائج العينات المحفوظة سابقاً.`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingTestId(t.id);
    try {
      await apiRequest(`/tests/${t.id}`, 'DELETE');
      toast.success(`تم حذف التحليل (${t.name}) بنجاح`);
      setTests((prev) => {
        const nextList = prev.filter((item) => item.id !== t.id);
        catalogCache.update(nextList);
        return nextList;
      });
      if (editingTestId === t.id) {
        setEditingTestId(null);
      }
    } catch (err: any) {
      toast.error(err.message || 'تعذر حذف التحليل');
    } finally {
      setDeletingTestId(null);
    }
  };

  const handleAddNewTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) {
      toast.warning('يرجى إدخال اسم وكود التحليل');
      return;
    }
    try {
      const maleRow = newRanges.find((r) => r.sex === 'M' || r.label?.includes('رجال'));
      const femaleRow = newRanges.find((r) => r.sex === 'F' || r.label?.includes('نساء'));
      const generalRow = newRanges.find((r) => r.sex === 'any' || r.label === 'للجميع') || newRanges[0];

      let summaryText = newRef.trim();
      if (newRanges.length > 0 && !summaryText) {
        if (maleRow && femaleRow) {
          const mStr = maleRow.low != null || maleRow.high != null ? `${maleRow.low ?? ''} - ${maleRow.high ?? ''}` : maleRow.text || '';
          const fStr = femaleRow.low != null || femaleRow.high != null ? `${femaleRow.low ?? ''} - ${femaleRow.high ?? ''}` : femaleRow.text || '';
          summaryText = `M: ${mStr} | F: ${fStr}`;
        } else if (generalRow) {
          if (generalRow.low != null && generalRow.high != null) {
            summaryText = `${generalRow.low} - ${generalRow.high}`;
          } else if (generalRow.text) {
            summaryText = generalRow.text;
          }
        }
      }

      await apiRequest('/tests', 'POST', {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        category: newCategory,
        price: Number(toEnglishDigits(newPrice)) || 0,
        unit: newUnit.trim(),
        referenceRange: summaryText || newRef.trim(),
        refRangeText: summaryText || newRef.trim(),
        normalRange: summaryText || newRef.trim(),
        referenceRanges: newRanges.length > 0 ? newRanges : [],
        criticalLow: newCriticalLow !== '' ? Number(toEnglishDigits(newCriticalLow)) : null,
        criticalHigh: newCriticalHigh !== '' ? Number(toEnglishDigits(newCriticalHigh)) : null,
        normalMaleLow: maleRow && maleRow.low != null ? Number(maleRow.low) : null,
        normalMaleHigh: maleRow && maleRow.high != null ? Number(maleRow.high) : null,
        normalFemaleLow: femaleRow && femaleRow.low != null ? Number(femaleRow.low) : null,
        normalFemaleHigh: femaleRow && femaleRow.high != null ? Number(femaleRow.high) : null,
        refRangeLow: generalRow && generalRow.low != null ? Number(generalRow.low) : null,
        refRangeHigh: generalRow && generalRow.high != null ? Number(generalRow.high) : null,
        active: true,
      });
      toast.success('تمت إضافة التحليل الجديد إلى الكتالوج بنجاح');
      setShowAddTestModal(false);
      setNewCode('');
      setNewName('');
      setNewRef('');
      setNewRanges([]);
      setNewCriticalLow('');
      setNewCriticalHigh('');
      setShowNewRangesEditor(false);
      await loadCatalog();
    } catch (err: any) {
      toast.error(err.message || 'تعذر إضافة التحليل');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;
    try {
      await apiRequest('/staff', 'POST', {
        name: newStaffName.trim(),
        role: newStaffRole,
      });
      setNewStaffName('');
      toast.success('تمت إضافة الموظف بنجاح');
      await loadSystemData();
    } catch (err: any) {
      toast.error(err.message || 'تعذر إضافة الموظف');
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      await apiRequest(`/staff/${id}`, 'DELETE');
      toast.success('تم حذف الموظف');
      await loadSystemData();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حذف الموظف');
    }
  };

  const formatBackupSize = (bytes: number) => {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  };

  const handleCreateBackup = async () => {
    setBackingUp(true);
    try {
      const token = await fetchBackupToken();
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-backup-token': token } : {}),
        },
        body: JSON.stringify({ label: 'user_manual' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        throw new Error(data?.message || 'تعذر إنشاء النسخة الاحتياطية');
      }
      const sizeStr = formatBackupSize(data?.sizeBytes || data?.backup?.sizeBytes || 0);
      toast.success(`تم إنشاء النسخة الاحتياطية بنجاح: ${data?.fileName || ''} (${sizeStr})`);
      await loadBackupSnapshots();
    } catch (err: any) {
      toast.error(err.message || 'تعذر إنشاء النسخة الاحتياطية');
    } finally {
      setBackingUp(false);
    }
  };

  const handleDownloadBackup = async (fileName?: string) => {
    try {
      await fetchBackupToken();
      const targetUrl = fileName
        ? `/api/backup?fileName=${encodeURIComponent(fileName)}&download=1`
        : `/api/backup/export${fileName ? `?fileName=${encodeURIComponent(fileName)}` : ''}`;
      const a = document.createElement('a');
      a.href = targetUrl;
      if (fileName) a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error(err?.message || 'تعذر تنزيل النسخة الاحتياطية');
    }
  };

  const handleRestoreSnapshot = async (fileName: string) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من استعادة النسخة الاحتياطية (${fileName})؟\nسيتم أخذ نسخة أمان تلقائية للوضع الحالي قبل الاستعادة.`
    );
    if (!confirmed) return;

    setRestoringBackupFile(fileName);
    try {
      const token = await fetchBackupToken();
      const fileRes = await fetch(`/api/backup?fileName=${encodeURIComponent(fileName)}`, {
        cache: 'no-store',
        headers: token ? { 'x-backup-token': token } : {},
      });
      if (!fileRes.ok) {
        throw new Error('تعذر قراءة ملف النسخة الاحتياطية المختارة');
      }
      const rawJson = await fileRes.text();
      const restoreRes = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-backup-token': token } : {}),
        },
        body: rawJson,
      });
      const restoreData = await restoreRes.json().catch(() => ({}));
      if (!restoreRes.ok || restoreData?.success === false) {
        throw new Error(restoreData?.message || 'تعذر استعادة النسخة الاحتياطية');
      }
      toast.success(restoreData?.message || 'تم استعادة النسخة الاحتياطية بنجاح');
      await loadBackupSnapshots();
      await loadCatalog();
    } catch (err: any) {
      toast.error(err?.message || 'تعذر استعادة النسخة الاحتياطية');
    } finally {
      setRestoringBackupFile(null);
    }
  };

  const handleRestoreFromExternalFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const confirmed = window.confirm(
      `هل أنت متأكد من استعادة قاعدة البيانات من الملف الخارجي (${file.name})؟\nسيتم أخذ نسخة أمان تلقائية للبيانات الحالية قبل الاستعادة.`
    );
    if (!confirmed) return;

    setRestoringBackupFile(file.name);
    try {
      const rawJson = await file.text();
      const token = await fetchBackupToken();
      const restoreRes = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-backup-token': token } : {}),
        },
        body: rawJson,
      });
      const restoreData = await restoreRes.json().catch(() => ({}));
      if (!restoreRes.ok || restoreData?.success === false) {
        throw new Error(restoreData?.message || 'تعذر استعادة النسخة الاحتياطية من الملف');
      }
      toast.success(restoreData?.message || 'تم استعادة النسخة الاحتياطية بنجاح');
      await loadBackupSnapshots();
      await loadCatalog();
    } catch (err: any) {
      toast.error(err?.message || 'تعذر استعادة النسخة الاحتياطية');
    } finally {
      setRestoringBackupFile(null);
    }
  };

  const handleCheckUpdate = async () => {
    setCheckingUpdate(true);
    try {
      const desktop = typeof window !== 'undefined' ? (window as any).electronDesktop : null;
      if (desktop?.updater) {
        const res = await desktop.updater.check();
        if (res?.updateInfo?.version) {
          toast.info(`يتوفر تحديث جديد: ${res.updateInfo.version}`);
        } else {
          toast.success('البرنامج يعمل بأحدث إصدار مستقر');
        }
      } else {
        const res = await fetch('/api/version/check').then((r) => r.json());
        setUpdaterState(res);
        toast.success(`البرنامج محدث لآخر إصدار (${res.currentVersion || 'v2.0.0'})`);
      }
    } catch (e) {
      toast.info('النظام يعمل محلياً بأحدث إصدار مستقر');
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div
      dir="rtl"
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)',
        overflow: 'hidden',
      }}
    >
      {/* 1. Compact Top Header Bar (48px) with 4 Clean Tabs */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 6px 16px',
          backgroundColor: 'var(--bg-primary)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'PAPER_DESIGN', label: 'تصميم الفورمات والورق', icon: Layout },
            { id: 'CATALOG', label: `دليل التحاليل والأسعار (${tests.length || 322})`, icon: Layers },
            {
              id: 'WHATSAPP',
              label: waStatus.connected
                ? `💬 واتساب ويب (متصل ✓)`
                : '💬 ربط واتساب ويب (الباركود QR)',
              icon: SettingsIcon,
            },
            { id: 'SYSTEM', label: 'الشبكة والنسخ الاحتياطي والنظام', icon: SettingsIcon },
          ].map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            const isWaTab = t.id === 'WHATSAPP';
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '7px 16px',
                  borderRadius: '8px',
                  border: active
                    ? 'none'
                    : isWaTab
                      ? '1.5px solid #16a34a'
                      : '1px solid var(--border-color)',
                  backgroundColor: active
                    ? isWaTab
                      ? '#16a34a'
                      : '#0f766e'
                    : isWaTab
                      ? '#f0fdf4'
                      : 'var(--bg-card)',
                  color: active
                    ? '#ffffff'
                    : isWaTab
                      ? '#15803d'
                      : 'var(--text-main)',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: active ? '0 2px 5px rgba(15, 118, 110, 0.25)' : 'none',
                }}
              >
                {!isWaTab && <Icon size={15} />}
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTab !== 'WHATSAPP' && (
            <button
              type="button"
              onClick={() => setActiveTab('WHATSAPP')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1.5px solid #16a34a',
                backgroundColor: waStatus.connected ? '#f0fdf4' : '#16a34a',
                color: waStatus.connected ? '#15803d' : '#ffffff',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <span>💬</span>
              <span>
                {waStatus.connected
                  ? `واتساب ويب: متصل ✓ ${waAutoSend ? '(إرسال تلقائي مفعل)' : ''}`
                  : 'عرض باركود ربط واتساب (QR)'}
              </span>
            </button>
          )}

          {activeTab === 'CATALOG' && (
            <button
              type="button"
              onClick={() => setShowAddTestModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '7px 16px',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              <span>إضافة تحليل جديد</span>
            </button>
          )}
        </div>
      </header>

      {/* 2. Active Tab Workspace */}
      <div
        style={{
          flex: 1,
          overflow: activeTab === 'PAPER_DESIGN' || activeTab === 'WHATSAPP' ? 'auto' : 'hidden',
          padding: activeTab === 'PAPER_DESIGN' ? '4px 16px 16px 16px' : '8px 16px 14px 16px',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        {/* TAB 1: Format Designer (PaperDesignerV2 - 100% Untouched!) */}
        {activeTab === 'PAPER_DESIGN' && <PaperDesignerV2 />}

        {/* TAB WHATSAPP: Dedicated Large WhatsApp Web QR Pairing & Auto-Send Screen */}
        {activeTab === 'WHATSAPP' && (
          <div
            style={{
              maxWidth: '860px',
              width: '100%',
              margin: '12px auto',
              backgroundColor: 'var(--bg-card)',
              border: '2px solid #16a34a',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 8px 28px rgba(22, 163, 74, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  💬
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: 'var(--text-main)' }}>
                    ربط حساب واتساب ويب بالباركود (QR Code) والإرسال التلقائي
                  </h2>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '3px' }}>
                    اربط رقم المختبر لمرة واحدة عبر مسح الباركود، وسيبقى الحساب محفوظاً لإرسال النتائج تلقائياً بعد حفظها
                  </div>
                </div>
              </div>

              <span
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  backgroundColor: waStatus.connected
                    ? '#dcfce7'
                    : waStatus.status === 'PAIRING'
                      ? '#fef3c7'
                      : 'var(--bg-input)',
                  color: waStatus.connected
                    ? '#15803d'
                    : waStatus.status === 'PAIRING'
                      ? '#b45309'
                      : 'var(--text-muted)',
                  fontSize: '13px',
                  fontWeight: 900,
                }}
              >
                {waStatus.connected
                  ? '✓ متصل ومحفوظ دائماً'
                  : waStatus.status === 'PAIRING'
                    ? '⏳ بانتظار مسح الباركود من هاتفك...'
                    : 'غير مرتبط'}
              </span>
            </div>

            {/* Auto-Send Toggle Switch */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '12px',
                backgroundColor: waAutoSend ? 'rgba(22, 163, 74, 0.08)' : 'var(--bg-input)',
                border: waAutoSend ? '1.5px solid rgba(22, 163, 74, 0.4)' : '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: 900, color: 'var(--text-main)' }}>
                  تفعيل الإرسال التلقائي عبر واتساب بعد حفظ النتيجة
                </div>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                  بمجرد اكتمال إدخال نتائج الفحوصات للمريض والضغط على زر <b>حفظ النتيجة</b>، سيقوم البرنامج تلقائياً بتجهيز صورة التقرير الطبي وإرسالها فوراً إلى رقم واتساب المريض دون أي خطوة إضافية.
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={waAutoSend}
                onClick={() => handleToggleWaAutoSend(!waAutoSend)}
                style={{
                  width: '56px',
                  height: '30px',
                  borderRadius: '999px',
                  border: 'none',
                  backgroundColor: waAutoSend ? '#16a34a' : '#94a3b8',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                  flexShrink: 0,
                  padding: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: waAutoSend ? '29px' : '3px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                    transition: 'left 0.2s ease',
                  }}
                />
              </button>
            </div>

            {/* QR Barcode Display or Connected Account Box */}
            {waStatus.connected ? (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  backgroundColor: '#f0fdf4',
                  border: '1.5px solid #86efac',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: '#166534' }}>
                    ✓ حساب واتساب المختبر مرتبط ونشط الآن (الجلسة محفوظة تلقائياً)
                  </div>
                  <div style={{ fontSize: '13.5px', color: '#15803d', fontWeight: 700, marginTop: '6px' }}>
                    الرقم المرتبط:{' '}
                    <span dir="ltr" style={{ unicodeBidi: 'isolate', fontWeight: 900 }}>
                      +{waStatus.user || 'متصل'}
                    </span>
                    {waStatus.userName ? ` (${waStatus.userName})` : ''}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutWhatsApp}
                  disabled={waLoading}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #fca5a5',
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {waLoading ? 'جاري الفصل...' : 'إلغاء الربط / تغيير رقم الواتساب'}
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '28px',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    width: '250px',
                    height: '250px',
                    padding: '12px',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    border: '3px solid #16a34a',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                  }}
                >
                  {waStatus.qrDataUrl ? (
                    <img
                      src={waStatus.qrDataUrl}
                      alt="WhatsApp Web QR Code"
                      style={{ width: '226px', height: '226px', display: 'block' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', color: '#475569', padding: '16px', fontSize: '13px', fontWeight: 700 }}>
                      {waLoading || waStatus.status === 'PAIRING'
                        ? '⏳ جاري الاتصال وتوليد رمز الباركود (QR)... يرجى الانتظار ثوانٍ معدودة'
                        : 'اضغط زر توليد الباركود بالأسفل'}
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: '240px', fontSize: '14px', lineHeight: 1.9 }}>
                  <div style={{ fontWeight: 900, fontSize: '16px', color: '#15803d', marginBottom: '8px' }}>
                    خطوات ربط واتساب المختبر بالباركود:
                  </div>
                  <div>1. افتح تطبيق <b>واتساب (WhatsApp)</b> في هاتف المختبر.</div>
                  <div>2. اضغط على القائمة <b>(⋮)</b> أو <b>الإعدادات</b> ثم اختر <b>الأجهزة المرتبطة (Linked Devices)</b>.</div>
                  <div>3. اضغط على <b>ربط جهاز (Link a Device)</b> ووجّه الكاميرا نحو هذا الباركود.</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '8px', fontWeight: 700 }}>
                    🔒 بمجرد المسح سيتم حفظ الجلسة داخل البرنامج تلقائياً ولن تحتاج لمسح الباركود مرة أخرى.
                  </div>

                  <div style={{ marginTop: '14px' }}>
                    <button
                      type="button"
                      onClick={() => handleConnectWhatsApp(!waStatus.qrDataUrl ? false : true)}
                      disabled={waLoading}
                      style={{
                        padding: '10px 18px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: waLoading ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <RefreshCw size={15} className={waLoading ? 'animate-spin' : ''} />
                      <span>{waLoading ? 'جاري توليد الباركود...' : 'تحديث / إعادة توليد الباركود (QR)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Ultra-Simple Test Catalog & Prices Table */}
        {activeTab === 'CATALOG' && (
          <div
            style={{
              flex: 1,
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            {/* Filter & Search Bar */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', maxWidth: 'calc(100% - 300px)', scrollbarWidth: 'thin' }}>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCatalogCategory(cat)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      border: catalogCategory === cat ? '1.5px solid #0f766e' : '1px solid var(--border-color)',
                      backgroundColor: catalogCategory === cat ? 'rgba(15, 118, 110, 0.1)' : 'var(--bg-input)',
                      color: catalogCategory === cat ? '#0f766e' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {cat === 'ALL' ? 'كل التخصصات' : cat}
                  </button>
                ))}
              </div>

              <div style={{ position: 'relative', width: '280px', flexShrink: 0 }}>
                <Search
                  size={15}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="ابحث باسم التحليل أو الكود..."
                  style={{
                    width: '100%',
                    height: '36px',
                    padding: '0 12px 0 32px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    fontSize: '13px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Scrollable Catalog Table */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                    <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700 }}>الكود</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700 }}>اسم التحليل</th>
                    <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700 }}>القسم</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>الوحدة</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>المعدل الطبيعي</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>السعر ({currency})</th>
                    <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700, width: '180px' }}>تعديل سريع</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingCatalog ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        جاري تحميل دليل التحاليل...
                      </td>
                    </tr>
                  ) : (
                    filteredTests.map((t) => {
                      const isEditing = editingTestId === t.id;
                      const hasMultiRanges = Array.isArray(t.referenceRanges) && t.referenceRanges.length > 1;
                      const hasMfRanges = !hasMultiRanges && (t.normalMaleLow != null || t.normalFemaleLow != null);
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '9px 8px', fontWeight: 900, color: '#0f766e' }}>{t.code}</td>
                          <td style={{ padding: '9px 8px', fontWeight: 800, color: 'var(--text-main)' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="اسم التحليل..."
                                style={{
                                  width: '100%',
                                  minWidth: '130px',
                                  height: '30px',
                                  padding: '0 8px',
                                  borderRadius: '6px',
                                  border: '1.5px solid #0f766e',
                                  fontSize: '13px',
                                  fontWeight: 800,
                                  color: 'var(--text-main)',
                                  backgroundColor: 'var(--bg-input)',
                                }}
                              />
                            ) : (
                              t.name
                            )}
                          </td>
                          <td style={{ padding: '9px 8px', color: 'var(--text-muted)', fontWeight: 600 }}>{t.category}</td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' }} dir="ltr">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editUnit}
                                onChange={(e) => setEditUnit(e.target.value)}
                                style={{ width: '90px', height: '30px', textAlign: 'center', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                              />
                            ) : (
                              t.unit || '-'
                            )}
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editRefRange}
                                onChange={(e) => setEditRefRange(e.target.value)}
                                style={{ width: '160px', height: '30px', textAlign: 'center', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                                dir="ltr"
                              />
                            ) : hasMultiRanges ? (
                              <button
                                type="button"
                                onClick={() => handleOpenRangesModal(t)}
                                title="انقر لتعديل شرائح المعدل الطبيعي (رجال / نساء / أطفال)"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 9px',
                                  borderRadius: '999px',
                                  border: '1px solid rgba(15, 118, 110, 0.35)',
                                  backgroundColor: 'rgba(15, 118, 110, 0.08)',
                                  color: '#0f766e',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                <span>🎯 مخصص ({t.referenceRanges.length} فئات)</span>
                              </button>
                            ) : hasMfRanges ? (
                              <button
                                type="button"
                                onClick={() => handleOpenRangesModal(t)}
                                title="انقر لتعديل شرائح المعدل الطبيعي (رجال / نساء / أطفال)"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  padding: '3px 9px',
                                  borderRadius: '999px',
                                  border: '1px solid rgba(15, 118, 110, 0.35)',
                                  backgroundColor: 'rgba(15, 118, 110, 0.08)',
                                  color: '#0f766e',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                }}
                              >
                                <span>🎯 رجال / نساء</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', fontWeight: 600 }} dir="ltr">
                                {(() => {
                                  const raw = String(t.referenceRange || t.refRangeText || t.normalRange || '').trim();
                                  if (raw && raw.toLowerCase() !== 'normal') return raw;
                                  if (t.refRangeLow != null && t.refRangeHigh != null) return `${t.refRangeLow} - ${t.refRangeHigh}`;
                                  return '—';
                                })()}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'center', fontWeight: 900 }}>
                            {isEditing ? (
                              <input
                                type="text"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                style={{ width: '100px', height: '30px', textAlign: 'center', borderRadius: '6px', border: '1.5px solid #0f766e', fontWeight: 800 }}
                              />
                            ) : (
                              `${Number(t.price || 0).toLocaleString()} ${currency}`
                            )}
                          </td>
                          <td style={{ padding: '9px 8px', textAlign: 'center' }}>
                            {isEditing ? (
                              <div style={{ display: 'inline-flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditTest(t)}
                                  style={{ padding: '4px 10px', borderRadius: '6px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  حفظ
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingTestId(null)}
                                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', cursor: 'pointer' }}
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenRangesModal(t)}
                                  title="تخصيص المعدلات الطبيعية (رجال / نساء / أطفال)"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(15, 118, 110, 0.35)',
                                    backgroundColor: 'rgba(15, 118, 110, 0.08)',
                                    color: '#0f766e',
                                    fontSize: '11.5px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  <span>🎯 النسب</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEditTest(t)}
                                  style={{
                                    padding: '4px 9px',
                                    borderRadius: '6px',
                                    border: '1px solid var(--border-color)',
                                    backgroundColor: 'var(--bg-input)',
                                    color: 'var(--text-main)',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  تعديل
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTest(t)}
                                  disabled={deletingTestId === t.id}
                                  title="حذف هذا التحليل من الكتالوج"
                                  style={{
                                    padding: '4px 7px',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(220, 38, 38, 0.35)',
                                    backgroundColor: 'rgba(220, 38, 38, 0.08)',
                                    color: '#dc2626',
                                    fontSize: '11.5px',
                                    fontWeight: 700,
                                    cursor: deletingTestId === t.id ? 'not-allowed' : 'pointer',
                                    whiteSpace: 'nowrap',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: deletingTestId === t.id ? 0.5 : 1,
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Network, Backup, Updates, Staff & License in One Simple Split View */}
        {activeTab === 'SYSTEM' && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'row',
              gap: '12px',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            {/* Right Column: Network & LAN Multi-PC Setup */}
            <div
              style={{
                flex: 1.2,
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflowY: 'auto',
                padding: '14px',
              }}
            >
              <NetworkSettingsPanel labProfile={labProfile} updateLabProfile={updateLabProfile} />
            </div>

            {/* Left Column: WhatsApp Web QR Pairing, Backup, Updates, License & Staff */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflowY: 'auto',
              }}
            >
              {/* Card 0: WhatsApp Web QR Pairing & Auto-Send After Result Completion */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: waStatus.connected ? '1.5px solid #16a34a' : '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: waStatus.connected ? '0 4px 14px rgba(22, 163, 74, 0.08)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '16px',
                      }}
                    >
                      💬
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 900 }}>ربط واتساب ويب والإرسال التلقائي للنتائج</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        اربط رقم المختبر بالباركود لمرة واحدة وسيبقى محفوظاً دائماً
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      backgroundColor: waStatus.connected
                        ? '#dcfce7'
                        : waStatus.status === 'PAIRING'
                          ? '#fef3c7'
                          : 'var(--bg-input)',
                      color: waStatus.connected
                        ? '#15803d'
                        : waStatus.status === 'PAIRING'
                          ? '#b45309'
                          : 'var(--text-muted)',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    {waStatus.connected
                      ? 'متصل ومحفوظ ✓'
                      : waStatus.status === 'PAIRING'
                        ? 'بانتظار مسح الباركود...'
                        : 'غير مرتبط'}
                  </span>
                </div>

                {/* Toggle Switch: Auto-Send WhatsApp on Result Save */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: waAutoSend ? 'rgba(22, 163, 74, 0.08)' : 'var(--bg-input)',
                    border: waAutoSend ? '1px solid rgba(22, 163, 74, 0.35)' : '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13.5px', fontWeight: 900, color: 'var(--text-main)' }}>
                      تفعيل الإرسال التلقائي عبر واتساب بعد حفظ النتيجة
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.4 }}>
                      عند اكتمال كافة نتائج تحاليل المريض والضغط على حفظ، يتم إرسال صورة التقرير الطبي المعتمد تلقائياً بالخلفية إلى واتساب المريض
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={waAutoSend}
                    onClick={() => handleToggleWaAutoSend(!waAutoSend)}
                    style={{
                      width: '50px',
                      height: '28px',
                      borderRadius: '999px',
                      border: 'none',
                      backgroundColor: waAutoSend ? '#16a34a' : '#94a3b8',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s ease',
                      flexShrink: 0,
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '3px',
                        left: waAutoSend ? '25px' : '3px',
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                        transition: 'left 0.2s ease',
                      }}
                    />
                  </button>
                </div>

                {/* Connected Account Info OR QR Pairing Box */}
                {waStatus.connected ? (
                  <div
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      backgroundColor: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 900, color: '#166534' }}>
                        ✓ الحساب مرتبط ونشط (محفوظ تلقائياً)
                      </div>
                      <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                        الرقم المرتبط:{' '}
                        <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
                          +{waStatus.user || 'متصل'}
                        </span>
                        {waStatus.userName ? ` (${waStatus.userName})` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogoutWhatsApp}
                      disabled={waLoading}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: '1px solid #fca5a5',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      {waLoading ? 'جاري الفصل...' : 'إلغاء الربط / تغيير الحساب'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => handleConnectWhatsApp(true)}
                        disabled={waLoading}
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#16a34a',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 800,
                          cursor: waLoading ? 'wait' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '7px',
                        }}
                      >
                        <RefreshCw size={15} />
                        <span>
                          {waLoading
                            ? 'جاري توليد الباركود...'
                            : waStatus.qrDataUrl
                              ? 'تحديث رمز الباركود (QR)'
                              : 'ربط واتساب ويب الآن (عرض الباركود QR)'}
                        </span>
                      </button>
                    </div>

                    {waStatus.qrDataUrl && (
                      <div
                        style={{
                          padding: '14px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-input)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div
                          style={{
                            padding: '8px',
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            border: '2px solid #16a34a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={waStatus.qrDataUrl}
                            alt="WhatsApp Web QR Code"
                            style={{ width: '175px', height: '175px', display: 'block' }}
                          />
                        </div>
                        <div style={{ flex: 1, minWidth: '180px', fontSize: '12.5px', lineHeight: 1.7 }}>
                          <div style={{ fontWeight: 900, fontSize: '13.5px', color: '#15803d', marginBottom: '4px' }}>
                            امسح الباركود من هاتفك للربط الدائم:
                          </div>
                          <div>1. افتح تطبيق <b>واتساب</b> في هاتفك.</div>
                          <div>2. اذهب إلى <b>الإعدادات</b> أو القائمة <b>(⋮)</b> ثم اختر <b>الأجهزة المرتبطة</b>.</div>
                          <div>3. اضغط <b>ربط جهاز</b> ووجّه الكاميرا نحو هذا الباركود.</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                            🔒 سيتم حفظ الجلسة تلقائياً في البرنامج ولن تحتاج لمسحه مرة أخرى.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card 1: Backup & Auto-Updates */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Database size={18} color="#0f766e" />
                    <span style={{ fontSize: '15px', fontWeight: 900 }}>النسخ الاحتياطي والتحديثات</span>
                  </div>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '999px',
                      backgroundColor: '#f0fdf4',
                      color: '#15803d',
                      fontSize: '12px',
                      fontWeight: 800,
                    }}
                  >
                    الإصدار: {updaterState?.currentVersion || 'v2.0.0'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handleCreateBackup}
                    disabled={backingUp}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0f766e',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                    }}
                  >
                    <Download size={15} />
                    <span>{backingUp ? 'جاري الحفظ...' : 'حفظ نسخة احتياطية الآن'}</span>
                  </button>

                  <label
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #0284c7',
                      backgroundColor: 'rgba(2, 132, 199, 0.08)',
                      color: '#0284c7',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreFromExternalFile}
                      style={{ display: 'none' }}
                    />
                    <span>استعادة من ملف خارجي</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleCheckUpdate}
                    disabled={checkingUpdate}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)',
                      color: 'var(--text-main)',
                      fontSize: '13px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '7px',
                    }}
                  >
                    <RefreshCw size={15} />
                    <span>{checkingUpdate ? 'جاري الفحص...' : 'فحص التحديثات'}</span>
                  </button>
                </div>

                {/* Available Backups List */}
                <div
                  style={{
                    marginTop: '4px',
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: 'var(--text-main)' }}>
                      النسخ الاحتياطية المتاحة ({backupList.length})
                    </span>
                    <button
                      type="button"
                      onClick={loadBackupSnapshots}
                      disabled={loadingBackups}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0f766e',
                        fontSize: '11.5px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <RefreshCw size={12} />
                      <span>{loadingBackups ? 'تحديث...' : 'تحديث القائمة'}</span>
                    </button>
                  </div>

                  {backupList.length === 0 ? (
                    <div
                      style={{
                        padding: '10px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-input)',
                        color: 'var(--text-muted)',
                        fontSize: '12px',
                        textAlign: 'center',
                        fontWeight: 600,
                      }}
                    >
                      لا توجد نسخ احتياطية محفوظة حالياً. اضغط «حفظ نسخة احتياطية الآن» لإنشاء أول نسخة.
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        maxHeight: '190px',
                        overflowY: 'auto',
                      }}
                    >
                      {backupList.map((b) => {
                        const isRestoring = restoringBackupFile === b.fileName;
                        const dateFormatted = b.createdAt
                          ? new Date(b.createdAt).toLocaleString('ar-IQ', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '';
                        return (
                          <div
                            key={b.fileName}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: '1px solid var(--border-subtle)',
                              backgroundColor: 'var(--bg-input)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div
                                dir="ltr"
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  color: 'var(--text-main)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  textAlign: 'right',
                                }}
                                title={b.fileName}
                              >
                                {b.fileName}
                              </div>
                              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                                الحجم: <span dir="ltr">{formatBackupSize(b.sizeBytes)}</span>
                                {dateFormatted ? ` • ${dateFormatted}` : ''}
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => handleDownloadBackup(b.fileName)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #0f766e',
                                  backgroundColor: 'rgba(15, 118, 110, 0.08)',
                                  color: '#0f766e',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                <Download size={12} />
                                <span>تنزيل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRestoreSnapshot(b.fileName)}
                                disabled={Boolean(restoringBackupFile)}
                                style={{
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  border: '1px solid #d97706',
                                  backgroundColor: 'rgba(217, 119, 6, 0.1)',
                                  color: '#b45309',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  cursor: restoringBackupFile ? 'wait' : 'pointer',
                                }}
                              >
                                {isRestoring ? 'جاري الاستعادة...' : 'استعادة'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: License Status */}
              <div
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={22} color="#16a34a" />
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 900 }}>حالة ترخيص النظام</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {licenseStatus?.isActivated ? 'نسخة مفعلة رسمياً مدى الحياة' : 'النظام يعمل بكامل الميزات'}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: '999px',
                    backgroundColor: '#dcfce7',
                    color: '#15803d',
                    fontSize: '12px',
                    fontWeight: 800,
                  }}
                >
                  مفعل ✓
                </span>
              </div>

              {/* Card 3: Staff Management */}
              <div
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={17} color="#0284c7" />
                  <span style={{ fontSize: '14px', fontWeight: 900 }}>كادر المختبر والفنيون ({staffList.length})</span>
                </div>

                <form onSubmit={handleAddStaff} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    placeholder="اسم الموظف أو الفني..."
                    style={{
                      flex: 1,
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-input)',
                      fontSize: '12.5px',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0 14px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    + إضافة
                  </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
                  {staffList.map((st) => (
                    <div
                      key={st.id}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '13px' }}>{st.name}</span>
                        <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginRight: '8px' }}>
                          ({st.role || 'فني مختبر'})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteStaff(st.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Test Modal */}
      {showAddTestModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
            backdropFilter: 'blur(3px)',
          }}
        >
          <form
            onSubmit={handleAddNewTest}
            style={{
              width: showNewRangesEditor ? '880px' : '440px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              overflowY: 'auto',
              boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
              transition: 'width 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>إضافة تحليل جديد للدليل</h3>
              <button
                type="button"
                onClick={() => {
                  setShowAddTestModal(false);
                  setShowNewRangesEditor(false);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ width: '130px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>الكود المختصر</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="GLU"
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>الاسم العلمي</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Fasting Blood Sugar"
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>السعر ({currency})</label>
                <input
                  type="text"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>الوحدة</label>
                <input
                  type="text"
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>المعدل الطبيعي العام (Reference Range)</label>
              <input
                type="text"
                value={newRef}
                onChange={(e) => setNewRef(e.target.value)}
                placeholder="70 - 110"
                style={{ width: '100%', height: '36px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>

            {/* Multi-tier ranges option */}
            <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px dashed var(--border-color)', background: 'var(--bg-input)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <span style={{ fontSize: '12px', fontWeight: 800 }}>تخصيص المعدل الطبيعي (رجال / نساء / أطفال):</span>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {newRanges.length > 0
                      ? `✓ تم تخصيص (${newRanges.length}) فئات مخصصة للنسب`
                      : 'يمكنك تركها عامة أو النقر لتحديد نسب دقيقة لكل فئة وعمر'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (newRanges.length === 0) {
                      setNewRanges([
                        {
                          id: `new_r_1`,
                          label: 'للجميع',
                          sex: 'any',
                          ageMin: 0,
                          ageMax: null,
                          ageUnit: 'years',
                          low: null,
                          high: null,
                          text: newRef.trim() || null,
                          unit: newUnit.trim() || null,
                          isUserEdited: true,
                          sortOrder: 0,
                        },
                      ]);
                    }
                    setShowNewRangesEditor(!showNewRangesEditor);
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    border: '1px solid #0f766e',
                    background: showNewRangesEditor ? '#0f766e' : 'rgba(15, 118, 110, 0.1)',
                    color: showNewRangesEditor ? '#fff' : '#0f766e',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  {showNewRangesEditor ? 'إخفاء المحرر المتقدم ▲' : '🎯 تخصيص الشرائح والأعمار ▼'}
                </button>
              </div>

              {showNewRangesEditor && (
                <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                  <ReferenceRangesEditor
                    testName={newName || newCode || 'فحص جديد'}
                    unit={newUnit}
                    ranges={newRanges}
                    onChange={setNewRanges}
                    criticalLow={newCriticalLow}
                    criticalHigh={newCriticalHigh}
                    onCriticalChange={(low, high) => {
                      setNewCriticalLow(low);
                      setNewCriticalHigh(high);
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowAddTestModal(false);
                  setShowNewRangesEditor(false);
                }}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}
              >
                إلغاء
              </button>
              <button type="submit" style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                حفظ التحليل
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Multi-Tier Reference Ranges Editor Modal for Existing Tests */}
      {rangesModalTest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              width: '920px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
              overflow: 'hidden',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 118, 110, 0.12)',
                    color: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '18px',
                  }}
                >
                  🎯
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 900 }}>
                    تخصيص المعدلات الطبيعية والشرائح (رجال / نساء / أطفال)
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    الفحص: <b style={{ color: 'var(--text-main)' }}>{rangesModalTest.name}</b> ({rangesModalTest.code || 'بدون كود'}) — الوحدة:{' '}
                    <b style={{ color: 'var(--text-main)' }} dir="ltr">{rangesModalTest.unit || 'بدون وحدة'}</b>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRangesModalTest(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '6px',
                  borderRadius: '6px',
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Scrollable ReferenceRangesEditor */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <ReferenceRangesEditor
                testName={rangesModalTest.name || rangesModalTest.code}
                unit={rangesModalTest.unit || ''}
                ranges={activeRanges}
                onChange={setActiveRanges}
                criticalLow={activeCriticalLow}
                criticalHigh={activeCriticalHigh}
                onCriticalChange={(low, high) => {
                  setActiveCriticalLow(low);
                  setActiveCriticalHigh(high);
                }}
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-surface)',
                gap: '12px',
              }}
            >
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                💡 يتم تطبيق هذه النسب تلقائياً في شاشة إدخال النتائج وتقارير الطباعة بحسب جنس وعمر كل مريض.
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRangesModalTest(null)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-input)',
                    color: 'var(--text-main)',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveRangesModal}
                  disabled={savingRanges}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#0f766e',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  {savingRanges ? 'جاري الحفظ...' : 'حفظ المعدلات الطبيعية'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const pathname = usePathname();
  const initialTab = pathname?.startsWith('/catalog')
    ? 'CATALOG'
    : pathname?.startsWith('/staff') || pathname?.startsWith('/license')
      ? 'SYSTEM'
      : 'PAPER_DESIGN';
  return <UnifiedSettingsCatalogView initialTab={initialTab} />;
}

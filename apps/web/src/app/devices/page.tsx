'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import { useLab } from '../../components/LabContext';
import { DEVICE_PRESETS, DevicePreset } from '../../lib/devicePresets';
import {
  Cpu,
  Package,
  Plus,
  Search,
  Trash2,
  X,
  RefreshCw,
  HelpCircle,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Activity,
} from 'lucide-react';
import { toEnglishDigits, formatEnglishDate } from '../../lib/formatters';
import MindrayBc30Simulator from '../../components/devices/MindrayBc30Simulator';

function UnifiedDevicesInventoryView() {
  const toast = useToast();
  const { labProfile } = useLab();
  const currency = labProfile?.currency || 'د.ع';

  // Devices State
  const [devices, setDevices] = useState<any[]>([]);
  const [serverIp, setServerIp] = useState<string>('192.168.1.100');
  const [listenerPort, setListenerPort] = useState<number>(5000);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [guideDevice, setGuideDevice] = useState<{ name: string; preset?: DevicePreset } | null>(null);
  const [showMindraySimulator, setShowMindraySimulator] = useState(false);

  // Add Device Modal State
  const [showAddDeviceModal, setShowAddDeviceModal] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEVICE_PRESETS[0]?.id || '');
  const [devName, setDevName] = useState<string>(`${DEVICE_PRESETS[0]?.brand || ''} ${DEVICE_PRESETS[0]?.model || ''}`.trim());
  const [devProtocol, setDevProtocol] = useState<string>(DEVICE_PRESETS[0]?.protocol || 'HL7');
  const [devConnType, setDevConnType] = useState<string>(DEVICE_PRESETS[0]?.connectionType || 'TCP_SERVER');
  const [devPort, setDevPort] = useState<string>('5000');
  const [savingDevice, setSavingDevice] = useState(false);

  // Inventory State
  const [items, setItems] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any>({ expiredCount: 0, expiringSoonCount: 0, lowStockCount: 0 });
  const [invFilter, setInvFilter] = useState<'ALL' | 'LOW' | 'EXPIRED'>('ALL');
  const [invSearch, setInvSearch] = useState('');

  // Add Inventory Item Modal State
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemName, setItemName] = useState('');
  const [catalogCode, setCatalogCode] = useState('');
  const [category, setCategory] = useState<'REAGENT' | 'KIT' | 'CONSUMABLE' | 'CONTROL'>('REAGENT');
  const [quantity, setQuantity] = useState('');
  const [reorderThreshold, setReorderThreshold] = useState('5');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [devRes, invRes, alertsRes] = await Promise.all([
        apiRequest('/devices').catch(() => []),
        apiRequest('/inventory').catch(() => []),
        apiRequest('/inventory/alerts').catch(() => ({ expiredCount: 0, expiringSoonCount: 0, lowStockCount: 0 })),
      ]);

      if (Array.isArray(devRes)) {
        setDevices(devRes);
      } else if (devRes && typeof devRes === 'object') {
        setDevices(Array.isArray(devRes.devices) ? devRes.devices : []);
        if (devRes.serverIp) setServerIp(devRes.serverIp);
        if (devRes.listenerPort) setListenerPort(Number(devRes.listenerPort));
      }

      setItems(Array.isArray(invRes) ? invRes : []);
      setAlerts(alertsRes || { expiredCount: 0, expiringSoonCount: 0, lowStockCount: 0 });
    } catch (err: any) {
      toast.error(err.message || 'تعذر تحميل بيانات الأجهزة والمخزون');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const activePreset = useMemo(
    () => DEVICE_PRESETS.find((p) => p.id === selectedPresetId),
    [selectedPresetId]
  );

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = DEVICE_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setDevName(`${preset.brand} ${preset.model}`);
      setDevProtocol(preset.protocol);
      setDevConnType(preset.connectionType);
    }
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devName.trim()) {
      toast.warning('يرجى إدخال اسم الجهاز الطبي');
      return;
    }
    setSavingDevice(true);
    try {
      const preset = DEVICE_PRESETS.find((p) => p.id === selectedPresetId);
      const resolvedBrand = preset?.brand || devName.trim().split(' ')[0] || 'Generic';
      await apiRequest('/devices', 'POST', {
        name: devName.trim(),
        brand: resolvedBrand,
        manufacturer: resolvedBrand,
        model: preset?.model || devName.trim(),
        category: preset?.category || 'General',
        protocol: devProtocol,
        connectionType: devConnType,
        port: Number(toEnglishDigits(devPort)) || 5000,
        active: true,
        mappings: preset?.defaultMappings || [],
      });
      toast.success('تمت إضافة الجهاز الطبي وربط الكودات القياسية بنجاح');
      setShowAddDeviceModal(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر إضافة الجهاز');
    } finally {
      setSavingDevice(false);
    }
  };

  const handleDeleteDevice = async (id: string) => {
    try {
      await apiRequest(`/devices/${id}`, 'DELETE');
      toast.success('تم حذف الجهاز الطبي');
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حذف الجهاز');
    }
  };

  const handleTestConnection = async (device: any) => {
    setSimulatingId(device.id);
    try {
      const firstCode = device.mappings?.[0]?.analyzerCode || 'WBC';
      await apiRequest('/devices/ingest', 'POST', {
        deviceId: device.id,
        sampleBarcode: '2031',
        results: [{ testCode: firstCode, value: '7.4', unit: '10^3/uL', flag: 'N' }],
      });
      toast.success(`نجح اتصال وفحص الجهاز (${device.name}) وتم استقبال قراءة تجريبية حية!`, 'نجاح فحص الربط');
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'فشل إرسال القراءة التجريبية');
    } finally {
      setSimulatingId(null);
    }
  };

  const handleOpenGuideForDevice = (device: any) => {
    const matchedPreset = DEVICE_PRESETS.find(
      (p) =>
        `${p.brand} ${p.model}`.toLowerCase() === (device.name || '').toLowerCase() ||
        (device.model && p.model.toLowerCase() === String(device.model).toLowerCase()) ||
        (device.name || '').toLowerCase().includes(p.brand.toLowerCase())
    );
    setGuideDevice({ name: device.name, preset: matchedPreset || DEVICE_PRESETS[0] });
  };

  const handleSaveInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !quantity) {
      toast.warning('يرجى إدخال اسم الكاشف والكمية');
      return;
    }
    setSavingItem(true);
    try {
      await apiRequest('/inventory', 'POST', {
        name: itemName.trim(),
        catalogCode: catalogCode.trim() || undefined,
        category,
        unit: 'عبوة',
        quantity: Number(toEnglishDigits(quantity)) || 1,
        reorderThreshold: Number(toEnglishDigits(reorderThreshold)) || 3,
        costPerUnit: Number(toEnglishDigits(costPerUnit)) || 0,
        expiryDate: expiryDate || undefined,
      });
      toast.success('تمت إضافة الكاشف للمخزون وتفعيل الخصم التلقائي بنجاح');
      setShowAddItemModal(false);
      setItemName('');
      setCatalogCode('');
      setQuantity('');
      setCostPerUnit('');
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حفظ الكاشف');
    } finally {
      setSavingItem(false);
    }
  };

  const handleOpenVial = async (id: string) => {
    try {
      await apiRequest(`/inventory/${id}/open`, 'POST');
      toast.success('تم فتح عبوة جديدة وتجهيز الفحوصات للخصم التلقائي');
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر فتح العبوة');
    }
  };

  const handleDeleteInventoryItem = async (id: string) => {
    try {
      await apiRequest(`/inventory/${id}`, 'DELETE');
      toast.success('تم حذف المادة من المخزون');
      await loadAll();
    } catch (err: any) {
      toast.error(err.message || 'تعذر حذف المادة');
    }
  };

  const filteredItems = useMemo(() => {
    const q = invSearch.toLowerCase().trim();
    const now = new Date();
    return items.filter((item) => {
      const isLow = Number(item.quantity) <= Number(item.reorderThreshold || 3);
      const isExpired = item.expiryDate ? new Date(item.expiryDate) <= now : false;
      if (invFilter === 'LOW' && !isLow) return false;
      if (invFilter === 'EXPIRED' && !isExpired) return false;
      if (!q) return true;
      return (
        (item.name || '').toLowerCase().includes(q) ||
        (item.catalogCode || '').toLowerCase().includes(q)
      );
    });
  }, [items, invFilter, invSearch]);

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
      {/* 1. Compact Top Header Bar (48px) */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px 4px 16px',
          backgroundColor: 'var(--bg-primary)',
          flexShrink: 0,
        }}
      >
        {/* Left Action Pill Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setShowAddDeviceModal(true)}
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
              boxShadow: '0 2px 5px rgba(2, 132, 199, 0.25)',
            }}
          >
            <Plus size={16} />
            <span>إضافة جهاز طبي</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddItemModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 16px',
              backgroundColor: '#0f766e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(15, 118, 110, 0.25)',
            }}
          >
            <Package size={15} />
            <span>إضافة كاشف للمخزون</span>
          </button>

          <button
            type="button"
            onClick={() => setShowMindraySimulator(true)}
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
              boxShadow: '0 2px 8px rgba(2, 132, 199, 0.35)',
            }}
          >
            <Activity size={15} />
            <span>محاكي جهاز Mindray BC-30 التفاعلي</span>
          </button>
        </div>

        {/* Right Info Pills (Server IP & Port 5000 + Stock Alerts) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid #0f766e',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
            }}
          >
            <Wifi size={15} color="#0f766e" />
            <span style={{ color: 'var(--text-muted)' }}>عنوان السيرفر للأجهزة:</span>
            <strong dir="ltr" style={{ color: '#0f766e', fontSize: '13.5px' }}>
              {serverIp} : {listenerPort}
            </strong>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '9px',
              fontSize: '12.5px',
              fontWeight: 700,
            }}
          >
            <AlertTriangle size={15} color="#f59e0b" />
            <span style={{ color: 'var(--text-muted)' }}>نواقص الكواشف:</span>
            <strong style={{ color: alerts.lowStockCount > 0 ? '#dc2626' : '#16a34a', fontSize: '14px' }}>
              {alerts.lowStockCount || 0}
            </strong>
          </div>

          <button
            type="button"
            onClick={loadAll}
            title="تحديث البيانات"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-card)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </header>

      {/* 2. Split Workspace (Right: Medical Analyzers | Left: Inventory & Auto-Deducted Reagents) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: '12px',
          padding: '10px 16px 14px 16px',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        {/* RIGHT PANEL: Connected Medical Analyzers (~400px) */}
        <section
          style={{
            width: '400px',
            minWidth: '400px',
            height: '100%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            style={{
              padding: '12px 14px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={17} color="#0284c7" />
              <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-main)' }}>
                الأجهزة الطبية المربوطة ({devices.length})
              </span>
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
              استقبال تلقائي للنتائج
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {devices.length === 0 ? (
              <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                لا توجد أجهزة طبية مضافة بعد. اضغط على «إضافة جهاز طبي» بالأعلى.
              </div>
            ) : (
              devices.map((dev) => (
                <div
                  key={dev.id}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '999px',
                            backgroundColor: dev.active !== false ? '#10b981' : '#94a3b8',
                          }}
                        />
                        <span style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-main)' }}>{dev.name}</span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                        البروتوكول: {dev.protocol || 'HL7'} • المنفذ: {dev.port || 5000} • ({dev.mappings?.length || 0} فحص مربوط)
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteDevice(dev.id)}
                      title="حذف الجهاز"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  {/* Easy Non-Tech Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleOpenGuideForDevice(dev)}
                      style={{
                        flex: 1,
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: '1px solid #bae6fd',
                        backgroundColor: '#f0f9ff',
                        color: '#0369a1',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <HelpCircle size={14} />
                      <span>خطوات الربط بالتفصيل</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTestConnection(dev)}
                      disabled={simulatingId === dev.id}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '8px',
                        border: '1px solid #bbf7d0',
                        backgroundColor: '#f0fdf4',
                        color: '#15803d',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                      }}
                    >
                      <Zap size={14} />
                      <span>{simulatingId === dev.id ? 'جاري الفحص...' : 'فحص الربط'}</span>
                    </button>

                    {(dev.brand?.toLowerCase() === 'mindray' || (dev.name || '').toLowerCase().includes('mindray')) && (
                      <button
                        type="button"
                        onClick={() => setShowMindraySimulator(true)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: '1px solid #bae6fd',
                          backgroundColor: '#0284c7',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                        }}
                      >
                        <Activity size={14} />
                        <span>شاشة المحاكي</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* LEFT PANEL: Inventory & Reagents Table (Flexible) */}
        <section
          style={{
            flex: 1,
            height: '100%',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)',
            minWidth: 0,
          }}
        >
          {/* Top Filter Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 900, color: 'var(--text-main)', marginLeft: '8px' }}>
                المخزون والكواشف الطبية
              </span>
              {[
                { id: 'ALL', label: `الكل (${items.length})` },
                { id: 'LOW', label: `نواقص الرصيد (${alerts.lowStockCount || 0})` },
                { id: 'EXPIRED', label: `منتهية الصلاحية (${alerts.expiredCount || 0})` },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setInvFilter(f.id as any)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: invFilter === f.id ? '1.5px solid #0f766e' : '1px solid var(--border-color)',
                    backgroundColor: invFilter === f.id ? 'rgba(15, 118, 110, 0.1)' : 'var(--bg-input)',
                    color: invFilter === f.id ? '#0f766e' : 'var(--text-muted)',
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', width: '230px' }}>
              <Search
                size={15}
                color="var(--text-muted)"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                type="text"
                value={invSearch}
                onChange={(e) => setInvSearch(e.target.value)}
                placeholder="بحث عن كاشف أو كود تحليل..."
                style={{
                  width: '100%',
                  height: '34px',
                  padding: '0 10px 0 30px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-input)',
                  color: 'var(--text-main)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Scrollable Inventory Table */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '12px' }}>
                  <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700 }}>اسم الكاشف / المادة</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>الربط التلقائي بالتحليل</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>العبوات المتبقية</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>الصلاحية</th>
                  <th style={{ textAlign: 'center', padding: '10px 8px', fontWeight: 700 }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      جاري تحميل المخزون...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      لا توجد مواد مطابقة في المخزون
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isLow = Number(item.quantity) <= Number(item.reorderThreshold || 3);
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 8px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--text-main)' }}>{item.name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            التكلفة: {Number(item.costPerUnit || 0).toLocaleString()} {currency}
                          </div>
                        </td>

                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          {item.catalogCode ? (
                            <span
                              style={{
                                padding: '3px 10px',
                                borderRadius: '999px',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                backgroundColor: '#f0fdf4',
                                color: '#15803d',
                                border: '1px solid #bbf7d0',
                              }}
                            >
                              🔗 يخصم مع #{item.catalogCode}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '11.5px' }}>يدوي</span>
                          )}
                        </td>

                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <span
                            style={{
                              fontWeight: 900,
                              fontSize: '14px',
                              color: isLow ? '#dc2626' : 'var(--text-main)',
                            }}
                          >
                            {item.quantity} {item.unit || 'عبوة'}
                          </span>
                          {isLow && (
                            <span
                              style={{
                                display: 'block',
                                fontSize: '10.5px',
                                fontWeight: 800,
                                color: '#dc2626',
                              }}
                            >
                              ⚠️ رصيد منخفض
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '10px 8px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                          {item.expiryDate ? formatEnglishDate(item.expiryDate) : 'مفتوح'}
                        </td>

                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenVial(item.id)}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '6px',
                                border: '1px solid #0f766e',
                                backgroundColor: 'rgba(15, 118, 110, 0.08)',
                                color: '#0f766e',
                                fontSize: '11.5px',
                                fontWeight: 800,
                                cursor: 'pointer',
                              }}
                            >
                              فتح عبوة
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteInventoryItem(item.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Add Device Modal with Built-in Step-by-Step Guide */}
      {showAddDeviceModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <form
            onSubmit={handleSaveDevice}
            style={{
              width: '620px',
              maxWidth: '95vw',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 900 }}>إضافة وربط جهاز طبي خطوة بخطوة</h3>
              <button type="button" onClick={() => setShowAddDeviceModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, marginBottom: '6px' }}>
                1. اختر موديل الجهاز الطبي من القائمة الجاهزة:
              </label>
              <select
                value={selectedPresetId}
                onChange={(e) => handleSelectPreset(e.target.value)}
                style={{
                  width: '100%',
                  height: '40px',
                  padding: '0 12px',
                  borderRadius: '8px',
                  border: '1.5px solid #0284c7',
                  backgroundColor: 'var(--bg-input)',
                  fontSize: '13.5px',
                  fontWeight: 800,
                }}
              >
                {DEVICE_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.brand} {p.model} ({p.category} - {p.protocol})
                  </option>
                ))}
              </select>
            </div>

            {/* Step-by-Step Guide Box for the Selected Analyzer */}
            {activePreset && (
              <div
                style={{
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  padding: '14px',
                  color: '#0c4a6e',
                }}
              >
                <div style={{ fontWeight: 900, fontSize: '13.5px', marginBottom: '8px' }}>
                  📋 طريقة ربط جهاز ({activePreset.brand} {activePreset.model}) بدون فني:
                </div>
                <div style={{ fontSize: '12.5px', marginBottom: '6px' }}>
                  <strong>• نوع الكيبل:</strong> {activePreset.cableTypeAr || 'كيبل شبكة LAN عادي (RJ45)'}
                </div>
                <div style={{ fontSize: '12.5px', marginBottom: '8px' }}>
                  <strong>• مكان الإعداد في شاشة الجهاز:</strong> <code dir="ltr">{activePreset.analyzerMenuPath || 'Setup > Host / LIS'}</code>
                </div>
                <ol style={{ margin: '0', paddingRight: '18px', fontSize: '12.5px', lineHeight: 1.7 }}>
                  {(activePreset.setupSteps || []).map((step, i) => (
                    <li key={i} style={{ fontWeight: 700 }}>
                      {step}
                    </li>
                  ))}
                  <li style={{ fontWeight: 900, color: '#0f766e' }}>
                    اكتب في شاشة الجهاز عنوان السيرفر (<span dir="ltr">{serverIp}</span>) والمنفذ (<span dir="ltr">{listenerPort}</span>).
                  </li>
                </ol>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>الاسم المعروض في المختبر</label>
                <input
                  type="text"
                  value={devName}
                  onChange={(e) => setDevName(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ width: '130px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>رقم المنفذ (Port)</label>
                <input
                  type="text"
                  value={devPort}
                  onChange={(e) => setDevPort(e.target.value)}
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={() => setShowAddDeviceModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                إلغاء
              </button>
              <button type="submit" disabled={savingDevice} style={{ padding: '8px 22px', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                {savingDevice ? 'جاري الإضافة...' : 'تثبيت الجهاز وتفعيل الاستماع'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Per-Device Connection Guide Modal */}
      {guideDevice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '16px',
          }}
        >
          <div
            style={{
              width: '540px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>خطوات ربط جهاز ({guideDevice.name})</h3>
              <button type="button" onClick={() => setGuideDevice(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: '13px', fontWeight: 800, color: '#166534' }}>
              🌐 عنوان حاسوب المختبر (Host IP): <span dir="ltr">{serverIp}</span> | المنفذ (Port): <span dir="ltr">{listenerPort}</span>
            </div>
            <div style={{ fontSize: '13px', lineHeight: 1.8 }}>
              <div><strong>• نوع التوصيل:</strong> {guideDevice.preset?.cableTypeAr || 'كيبل شبكة LAN عادي'}</div>
              <div><strong>• مسار الشاشة في الجهاز:</strong> <code dir="ltr">{guideDevice.preset?.analyzerMenuPath}</code></div>
              <ol style={{ marginTop: '8px', paddingRight: '18px' }}>
                {(guideDevice.preset?.setupSteps || []).map((st, idx) => (
                  <li key={idx} style={{ fontWeight: 700, marginBottom: '4px' }}>{st}</li>
                ))}
              </ol>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setGuideDevice(null)} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                تم، واضح
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Inventory Reagent Modal */}
      {showAddItemModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <form
            onSubmit={handleSaveInventoryItem}
            style={{
              width: '420px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>إضافة كاشف أو مستلزم للمخزون</h3>
              <button type="button" onClick={() => setShowAddItemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>اسم الكاشف / المادة</label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="مثال: Glucose Reagent Kit"
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>
                كود التحليل المربوط بالخصم التلقائي (اختياري)
              </label>
              <input
                type="text"
                value={catalogCode}
                onChange={(e) => setCatalogCode(e.target.value)}
                placeholder="مثال: GLU أو CBC أو CRP"
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>الكمية المتوفرة</label>
                <input
                  type="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="10"
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>سعر التكلفة ({currency})</label>
                <input
                  type="text"
                  value={costPerUnit}
                  onChange={(e) => setCostPerUnit(e.target.value)}
                  placeholder="25000"
                  style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>تاريخ الصلاحية</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                style={{ width: '100%', height: '38px', padding: '0 10px', borderRadius: '8px', border: '1px solid var(--border-color)', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" onClick={() => setShowAddItemModal(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                إلغاء
              </button>
              <button type="submit" disabled={savingItem} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#0f766e', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>
                {savingItem ? 'جاري الحفظ...' : 'حفظ في المخزون'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Interactive Mindray BC-30 Simulator Modal */}
      {showMindraySimulator && (
        <MindrayBc30Simulator
          onClose={() => setShowMindraySimulator(false)}
          onOpenSampleInReception={(sId) => {
            setShowMindraySimulator(false);
            window.location.href = `/?sample=${sId}`;
          }}
        />
      )}
    </div>
  );
}

export default function DevicesPage() {
  return <UnifiedDevicesInventoryView />;
}

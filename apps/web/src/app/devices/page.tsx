'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { Cpu, Plus, Activity, Zap, Trash2, Edit3, Layers, RefreshCw, Copy, Check, Terminal, Download, Play, X, FileText, Sparkles, TestTube, AlertTriangle, Barcode } from 'lucide-react';

export default function DevicesPage() {
  const toast = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [catalogTests, setCatalogTests] = useState<any[]>([]);
  const [incomingResults, setIncomingResults] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'devices' | 'feed' | 'agent'>('devices');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [deleteDeviceId, setDeleteDeviceId] = useState<string | null>(null);

  // Selected for inspection
  const [selectedDevice, setSelectedDevice] = useState<any | null>(null);
  const [selectedPendingResult, setSelectedPendingResult] = useState<any | null>(null);

  // Device Form States
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Mindray');
  const [model, setModel] = useState('');
  const [category, setCategory] = useState('CBC');
  const [connectionType, setConnectionType] = useState('TCP_IP');
  const [protocol, setProtocol] = useState('HL7_V2');
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [port, setPort] = useState('5100');
  const [comPort, setComPort] = useState('COM1');
  const [baudRate, setBaudRate] = useState('9600');
  const [autoMatchSample, setAutoMatchSample] = useState(true);
  const [notes, setNotes] = useState('');

  // Mapping Form States
  const [newDeviceCode, setNewDeviceCode] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newCatalogId, setNewCatalogId] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newMultiplier, setNewMultiplier] = useState('1.0');

  // Simulation Form States
  const [simSampleNumber, setSimSampleNumber] = useState('1001');
  const [simPatientName, setSimPatientName] = useState('عينة فحص تجريبية');
  const [simulating, setSimulating] = useState(false);

  // Manual Assign Form States
  const [assignSampleId, setAssignSampleId] = useState('');
  const [assignTestCatalogId, setAssignTestCatalogId] = useState('');

  // Fetch all initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [devRes, preRes, catRes, incRes, sampRes] = await Promise.all([
        apiRequest('/devices').catch(() => ({ devices: [] })),
        apiRequest('/devices/presets').catch(() => ({ presets: [] })),
        apiRequest('/tests').catch(() => ({ tests: [] })),
        apiRequest('/devices/incoming-results?limit=50').catch(() => ({ results: [] })),
        apiRequest('/samples?status=ALL').catch(() => []),
      ]);

      setDevices(devRes.devices || []);
      setPresets(preRes.presets || []);
      setCatalogTests(catRes.tests || []);
      setIncomingResults(incRes.results || []);
      setSamples(Array.isArray(sampRes) ? sampRes : sampRes.samples || []);
    } catch (err: any) {
      toast.error(err.message || 'فشل في تحميل بيانات الأجهزة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh feed every 10 seconds
    const interval = setInterval(() => {
      apiRequest('/devices/incoming-results?limit=50')
        .then((res) => {
          if (res.results) setIncomingResults(res.results);
        })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Preset Selection Handler
  const handlePresetChange = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;
    const p = presets.find((item) => item.id === presetId);
    if (p) {
      setName(p.model);
      setBrand(p.brand);
      setModel(p.model);
      setCategory(p.category);
      setConnectionType(p.connectionType);
      setProtocol(p.protocol);
      if (p.defaultPort) setPort(String(p.defaultPort));
      if (p.defaultBaudRate) setBaudRate(String(p.defaultBaudRate));
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingDeviceId(null);
    setSelectedPresetId('');
    setName('');
    setBrand('Mindray');
    setModel('');
    setCategory('CBC');
    setConnectionType('TCP_IP');
    setProtocol('HL7_V2');
    setIpAddress('192.168.1.100');
    setPort('5100');
    setComPort('COM1');
    setBaudRate('9600');
    setAutoMatchSample(true);
    setNotes('');
    setShowDeviceModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dev: any) => {
    setEditingDeviceId(dev.id);
    setSelectedPresetId('');
    setName(dev.name);
    setBrand(dev.brand);
    setModel(dev.model);
    setCategory(dev.category);
    setConnectionType(dev.connectionType);
    setProtocol(dev.protocol);
    setIpAddress(dev.ipAddress || '192.168.1.100');
    setPort(String(dev.port || 5100));
    setComPort(dev.comPort || 'COM1');
    setBaudRate(String(dev.baudRate || 9600));
    setAutoMatchSample(dev.autoMatchSample);
    setNotes(dev.notes || '');
    setShowDeviceModal(true);
  };

  // Save Device
  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim()) {
      toast.error('يرجى ملء اسم الجهاز والشركة المصنعة');
      return;
    }

    try {
      const payload = {
        name,
        brand,
        model: model || name,
        category,
        connectionType,
        protocol,
        ipAddress: connectionType === 'TCP_IP' ? ipAddress : null,
        port: connectionType === 'TCP_IP' ? Number(port) : null,
        comPort: connectionType === 'SERIAL_PORT' ? comPort : null,
        baudRate: connectionType === 'SERIAL_PORT' ? Number(baudRate) : null,
        autoMatchSample,
        notes,
        presetId: selectedPresetId || undefined,
      };

      if (editingDeviceId) {
        await apiRequest(`/devices/${editingDeviceId}`, 'PUT', payload);
        toast.success('تم تحديث إعدادات الجهاز بنجاح');
      } else {
        await apiRequest('/devices', 'POST', payload);
        toast.success('تمت إضافة الجهاز وربط الفحوصات التلقائية بنجاح');
      }

      setShowDeviceModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'حدث خطأ أثناء حفظ الجهاز');
    }
  };

  // Delete Device
  const handleDeleteDevice = async () => {
    if (!deleteDeviceId) return;
    try {
      await apiRequest(`/devices/${deleteDeviceId}`, 'DELETE');
      toast.success('تم حذف الجهاز بنجاح');
      setDeleteDeviceId(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'فشل حذف الجهاز');
    }
  };

  // Open Mapping Modal for a device
  const handleOpenMappings = async (dev: any) => {
    try {
      const res = await apiRequest(`/devices/${dev.id}`);
      setSelectedDevice(res.device);
      setNewDeviceCode('');
      setNewDeviceName('');
      setNewCatalogId(catalogTests[0]?.id || '');
      setNewUnit('');
      setNewMultiplier('1.0');
      setShowMappingModal(true);
    } catch (err: any) {
      toast.error('فشل تحميل تفاصيل الجهاز');
    }
  };

  // Add / Save Mapping
  const handleAddMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !newDeviceCode.trim() || !newCatalogId) {
      toast.error('يرجى تحديد كود فحص الجهاز والفحص المقابل في النظام');
      return;
    }

    try {
      await apiRequest(`/devices/${selectedDevice.id}/mappings`, 'POST', {
        deviceTestCode: newDeviceCode.trim().toUpperCase(),
        deviceTestName: newDeviceName.trim() || newDeviceCode.trim(),
        testCatalogId: newCatalogId,
        unit: newUnit.trim() || undefined,
        multiplier: parseFloat(newMultiplier) || 1.0,
      });

      toast.success('تم حفظ ربط الفحص بنجاح');
      const res = await apiRequest(`/devices/${selectedDevice.id}`);
      setSelectedDevice(res.device);
      setNewDeviceCode('');
      setNewDeviceName('');
      setNewUnit('');
      setNewMultiplier('1.0');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'فشل حفظ الربط');
    }
  };

  // Delete Mapping
  const handleDeleteMapping = async (mappingId: string) => {
    if (!selectedDevice) return;
    try {
      await apiRequest(`/devices/${selectedDevice.id}/mappings/${mappingId}`, 'DELETE');
      toast.success('تم حذف الربط');
      const res = await apiRequest(`/devices/${selectedDevice.id}`);
      setSelectedDevice(res.device);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'فشل الحذف');
    }
  };

  // Open Simulation Modal
  const handleOpenSimulate = (dev: any) => {
    setSelectedDevice(dev);
    const latestNum = samples[0]?.sampleNumber || 1001;
    setSimSampleNumber(String(latestNum));
    setShowSimulateModal(true);
  };

  // Execute Simulation
  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;
    setSimulating(true);
    try {
      const res = await apiRequest(`/devices/${selectedDevice.id}/test-simulate`, 'POST', {
        sampleNumber: Number(simSampleNumber),
        patientName: simPatientName,
      });

      toast.success(
        `<Zap size={14} /> تم الإرسال بنجاح! تم استلام ${res.summary.totalItems} فحص ومطابقة ${res.summary.appliedItems} نتيجة بالعينة #${simSampleNumber}`
      );
      setShowSimulateModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'فشل تشغيل المحاكاة');
    } finally {
      setSimulating(false);
    }
  };

  // Open Logs Modal
  const handleOpenLogs = async (dev: any) => {
    try {
      const res = await apiRequest(`/devices/${dev.id}`);
      setSelectedDevice(res.device);
      setShowLogsModal(true);
    } catch (err: any) {
      toast.error('فشل تحميل السجلات');
    }
  };

  // Copy API Token
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    toast.info('تم نسخ رمز الربط (Pairing API Key)');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Open Assign Modal for Pending Result
  const handleOpenAssign = (item: any) => {
    setSelectedPendingResult(item);
    setAssignSampleId(samples[0]?.id || '');
    setAssignTestCatalogId(catalogTests[0]?.id || '');
    setShowAssignModal(true);
  };

  // Execute Manual Assign
  const handleSaveAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPendingResult || !assignSampleId || !assignTestCatalogId) return;

    try {
      await apiRequest(`/devices/incoming-results/${selectedPendingResult.id}/apply`, 'POST', {
        sampleId: assignSampleId,
        testCatalogId: assignTestCatalogId,
      });

      toast.success('تم إسناد وتطبيق النتيجة على العينة بنجاح');
      setShowAssignModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'فشل إسناد النتيجة');
    }
  };

  return (
    <AppShell>
      <div style={{ padding: '16px 20px' }}>
        
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                <Cpu size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  ربط أجهزة المختبر والتحليلات الآلية (LIS Device Hub)
                </h1>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  استقبال نتائج أجهزة الدم، الكيمياء، والهرمونات وتنزيلها بالعينة تلقائياً
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchData} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>تحديث</span>
            </button>
            <button 
              onClick={handleOpenCreate} 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
            >
              <Plus size={16} />
              <span>إضافة جهاز جديد</span>
            </button>
          </div>
        </div>

        {/* Quick Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('devices')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'devices' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'devices' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontWeight: activeTab === 'devices' ? 800 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Cpu size={16} />
            <span>الأجهزة المعرفة ({devices.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'feed' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'feed' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontWeight: activeTab === 'feed' ? 800 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Zap size={16} />
            <span>بث النتائج الواردة المباشر ({incomingResults.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'agent' ? '2px solid var(--accent-cyan)' : '2px solid transparent',
              color: activeTab === 'agent' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontWeight: activeTab === 'agent' ? 800 : 500,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Terminal size={16} />
            <span>الوسيط المحلي (LIS Local Agent)</span>
          </button>
        </div>

        {/* TAB 1: DEVICES LIST */}
        {activeTab === 'devices' && (
          <div>
            {devices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', background: 'var(--bg-card)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                <Cpu size={48} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
                <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '6px' }}>لم يتم ربط أي جهاز حتى الآن</h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                  يمكنك إضافة أجهزة صورة الدم (CBC)، الكيمياء السريرية، الهرمونات، وأجهزة الأملاح بخطوات بسيطة واختيار نوع الجهاز من القوالب الجاهزة.
                </p>
                <button onClick={handleOpenCreate} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={16} />
                  <span>إضافة أول جهاز</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
                {devices.map((dev) => {
                  const isOnline = dev.status === 'ONLINE';
                  return (
                    <div
                      key={dev.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '12px',
                        position: 'relative',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Card Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <strong style={{ fontSize: '15px', color: 'var(--text-main)' }}>{dev.name}</strong>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: isOnline ? 'rgba(34, 197, 94, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                                color: isOnline ? '#4ade80' : 'var(--text-muted)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isOnline ? '#22c55e' : '#94a3b8' }}></span>
                              {isOnline ? 'متصل (Online)' : 'غير متصل (Offline)'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'flex', gap: '8px' }}>
                            <span>🏭 {dev.brand}</span>
                            <span><Barcode size={14} /> {dev.model}</span>
                            <span><TestTube size={14} /> {dev.category}</span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button onClick={() => handleOpenEdit(dev)} className="btn-icon" title="تعديل الجهاز">
                            <Edit3 size={14} />
                          </button>
                          <button onClick={() => setDeleteDeviceId(dev.id)} className="btn-icon" title="حذف الجهاز" style={{ color: '#f87171' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Connection Details Box */}
                      <div style={{ background: 'var(--bg-input)', padding: '10px 12px', borderRadius: '8px', fontSize: '11.5px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>نوع الاتصال:</span>
                          <strong style={{ color: 'var(--accent-cyan)' }}>
                            {dev.connectionType === 'TCP_IP' ? `🌐 شبكة LAN (Port: ${dev.port})` : dev.connectionType === 'SERIAL_PORT' ? `🔌 سيريال (${dev.comPort} - ${dev.baudRate})` : '📁 مراقب مجلد'}
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>البروتوكول:</span>
                          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{dev.protocol}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--text-muted)' }}>المطابقة التلقائية:</span>
                          <span style={{ color: dev.autoMatchSample ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                            {dev.autoMatchSample ? '<Zap size={14} /> مفعّلة (تنزيل فوري)' : 'يدوية'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid var(--border-color)', marginTop: '2px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>رمز الإقران (API Key):</span>
                          <button
                            onClick={() => copyToClipboard(dev.apiKey)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                          >
                            {copiedKey === dev.apiKey ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                            <code>{dev.apiKey.substring(0, 10)}...</code>
                          </button>
                        </div>
                      </div>

                      {/* Card Stats */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', padding: '0 4px' }}>
                        <span>🔗 الفحوصات المربوطة: <strong style={{ color: 'var(--text-main)' }}>{dev.mappingCount || 0}</strong></span>
                        <span>📥 نتائج مستلمة: <strong style={{ color: 'var(--text-main)' }}>{dev.resultsCount || 0}</strong></span>
                      </div>

                      {/* Card Actions */}
                      <div style={{ display: 'flex', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
                        <button
                          onClick={() => handleOpenMappings(dev)}
                          className="btn-secondary"
                          style={{ flex: 1, padding: '6px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Layers size={13} color="var(--accent-cyan)" />
                          <span>ربط الفحوصات ({dev.mappingCount || 0})</span>
                        </button>
                        <button
                          onClick={() => handleOpenSimulate(dev)}
                          className="btn-secondary"
                          style={{ padding: '6px 10px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#fbbf24' }}
                          title="محاكاة إرسال نتائج"
                        >
                          <Play size={13} />
                          <span>تجربة</span>
                        </button>
                        <button
                          onClick={() => handleOpenLogs(dev)}
                          className="btn-icon"
                          title="عرض سجل الرسائل الخام"
                          style={{ padding: '6px' }}
                        >
                          <FileText size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INCOMING FEED */}
        {activeTab === 'feed' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>سجل النتائج الواردة من الأجهزة لحظة بلحظة</strong>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>يتم التحديث تلقائياً كل 10 ثوانٍ <Zap size={14} /></span>
            </div>

            {incomingResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                <p>لا توجد نتائج واردة حتى الآن. عند قيام أي جهاز بفحص عينة ستظهر النتائج هنا فوراً.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 14px' }}>الوقت</th>
                      <th style={{ padding: '10px 14px' }}>الجهاز</th>
                      <th style={{ padding: '10px 14px' }}>رقم العينة</th>
                      <th style={{ padding: '10px 14px' }}>الفحص</th>
                      <th style={{ padding: '10px 14px' }}>النتيجة</th>
                      <th style={{ padding: '10px 14px' }}>الوحدة</th>
                      <th style={{ padding: '10px 14px' }}>الحالة</th>
                      <th style={{ padding: '10px 14px' }}>إجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incomingResults.map((item) => {
                      const isApplied = item.status === 'APPLIED';
                      return (
                        <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)', fontSize: '11px' }}>
                            {new Date(item.receivedAt).toLocaleTimeString('ar-IQ')}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                            {item.device?.name || 'جهاز خارجي'}
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontWeight: 800 }}>
                              #{item.sampleNumber || item.sampleBarcode || 'غير محدد'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600 }}>
                            {item.testName || item.testCode}
                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '4px' }}>({item.testCode})</span>
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 800, fontSize: '13px', color: item.isCritical ? '#f87171' : item.isAbnormal ? '#fbbf24' : '#fff' }}>
                            {item.resultValue}
                            {item.isCritical && <span style={{ marginRight: '4px', color: '#f87171' }}><AlertTriangle size={12} /> حرج</span>}
                          </td>
                          <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{item.unit || '-'}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '10px',
                                fontSize: '10px',
                                fontWeight: 700,
                                background: isApplied ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                                color: isApplied ? '#4ade80' : '#facc15',
                              }}
                            >
                              {isApplied ? '<Check size={12} /> نزل بالعينة' : '⏳ معلق'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            {!isApplied && (
                              <button
                                onClick={() => handleOpenAssign(item)}
                                className="btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                              >
                                إسناد لعينة
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: LOCAL AGENT SETUP & GUIDE */}
        {activeTab === 'agent' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '16px' }}>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Terminal size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '15px', color: 'var(--text-main)', margin: 0 }}>ما هو الوسيط المحلي (LIS Local Agent)؟</h3>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '14px' }}>
                الوسيط المحلي هو برنامج خفيف يعمل في خلفية أي حاسوب داخل المختبر. يتصل بالأجهزة المحلية عبر منافذ السيريال (RS232/COM) أو شبكة المختبر الداخلية (LAN)، ويقوم برفع النتائج مشفرة فور صدورها إلى منصة المختبر السحابية لتظهر على الفور أمام الفنيين.
              </p>

              <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', fontSize: '12px', marginBottom: '14px' }}>
                <strong style={{ color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>خطوات التشغيل السريع:</strong>
                <ol style={{ paddingRight: '18px', margin: 0, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <li>أضف جهاز المختبر في النظام واحصل على <strong>رمز الإقران (API Key)</strong>.</li>
                  <li>وصل كابل السيريال أو كابل الشبكة بين الجهاز وحاسوب المختبر.</li>
                  <li>شغّل الوسيط المحلي بضغطة زر؛ وسيقوم باستقبال النتائج وتنزيلها تلقائياً.</li>
                </ol>
              </div>

              <a
                href="/api/devices/agent-code"
                target="_blank"
                download="lis-agent.js"
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <Download size={15} />
                <span>تحميل ملف كود الوسيط المحلي (lis-agent.js)</span>
              </a>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={20} color="#fbbf24" />
                <h3 style={{ fontSize: '15px', color: 'var(--text-main)', margin: 0 }}>الأجهزة والبروتوكولات المدعومة مسبقاً</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {presets.map((p) => (
                  <div key={p.id} style={{ background: 'var(--bg-input)', padding: '8px 10px', borderRadius: '6px', fontSize: '11.5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ color: 'var(--text-main)', display: 'block' }}>{p.brand} {p.model}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '10.5px' }}>{p.arabicDescription}</span>
                    </div>
                    <span style={{ padding: '2px 6px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '10px' }}>
                      {p.protocol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 1: ADD / EDIT DEVICE */}
        {showDeviceModal && (
          <div className="modal-overlay" onClick={() => setShowDeviceModal(false)}>
            <div className="modal-content" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={20} color="var(--accent-cyan)" />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    {editingDeviceId ? 'تعديل إعدادات الجهاز' : 'إضافة جهاز مختبر جديد'}
                  </h3>
                </div>
                <button onClick={() => setShowDeviceModal(false)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveDevice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Preset Dropdown (For new devices) */}
                {!editingDeviceId && (
                  <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '10px 12px', borderRadius: '8px' }}>
                    <label style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      <Zap size={14} /> اختر من قوالب الأجهزة الجاهزة (Plug & Play):
                    </label>
                    <select
                      value={selectedPresetId}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className="input-field"
                      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent-cyan)' }}
                    >
                      <option value="">-- جهاز مخصص أو تعريف يدوي --</option>
                      {presets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.brand} - {p.model} ({p.arabicDescription})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>اسم الجهاز في المختبر *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: Mindray BC-5000 (الدم الرئيسي)"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>الشركة المصنعة *</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Mindray, Sysmex, Roche, إلخ"
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>الموديل</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="BC-5000, XP-300, c111..."
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>نوع التحاليل (التصنيف)</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                      <option value="CBC">صورة الدم الكاملة (CBC / Hematology)</option>
                      <option value="CHEMISTRY">كيمياء سريرية (Clinical Chemistry)</option>
                      <option value="IMMUNOLOGY">هرمونات ومناعة (Immunology / Hormones)</option>
                      <option value="ELECTROLYTES">أملاح وشوارد الدم (Electrolytes)</option>
                      <option value="URINE">تحليل الإدرار الآلي (Urine Analyzer)</option>
                      <option value="OTHER">تحاليل أخرى (Other)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>طريقة الاتصال</label>
                    <select value={connectionType} onChange={(e) => setConnectionType(e.target.value)} className="input-field">
                      <option value="TCP_IP">🌐 شبكة LAN (TCP/IP Socket)</option>
                      <option value="SERIAL_PORT">🔌 كابل سيريال (RS-232 / USB COM)</option>
                      <option value="FILE_WATCHER">📁 مراقب مجلد مشترك (File Drop)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>بروتوكول البيانات</label>
                    <select value={protocol} onChange={(e) => setProtocol(e.target.value)} className="input-field">
                      <option value="HL7_V2">HL7 v2.x (ORU^R01)</option>
                      <option value="ASTM_1394">ASTM 1381 / 1394 (Standard)</option>
                      <option value="CSV_DELIMITED">ملف CSV / نصوص مفصولة</option>
                      <option value="CUSTOM_TEXT">نصي مخصص (Custom Delimited)</option>
                    </select>
                  </div>
                </div>

                {connectionType === 'TCP_IP' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>عنوان IP للجهاز أو السيرفر</label>
                      <input
                        type="text"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        placeholder="192.168.1.100"
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>منفذ الشبكة (Port)</label>
                      <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        placeholder="5100"
                        className="input-field"
                      />
                    </div>
                  </div>
                )}

                {connectionType === 'SERIAL_PORT' && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>منفذ السيريال (COM Port)</label>
                      <input
                        type="text"
                        value={comPort}
                        onChange={(e) => setComPort(e.target.value)}
                        placeholder="COM1, COM2..."
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>معدل الباود (BaudRate)</label>
                      <select value={baudRate} onChange={(e) => setBaudRate(e.target.value)} className="input-field">
                        <option value="9600">9600</option>
                        <option value="19200">19200</option>
                        <option value="38400">38400</option>
                        <option value="115200">115200</option>
                      </select>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                  <input
                    type="checkbox"
                    id="autoMatch"
                    checked={autoMatchSample}
                    onChange={(e) => setAutoMatchSample(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--accent-cyan)' }}
                  />
                  <label htmlFor="autoMatch" style={{ fontSize: '12px', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <strong>تنزيل النتائج فورياً وتلقائياً</strong> عند تطابق رقم العينة (Sample ID / Barcode)
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <button type="button" onClick={() => setShowDeviceModal(false)} className="btn-secondary">
                    إلغاء
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingDeviceId ? 'حفظ التعديلات' : 'إضافة الجهاز'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: TEST CODE MAPPINGS */}
        {showMappingModal && selectedDevice && (
          <div className="modal-overlay" onClick={() => setShowMappingModal(false)}>
            <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    🔗 جدول مطابقة الفحوصات: {selectedDevice.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    ربط الرموز التي يرسلها الجهاز بالفحوصات المعرفة في كتالوج المختبر
                  </span>
                </div>
                <button onClick={() => setShowMappingModal(false)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>

              {/* Add New Mapping Form */}
              <form onSubmit={handleAddMapping} style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', marginBottom: '14px' }}>
                <strong style={{ fontSize: '12px', color: 'var(--accent-cyan)', display: 'block', marginBottom: '8px' }}>
                  + إضافة ربط فحص جديد:
                </strong>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr 60px auto', gap: '8px', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>كود الجهاز (e.g. WBC)</label>
                    <input
                      type="text"
                      value={newDeviceCode}
                      onChange={(e) => setNewDeviceCode(e.target.value)}
                      placeholder="WBC"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>الفحص في الكتالوج</label>
                    <select
                      value={newCatalogId}
                      onChange={(e) => setNewCatalogId(e.target.value)}
                      className="input-field"
                      required
                    >
                      <option value="">-- اختر الفحص المقابل --</option>
                      {catalogTests.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} {t.code ? `(${t.code})` : ''} - {t.category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>الوحدة (اختياري)</label>
                    <input
                      type="text"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="10^3/uL"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>المعامل</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMultiplier}
                      onChange={(e) => setNewMultiplier(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '8px 12px', fontSize: '12px' }}>
                    حفظ الربط
                  </button>
                </div>
              </form>

              {/* Existing Mappings Table */}
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'right' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '8px 10px' }}>كود الجهاز</th>
                      <th style={{ padding: '8px 10px' }}>الفحص المرتبط في النظام</th>
                      <th style={{ padding: '8px 10px' }}>التصنيف</th>
                      <th style={{ padding: '8px 10px' }}>الوحدة</th>
                      <th style={{ padding: '8px 10px' }}>معامل التحويل</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center' }}>حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedDevice.mappings || []).map((m: any) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 10px', fontWeight: 700, color: 'var(--accent-cyan)' }}>{m.deviceTestCode}</td>
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-main)' }}>{m.testCatalog?.name || 'غير معروف'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{m.testCatalog?.category || '-'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{m.unit || m.testCatalog?.unit || '-'}</td>
                        <td style={{ padding: '8px 10px' }}>{m.multiplier}</td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button onClick={() => handleDeleteMapping(m.id)} className="btn-icon" style={{ color: '#f87171' }}>
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 3: SIMULATION & TEST TRANSMISSION */}
        {showSimulateModal && selectedDevice && (
          <div className="modal-overlay" onClick={() => setShowSimulateModal(false)}>
            <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Play size={18} color="#fbbf24" />
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    <Zap size={14} /> محاكاة فحص وتنزيل نتائج تجريبية
                  </h3>
                </div>
                <button onClick={() => setShowSimulateModal(false)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
                ستقوم المحاكاة بإرسال حزمة نتائج كاملة مطابقة لمواصفات جهاز <strong>{selectedDevice.name}</strong> إلى محرك الـ LIS للتحقق من نزول النتائج وحساب المعدلات الطبيعية والحرجة بالعينة فوراً.
              </p>

              <form onSubmit={handleRunSimulation} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    رقم العينة المراد تنزيل النتائج لها:
                  </label>
                  <input
                    type="number"
                    value={simSampleNumber}
                    onChange={(e) => setSimSampleNumber(e.target.value)}
                    placeholder="1001"
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>
                    اسم المريض في رسالة الجهاز:
                  </label>
                  <input
                    type="text"
                    value={simPatientName}
                    onChange={(e) => setSimPatientName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowSimulateModal(false)} className="btn-secondary">
                    إلغاء
                  </button>
                  <button type="submit" disabled={simulating} className="btn-primary" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)', color: '#000', fontWeight: 800 }}>
                    {simulating ? 'جارِ الإرسال والمطابقة...' : '<Zap size={14} /> تشغيل الإرسال الفوري'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: RAW LOGS INSPECTOR */}
        {showLogsModal && selectedDevice && (
          <div className="modal-overlay" onClick={() => setShowLogsModal(false)}>
            <div className="modal-content" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                    📜 سجل الرسائل الخام (Raw Logs): {selectedDevice.name}
                  </h3>
                </div>
                <button onClick={() => setShowLogsModal(false)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>

              <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(selectedDevice.logs || []).length === 0 ? (
                  <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>لا توجد رسائل مسجلة بعد.</p>
                ) : (
                  (selectedDevice.logs || []).map((log: any) => (
                    <div key={log.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', fontFamily: 'monospace' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '4px' }}>
                        <span style={{ color: log.direction === 'INCOMING' ? '#4ade80' : '#f87171' }}>● {log.direction}</span>
                        <span>{new Date(log.createdAt).toLocaleString('ar-IQ')}</span>
                      </div>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--accent-cyan)' }}>{log.message}</pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 5: MANUAL ASSIGN PENDING RESULT */}
        {showAssignModal && selectedPendingResult && (
          <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
            <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  إسناد النتيجة المعلقة لعينة
                </h3>
                <button onClick={() => setShowAssignModal(false)} className="btn-icon">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSaveAssign} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '6px', fontSize: '12px' }}>
                  <div>كود الفحص المستلم: <strong>{selectedPendingResult.testCode}</strong></div>
                  <div>القيمة المستلمة: <strong style={{ color: 'var(--accent-cyan)' }}>{selectedPendingResult.resultValue} {selectedPendingResult.unit}</strong></div>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>اختر العينة والمريض:</label>
                  <select value={assignSampleId} onChange={(e) => setAssignSampleId(e.target.value)} className="input-field" required>
                    {samples.map((s) => (
                      <option key={s.id} value={s.id}>
                        عينة #{s.sampleNumber} - {s.patient?.name || 'غير معروف'} ({s.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>اختر الفحص من الكتالوج:</label>
                  <select value={assignTestCatalogId} onChange={(e) => setAssignTestCatalogId(e.target.value)} className="input-field" required>
                    {catalogTests.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.code ? `(${t.code})` : ''} - {t.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button type="button" onClick={() => setShowAssignModal(false)} className="btn-secondary">
                    إلغاء
                  </button>
                  <button type="submit" className="btn-primary">
                    تطبيق النتيجة
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION */}
        <ConfirmModal
          isOpen={!!deleteDeviceId}
          title="حذف جهاز المختبر"
          message="هل أنت متأكد من حذف هذا الجهاز وكافة روابط الفحوصات المرتبطة به؟"
          confirmText="نعم، احذف الجهاز"
          cancelText="إلغاء"
          type="danger"
          onConfirm={handleDeleteDevice}
          onCancel={() => setDeleteDeviceId(null)}
        />

      </div>
    </AppShell>
  );
}

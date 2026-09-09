'use client';

export const dynamic = 'force-dynamic';

import React, { useEffect, useState, useRef } from 'react';
import AppShell from '../../components/AppShell';
import { apiRequest } from '../../lib/api';
import { useToast } from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import Link from 'next/link';
import {
  Cpu,
  Plus,
  Activity,
  Zap,
  Trash2,
  Edit3,
  Layers,
  RefreshCw,
  Copy,
  Check,
  Terminal,
  Download,
  Play,
  X,
  FileText,
  Sparkles,
  TestTube,
  AlertTriangle,
  Barcode,
  Radio,
  Sliders,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
  Eye,
  CheckCheck
} from 'lucide-react';
import {
  CLINICAL_PROFILES,
  ClinicalProfileKey,
  SimulationFrame
} from '../../lib/deviceEngine';

export default function DevicesPage() {
  const toast = useToast();
  const [devices, setDevices] = useState<any[]>([]);
  const [presets, setPresets] = useState<any[]>([]);
  const [catalogTests, setCatalogTests] = useState<any[]>([]);
  const [incomingResults, setIncomingResults] = useState<any[]>([]);
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'devices' | 'simulator' | 'feed' | 'agent'>('simulator');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
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

  // Manual Assign Form States
  const [assignSampleId, setAssignSampleId] = useState('');
  const [assignTestCatalogId, setAssignTestCatalogId] = useState('');

  // -------------------------------------------------------------
  // Simulator Studio States
  // -------------------------------------------------------------
  const [selectedSimDeviceId, setSelectedSimDeviceId] = useState<string>('');
  const [selectedProfileKey, setSelectedProfileKey] = useState<ClinicalProfileKey>('NORMAL_ADULT');
  const [simSampleNumber, setSimSampleNumber] = useState('1001');
  const [simPatientName, setSimPatientName] = useState('حيدر عبد الحسين الخفاجي');
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState<number>(0); // 0: idle, 1: barcode, 2: aspirating/assay, 3: encoding/tx, 4: lis ingested
  const [lcdStatus, setLcdStatus] = useState<string>('READY (STANDBY)');
  const [activeLeds, setActiveLeds] = useState<{ power: boolean; link: boolean; tx: boolean; rx: boolean }>({
    power: true,
    link: true,
    tx: false,
    rx: false,
  });
  const [simLiveFrames, setSimLiveFrames] = useState<SimulationFrame[]>([]);
  const [simResultSummary, setSimResultSummary] = useState<any | null>(null);
  const terminalRef = useRef<HTMLDivElement | null>(null);

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

      const loadedDevices = devRes.devices || [];
      const loadedSamples = Array.isArray(sampRes) ? sampRes : sampRes.samples || [];

      setDevices(loadedDevices);
      setPresets(preRes.presets || []);
      setCatalogTests(catRes.tests || []);
      setIncomingResults(incRes.results || []);
      setSamples(loadedSamples);

      // Auto-select initial simulator device
      if (!selectedSimDeviceId && loadedDevices.length > 0) {
        setSelectedSimDeviceId(loadedDevices[0].id);
      }

      // Auto-populate simulation sample
      if (loadedSamples.length > 0) {
        const first = loadedSamples[0];
        setSimSampleNumber(String(first.sampleNumber));
        setSimPatientName(first.patient?.name || 'عينة مريض');
      }
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

  // Auto scroll terminal to bottom when new frames arrive
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [simLiveFrames, simStep]);

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

  // -------------------------------------------------------------
  // RUN SIMULATION (Quasi-Realistic LIS Interfacing)
  // -------------------------------------------------------------
  const handleRunSimulation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetDev = devices.find((d) => d.id === selectedSimDeviceId) || devices[0];
    if (!targetDev) {
      toast.error('يرجى تحديد الجهاز لتشغيل المحاكاة');
      return;
    }

    setSimulating(true);
    setSimStep(1); // Barcode scan
    setLcdStatus('SCANNING BARCODE & VERIFYING SPECIMEN...');
    setActiveLeds({ power: true, link: true, tx: true, rx: false });

    setTimeout(() => {
      setSimStep(2); // Aspirating & Assay
      setLcdStatus('ASPIRATING BLOOD SAMPLE & RUNNING DUAL-CHAMBER ASSAY...');
      setActiveLeds({ power: true, link: true, tx: true, rx: true });
    }, 700);

    setTimeout(() => {
      setSimStep(3); // Packet Encoding & Transmission
      setLcdStatus(`ENCODING ${targetDev.protocol} FRAMES & TRANSMITTING VIA ${targetDev.connectionType}...`);
      setActiveLeds({ power: true, link: true, tx: true, rx: false });
    }, 1400);

    try {
      const res = await apiRequest(`/devices/${targetDev.id}/test-simulate`, 'POST', {
        sampleNumber: Number(simSampleNumber),
        patientName: simPatientName,
        profileKey: selectedProfileKey,
      });

      setTimeout(() => {
        setSimStep(4);
        setLcdStatus('TRANSMISSION COMPLETE - RESULTS ACKNOWLEDGED BY LIS [ACK 0x06]');
        setActiveLeds({ power: true, link: true, tx: false, rx: true });
        setSimLiveFrames(res.simulation?.frames || []);
        setSimResultSummary(res);

        toast.success(
          `تمت المحاكاة بنجاح! تم استلام ${res.simulation?.parsedItemsCount || 0} فحص وتنزيل ${res.summary?.appliedItems || 0} نتيجة بالعينة #${simSampleNumber}`
        );

        fetchData();
        setSimulating(false);

        setTimeout(() => {
          setLcdStatus('READY (STANDBY)');
          setActiveLeds({ power: true, link: true, tx: false, rx: false });
        }, 4000);
      }, 2200);
    } catch (err: any) {
      toast.error(err.message || 'فشل تشغيل المحاكاة');
      setSimulating(false);
      setSimStep(0);
      setLcdStatus('ERROR: COMMUNICATION FAILURE');
      setActiveLeds({ power: true, link: false, tx: false, rx: false });
    }
  };

  // Quick switch from device card
  const handleQuickSimulateDevice = (dev: any) => {
    setSelectedSimDeviceId(dev.id);
    setActiveTab('simulator');
  };

  const currentSimDevice = devices.find((d) => d.id === selectedSimDeviceId) || devices[0];
  const activeProfile = CLINICAL_PROFILES[selectedProfileKey] || CLINICAL_PROFILES.NORMAL_ADULT;

  return (
    <AppShell>
      <div style={{ padding: '16px 20px' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-cyan)' }}>
                <Cpu size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  ربط أجهزة المختبر والتحليلات الآلية (LIS Device Hub & Simulator)
                </h1>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                  استقبال نتائج أجهزة صورة الدم، الكيمياء، والهرمونات وتنزيلها بالعينة تلقائياً مع محاكي افتراضي شبه حقيقي
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
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('simulator')}
            style={{
              padding: '9px 18px',
              background: activeTab === 'simulator' ? 'rgba(6, 182, 212, 0.12)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === 'simulator' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
              color: activeTab === 'simulator' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              fontWeight: activeTab === 'simulator' ? 800 : 600,
              fontSize: '13.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              borderRadius: '6px 6px 0 0',
            }}
          >
            <Radio size={16} color={activeTab === 'simulator' ? 'var(--accent-cyan)' : undefined} />
            <span>محاكي الأجهزة الافتراضي الشبه حقيقي (LIS Simulator)</span>
            <span style={{ fontSize: '10px', background: 'var(--accent-cyan)', color: '#000', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>LIVE</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            style={{
              padding: '9px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'devices' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
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
              padding: '9px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'feed' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
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
              padding: '9px 18px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'agent' ? '3px solid var(--accent-cyan)' : '3px solid transparent',
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

        {/* ========================================================================= */}
        {/* TAB 0: VIRTUAL ANALYZER SIMULATOR STUDIO (MAIN FOCUS)                    */}
        {/* ========================================================================= */}
        {activeTab === 'simulator' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* Device Switcher Ribbon */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                  اختر الجهاز المراد محاكاته:
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {devices.map((d) => {
                    const isSelected = d.id === selectedSimDeviceId;
                    return (
                      <button
                        key={d.id}
                        onClick={() => {
                          setSelectedSimDeviceId(d.id);
                          setSimResultSummary(null);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: isSelected ? '1px solid var(--accent-cyan)' : '1px solid var(--border-color)',
                          background: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'var(--bg-input)',
                          color: isSelected ? 'var(--accent-cyan)' : 'var(--text-muted)',
                          fontSize: '12px',
                          fontWeight: isSelected ? 800 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Cpu size={14} />
                        <span>{d.name}</span>
                        <span style={{ fontSize: '10px', opacity: 0.8, padding: '1px 4px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)' }}>
                          {d.protocol}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {currentSimDevice && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  <span>منفذ الربط:</span>
                  <strong style={{ color: 'var(--accent-cyan)' }}>
                    {currentSimDevice.connectionType === 'TCP_IP'
                      ? `🌐 LAN (Port ${currentSimDevice.port || 5100})`
                      : `🔌 Serial (${currentSimDevice.comPort || 'COM1'} - ${currentSimDevice.baudRate || 9600})`}
                  </strong>
                </div>
              )}
            </div>

            {/* Studio Main Grid: Left = Hardware Console & Control, Right = Terminal Monitor & Result */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 1fr) minmax(460px, 1.25fr)', gap: '16px' }}>
              
              {/* LEFT COLUMN: Hardware Chassis & Execution Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 1. Hardware Chassis Plaque & Retro Matrix LCD Screen */}
                <div style={{ background: '#0f172a', border: '2px solid #1e293b', borderRadius: '12px', padding: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', position: 'relative' }}>
                  
                  {/* Chassis Top Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0284c7' }}></div>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#f8fafc', letterSpacing: '0.5px' }}>
                          {currentSimDevice?.brand?.toUpperCase() || 'MINDRAY'} MEDICAL INSTRUMENTS
                        </strong>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          MODEL: {currentSimDevice?.model || 'BC-5000'} | SN: MD-{currentSimDevice?.id?.slice(-4) || '5082'}-2024
                        </div>
                      </div>
                    </div>

                    {/* Hardware LED Indicators Bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#020617', padding: '5px 10px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                      {/* POWER */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeLeds.power ? '#22c55e' : '#334155', boxShadow: activeLeds.power ? '0 0 8px #22c55e' : 'none' }}></span>
                        <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 700 }}>PWR</span>
                      </div>
                      {/* LINK */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeLeds.link ? '#06b6d4' : '#334155', boxShadow: activeLeds.link ? '0 0 8px #06b6d4' : 'none' }}></span>
                        <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 700 }}>LINK</span>
                      </div>
                      {/* TX */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeLeds.tx ? '#fbbf24' : '#334155', boxShadow: activeLeds.tx ? '0 0 8px #fbbf24' : 'none', transition: 'all 0.1s' }}></span>
                        <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 700 }}>TX</span>
                      </div>
                      {/* RX */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: activeLeds.rx ? '#38bdf8' : '#334155', boxShadow: activeLeds.rx ? '0 0 8px #38bdf8' : 'none', transition: 'all 0.1s' }}></span>
                        <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 700 }}>RX</span>
                      </div>
                    </div>
                  </div>

                  {/* Retro Cyber Phosphor Matrix LCD Screen */}
                  <div
                    style={{
                      background: 'radial-gradient(ellipse at center, #022010 0%, #011409 100%)',
                      border: '2px solid #14532d',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      fontFamily: 'monospace',
                      color: '#4ade80',
                      textShadow: '0 0 5px rgba(74, 222, 128, 0.6)',
                      boxShadow: 'inset 0 0 12px rgba(0,0,0,0.8)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px dashed #166534', paddingBottom: '4px', marginBottom: '6px' }}>
                      <span>SYS: {currentSimDevice?.model?.toUpperCase()} OS v4.2</span>
                      <span style={{ color: '#86efac' }}>PORT: {currentSimDevice?.connectionType === 'TCP_IP' ? `TCP:${currentSimDevice?.port || 5100}` : `${currentSimDevice?.comPort || 'COM1'}:9600`}</span>
                    </div>

                    <div style={{ fontSize: '12px', fontWeight: 700, margin: '4px 0' }}>
                      &gt; STATUS: {lcdStatus}
                    </div>

                    <div style={{ fontSize: '11px', color: '#a7f3d0', display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                      <span>SAMPLE_ID: #{simSampleNumber}</span>
                      <span>DIAG_PROFILE: {activeProfile.key}</span>
                    </div>

                    <div style={{ fontSize: '10px', color: '#6ee7b7', marginTop: '4px', opacity: 0.85 }}>
                      LIS PROTOCOL: {currentSimDevice?.protocol === 'HL7_V2' ? 'HL7 v2.3.1 (ORU^R01 / MLLP)' : 'ASTM E1381/E1394 STANDARD'}
                    </div>
                  </div>

                  {/* Cable Connection Graphic */}
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#020617', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }}></span>
                      <span>الكابل المتصل:</span>
                      <strong style={{ color: '#e2e8f0' }}>
                        {currentSimDevice?.connectionType === 'TCP_IP' ? '🌐 كابل شبكة محلي RJ-45 LAN مخصص' : '🔌 كابل تسلسلي RS-232 DB9 Null-Modem'}
                      </strong>
                    </div>
                    <span style={{ color: '#06b6d4', fontWeight: 700 }}>
                      {currentSimDevice?.connectionType === 'TCP_IP' ? '192.168.1.150' : '9600-8-N-1'}
                    </span>
                  </div>
                </div>

                {/* 2. Simulation Controls: Sample & Clinical Scenario Selection */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Sample Selection */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                      1. اختر العينة المستهدفة بالمختبر:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                      <select
                        value={simSampleNumber}
                        onChange={(e) => {
                          const num = e.target.value;
                          setSimSampleNumber(num);
                          const s = samples.find((x) => String(x.sampleNumber) === num);
                          if (s?.patient?.name) {
                            setSimPatientName(s.patient.name);
                          }
                        }}
                        className="input-field"
                        style={{ fontSize: '12px' }}
                      >
                        {samples.map((s) => (
                          <option key={s.id} value={s.sampleNumber}>
                            عينة #{s.sampleNumber} - {s.patient?.name} ({s.status})
                          </option>
                        ))}
                      </select>

                      <input
                        type="text"
                        value={simPatientName}
                        onChange={(e) => setSimPatientName(e.target.value)}
                        placeholder="اسم المريض"
                        className="input-field"
                        style={{ fontSize: '12px' }}
                      />
                    </div>

                    {/* Preview Tests in Target Sample */}
                    {(() => {
                      const matched = samples.find((s) => String(s.sampleNumber) === simSampleNumber);
                      if (!matched) return null;
                      return (
                        <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span>الفحوصات المطلوبة بالعينة:</span>
                          {(matched.tests || []).map((t: any, idx: number) => (
                            <span key={idx} style={{ padding: '1px 6px', borderRadius: '4px', background: 'var(--bg-input)', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                              {t.test?.code || t.test?.name}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Clinical Profile Selector */}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
                      2. السيناريو المرضي والتشخيصي للمحاكاة:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {(Object.keys(CLINICAL_PROFILES) as ClinicalProfileKey[]).map((key) => {
                        const prof = CLINICAL_PROFILES[key];
                        const isSelected = selectedProfileKey === key;
                        return (
                          <div
                            key={key}
                            onClick={() => setSelectedProfileKey(key)}
                            style={{
                              border: isSelected ? `2px solid ${prof.badgeColor}` : '1px solid var(--border-color)',
                              background: isSelected ? `${prof.badgeColor}15` : 'var(--bg-input)',
                              borderRadius: '8px',
                              padding: '10px',
                              cursor: 'pointer',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <strong style={{ fontSize: '11.5px', color: isSelected ? prof.badgeColor : 'var(--text-main)' }}>
                                {prof.labelAr}
                              </strong>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: prof.badgeColor }}></span>
                            </div>
                            <p style={{ fontSize: '10.5px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                              {prof.descriptionAr}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Action Button & Execution Progress */}
                  <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
                    <button
                      onClick={() => handleRunSimulation()}
                      disabled={simulating}
                      className="btn-primary"
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '14px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: simulating
                          ? 'var(--bg-input)'
                          : 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
                        boxShadow: '0 4px 14px rgba(6, 182, 212, 0.3)',
                      }}
                    >
                      <Zap size={18} className={simulating ? 'spin' : ''} />
                      <span>{simulating ? 'جارِ التحليل والمصافحة وبث الحزم إلى LIS...' : '🚀 تشغيل دورة الفحص وبث النتائج إلى LIS'}</span>
                    </button>

                    {/* Step by Step Indicator */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', marginTop: '10px', textAlign: 'center', fontSize: '10px' }}>
                      <div style={{ padding: '6px 2px', borderRadius: '6px', background: simStep >= 1 ? 'rgba(6, 182, 212, 0.2)' : 'var(--bg-input)', color: simStep >= 1 ? 'var(--accent-cyan)' : 'var(--text-dim)', fontWeight: simStep === 1 ? 800 : 500 }}>
                        1. باركود
                      </div>
                      <div style={{ padding: '6px 2px', borderRadius: '6px', background: simStep >= 2 ? 'rgba(6, 182, 212, 0.2)' : 'var(--bg-input)', color: simStep >= 2 ? 'var(--accent-cyan)' : 'var(--text-dim)', fontWeight: simStep === 2 ? 800 : 500 }}>
                        2. سحب العينة
                      </div>
                      <div style={{ padding: '6px 2px', borderRadius: '6px', background: simStep >= 3 ? 'rgba(6, 182, 212, 0.2)' : 'var(--bg-input)', color: simStep >= 3 ? 'var(--accent-cyan)' : 'var(--text-dim)', fontWeight: simStep === 3 ? 800 : 500 }}>
                        3. تكويد الحزمة
                      </div>
                      <div style={{ padding: '6px 2px', borderRadius: '6px', background: simStep >= 4 ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-input)', color: simStep >= 4 ? '#4ade80' : 'var(--text-dim)', fontWeight: simStep === 4 ? 800 : 500 }}>
                        4. مصافحة وبث
                      </div>
                      <div style={{ padding: '6px 2px', borderRadius: '6px', background: simStep >= 4 ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-input)', color: simStep >= 4 ? '#4ade80' : 'var(--text-dim)', fontWeight: simStep === 4 ? 800 : 500 }}>
                        5. تنزيل بالـ LIS
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Live Protocol Terminal & Results Inspector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* 3. Live Protocol Terminal (Serial / LAN TCP Socket Monitor) */}
                <div style={{ background: '#030712', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '420px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
                  
                  {/* Terminal Header */}
                  <div style={{ background: '#111827', padding: '10px 14px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal size={16} color="#38bdf8" />
                      <strong style={{ fontSize: '12.5px', color: '#f3f4f6', fontFamily: 'monospace' }}>
                        SERIAL / SOCKET TERMINAL MONITOR [{currentSimDevice?.protocol}]
                      </strong>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          const text = simLiveFrames.map((f) => `[${f.timestamp}] ${f.direction} ${f.content} (${f.description})`).join('\n');
                          navigator.clipboard.writeText(text);
                          toast.info('تم نسخ سجل الحزمة بالكامل');
                        }}
                        disabled={simLiveFrames.length === 0}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Copy size={11} />
                        <span>نسخ السجل</span>
                      </button>
                      <button
                        onClick={() => setSimLiveFrames([])}
                        className="btn-secondary"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        مسح
                      </button>
                    </div>
                  </div>

                  {/* Terminal Screen Body */}
                  <div
                    ref={terminalRef}
                    style={{
                      flex: 1,
                      padding: '12px',
                      overflowY: 'auto',
                      fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                      fontSize: '11px',
                      lineHeight: 1.5,
                      color: '#94a3b8',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    {simLiveFrames.length === 0 ? (
                      <div style={{ textAlign: 'center', margin: 'auto', color: '#475569' }}>
                        <Terminal size={36} style={{ marginBottom: '8px', opacity: 0.4 }} />
                        <p style={{ margin: 0, fontSize: '12px' }}>في انتظار بدء جلسة البث والمصافحة...</p>
                        <span style={{ fontSize: '10.5px' }}>اضغط على &quot;تشغيل دورة الفحص&quot; لبدء إرسال حزم ASTM / HL7 الحية ومراقبة الإشارات.</span>
                      </div>
                    ) : (
                      simLiveFrames.map((frame, idx) => {
                        const isTx = frame.direction === 'TX';
                        return (
                          <div
                            key={frame.id || idx}
                            style={{
                              background: isTx ? 'rgba(30, 41, 59, 0.4)' : 'rgba(6, 182, 212, 0.08)',
                              borderRight: isTx ? '3px solid #fbbf24' : '3px solid #22c55e',
                              padding: '6px 10px',
                              borderRadius: '4px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ color: isTx ? '#fbbf24' : '#22c55e', fontWeight: 800 }}>
                                  {isTx ? 'TX ➔ [DEV]' : '⬅ RX [LIS]'}
                                </span>
                                <span style={{ color: '#64748b' }}>[{frame.timestamp}]</span>
                                <span style={{ padding: '1px 5px', borderRadius: '3px', background: '#1e293b', color: '#cbd5e1', fontSize: '10px' }}>
                                  {frame.type}
                                </span>
                              </div>
                              <span style={{ color: '#0ea5e9', fontSize: '10px' }}>
                                HEX: {frame.hexDisplay}
                              </span>
                            </div>

                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: isTx ? '#f8fafc' : '#4ade80', fontWeight: 600 }}>
                              {frame.content}
                            </pre>

                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                              ℹ️ {frame.description}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* 4. Ingestion Results Confirmation Card */}
                {simResultSummary && (
                  <div
                    style={{
                      background: 'rgba(34, 197, 94, 0.08)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={22} color="#22c55e" />
                        <div>
                          <strong style={{ fontSize: '14px', color: '#4ade80' }}>
                            تم استلام النتائج وإدراجها فورياً بسجل العينة #{simResultSummary.summary?.sampleNumber}
                          </strong>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            المريض: {simResultSummary.summary?.patientName} | الجهاز: {simResultSummary.summary?.deviceName}
                          </div>
                        </div>
                      </div>

                      <span style={{ padding: '3px 8px', borderRadius: '12px', background: '#22c55e20', color: '#4ade80', fontWeight: 800, fontSize: '11px' }}>
                        حالة العينة: READY (جاهزة)
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                      <div style={{ background: 'var(--bg-input)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>فحوصات تم استلامها:</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>
                          {simResultSummary.summary?.totalItems || 0}
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-input)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>فحوصات طابقت بالعينة:</span>
                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#4ade80' }}>
                          {simResultSummary.summary?.appliedItems || 0}
                        </div>
                      </div>
                      <div style={{ background: 'var(--bg-input)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>البروتوكول المستخدم:</span>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                          {simResultSummary.simulation?.protocol}
                        </div>
                      </div>
                    </div>

                    {/* Action Shortcut to Workstation */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Link
                        href={`/results?sampleId=${simResultSummary.summary?.sample?.id || `s-${simSampleNumber}`}`}
                        className="btn-primary"
                        style={{
                          flex: 1,
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          fontSize: '12.5px',
                        }}
                      >
                        <Eye size={15} />
                        <span>فتح النتيجة وتدقيقها في ورقة العمل (Workstation) ↗</span>
                      </Link>

                      <Link
                        href={`/api/samples/${simResultSummary.summary?.sample?.id || `s-${simSampleNumber}`}/print`}
                        target="_blank"
                        className="btn-secondary"
                        style={{
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 12px',
                          fontSize: '12px',
                        }}
                      >
                        <FileText size={14} />
                        <span>معاينة الطباعة 🖨️</span>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: REGISTERED DEVICES LIST                                           */}
        {/* ========================================================================= */}
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
                            <span>🏷️ {dev.model}</span>
                            <span>🧪 {dev.category}</span>
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
                            {dev.autoMatchSample ? '⚡ مفعّلة (تنزيل فوري)' : 'يدوية'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px', borderTop: '1px solid var(--border-color)', marginTop: '2px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>رمز الإقران (API Key):</span>
                          <button
                            onClick={() => copyToClipboard(dev.apiKey)}
                            style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}
                          >
                            {copiedKey === dev.apiKey ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
                            <code>{dev.apiKey?.substring(0, 12)}...</code>
                          </button>
                        </div>
                      </div>

                      {/* Card Stats */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', padding: '0 4px' }}>
                        <span>🔗 الفحوصات المربوطة: <strong style={{ color: 'var(--text-main)' }}>{dev.mappings?.length || 0}</strong></span>
                        <span>⏱️ آخر إشارة: <strong style={{ color: 'var(--text-main)' }}>{dev.lastCommunication ? new Date(dev.lastCommunication).toLocaleTimeString('ar-IQ') : 'لا يوجد'}</strong></span>
                      </div>

                      {/* Card Actions */}
                      <div style={{ display: 'flex', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
                        <button
                          onClick={() => handleOpenMappings(dev)}
                          className="btn-secondary"
                          style={{ flex: 1, padding: '6px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          <Layers size={13} color="var(--accent-cyan)" />
                          <span>ربط الفحوصات ({dev.mappings?.length || 0})</span>
                        </button>
                        <button
                          onClick={() => handleQuickSimulateDevice(dev)}
                          className="btn-primary"
                          style={{ padding: '6px 12px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}
                          title="تشغيل محاكاة في الاستوديو"
                        >
                          <Play size={13} />
                          <span>محاكاة</span>
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

        {/* ========================================================================= */}
        {/* TAB 2: INCOMING RESULTS FEED                                             */}
        {/* ========================================================================= */}
        {activeTab === 'feed' && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={16} color="var(--accent-cyan)" />
                <strong style={{ fontSize: '13.5px', color: 'var(--text-main)' }}>سجل النتائج الواردة من الأجهزة لحظة بلحظة</strong>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>يتم التحديث تلقائياً كل 10 ثوانٍ ⚡</span>
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
                            {new Date(item.createdAt || item.receivedAt || Date.now()).toLocaleTimeString('ar-IQ')}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-main)' }}>
                            {item.deviceName || item.device?.name || 'جهاز خارجي'}
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
                            {item.value || item.resultValue}
                            {item.isCritical && <span style={{ marginRight: '4px', color: '#f87171' }}>⚠️ حرج</span>}
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
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {isApplied ? (
                                <>
                                  <Check size={11} />
                                  <span>نزل بالعينة</span>
                                </>
                              ) : (
                                <span>⏳ معلق</span>
                              )}
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

        {/* ========================================================================= */}
        {/* TAB 3: LOCAL AGENT GUIDE & DOWNLOAD                                      */}
        {/* ========================================================================= */}
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

        {/* ========================================================================= */}
        {/* MODALS                                                                    */}
        {/* ========================================================================= */}

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
                {!editingDeviceId && (
                  <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '10px 12px', borderRadius: '8px' }}>
                    <label style={{ fontSize: '11.5px', color: 'var(--accent-cyan)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      اختر من قوالب الأجهزة الجاهزة (تلقائي الربط):
                    </label>
                    <select value={selectedPresetId} onChange={(e) => handlePresetChange(e.target.value)} className="input-field">
                      <option value="">-- جهاز مخصص / إدخال يدوي --</option>
                      {presets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.brand} {p.model} ({p.category}) - {p.protocol}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>اسم الجهاز التعريفي بالمختبر *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مثال: Mindray BC-5000 (CBC)"
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>الشركة المصنعة (Brand) *</label>
                    <input
                      type="text"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Mindray, Sysmex, Roche..."
                      className="input-field"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>الموديل (Model)</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="BC-5000, Cobas c311..."
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '3px' }}>تصنيف التحاليل</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field">
                      <option value="CBC">صورة الدم الكاملة (CBC / Hematology)</option>
                      <option value="CHEMISTRY">الكيمياء السريرية (Chemistry)</option>
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
                      placeholder="WBC, GLU, CREA..."
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>الفحص المقابل بالنظام</label>
                    <select
                      value={newCatalogId}
                      onChange={(e) => setNewCatalogId(e.target.value)}
                      className="input-field"
                      required
                    >
                      {catalogTests.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.code}) - {t.category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>الوحدة</label>
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
                        <td style={{ padding: '8px 10px', fontWeight: 600, color: 'var(--text-main)' }}>{m.testCatalogName || m.testCatalog?.name || m.testCatalogCode || 'غير معروف'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{m.testCatalog?.category || '-'}</td>
                        <td style={{ padding: '8px 10px', color: 'var(--text-muted)' }}>{m.unit || m.testCatalog?.unit || '-'}</td>
                        <td style={{ padding: '8px 10px' }}>{m.multiplier || 1.0}</td>
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

        {/* MODAL 3: RAW LOGS INSPECTOR */}
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
                        <span style={{ color: log.direction === 'INBOUND' ? '#4ade80' : '#f87171' }}>● {log.direction}</span>
                        <span>{new Date(log.createdAt).toLocaleString('ar-IQ')}</span>
                      </div>
                      <div style={{ color: '#e2e8f0', marginBottom: '4px' }}>{log.summary}</div>
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: 'var(--accent-cyan)' }}>{log.rawPayload}</pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL 4: MANUAL ASSIGN PENDING RESULT */}
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
                  <div>القيمة المستلمة: <strong style={{ color: 'var(--accent-cyan)' }}>{selectedPendingResult.value} {selectedPendingResult.unit}</strong></div>
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

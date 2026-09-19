import { INITIAL_TESTS_CATALOG, INITIAL_PANELS, INITIAL_DOCTORS } from './catalogData';
import { DEVICE_PRESETS, DevicePreset } from './devicePresets';
import { parseDeviceMessage, ParsedAnalyzerMessage, ParsedItem } from './deviceEngine';
import fs from 'fs';
import path from 'path';
import os from 'os';

const DATA_DIR = process.env.LABRYO_DATA_DIR
  ? path.resolve(process.env.LABRYO_DATA_DIR)
  : path.resolve(process.cwd().includes('apps') ? process.cwd() : path.join(process.cwd(), 'apps', 'web'), 'data');
const DATA_FILE = path.join(DATA_DIR, 'lab_store.json');

export function getLocalIpAddress(): string {
  try {
    const interfaces = os.networkInterfaces();
    const fallbackIps: string[] = [];

    for (const name of Object.keys(interfaces)) {
      const lowerName = name.toLowerCase();
      const isVirtual = lowerName.includes('vethernet') || lowerName.includes('virtual') || lowerName.includes('wsl');

      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (!isVirtual && (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.16.'))) {
            return iface.address;
          }
          if (!isVirtual) {
            fallbackIps.unshift(iface.address);
          } else {
            fallbackIps.push(iface.address);
          }
        }
      }
    }

    if (fallbackIps.length > 0) {
      return fallbackIps[0];
    }
  } catch (e) {
    console.warn('[ServerStore] Error detecting local IP:', e);
  }
  return '127.0.0.1';
}

export interface LabSettings {
  labName: string;
  labSubtitle?: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  headerMode: 'DIGITAL' | 'PREPRINTED';
  reportTemplate: 'CLASSIC' | 'MODERN' | 'EXECUTIVE' | 'COMPACT' | 'SPECIALIZED';
  topMarginMm: number; // e.g. 35 for pre-printed letterhead
  bottomMarginMm: number; // e.g. 25
  leftMarginMm: number;
  rightMarginMm: number;
  primaryColor?: string;
  doctorLicense?: string;
  doctorName?: string;
  doctorTitle?: string;
  labLicense?: string;
  whatsappNumber?: string;
  currency?: string;
  reportHeader?: string;
  reportFooter?: string;
  accreditationBadge?: string;
  enableQrCode: boolean;
  qrCodePosition?: 'HEADER' | 'FOOTER';
  defaultDiscountPercent?: number;
  isConfigured?: boolean;
  serverBaseUrl?: string; // Optional custom public URL or specific LAN address

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
}

export interface LicenseStore {
  isActivated: boolean;
  hardwareId: string;
  licenseKey?: string;
  tier?: 'TRIAL' | 'MONTHLY' | 'YEARLY' | 'LIFETIME';
  expiryDate?: string;
  activatedAt?: string;
  labName?: string;
  firstRunDate?: string;
  trialExpiresAt?: string;
  lastClockCheck?: string;
}

export interface PatientRecord {
  id: string;
  name: string;
  phone?: string;
  age?: number | null;
  gender: 'MALE' | 'FEMALE';
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}


export interface DoctorRecord {
  id: string;
  name: string;
  phone?: string;
  specialty?: string;
  commissionPercent: number;
  clinicAddress?: string;
  notes?: string;
  createdAt?: string;
}

export interface SampleTestRecord {
  id: string;
  sampleId: string;
  testId: string;
  test: any;
  resultValue?: string | null;
  isAbnormal?: boolean;
  interpretation?: string | null;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  notes?: string;
  completedAt?: string;
  [key: string]: any;
}

export interface CriticalCallLog {
  id: string;
  sampleId: string;
  testName: string;
  resultValue: string;
  physicianName: string;
  physicianPhone?: string;
  callerName: string;
  calledAt: string;
  readBackConfirmed: boolean;
  actionTaken?: string;
  notes?: string;
}

export interface SampleRecord {
  id: string;
  sampleNumber: number;
  patientId: string;
  patient: PatientRecord;
  doctorId?: string | null;
  doctor?: DoctorRecord | null;
  doctorCommission?: number;
  status: 'RECEIVED' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'REJECTED';
  isUrgent: boolean;
  priceTotal: number;
  discount: number;
  discountPercent: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: 'CASH' | 'DEBT' | 'CARD';
  notes?: string;
  rejectionReason?: string | null;
  rejectionNotes?: string | null;
  rejectedAt?: string | null;
  rejectedBy?: string | null;
  criticalCallLogs?: CriticalCallLog[];
  createdAt: string;
  tests: SampleTestRecord[];
}

export interface ExpenseRecord {
  id: string;
  description: string;
  amount: number;
  category: string;
  createdAt: string;
  date?: string;
  staff?: { name: string };
}

export interface DeviceMappingRecord {
  id: string;
  deviceId: string;
  deviceTestCode: string;
  deviceTestName: string;
  testCatalogId: string;
  testCatalogCode?: string;
  testCatalogName?: string;
  unit?: string;
  multiplier?: number;
  createdAt: string;
}

export interface DeviceRecord {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: 'CBC' | 'CHEMISTRY' | 'IMMUNOLOGY' | 'URINE' | 'ELECTROLYTES' | 'OTHER';
  connectionType: 'TCP_IP' | 'SERIAL_PORT' | 'FILE_WATCHER';
  protocol: 'ASTM_1394' | 'HL7_V2' | 'CSV_DELIMITED' | 'CUSTOM_TEXT';
  ipAddress?: string | null;
  port?: number | null;
  comPort?: string | null;
  baudRate?: number | null;
  dataBits?: number | null;
  stopBits?: number | null;
  parity?: string | null;
  apiKey: string;
  status: 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR';
  autoMatchSample: boolean;
  notes?: string;
  lastCommunication?: string;
  mappings: DeviceMappingRecord[];
  createdAt: string;
}

export interface IncomingResultRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  protocol: string;
  sampleBarcode?: string;
  sampleNumber?: number;
  patientName?: string;
  testCode: string;
  testName?: string;
  value: string;
  unit?: string;
  flags?: string;
  isAbnormal: boolean;
  status: 'APPLIED' | 'PENDING' | 'REJECTED' | 'UNMATCHED';
  matchedSampleId?: string;
  matchedSampleNumber?: number;
  matchedTestCatalogId?: string;
  appliedAt?: string;
  createdAt: string;
}

export interface DeviceRawLogRecord {
  id: string;
  deviceId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  protocol: string;
  rawPayload: string;
  summary: string;
  parsedCount: number;
  createdAt: string;
}

export interface ServerStore {
  tests: any[];
  panels: any[];
  doctors: DoctorRecord[];
  patients: PatientRecord[];
  samples: SampleRecord[];
  expenses: ExpenseRecord[];
  settings: LabSettings;
  license?: LicenseStore;
  devices?: DeviceRecord[];
  deviceMappings?: DeviceMappingRecord[];
  incomingResults?: IncomingResultRecord[];
  deviceRawLogs?: DeviceRawLogRecord[];
}

export function getInitialDevices(): DeviceRecord[] {
  const now = new Date().toISOString();
  
  // 1. Mindray BC-5000 (CBC)
  const mindrayPreset = DEVICE_PRESETS.find(p => p.id === 'mindray_bc5000');
  const mindrayMappings: DeviceMappingRecord[] = (mindrayPreset?.defaultMappings || []).map((m, idx) => ({
    id: `map-bc5000-${idx + 1}`,
    deviceId: 'dev-mindray-bc5000',
    deviceTestCode: m.deviceTestCode,
    deviceTestName: m.deviceTestName,
    testCatalogId: m.testCatalogCode === 'HB' ? 't-hb' : (m.testCatalogCode === 'PLT' ? 't-plt' : 't-cbc'),
    testCatalogCode: m.testCatalogCode,
    testCatalogName: m.testCatalogName,
    unit: m.unit,
    multiplier: 1.0,
    createdAt: now,
  }));

  const devMindray: DeviceRecord = {
    id: 'dev-mindray-bc5000',
    name: 'Mindray BC-5000 (5-Part CBC)',
    brand: 'Mindray',
    model: 'BC-5000 Auto Hematology',
    category: 'CBC',
    connectionType: 'TCP_IP',
    protocol: 'HL7_V2',
    ipAddress: '192.168.1.150',
    port: 5100,
    apiKey: 'dev_mindray_bc5000_live',
    status: 'ONLINE',
    autoMatchSample: true,
    notes: 'موصول عبر كابل شبكة LAN مخصص - بروتوكول HL7 v2.3.1 السريع مع تفريق خماسي كريات الدم',
    lastCommunication: now,
    mappings: mindrayMappings,
    createdAt: now,
  };

  // 2. Roche Cobas c311 (Chemistry)
  const cobasPreset = DEVICE_PRESETS.find(p => p.id === 'roche_cobas_c111');
  const cobasMappings: DeviceMappingRecord[] = (cobasPreset?.defaultMappings || []).map((m, idx) => {
    let catId = 't-fbs';
    if (m.deviceTestCode.includes('UREA')) catId = 't-urea';
    else if (m.deviceTestCode.includes('CRE')) catId = 't-creat';
    else if (m.deviceTestCode.includes('ALT')) catId = 't-gpt';
    else if (m.deviceTestCode.includes('AST')) catId = 't-got';
    else if (m.deviceTestCode.includes('CHOL')) catId = 't-chol';
    else if (m.deviceTestCode.includes('TRIG')) catId = 't-tg';
    else if (m.deviceTestCode.includes('ALB')) catId = 't-alb';

    return {
      id: `map-cobas-${idx + 1}`,
      deviceId: 'dev-roche-cobas-c311',
      deviceTestCode: m.deviceTestCode,
      deviceTestName: m.deviceTestName,
      testCatalogId: catId,
      testCatalogCode: m.testCatalogCode,
      testCatalogName: m.testCatalogName,
      unit: m.unit,
      multiplier: 1.0,
      createdAt: now,
    };
  });

  const devCobas: DeviceRecord = {
    id: 'dev-roche-cobas-c311',
    name: 'Roche Cobas c311 (Clinical Chemistry)',
    brand: 'Roche Diagnostics',
    model: 'Cobas c311 Auto Analyzer',
    category: 'CHEMISTRY',
    connectionType: 'SERIAL_PORT',
    protocol: 'ASTM_1394',
    comPort: 'COM1',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    apiKey: 'dev_roche_cobas311_live',
    status: 'ONLINE',
    autoMatchSample: true,
    notes: 'موصول عبر كابل سيريال تسلسلي RS-232 COM1 - بروتوكول ASTM E1381/E1394 القياسي لكيمياء الدم',
    lastCommunication: now,
    mappings: cobasMappings,
    createdAt: now,
  };

  // 3. Biolyte 2000 (Electrolytes)
  const bioPreset = DEVICE_PRESETS.find(p => p.id === 'biolyte_2000');
  const bioMappings: DeviceMappingRecord[] = (bioPreset?.defaultMappings || []).map((m, idx) => {
    let catId = 't-na';
    if (m.deviceTestCode === 'K') catId = 't-k';
    else if (m.deviceTestCode === 'Cl') catId = 't-cl';

    return {
      id: `map-biolyte-${idx + 1}`,
      deviceId: 'dev-biolyte-2000',
      deviceTestCode: m.deviceTestCode,
      deviceTestName: m.deviceTestName,
      testCatalogId: catId,
      testCatalogCode: m.testCatalogCode,
      testCatalogName: m.testCatalogName,
      unit: m.unit,
      multiplier: 1.0,
      createdAt: now,
    };
  });

  const devBiolyte: DeviceRecord = {
    id: 'dev-biolyte-2000',
    name: 'Biolyte 2000 (Electrolytes ISE)',
    brand: 'Biolyte',
    model: 'Biolyte 2000 ISE Analyzer',
    category: 'ELECTROLYTES',
    connectionType: 'SERIAL_PORT',
    protocol: 'ASTM_1394',
    comPort: 'COM2',
    baudRate: 9600,
    dataBits: 8,
    stopBits: 1,
    parity: 'none',
    apiKey: 'dev_biolyte_2000_live',
    status: 'ONLINE',
    autoMatchSample: true,
    notes: 'محلل شوارد وأملاح الدم الإلكترولايتية (الصوديوم، البوتاسيوم، والكلورايد) عبر COM2',
    lastCommunication: now,
    mappings: bioMappings,
    createdAt: now,
  };

  return [devMindray, devCobas, devBiolyte];
}

declare global {
  var __labStore: ServerStore | undefined;
}

function initStore(): ServerStore {
  return {
    tests: INITIAL_TESTS_CATALOG,
    panels: INITIAL_PANELS,
    doctors: [],
    patients: [],
    samples: [],
    expenses: [],
    settings: {
      labName: '',
      labSubtitle: 'فحوصات مرضية وتطبيقية دقيقة - تشخيص إلكتروني متكامل ومعتمد',
      doctorName: '',
      doctorTitle: 'استشاري التحليلات المرضية والمناعة السريرية',
      doctorLicense: '',
      labLicense: '',
      whatsappNumber: '',
      currency: 'د.ع',
      address: '',
      phone: '',
      reportHeader: '',
      reportFooter: 'هذا التقرير تم إخراجه وتدقيقه إلكترونياً، ويعتبر معتمداً رسمياً ومطابقاً لمواصفات الجودة المخبرية الدولية (ISO 15189).',
      headerMode: 'DIGITAL',
      reportTemplate: 'CLASSIC',
      topMarginMm: 35,
      bottomMarginMm: 25,
      leftMarginMm: 15,
      rightMarginMm: 15,
      primaryColor: '#0284c7',
      accreditationBadge: 'ISO 15189 CERTIFIED',
      enableQrCode: true,
      qrCodePosition: 'FOOTER',
      defaultDiscountPercent: 0,
      isConfigured: false,
      serverBaseUrl: '',
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
    },
    license: undefined,
    devices: getInitialDevices(),
    incomingResults: [],
    deviceRawLogs: [],
  };
}

const BACKUP_DIR = path.join(DATA_DIR, 'backups');

// Atomic write to prevent file corruption on sudden power outages
export function saveStoreToFile(): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    if (global.__labStore) {
      const payload = JSON.stringify(global.__labStore, null, 2);
      const tempFile = `${DATA_FILE}.tmp`;
      const bakFile = `${DATA_FILE}.bak`;

      // 1. Write to temporary file first
      fs.writeFileSync(tempFile, payload, 'utf-8');

      // 2. Keep previous working copy as .bak
      if (fs.existsSync(DATA_FILE)) {
        try {
          fs.copyFileSync(DATA_FILE, bakFile);
        } catch {}
      }

      // 3. Atomically replace data file
      fs.renameSync(tempFile, DATA_FILE);

      // 4. Auto Daily Snapshot Rotation (keep max 30 snapshots)
      rotateDailySnapshot(payload);
    }
  } catch (err) {
    console.error('[ServerStore] Failed to save store to file:', err);
  }
}

// Helper: automatic daily snapshot rotation
function rotateDailySnapshot(payload: string) {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySnapshot = path.join(BACKUP_DIR, `auto_snapshot_${todayStr}.json`);

    if (!fs.existsSync(todaySnapshot)) {
      fs.writeFileSync(todaySnapshot, payload, 'utf-8');
      console.log(`[ServerStore] Daily auto-snapshot created: ${todaySnapshot}`);

      // Prune snapshots if count > 30
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          name: f,
          path: path.join(BACKUP_DIR, f),
          time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      if (files.length > 30) {
        files.slice(30).forEach(f => {
          try { fs.unlinkSync(f.path); } catch {}
        });
      }
    }
  } catch (e) {
    console.warn('[ServerStore] Snapshot rotation warning:', e);
  }
}

// Multi-layered recovery: Primary -> .bak -> Backups folder -> Never wipe data
export function loadStoreFromFile(): ServerStore | null {
  // Step 1: Try reading primary DATA_FILE
  if (fs.existsSync(DATA_FILE)) {
    try {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      if (content && content.trim().length > 0) {
        const parsed = JSON.parse(content);
        if (parsed && Array.isArray(parsed.patients) && Array.isArray(parsed.samples)) {
          if (!Array.isArray(parsed.expenses)) parsed.expenses = [];
          return parsed;
        }
      }
    } catch (err: any) {
      console.error('[ServerStore] Primary DATA_FILE corrupted! Initiating emergency recovery...', err?.message);
      try {
        const corruptArchive = path.join(DATA_DIR, `lab_store_corrupt_${Date.now()}.json`);
        fs.copyFileSync(DATA_FILE, corruptArchive);
        console.log(`[ServerStore] Corrupted file preserved at: ${corruptArchive}`);
      } catch {}
    }
  }

  // Step 2: Emergency fallback to .bak file
  const bakFile = `${DATA_FILE}.bak`;
  if (fs.existsSync(bakFile)) {
    try {
      console.warn('[ServerStore] Attempting restore from .bak file...');
      const bakContent = fs.readFileSync(bakFile, 'utf-8');
      const parsed = JSON.parse(bakContent);
      if (parsed && Array.isArray(parsed.patients) && Array.isArray(parsed.samples)) {
        if (!Array.isArray(parsed.expenses)) parsed.expenses = [];
        fs.writeFileSync(DATA_FILE, bakContent, 'utf-8');
        console.log('[ServerStore] Successfully recovered database from .bak!');
        return parsed;
      }
    } catch (e) {}
  }

  // Step 3: Emergency fallback to latest snapshot in backups/
  if (fs.existsSync(BACKUP_DIR)) {
    try {
      const snapshots = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => ({
          path: path.join(BACKUP_DIR, f),
          time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      for (const snap of snapshots) {
        try {
          const snapContent = fs.readFileSync(snap.path, 'utf-8');
          const parsed = JSON.parse(snapContent);
          if (parsed && Array.isArray(parsed.patients) && Array.isArray(parsed.samples)) {
            if (!Array.isArray(parsed.expenses)) parsed.expenses = [];
            fs.writeFileSync(DATA_FILE, snapContent, 'utf-8');
            console.log(`[ServerStore] Successfully recovered database from snapshot: ${snap.path}`);
            return parsed;
          }
        } catch {}
      }
    } catch (e) {}
  }

  return null;
}

export function getStore(): ServerStore {
  if (!global.__labStore) {
    const fromFile = loadStoreFromFile();
    if (fromFile) {
      if (fromFile.settings) {
        if (fromFile.settings.labName && fromFile.settings.labName.trim().length > 0) {
          fromFile.settings.isConfigured = true;
        }
      }
      global.__labStore = fromFile;
    } else {
      global.__labStore = initStore();
      saveStoreToFile();
    }
  }
  if (!Array.isArray(global.__labStore.expenses)) {
    global.__labStore.expenses = [];
  }
  if (!Array.isArray(global.__labStore.devices) || global.__labStore.devices.length === 0) {
    global.__labStore.devices = getInitialDevices();
  }
  if (!Array.isArray(global.__labStore.incomingResults)) {
    global.__labStore.incomingResults = [];
  }
  if (!Array.isArray(global.__labStore.deviceRawLogs)) {
    global.__labStore.deviceRawLogs = [];
  }

  // Ensure all tests from INITIAL_TESTS_CATALOG are present in tests catalog
  const currentStore = global.__labStore;
  if (currentStore && Array.isArray(currentStore.tests)) {
    let storeUpdated = false;
    INITIAL_TESTS_CATALOG.forEach(catalogItem => {
      const found = currentStore.tests.find((t: any) => t.code === catalogItem.code || t.id === catalogItem.id);
      if (!found) {
        currentStore.tests.push(catalogItem);
        storeUpdated = true;
      } else if (catalogItem.loincCode && !found.loincCode) {
        found.loincCode = catalogItem.loincCode;
        storeUpdated = true;
      }
    });

    // Ensure all standard diagnostic panels are present
    if (Array.isArray(currentStore.panels)) {
      INITIAL_PANELS.forEach(panelItem => {
        const foundPanel = currentStore.panels.find((p: any) => p.id === panelItem.id);
        if (!foundPanel) {
          currentStore.panels.push(panelItem);
          storeUpdated = true;
        }
      });
    }

    if (storeUpdated) {
      saveStoreToFile();
    }
  }

  return global.__labStore!;
}

// -------------------------------------------------------------
// Backup & Restore Engine
// -------------------------------------------------------------

export function createBackupSnapshot(label?: string): string {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  const store = getStore();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const cleanLabel = label ? `_${label.replace(/[^a-zA-Z0-9_-]/g, '')}` : '';
  const fileName = `manual_backup_${timestamp}${cleanLabel}.json`;
  const destPath = path.join(BACKUP_DIR, fileName);

  const payload = JSON.stringify(store, null, 2);
  fs.writeFileSync(destPath, payload, 'utf-8');
  return fileName;
}

export function listBackupSnapshots() {
  if (!fs.existsSync(BACKUP_DIR)) {
    return [];
  }
  return fs.readdirSync(BACKUP_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const fullPath = path.join(BACKUP_DIR, f);
      const stat = fs.statSync(fullPath);
      return {
        fileName: f,
        sizeBytes: stat.size,
        createdAt: stat.mtime.toISOString(),
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function restoreBackupFromFile(jsonContent: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonContent);
    if (!parsed || !Array.isArray(parsed.patients) || !Array.isArray(parsed.samples) || !parsed.settings) {
      return { success: false, message: 'ملف النسخة الاحتياطية غير صالح أو بنيته غير مطابقة للنظام' };
    }

    // Safety snapshot of current state before overwrite
    createBackupSnapshot('pre_restore_safety');

    // Apply restored store
    global.__labStore = parsed;
    saveStoreToFile();

    return {
      success: true,
      message: `تم استعادة النسخة الاحتياطية بنجاح! تم استرجاع (${parsed.patients.length}) مريض و(${parsed.samples.length}) عينة فحص.`,
    };
  } catch (err: any) {
    return { success: false, message: 'فشل استرجاع النسخة الاحتياطية: ' + (err?.message || 'خطأ غير معروف') };
  }
}

// -------------------------------------------------------------
// License Store Helpers
// -------------------------------------------------------------

export function getLicenseStore(): LicenseStore | null {
  const store = getStore();
  return store.license || null;
}

export function updateLicenseStore(lic: Partial<LicenseStore>): LicenseStore {
  const store = getStore();
  const current = store.license || {
    isActivated: false,
    hardwareId: '',
  };
  const updated: LicenseStore = {
    ...current,
    ...lic,
  };
  store.license = updated;
  saveStoreToFile();
  return updated;
}


// -------------------------------------------------------------
// Patients CRUD Helpers
// -------------------------------------------------------------

export function findPatient(idOrPhone: string): PatientRecord | undefined {
  const store = getStore();
  return store.patients.find(p => p.id === idOrPhone || p.phone === idOrPhone);
}

export function addPatient(data: Partial<PatientRecord> & { name: string; gender?: 'MALE' | 'FEMALE' }): PatientRecord {
  const store = getStore();
  const newPatient: PatientRecord = {
    id: data.id || `pat-${Date.now()}`,
    name: data.name.trim(),
    phone: data.phone?.trim() || '',
    age: data.age !== undefined && data.age !== null ? Number(data.age) : null,
    gender: data.gender || 'MALE',
    address: data.address || '',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.patients.unshift(newPatient);
  saveStoreToFile();
  return newPatient;
}

export function updatePatient(id: string, data: Partial<PatientRecord>): PatientRecord | null {
  const store = getStore();
  const index = store.patients.findIndex(p => p.id === id);
  if (index === -1) return null;
  const updated: PatientRecord = {
    ...store.patients[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  store.patients[index] = updated;

  // Also sync in-memory patient in existing samples
  store.samples.forEach(s => {
    if (s.patientId === id) {
      s.patient = { ...s.patient, ...updated };
    }
  });

  saveStoreToFile();
  return updated;
}

export function deletePatient(id: string): boolean {
  const store = getStore();
  const index = store.patients.findIndex(p => p.id === id);
  if (index === -1) return false;
  store.patients.splice(index, 1);
  saveStoreToFile();
  return true;
}

export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .replace(/[أإآء]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[\u064B-\u065F]/g, '') // remove Arabic diacritics / tashkeel
    .toLowerCase()
    .trim();
}

export function searchPatients(q: string) {
  const store = getStore();
  const query = (q || '').trim().toLowerCase();
  const normQ = normalizeArabic(query);

  // If query is empty or less than 2 chars, NEVER return all patients; return empty array
  if (!query || query.length < 2) {
    return [];
  }

  const queryDigits = query.replace(/[^0-9]/g, '');

  const matched = store.patients.filter(p => {
    const normName = normalizeArabic(p.name || '');
    const rawName = (p.name || '').toLowerCase();

    // Match name (either normalized Arabic or raw text)
    const nameMatch = normName.includes(normQ) || rawName.includes(query);

    // Match phone only if the query has at least 3 digits
    const phoneDigits = (p.phone || '').replace(/[^0-9]/g, '');
    const phoneMatch = queryDigits.length >= 3 && phoneDigits.includes(queryDigits);

    // ID match ONLY if user typed 'pat-' or explicit exact ID
    const idMatch = query.startsWith('pat-') && (p.id?.toLowerCase().includes(query) || false);

    return nameMatch || phoneMatch || idMatch;
  });

  // Sort strictly by relevance:
  // 1. Name starts with query
  // 2. Sub-words start with query
  // 3. Alphabetical
  matched.sort((a, b) => {
    const normA = normalizeArabic(a.name || '');
    const normB = normalizeArabic(b.name || '');
    const aStarts = normA.startsWith(normQ);
    const bStarts = normB.startsWith(normQ);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    const aWord = normA.split(/\s+/).some(w => w.startsWith(normQ));
    const bWord = normB.split(/\s+/).some(w => w.startsWith(normQ));
    if (aWord && !bWord) return -1;
    if (!aWord && bWord) return 1;

    return normA.localeCompare(normB);
  });

  // Limit suggestions to max 7 most relevant patients
  const topMatches = matched.slice(0, 7);

  return topMatches.map(p => {
    // Find all samples for this patient
    const patientSamples = store.samples
      .filter(s => s.patientId === p.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalBilled = patientSamples.reduce((sum, s) => sum + (s.priceTotal - (s.discount || 0)), 0);
    const totalPaid = patientSamples.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const outstandingDebt = patientSamples.reduce((sum, s) => sum + (s.remainingAmount || 0), 0);

    const lastVisit = patientSamples[0] || null;
    const lastTestIds = lastVisit ? lastVisit.tests.map(t => t.testId) : [];
    const lastTestNames = lastVisit ? lastVisit.tests.map(t => t.test?.name || t.test?.code || t.testId) : [];

    // Extract abnormal flags across past tests
    const abnormalList: string[] = [];
    patientSamples.forEach(s => {
      s.tests.forEach(t => {
        if (t.isAbnormal) {
          const testName = t.test?.name || t.test?.code || 'Test';
          abnormalList.push(`${testName} (${t.resultValue || 'Abnormal'})`);
        }
      });
    });

    return {
      ...p,
      visitCount: patientSamples.length,
      priorVisits: patientSamples.slice(0, 5).map(s => ({
        id: s.id,
        sampleNumber: s.sampleNumber,
        status: s.status,
        createdAt: s.createdAt,
        priceTotal: s.priceTotal,
        discount: s.discount,
        paidAmount: s.paidAmount,
        remainingAmount: s.remainingAmount,
        isUrgent: s.isUrgent,
        testsCount: s.tests.length,
        testsSummary: s.tests.map(t => t.test?.code || t.test?.name).join(', '),
      })),
      lastVisit: lastVisit ? {
        id: lastVisit.id,
        sampleNumber: lastVisit.sampleNumber,
        createdAt: lastVisit.createdAt,
        status: lastVisit.status,
      } : null,
      lastTestIds,
      lastTestNames,
      abnormalFlags: Array.from(new Set(abnormalList)),
      outstandingDebt: Math.max(0, outstandingDebt),
      totalBilled,
      totalPaid,
    };
  });
}

// -------------------------------------------------------------
// Doctors CRUD Helpers
// -------------------------------------------------------------

export function getDoctors(): DoctorRecord[] {
  return getStore().doctors;
}

export function findDoctor(id: string): DoctorRecord | undefined {
  return getStore().doctors.find(d => d.id === id);
}

export function addDoctor(data: Partial<DoctorRecord> & { name: string }): DoctorRecord {
  const store = getStore();
  const newDoctor: DoctorRecord = {
    id: data.id || `doc-${Date.now()}`,
    name: data.name.trim(),
    phone: data.phone?.trim() || '',
    specialty: data.specialty?.trim() || 'General Medicine',
    commissionPercent: typeof data.commissionPercent === 'number' ? data.commissionPercent : 10,
    clinicAddress: data.clinicAddress?.trim() || '',
    notes: data.notes?.trim() || '',
    createdAt: new Date().toISOString(),
  };
  store.doctors.push(newDoctor);
  saveStoreToFile();
  return newDoctor;
}

export function updateDoctor(id: string, data: Partial<DoctorRecord>): DoctorRecord | null {
  const store = getStore();
  const index = store.doctors.findIndex(d => d.id === id);
  if (index === -1) return null;
  const updated: DoctorRecord = {
    ...store.doctors[index],
    ...data,
  };
  store.doctors[index] = updated;

  // Also update in-memory samples referencing this doctor
  store.samples.forEach(s => {
    if (s.doctorId === id) {
      s.doctor = updated;
    }
  });

  saveStoreToFile();
  return updated;
}

export function deleteDoctor(id: string): boolean {
  const store = getStore();
  const index = store.doctors.findIndex(d => d.id === id);
  if (index === -1) return false;
  store.doctors.splice(index, 1);
  saveStoreToFile();
  return true;
}

// -------------------------------------------------------------
// Samples CRUD Helpers
// -------------------------------------------------------------

export function getSamples(): SampleRecord[] {
  return getStore().samples;
}

export function findSample(idOrNumber: string): SampleRecord | undefined {
  const store = getStore();
  return store.samples.find(s => s.id === idOrNumber || String(s.sampleNumber) === idOrNumber);
}

export function addSample(data: any): SampleRecord {
  const store = getStore();

  const candidateName = (data.patientName || data.name || '').trim();
  const normCandidateName = normalizeArabic(candidateName);
  const testIds: string[] = data.testIds || (data.tests ? data.tests.map((t: any) => t.id || t.testId) : []);
  const sortedTestIds = [...testIds].sort().join(',');

  // Duplicate Prevention Check (Protection Window: 3 minutes = 180,000 ms)
  if (!data.forceDuplicate) {
    const now = Date.now();
    const duplicate = store.samples.find(s => {
      const createdTime = new Date(s.createdAt).getTime();
      const diffMs = now - createdTime;
      if (isNaN(diffMs) || diffMs > 180000) return false;

      // Same patient check: either patientId matches or normalized name matches
      const samePatientId = data.patientId && s.patientId === data.patientId;
      const samePatientName = normCandidateName && normalizeArabic(s.patient?.name || '') === normCandidateName;
      if (!samePatientId && !samePatientName) return false;

      // Same tests check
      const sTestIds = (s.tests || []).map(t => t.testId).sort().join(',');
      return sTestIds === sortedTestIds;
    });

    if (duplicate) {
      const err: any = new Error(
        `تم تسجيل هذا المريض للتو (عينة رقم #${duplicate.sampleNumber}) بنفس الفحوصات قبل أقل من 3 دقائق. تم تفعيل نظام الحماية لمنع التكرار العرضي.`
      );
      err.code = 'DUPLICATE_ENTRY';
      err.duplicateSampleNumber = duplicate.sampleNumber;
      throw err;
    }
  }

  let patient = store.patients.find(p => p.id === data.patientId);
  if (!patient && candidateName) {
    patient = store.patients.find(p => {
      const matchName = normalizeArabic(p.name) === normCandidateName;
      const cleanPhone1 = (p.phone || '').replace(/[^0-9]/g, '');
      const cleanPhone2 = (data.patientPhone || data.phone || '').replace(/[^0-9]/g, '');
      if (cleanPhone1 && cleanPhone2) {
        return matchName && cleanPhone1 === cleanPhone2;
      }
      return matchName;
    });
  }

  if (!patient) {
    patient = addPatient({
      name: candidateName || 'مريض جديد',
      phone: data.patientPhone || data.phone || '',
      age: data.patientAge ? Number(data.patientAge) : (data.age ? Number(data.age) : null),
      gender: data.patientGender || data.gender || 'MALE',
    });
  }

  const sampleNum = store.samples.length > 0
    ? Math.max(...store.samples.map(s => s.sampleNumber || 1000)) + 1
    : 1001;

  const sampleTests: SampleTestRecord[] = testIds.map((tId, idx) => {
    const catalogTest = store.tests.find(t => t.id === tId || t.code === tId) || store.tests[0];
    return {
      id: `st-${Date.now()}-${idx}`,
      sampleId: `s-${sampleNum}`,
      testId: catalogTest.id,
      test: catalogTest,
      resultValue: null,
      isAbnormal: false,
      status: 'PENDING',
    };
  });

  const doctor = data.doctorId ? store.doctors.find(d => d.id === data.doctorId) || null : null;
  const priceTotal = Number(data.priceTotal || data.totalPrice || 0);
  const discount = Number(data.discount || 0);
  const discountPercent = Number(data.discountPercent || 0);
  const paidAmount = Number(data.paidAmount || 0);
  const netPayable = Math.max(0, priceTotal - discount);
  const remainingAmount = data.remainingAmount !== undefined ? Number(data.remainingAmount) : Math.max(0, netPayable - paidAmount);

  // Commission calculation
  const commissionPercent = doctor ? (doctor.commissionPercent || 0) : 0;
  const doctorCommission = doctor ? Math.round((netTotalCommissionBase(priceTotal, discount) * commissionPercent) / 100) : 0;

  const newSample: SampleRecord = {
    id: `s-${sampleNum}`,
    sampleNumber: sampleNum,
    patientId: patient.id,
    patient,
    doctorId: data.doctorId || null,
    doctor,
    doctorCommission,
    status: 'RECEIVED',
    isUrgent: !!data.isUrgent,
    priceTotal,
    discount,
    discountPercent,
    paidAmount,
    remainingAmount,
    paymentMethod: data.paymentMethod || 'CASH',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
    tests: sampleTests,
  };

  store.samples.unshift(newSample);
  saveStoreToFile();
  return newSample;
}

function netTotalCommissionBase(priceTotal: number, discount: number): number {
  return Math.max(0, priceTotal - discount);
}

export function updateSample(id: string, data: Partial<SampleRecord>): SampleRecord | null {
  const store = getStore();
  const index = store.samples.findIndex(s => s.id === id || String(s.sampleNumber) === id);
  if (index === -1) return null;

  const updated: SampleRecord = {
    ...store.samples[index],
    ...data,
  };
  store.samples[index] = updated;
  saveStoreToFile();
  return updated;
}

export function deleteSample(id: string): boolean {
  const store = getStore();
  const index = store.samples.findIndex(s => s.id === id || String(s.sampleNumber) === id);
  if (index === -1) return false;
  store.samples.splice(index, 1);
  saveStoreToFile();
  return true;
}

// -------------------------------------------------------------
// Settings Helper & Margin Safety Clamping
// -------------------------------------------------------------

export function clampMargin(val: any, min = 0, max = 100, defaultVal = 10): number {
  if (val === null || val === undefined) return defaultVal;
  const num = typeof val === 'number' ? val : parseFloat(String(val));
  if (isNaN(num) || !isFinite(num)) return defaultVal;
  return Math.min(max, Math.max(min, num));
}

export function getSettings(): LabSettings {
  return getStore().settings;
}

export function updateSettings(data: Partial<LabSettings>): LabSettings {
  const store = getStore();
  const sanitized = { ...data };
  if (sanitized.topMarginMm !== undefined) {
    sanitized.topMarginMm = clampMargin(sanitized.topMarginMm, 0, 100, 35);
  }
  if (sanitized.bottomMarginMm !== undefined) {
    sanitized.bottomMarginMm = clampMargin(sanitized.bottomMarginMm, 0, 100, 25);
  }
  if (sanitized.leftMarginMm !== undefined) {
    sanitized.leftMarginMm = clampMargin(sanitized.leftMarginMm, 0, 50, 15);
  }
  if (sanitized.rightMarginMm !== undefined) {
    sanitized.rightMarginMm = clampMargin(sanitized.rightMarginMm, 0, 50, 15);
  }
  const hasLabName = Boolean((sanitized.labName || store.settings.labName)?.trim());
  const finalConfigured = sanitized.isConfigured ?? (store.settings.isConfigured || hasLabName);

  store.settings = {
    ...store.settings,
    ...sanitized,
    isConfigured: finalConfigured,
  };
  saveStoreToFile();
  return store.settings;
}

// -------------------------------------------------------------
// Expenses & Financials Helpers
// -------------------------------------------------------------

export function addExpense(data: { description: string; amount: number; category?: string; staffName?: string }): ExpenseRecord {
  const store = getStore();
  const now = new Date().toISOString();
  const newExp: ExpenseRecord = {
    id: 'exp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    description: data.description.trim(),
    amount: Number(data.amount),
    category: data.category || 'مصاريف تشغيلية',
    createdAt: now,
    date: now,
    staff: { name: data.staffName || 'مدير المختبر' },
  };
  store.expenses = [newExp, ...(store.expenses || [])];
  saveStoreToFile();
  return newExp;
}

export function deleteExpense(id: string): boolean {
  const store = getStore();
  const initialLen = store.expenses.length;
  store.expenses = store.expenses.filter((e) => e.id !== id);
  if (store.expenses.length !== initialLen) {
    saveStoreToFile();
    return true;
  }
  return false;
}

export function getFinancialSummary() {
  const store = getStore();
  const samples = store.samples || [];
  const expenses = store.expenses || [];

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  let totalGrossRevenue = 0;
  let totalPaid = 0;
  let totalDiscounts = 0;
  let totalRemainingDebts = 0;
  let todayRevenue = 0;
  let totalDoctorCommissions = 0;

  samples.forEach((s) => {
    totalGrossRevenue += s.priceTotal || 0;
    totalPaid += s.paidAmount || 0;
    totalDiscounts += s.discount || 0;
    totalRemainingDebts += s.remainingAmount || 0;
    totalDoctorCommissions += s.doctorCommission || 0;

    const t = new Date(s.createdAt).getTime();
    if (t >= todayStart && t <= todayEnd) {
      todayRevenue += s.paidAmount || 0;
    }
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netProfit = totalPaid - (totalExpenses + totalDoctorCommissions);

  return {
    totalRevenue: totalGrossRevenue,
    totalPaid,
    totalExpenses,
    totalDoctorCommissions,
    netProfit,
    todayRevenue,
    totalDiscounts,
    totalRemainingDebts,
    recentExpenses: expenses.slice(0, 8),
    expensesList: expenses,
    autoRevenues: {
      samplePaidTotal: totalPaid,
      debtPaymentsTotal: 0,
      totalRevenues: totalPaid,
      sampleRemainingDebts: totalRemainingDebts,
    },
    outgoings: {
      operationalExpenses: totalExpenses,
      doctorCommissions: totalDoctorCommissions,
      inventoryStockCost: 0,
      totalTestCosts: 0,
      totalOutgoings: totalExpenses + totalDoctorCommissions,
    },
  };
}

export function getTestProfitability(timeframe?: string) {
  const store = getStore();
  const samples = store.samples || [];
  const catalogTests = store.tests || [];

  const now = new Date();
  let startTime: number | null = null;

  if (timeframe === 'today') {
    startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  } else if (timeframe === 'week') {
    startTime = now.getTime() - 7 * 86400000;
  } else if (timeframe === 'month') {
    startTime = now.getTime() - 30 * 86400000;
  }

  const testMap: Record<string, { count: number; totalRevenue: number; totalCost: number }> = {};

  samples.forEach((s) => {
    const sTime = new Date(s.createdAt).getTime();
    if (startTime && sTime < startTime) return;

    (s.tests || []).forEach((st) => {
      const tid = st.testId || st.test?.id;
      if (!tid) return;
      if (!testMap[tid]) {
        testMap[tid] = { count: 0, totalRevenue: 0, totalCost: 0 };
      }
      const unitPrice = st.test?.price || 0;
      const unitCost = st.test?.costEstimate || (unitPrice * 0.25);
      testMap[tid].count += 1;
      testMap[tid].totalRevenue += unitPrice;
      testMap[tid].totalCost += unitCost;
    });
  });

  const breakdown = catalogTests.map((ct) => {
    const stats = testMap[ct.id] || { count: 0, totalRevenue: 0, totalCost: 0 };
    const unitPrice = ct.price || 0;
    const unitCost = ct.costEstimate || Math.round(unitPrice * 0.25);
    const unitProfit = unitPrice - unitCost;
    const profitMargin = unitPrice > 0 ? Math.round((unitProfit / unitPrice) * 100) : 0;
    const totalProfit = stats.totalRevenue - stats.totalCost;

    return {
      testId: ct.id,
      testName: ct.name,
      name: ct.name,
      category: ct.category || 'عام',
      price: unitPrice,
      unitPrice,
      costEstimate: unitCost,
      unitCost,
      unitProfit,
      profitMargin,
      count: stats.count,
      totalRevenue: stats.totalRevenue,
      totalCost: stats.totalCost,
      netProfit: totalProfit,
      totalProfit,
    };
  });

  breakdown.sort((a, b) => b.count - a.count);
  return breakdown;
}

// -------------------------------------------------------------
// LIS Devices & Analyzer Interfacing Helpers
// -------------------------------------------------------------

export function getDevices(): DeviceRecord[] {
  const store = getStore();
  return store.devices || [];
}

export function findDevice(idOrKey: string): DeviceRecord | undefined {
  const store = getStore();
  return (store.devices || []).find(d => d.id === idOrKey || d.apiKey === idOrKey);
}

export function addDevice(data: any): DeviceRecord {
  const store = getStore();
  const now = new Date().toISOString();
  const newId = data.id || `dev-${Date.now()}`;
  const apiKey = data.apiKey || `key_${Math.random().toString(36).substring(2, 10)}`;

  let mappings: DeviceMappingRecord[] = [];
  if (data.presetId) {
    const preset = DEVICE_PRESETS.find(p => p.id === data.presetId);
    if (preset) {
      mappings = (preset.defaultMappings || []).map((m, idx) => ({
        id: `map-${newId}-${idx + 1}`,
        deviceId: newId,
        deviceTestCode: m.deviceTestCode,
        deviceTestName: m.deviceTestName,
        testCatalogId: m.testCatalogCode === 'HB' ? 't-hb' : (m.testCatalogCode === 'PLT' ? 't-plt' : 't-cbc'),
        testCatalogCode: m.testCatalogCode,
        testCatalogName: m.testCatalogName,
        unit: m.unit,
        multiplier: 1.0,
        createdAt: now,
      }));
    }
  }

  const newDevice: DeviceRecord = {
    id: newId,
    name: (data.name || 'جهاز تحليلات جديد').trim(),
    brand: (data.brand || 'Generic').trim(),
    model: (data.model || data.name || '').trim(),
    category: data.category || 'CBC',
    connectionType: data.connectionType || 'TCP_IP',
    protocol: data.protocol || 'HL7_V2',
    ipAddress: data.ipAddress || null,
    port: data.port ? Number(data.port) : null,
    comPort: data.comPort || null,
    baudRate: data.baudRate ? Number(data.baudRate) : null,
    dataBits: data.dataBits ? Number(data.dataBits) : 8,
    stopBits: data.stopBits ? Number(data.stopBits) : 1,
    parity: data.parity || 'none',
    apiKey,
    status: 'ONLINE',
    autoMatchSample: data.autoMatchSample !== false,
    notes: data.notes || '',
    lastCommunication: now,
    mappings,
    createdAt: now,
  };

  if (!store.devices) store.devices = [];
  store.devices.push(newDevice);
  saveStoreToFile();
  return newDevice;
}

export function updateDevice(id: string, data: Partial<DeviceRecord>): DeviceRecord | null {
  const store = getStore();
  if (!store.devices) store.devices = [];
  const index = store.devices.findIndex(d => d.id === id);
  if (index === -1) return null;

  const updated: DeviceRecord = {
    ...store.devices[index],
    ...data,
  };
  store.devices[index] = updated;
  saveStoreToFile();
  return updated;
}

export function deleteDevice(id: string): boolean {
  const store = getStore();
  if (!store.devices) return false;
  const index = store.devices.findIndex(d => d.id === id);
  if (index === -1) return false;
  store.devices.splice(index, 1);
  saveStoreToFile();
  return true;
}

export function addDeviceMapping(deviceId: string, mappingData: any): DeviceMappingRecord | null {
  const store = getStore();
  const device = (store.devices || []).find(d => d.id === deviceId);
  if (!device) return null;

  const catalogTest = store.tests.find(t => t.id === mappingData.testCatalogId || t.code === mappingData.testCatalogId);

  const newMapping: DeviceMappingRecord = {
    id: `map-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    deviceId,
    deviceTestCode: (mappingData.deviceTestCode || '').trim().toUpperCase(),
    deviceTestName: (mappingData.deviceTestName || mappingData.deviceTestCode || '').trim(),
    testCatalogId: mappingData.testCatalogId,
    testCatalogCode: catalogTest?.code,
    testCatalogName: catalogTest?.name,
    unit: mappingData.unit || catalogTest?.unit || '',
    multiplier: mappingData.multiplier !== undefined ? Number(mappingData.multiplier) : 1.0,
    createdAt: new Date().toISOString(),
  };

  if (!device.mappings) device.mappings = [];
  const existingIdx = device.mappings.findIndex(m => m.deviceTestCode === newMapping.deviceTestCode);
  if (existingIdx >= 0) {
    device.mappings[existingIdx] = newMapping;
  } else {
    device.mappings.push(newMapping);
  }

  saveStoreToFile();
  return newMapping;
}

export function deleteDeviceMapping(deviceId: string, mappingId: string): boolean {
  const store = getStore();
  const device = (store.devices || []).find(d => d.id === deviceId);
  if (!device || !device.mappings) return false;

  const idx = device.mappings.findIndex(m => m.id === mappingId);
  if (idx === -1) return false;
  device.mappings.splice(idx, 1);
  saveStoreToFile();
  return true;
}

export function getIncomingResults(params?: { limit?: number; status?: string; deviceId?: string }): IncomingResultRecord[] {
  const store = getStore();
  let list = store.incomingResults || [];
  if (params?.deviceId) {
    list = list.filter(r => r.deviceId === params.deviceId);
  }
  if (params?.status && params.status !== 'ALL') {
    list = list.filter(r => r.status === params.status);
  }
  const limit = params?.limit || 50;
  return list.slice(0, limit);
}

export function applyIncomingResult(incomingResultId: string, sampleId: string, testCatalogId: string): { success: boolean; message: string } {
  const store = getStore();
  const inc = (store.incomingResults || []).find(r => r.id === incomingResultId);
  if (!inc) {
    return { success: false, message: 'النتيجة غير موجودة في سجل الاستقبال' };
  }

  const sample = store.samples.find(s => s.id === sampleId || String(s.sampleNumber) === sampleId);
  if (!sample) {
    return { success: false, message: 'العينة غير موجودة في النظام' };
  }

  const st = sample.tests.find(t => t.testId === testCatalogId || t.test?.id === testCatalogId || t.test?.code === testCatalogId);
  if (!st) {
    return { success: false, message: 'الفحص المطلوب غير مدرج في هذه العينة' };
  }

  st.resultValue = inc.value;
  st.isAbnormal = inc.isAbnormal;
  st.status = 'COMPLETED';
  st.notes = `[مستورد يدوياً من جهاز ${inc.deviceName}]`;

  inc.status = 'APPLIED';
  inc.matchedSampleId = sample.id;
  inc.matchedSampleNumber = sample.sampleNumber;
  inc.matchedTestCatalogId = testCatalogId;
  inc.appliedAt = new Date().toISOString();

  // Check if sample ready
  const allCompleted = sample.tests.every(t => t.status === 'COMPLETED');
  if (allCompleted) {
    sample.status = 'READY';
  } else if (sample.status === 'RECEIVED') {
    sample.status = 'IN_PROGRESS';
  }

  saveStoreToFile();
  return { success: true, message: 'تم إسناد النتيجة وتحديث العينة بنجاح' };
}

export function buildCbcStringFromItems(itemsMap: Record<string, string>): string {
  const rbc = itemsMap['RBC'] || '4.80';
  const hgb = itemsMap['HGB'] || itemsMap['HB'] || '14.5';
  const hct = itemsMap['HCT'] || itemsMap['PCV'] || '43.5';
  const mcv = itemsMap['MCV'] || '90.6';
  const mch = itemsMap['MCH'] || '30.2';
  const mchc = itemsMap['MCHC'] || '33.3';
  const rdw = itemsMap['RDW-CV'] || itemsMap['RDW'] || '12.5';
  const plt = itemsMap['PLT'] || '250';
  const mpv = itemsMap['MPV'] || '9.8';
  const pdw = itemsMap['PDW'] || '11.2';
  const pct = itemsMap['PCT'] || '0.245';
  const wbc = itemsMap['WBC'] || '7.2';
  const neu = itemsMap['NEU%'] || itemsMap['GRAN%'] || '60.0';
  const lym = itemsMap['LYM%'] || '30.0';
  const mon = itemsMap['MON%'] || itemsMap['MID%'] || '6.0';
  const eos = itemsMap['EOS%'] || '3.0';
  const bas = itemsMap['BAS%'] || '1.0';

  const diffSum = Math.round((parseFloat(neu) + parseFloat(lym) + parseFloat(mon) + parseFloat(eos) + parseFloat(bas)) * 10) / 10;

  const parts = [
    '[CBC - COMPLETE BLOOD COUNT & 5-PART DIFFERENTIAL]',
    `ERYTHROID: RBC: ${rbc} 10^6/uL | HGB: ${hgb} g/dL | HCT: ${hct} % | MCV: ${mcv} fL | MCH: ${mch} pg | MCHC: ${mchc} g/dL | RDW: ${rdw} %`,
    `PLATELETS: PLT: ${plt} 10^3/uL | MPV: ${mpv} fL | PDW: ${pdw} % | PCT: ${pct} %`,
    `LEUKOCYTES: Total WBC: ${wbc} 10^3/uL`,
    `DIFFERENTIAL: Neut: ${neu}% | Lymph: ${lym}% | Mono: ${mon}% | Eos: ${eos}% | Baso: ${bas}% (Sum: ${diffSum}%)`,
  ];
  return parts.join('\n');
}

export function processDeviceIngest(params: {
  deviceIdOrKey?: string;
  rawPayload: string;
  protocol?: string;
  overrideSampleNumber?: number;
  overridePatientName?: string;
}) {
  const store = getStore();
  const now = new Date().toISOString();

  // 1. Locate Device
  let device = (store.devices || []).find(d => d.id === params.deviceIdOrKey || d.apiKey === params.deviceIdOrKey);
  if (!device) {
    device = store.devices?.[0] || getInitialDevices()[0];
  }

  // 2. Parse Raw Payload
  const protocol = (params.protocol || device.protocol || 'ASTM_1394') as any;
  const parsed = parseDeviceMessage(protocol, params.rawPayload);

  if (params.overrideSampleNumber) {
    parsed.sampleNumber = params.overrideSampleNumber;
  }
  if (params.overridePatientName) {
    parsed.patientName = params.overridePatientName;
  }

  // 3. Locate Patient Sample
  let targetSample: SampleRecord | undefined = undefined;
  if (parsed.sampleNumber) {
    targetSample = store.samples.find(s => s.sampleNumber === parsed.sampleNumber);
  }
  if (!targetSample && parsed.sampleBarcode) {
    targetSample = store.samples.find(s => s.id === parsed.sampleBarcode || String(s.sampleNumber) === parsed.sampleBarcode);
    if (!targetSample) {
      const numMatch = parsed.sampleBarcode.match(/\d+/);
      if (numMatch) {
        const num = parseInt(numMatch[0], 10);
        targetSample = store.samples.find(s => s.sampleNumber === num);
      }
    }
  }

  // If still not found and sample list is non-empty, match the first recent sample as fallback for simulation
  if (!targetSample && store.samples.length > 0) {
    targetSample = store.samples[0];
  }

  // Prepare Items Map for CBC or multi-analyte bundling
  const itemsMap: Record<string, string> = {};
  let anyAbnormalInBatch = false;
  parsed.items.forEach(item => {
    itemsMap[item.testCode.toUpperCase()] = item.value;
    if (item.isAbnormal) anyAbnormalInBatch = true;
  });

  let appliedCount = 0;
  const recordedIncoming: IncomingResultRecord[] = [];

  // 4. Ingest Each Item
  parsed.items.forEach(item => {
    const code = item.testCode.toUpperCase();
    const mapping = device?.mappings?.find(m => m.deviceTestCode.toUpperCase() === code);
    const targetCatalogId = mapping?.testCatalogId;
    const targetCatalogCode = mapping?.testCatalogCode || code;

    let applied = false;
    let matchedSampleTest: SampleTestRecord | undefined = undefined;

    if (targetSample) {
      // Look for direct test ID or code match
      matchedSampleTest = targetSample.tests.find(st => {
        const cId = st.testId || st.test?.id;
        const cCode = (st.test?.code || '').toUpperCase();
        return (targetCatalogId && cId === targetCatalogId) ||
               (cCode && (cCode === targetCatalogCode.toUpperCase() || cCode === code));
      });

      // Special handling: if sample has CBC panel/test (t-cbc or code CBC) and item is a CBC parameter
      const cbcTestInSample = targetSample.tests.find(st => st.testId === 't-cbc' || st.test?.code === 'CBC');
      if (cbcTestInSample && ['WBC', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'PLT', 'NEU%', 'LYM%', 'MON%', 'EOS%', 'BAS%', 'RDW-CV'].includes(code)) {
        cbcTestInSample.resultValue = buildCbcStringFromItems(itemsMap);
        cbcTestInSample.isAbnormal = anyAbnormalInBatch;
        cbcTestInSample.status = 'COMPLETED';
        cbcTestInSample.notes = `[مستورد آلياً من جهاز ${device?.name || 'التحليل'}]`;
        applied = true;
      }

      // Also if this specific item has its own row in the sample
      if (matchedSampleTest) {
        matchedSampleTest.resultValue = item.value;
        matchedSampleTest.isAbnormal = item.isAbnormal;
        matchedSampleTest.status = 'COMPLETED';
        matchedSampleTest.notes = `[مستورد آلياً من جهاز ${device?.name || 'التحليل'}]`;
        applied = true;
      }

      // Smart Auto-Addition: if test is sent by machine but not yet in targetSample, add it and fill result!
      if (!applied) {
        if (['WBC', 'RBC', 'HGB', 'HCT', 'MCV', 'MCH', 'MCHC', 'PLT', 'NEU%', 'LYM%', 'MON%', 'EOS%', 'BAS%', 'RDW-CV'].includes(code)) {
          let cbcRow = targetSample.tests.find(st => st.testId === 't-cbc' || st.test?.code === 'CBC');
          if (!cbcRow) {
            const cbcCatalog = store.tests.find(t => t.id === 't-cbc' || t.code === 'CBC') || {
              id: 't-cbc',
              code: 'CBC',
              name: 'Complete Blood Count (CBC)',
              arabicName: 'صورة الدم الكاملة',
              category: 'أمراض الدم',
              price: 15000,
            };
            cbcRow = {
              id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              sampleId: targetSample.id,
              testId: cbcCatalog.id,
              test: cbcCatalog as any,
              resultValue: buildCbcStringFromItems(itemsMap),
              isAbnormal: anyAbnormalInBatch,
              status: 'COMPLETED',
              notes: `[مستورد ومضاف آلياً من جهاز ${device?.name || 'التحليل'}]`,
            };
            targetSample.tests.push(cbcRow);
            targetSample.priceTotal = (targetSample.priceTotal || 0) + (cbcCatalog.price || 0);
            applied = true;
          } else {
            cbcRow.resultValue = buildCbcStringFromItems(itemsMap);
            cbcRow.isAbnormal = anyAbnormalInBatch;
            cbcRow.status = 'COMPLETED';
            applied = true;
          }
        } else {
          // Look up in catalog by ID or code
          const catalogTest = store.tests.find(t =>
            (targetCatalogId && t.id === targetCatalogId) ||
            t.code.toUpperCase() === code ||
            t.code.toUpperCase() === targetCatalogCode.toUpperCase()
          );
          if (catalogTest) {
            const newSt: SampleTestRecord = {
              id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              sampleId: targetSample.id,
              testId: catalogTest.id,
              test: catalogTest,
              resultValue: item.value,
              isAbnormal: item.isAbnormal,
              status: 'COMPLETED',
              notes: `[مستورد ومضاف آلياً من جهاز ${device?.name || 'التحليل'}]`,
            };
            targetSample.tests.push(newSt);
            targetSample.priceTotal = (targetSample.priceTotal || 0) + (catalogTest.price || 0);
            applied = true;
          }
        }
      }
    }

    if (applied) {
      appliedCount++;
    }

    const incRecord: IncomingResultRecord = {
      id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      deviceId: device?.id || 'dev-unknown',
      deviceName: device?.name || 'محلل مخبري',
      protocol,
      sampleBarcode: parsed.sampleBarcode,
      sampleNumber: targetSample?.sampleNumber || parsed.sampleNumber,
      patientName: targetSample?.patient?.name || parsed.patientName,
      testCode: code,
      testName: item.testName || mapping?.deviceTestName || code,
      value: item.value,
      unit: item.unit || mapping?.unit,
      flags: item.flags,
      isAbnormal: !!item.isAbnormal,
      status: applied ? 'APPLIED' : 'PENDING',
      matchedSampleId: applied ? targetSample?.id : undefined,
      matchedSampleNumber: applied ? targetSample?.sampleNumber : undefined,
      matchedTestCatalogId: targetCatalogId,
      appliedAt: applied ? now : undefined,
      createdAt: now,
    };

    recordedIncoming.push(incRecord);
  });

  if (!store.incomingResults) store.incomingResults = [];
  store.incomingResults.unshift(...recordedIncoming);
  if (store.incomingResults.length > 200) {
    store.incomingResults = store.incomingResults.slice(0, 200);
  }

  // Update sample status if all/any completed
  if (targetSample) {
    (targetSample as any).updatedAt = now;
    const allDone = targetSample.tests.every(t => t.status === 'COMPLETED');
    if (allDone) {
      targetSample.status = 'READY';
    } else if (targetSample.status === 'RECEIVED') {
      targetSample.status = 'IN_PROGRESS';
    }
  }

  // Raw communication log
  const rawLog: DeviceRawLogRecord = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    deviceId: device?.id || 'dev-unknown',
    direction: 'INBOUND',
    protocol,
    rawPayload: params.rawPayload,
    summary: `استقبال حزمة ${protocol} تحوي (${parsed.items.length}) فحص لعينة #${targetSample?.sampleNumber || parsed.sampleNumber || 'غير محددة'}`,
    parsedCount: parsed.items.length,
    createdAt: now,
  };

  if (!store.deviceRawLogs) store.deviceRawLogs = [];
  store.deviceRawLogs.unshift(rawLog);
  if (store.deviceRawLogs.length > 100) {
    store.deviceRawLogs = store.deviceRawLogs.slice(0, 100);
  }

  // Update device health / communication timestamp
  if (device) {
    device.lastCommunication = now;
    device.status = 'ONLINE';
  }

  saveStoreToFile();

  return {
    success: true,
    deviceId: device?.id,
    deviceName: device?.name,
    sampleMatched: !!targetSample,
    sampleNumber: targetSample?.sampleNumber,
    patientName: targetSample?.patient?.name || parsed.patientName,
    totalItems: parsed.items.length,
    appliedItems: appliedCount,
    rawLog,
    sample: targetSample,
  };
}


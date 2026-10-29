import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export interface PairedDevice {
  id: string;
  name: string;
  platform: 'windows' | 'android' | 'ios' | 'mac' | 'linux' | 'other';
  ip: string;
  token: string;
  role: 'OPERATOR' | 'RECEPTION' | 'TECHNICIAN' | 'VIEWER';
  createdAt: number;
  lastSeenAt: number;
  latencyMs?: number;
  isBlocked?: boolean;
}

export interface PendingPairRequest {
  requestId: string;
  deviceId: string;
  name: string;
  platform: 'windows' | 'android' | 'ios' | 'mac' | 'linux' | 'other';
  ip: string;
  code: string; // 6-digit code like "482-915"
  requestedAt: number;
  expiresAt: number;
}

export interface NetworkEvent {
  eventId: number;
  type: 'SAMPLE' | 'PATIENT' | 'RESULT' | 'FINANCIAL' | 'SETTING' | 'SYSTEM';
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'PING' | 'DEVICE_UPDATE';
  recordId: string;
  timestamp: number;
  data?: any;
}

export interface NetworkDiagnosticLog {
  id: string;
  timestamp: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  category: 'PAIRING' | 'CONNECTION' | 'BROADCAST' | 'HEARTBEAT' | 'SECURITY' | 'SYSTEM';
  message: string;
  details?: any;
}

// Global in-memory state across Next.js requests in the same process
interface GlobalNetworkState {
  pairedDevices: Map<string, PairedDevice>;
  pendingRequests: Map<string, PendingPairRequest>;
  approvedRequests: Map<string, { device: PairedDevice; approvedAt: number }>;
  eventBuffer: NetworkEvent[];
  nextEventId: number;
  logs: NetworkDiagnosticLog[];
  sseClients: Map<string, (event: NetworkEvent) => void>;
  serverBootTime: number;
  isInitialized: boolean;
}

const g = globalThis as unknown as { __labryoNetworkState?: GlobalNetworkState };

if (!g.__labryoNetworkState) {
  g.__labryoNetworkState = {
    pairedDevices: new Map(),
    pendingRequests: new Map(),
    approvedRequests: new Map(),
    eventBuffer: [],
    nextEventId: 1,
    logs: [],
    sseClients: new Map(),
    serverBootTime: Date.now(),
    isInitialized: false,
  };
}
if (!g.__labryoNetworkState.approvedRequests) {
  g.__labryoNetworkState.approvedRequests = new Map();
}

const state = g.__labryoNetworkState;

function getDataDir(): string {
  if (process.env.LABRYO_DATA_DIR) {
    return path.resolve(process.env.LABRYO_DATA_DIR);
  }
  const rootDir = process.cwd().includes('apps') ? path.resolve(process.cwd(), '..', '..') : process.cwd();
  const candidate = path.join(rootDir, 'apps', 'web', 'data');
  if (fs.existsSync(candidate)) return candidate;
  const fallback = path.join(process.cwd(), 'data');
  if (!fs.existsSync(fallback)) {
    try { fs.mkdirSync(fallback, { recursive: true }); } catch {}
  }
  return fallback;
}

const DEVICES_FILE = path.join(getDataDir(), 'network_devices.json');

function loadPersistedDevices() {
  if (state.isInitialized) return;
  state.isInitialized = true;
  try {
    if (fs.existsSync(DEVICES_FILE)) {
      const raw = fs.readFileSync(DEVICES_FILE, 'utf-8');
      const list: PairedDevice[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const dev of list) {
          state.pairedDevices.set(dev.id, dev);
        }
      }
    }
  } catch (err) {
    console.warn('[NetworkManager] Error loading devices file:', err);
  }
}

function savePersistedDevices() {
  try {
    const list = Array.from(state.pairedDevices.values());
    const dir = path.dirname(DEVICES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DEVICES_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch (err) {
    console.error('[NetworkManager] Error saving devices file:', err);
  }
}

export function logNetworkEvent(
  level: 'INFO' | 'WARN' | 'ERROR',
  category: 'PAIRING' | 'CONNECTION' | 'BROADCAST' | 'HEARTBEAT' | 'SECURITY' | 'SYSTEM',
  message: string,
  details?: any
) {
  const entry: NetworkDiagnosticLog = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    level,
    category,
    message,
    details,
  };
  state.logs.unshift(entry);
  if (state.logs.length > 100) {
    state.logs.length = 100;
  }
  if (level === 'ERROR') {
    console.error(`[Network ${category}] ${message}`, details || '');
  }
}

export function getLocalIpAddress(): string {
  try {
    const interfaces = os.networkInterfaces();
    const candidates: string[] = [];
    for (const name of Object.keys(interfaces)) {
      const lower = name.toLowerCase();
      if (lower.includes('vethernet') || lower.includes('virtual') || lower.includes('hyper-v') || lower.includes('wsl')) {
        continue;
      }
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.16.')) {
            if (lower.includes('wi-fi') || lower.includes('wlan') || lower.includes('wireless') || lower.includes('ethernet')) {
              candidates.unshift(iface.address);
            } else {
              candidates.push(iface.address);
            }
          }
        }
      }
    }
    if (candidates.length > 0) return candidates[0];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        if (iface.family === 'IPv4' && !iface.internal) return iface.address;
      }
    }
  } catch {}
  return '127.0.0.1';
}

export function getServerStatus() {
  loadPersistedDevices();
  const ip = getLocalIpAddress();
  const port = 8080;
  const uptimeSeconds = Math.floor((Date.now() - state.serverBootTime) / 1000);
  const now = Date.now();
  // Active if pinged in last 60s or currently connected via SSE
  let connectedCount = 0;
  for (const dev of Array.from(state.pairedDevices.values())) {
    if (!dev.isBlocked && now - dev.lastSeenAt < 60000) {
      connectedCount++;
    }
  }

  return {
    ip,
    port,
    lanUrl: `http://${ip}:${port}`,
    mdnsHost: 'labryo.local',
    mdnsUrl: `http://labryo.local:${port}`,
    uptimeSeconds,
    activeSSECount: state.sseClients.size,
    pairedCount: state.pairedDevices.size,
    connectedCount: Math.max(connectedCount, state.sseClients.size),
    isWindows: process.platform === 'win32',
    serverBootTime: state.serverBootTime,
  };
}

export function createPairingRequest(
  name: string,
  platform: PairedDevice['platform'],
  clientIp: string
): PendingPairRequest {
  loadPersistedDevices();
  // Clean expired requests
  const now = Date.now();
  for (const [id, req] of Array.from(state.pendingRequests.entries())) {
    if (req.expiresAt < now) {
      state.pendingRequests.delete(id);
    }
  }

  // Generate 6 digit code (3-3 format e.g. 748-291)
  const randomNum = crypto.randomInt(100000, 1000000);
  const code = `${String(randomNum).slice(0, 3)}-${String(randomNum).slice(3)}`;
  const requestId = crypto.randomUUID();
  const deviceId = crypto.randomBytes(8).toString('hex');

  const pairReq: PendingPairRequest = {
    requestId,
    deviceId,
    name: name.trim() || `جهاز-${code.replace('-', '')}`,
    platform: platform || 'other',
    ip: clientIp || '127.0.0.1',
    code,
    requestedAt: now,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes
  };

  state.pendingRequests.set(requestId, pairReq);
  logNetworkEvent('INFO', 'PAIRING', `طلب اقتران جديد من جهاز "${pairReq.name}" بالكود ${code}`, { ip: clientIp, platform });
  return pairReq;
}

export function getPendingRequests(): PendingPairRequest[] {
  const now = Date.now();
  const list: PendingPairRequest[] = [];
  for (const [id, req] of Array.from(state.pendingRequests.entries())) {
    if (req.expiresAt >= now) {
      list.push(req);
    } else {
      state.pendingRequests.delete(id);
    }
  }
  return list.sort((a, b) => b.requestedAt - a.requestedAt);
}

export function approvePairingRequest(requestId: string, role: PairedDevice['role'] = 'OPERATOR'): PairedDevice | null {
  loadPersistedDevices();
  const req = state.pendingRequests.get(requestId);
  if (!req) return null;

  const token = `lab_${crypto.randomBytes(24).toString('hex')}`;
  const paired: PairedDevice = {
    id: req.deviceId,
    name: req.name,
    platform: req.platform,
    ip: req.ip,
    token,
    role,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    latencyMs: 1,
    isBlocked: false,
  };

  state.pairedDevices.set(paired.id, paired);
  state.pendingRequests.delete(requestId);
  state.approvedRequests.set(requestId, { device: paired, approvedAt: Date.now() });
  savePersistedDevices();

  logNetworkEvent('INFO', 'PAIRING', `تم اعتماد اقتران الجهاز "${paired.name}" بنجاح`, { id: paired.id, ip: paired.ip });
  
  // Broadcast system device update
  broadcastEvent('SYSTEM', 'DEVICE_UPDATE', paired.id, {
    actionType: 'PAIRED',
    device: { id: paired.id, name: paired.name },
  });

  return paired;
}

export function autoPairLanDevice(
  name: string,
  platform: PairedDevice['platform'],
  clientIp: string,
  role: PairedDevice['role'] = 'OPERATOR'
): { device: PairedDevice | null; blocked?: boolean } {
  loadPersistedDevices();
  const cleanIp = (clientIp || '127.0.0.1').replace(/^::ffff:/i, '');

  // Check if a device with the same IP and platform is already paired
  for (const existing of Array.from(state.pairedDevices.values())) {
    const existingIp = (existing.ip || '').replace(/^::ffff:/i, '');
    if (existingIp === cleanIp && existing.platform === (platform || 'other') && cleanIp !== '127.0.0.1') {
      if (existing.isBlocked) {
        return { device: null, blocked: true };
      }
      existing.lastSeenAt = Date.now();
      if (name && name.trim()) {
        existing.name = name.trim();
      }
      savePersistedDevices();
      return { device: existing };
    }
  }

  const deviceId = crypto.randomBytes(8).toString('hex');
  const token = `lab_${crypto.randomBytes(24).toString('hex')}`;
  const paired: PairedDevice = {
    id: deviceId,
    name: (name || '').trim() || `جهاز شبكة (${cleanIp})`,
    platform: platform || 'other',
    ip: cleanIp,
    token,
    role,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    latencyMs: 1,
    isBlocked: false,
  };

  state.pairedDevices.set(paired.id, paired);
  savePersistedDevices();

  logNetworkEvent('INFO', 'PAIRING', `تم ربط واقتران جهاز الشبكة المحلية تلقائياً: "${paired.name}"`, {
    id: paired.id,
    ip: paired.ip,
    platform: paired.platform,
  });

  broadcastEvent('SYSTEM', 'DEVICE_UPDATE', paired.id, {
    actionType: 'PAIRED',
    device: { id: paired.id, name: paired.name },
  });

  return { device: paired };
}

export function rejectPairingRequest(requestId: string): boolean {
  const req = state.pendingRequests.get(requestId);
  state.approvedRequests.delete(requestId);
  if (!req) return false;
  state.pendingRequests.delete(requestId);
  logNetworkEvent('WARN', 'PAIRING', `تم رفض طلب اقتران الجهاز "${req.name}" (كود: ${req.code})`);
  return true;
}

export function checkPairingStatus(requestId: string): { status: 'PENDING' | 'APPROVED' | 'EXPIRED' | 'REJECTED'; device?: PairedDevice } {
  loadPersistedDevices();
  const req = state.pendingRequests.get(requestId);
  if (req) {
    if (Date.now() > req.expiresAt) {
      state.pendingRequests.delete(requestId);
      return { status: 'EXPIRED' };
    }
    return { status: 'PENDING' };
  }

  // Check if device was approved for this specific requestId within 5 minutes
  const approved = state.approvedRequests.get(requestId);
  if (approved) {
    if (Date.now() - approved.approvedAt <= 5 * 60 * 1000) {
      return { status: 'APPROVED', device: approved.device };
    } else {
      state.approvedRequests.delete(requestId);
    }
  }

  return { status: 'REJECTED' };
}

export function getPairedDevices(): PairedDevice[] {
  loadPersistedDevices();
  return Array.from(state.pairedDevices.values()).sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

export function revokeDevice(deviceId: string): boolean {
  loadPersistedDevices();
  const dev = state.pairedDevices.get(deviceId);
  if (!dev) return false;
  state.pairedDevices.delete(deviceId);
  savePersistedDevices();

  // Close any active SSE connection for this device
  for (const [clientId, send] of Array.from(state.sseClients.entries())) {
    if (clientId.startsWith(deviceId)) {
      state.sseClients.delete(clientId);
    }
  }

  logNetworkEvent('WARN', 'SECURITY', `تم إلغاء اقتران وحذف الجهاز "${dev.name}"`, { id: deviceId });
  broadcastEvent('SYSTEM', 'DEVICE_UPDATE', deviceId, { actionType: 'REVOKED' });
  return true;
}

export function setDeviceBlocked(deviceId: string, isBlocked: boolean): boolean {
  loadPersistedDevices();
  const dev = state.pairedDevices.get(deviceId);
  if (!dev) return false;
  dev.isBlocked = isBlocked;
  savePersistedDevices();
  logNetworkEvent('WARN', 'SECURITY', `${isBlocked ? 'تم حظر' : 'تم فك حظر'} الجهاز "${dev.name}"`, { id: deviceId });
  broadcastEvent('SYSTEM', 'DEVICE_UPDATE', deviceId, { actionType: isBlocked ? 'BLOCKED' : 'UNBLOCKED' });
  return true;
}

export function verifyDeviceToken(token: string | null | undefined, clientIp: string): { valid: boolean; device?: PairedDevice; isLoopback?: boolean } {
  // Loopback (Server itself) is always authorized
  const isLoopback = clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1' || clientIp === 'localhost';
  if (isLoopback && !token) {
    return { valid: true, isLoopback: true };
  }

  if (!token) return { valid: false };

  loadPersistedDevices();
  for (const dev of Array.from(state.pairedDevices.values())) {
    if (dev.token === token && !dev.isBlocked) {
      // Update last seen
      dev.lastSeenAt = Date.now();
      return { valid: true, device: dev };
    }
  }

  return { valid: false };
}

export function recordDevicePing(tokenOrId: string, latencyMs?: number): boolean {
  loadPersistedDevices();
  for (const dev of Array.from(state.pairedDevices.values())) {
    if (dev.token === tokenOrId || dev.id === tokenOrId) {
      dev.lastSeenAt = Date.now();
      if (typeof latencyMs === 'number' && latencyMs >= 0) {
        dev.latencyMs = latencyMs;
      }
      return true;
    }
  }
  return false;
}

// --------------------------------------------------------------------------
// Realtime SSE Broadcast Engine with Ring Buffer
// --------------------------------------------------------------------------

export function broadcastEvent(
  type: NetworkEvent['type'],
  action: NetworkEvent['action'],
  recordId: string,
  data?: any
): NetworkEvent {
  const event: NetworkEvent = {
    eventId: state.nextEventId++,
    type,
    action,
    recordId,
    timestamp: Date.now(),
    data,
  };

  // Ring Buffer (Keep last 100 events)
  state.eventBuffer.push(event);
  if (state.eventBuffer.length > 100) {
    state.eventBuffer.shift();
  }

  // Push to all active SSE subscribers
  for (const [clientId, send] of Array.from(state.sseClients.entries())) {
    try {
      send(event);
    } catch (err) {
      state.sseClients.delete(clientId);
    }
  }

  return event;
}

export function getEventsSince(lastEventId: number): NetworkEvent[] {
  if (!lastEventId || isNaN(lastEventId)) return [];
  return state.eventBuffer.filter((e) => e.eventId > lastEventId);
}

export function registerSSEClient(clientId: string, sendFn: (event: NetworkEvent) => void): () => void {
  state.sseClients.set(clientId, sendFn);
  logNetworkEvent('INFO', 'CONNECTION', `اتصال عميل جديد للبث المباشر (SSE): ${clientId}`, { totalClients: state.sseClients.size });

  return () => {
    state.sseClients.delete(clientId);
    logNetworkEvent('INFO', 'CONNECTION', `انفصال عميل البث المباشر (SSE): ${clientId}`, { totalClients: state.sseClients.size });
  };
}

export function getDiagnostics() {
  loadPersistedDevices();
  const server = getServerStatus();
  return {
    server,
    eventBufferCount: state.eventBuffer.length,
    activeSSECount: state.sseClients.size,
    logs: state.logs.slice(0, 50),
  };
}

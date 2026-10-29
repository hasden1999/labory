import { Bonjour } from 'bonjour-service';
import os from 'os';

export function startMDNS(port: number) {
  const isBench = process.env.LABRYO_STARTUP_BENCHMARK === '1' || process.env.DEBUG_STARTUP_BENCHMARK === '1';
  const t0 = isBench ? process.hrtime.bigint() : 0n;
  // Desktop-only default: no LAN broadcast unless explicitly enabled
  if (process.env.LABRYO_ENABLE_MDNS !== '1') {
    if (isBench) {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      console.log(`⏱️ [BENCHMARK] mDNS: ${ms.toFixed(2)}ms (disabled)`);
    }
    console.log('mDNS broadcast disabled (Desktop-only mode). Set LABRYO_ENABLE_MDNS=1 to enable LAN discovery.');
    return;
  }
  try {
    const instance = new Bonjour();
    const webPort = 8080;
    instance.publish({
      name: 'LabryoServer',
      host: 'labryo.local',
      type: 'http',
      port: webPort,
      txt: { name: 'Labryo Clinical LIMS LAN Server' },
    });
    if (isBench) {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      console.log(`⏱️ [BENCHMARK] mDNS: ${ms.toFixed(2)}ms`);
    }
    console.log(`mDNS service broadcasted: http://labryo.local:${webPort}`);
  } catch (err) {
    console.error('Failed to initialize mDNS broadcast:', err);
  }
}

export function getLocalIPAddress(): string {
  const interfaces = os.networkInterfaces();
  const candidates: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    // Skip virtual switches, hyper-v, WSL, and loopback
    if (lowerName.includes('vethernet') || lowerName.includes('virtual') || lowerName.includes('hyper-v') || lowerName.includes('wsl')) {
      continue;
    }

    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        if (iface.address.startsWith('192.168.') || iface.address.startsWith('10.') || iface.address.startsWith('172.16.')) {
          // If Wi-Fi or Wireless, put at the top of candidate list
          if (lowerName.includes('wi-fi') || lowerName.includes('wlan') || lowerName.includes('wireless')) {
            candidates.unshift(iface.address);
          } else {
            candidates.push(iface.address);
          }
        }
      }
    }
  }

  if (candidates.length > 0) {
    return candidates[0];
  }

  // Fallback check across all interfaces
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }

  return '127.0.0.1';
}

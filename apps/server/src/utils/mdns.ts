import { Bonjour } from 'bonjour-service';
import os from 'os';

export function startMDNS(port: number) {
  try {
    const instance = new Bonjour();
    instance.publish({
      name: 'LabManagerServer',
      type: 'http',
      port: port,
      txt: { name: 'Lab Manager Offline Server' },
    });
    console.log(`mDNS service broadcasted: http://labmanager.local:${port}`);
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

/**
 * LIS Edge Bridge Agent - Multi-Tenant Lab Analyzer Connector
 * -------------------------------------------------------------
 * This agent runs locally inside the laboratory network.
 * It connects to local analyzers (TCP/IP LAN or RS232 Serial COM)
 * and securely relays test results in real-time to the SaaS Cloud.
 */

const http = require('http');
const https = require('https');
const net = require('net');
const fs = require('fs');
const path = require('path');

// 1. CONFIGURATION
const CONFIG = {
  // SaaS Server URL
  serverUrl: process.env.LIS_SERVER_URL || 'http://localhost:8000',
  // Polling interval in ms for folder watcher (if used)
  fileWatchInterval: 5000,
  // Registered Devices for this Lab
  devices: [
    {
      id: 'mindray_bc5000',
      name: 'Mindray BC-5000 (LAN)',
      apiKey: process.env.DEVICE_API_KEY || 'YOUR_DEVICE_API_KEY',
      type: 'TCP_LISTENER', // 'TCP_LISTENER' | 'SERIAL_PORT' | 'FILE_WATCHER'
      port: 5100, // TCP Port to listen for analyzer
    },
  ],
};

console.log('====================================================');
console.log('🔬 LIS Local Bridge Agent v1.0.0 (SaaS Multi-Tenant)');
console.log(`📡 Target Cloud Server: ${CONFIG.serverUrl}`);
console.log('====================================================');

// 2. HELPER: Send Data to SaaS Server
function sendPayloadToCloud(apiKey, rawFrame, extraData = {}) {
  const payload = JSON.stringify({
    apiKey,
    rawFrame,
    ...extraData,
  });

  const parsedUrl = new URL(`${CONFIG.serverUrl}/api/devices/ingest`);
  const client = parsedUrl.protocol === 'https:' ? https : http;

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = client.request(parsedUrl, options, (res) => {
    let responseBody = '';
    res.on('data', (chunk) => (responseBody += chunk));
    res.on('end', () => {
      try {
        const json = JSON.parse(responseBody);
        if (json.success) {
          console.log(`✅ [${new Date().toLocaleTimeString()}] Cloud Ingest Success:`, {
            sampleNumber: json.summary?.sampleNumber,
            totalTests: json.summary?.totalItems,
            appliedTests: json.summary?.appliedItems,
          });
        } else {
          console.error(`❌ Cloud Ingest Error: ${json.error}`);
        }
      } catch {
        console.log(`📥 Cloud Response: ${responseBody}`);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`❌ Network error contacting SaaS Cloud: ${err.message}`);
  });

  req.write(payload);
  req.end();
}

// 3. START LISTENERS FOR EACH CONFIGURED DEVICE
CONFIG.devices.forEach((dev) => {
  if (dev.type === 'TCP_LISTENER') {
    const tcpServer = net.createServer((socket) => {
      const clientIp = socket.remoteAddress;
      console.log(`🔌 [${dev.name}] Analyzer connected from IP: ${clientIp}`);

      let buffer = '';

      socket.on('data', (chunk) => {
        const rawStr = chunk.toString();
        buffer += rawStr;

        // Auto ACK for ASTM / HL7 handshakes
        // ASTM: ENQ (0x05) -> ACK (0x06)
        if (rawStr.includes(String.fromCharCode(5))) {
          socket.write(String.fromCharCode(6));
        }
        // HL7: ACK response
        if (rawStr.startsWith('MSH|')) {
          const fields = rawStr.split('|');
          const msgControlId = fields[9] || '1';
          const ackMsg = `\x0bMSH|^~\\&|LIS|LAB|||${new Date().toISOString()}||ACK^R01|${msgControlId}|P|2.3.1\rMSA|AA|${msgControlId}\r\x1c\r`;
          socket.write(ackMsg);
        }
      });

      socket.on('end', () => {
        console.log(`📥 [${dev.name}] Transmission complete (${buffer.length} bytes)`);
        if (buffer.trim()) {
          sendPayloadToCloud(dev.apiKey, buffer);
        }
      });

      socket.on('error', (err) => {
        console.error(`⚠️ [${dev.name}] Socket error:`, err.message);
      });
    });

    tcpServer.listen(dev.port, '0.0.0.0', () => {
      console.log(`🟢 [${dev.name}] Listening for Analyzer on TCP Port ${dev.port}`);
    });
  }
});

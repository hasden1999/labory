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

      let buf = Buffer.alloc(0);
      let frames = [];
      let hasChecksumError = false;

      function calculateAstmChecksum(bytes) {
        let sum = 0;
        for (let i = 0; i < bytes.length; i++) {
          sum = (sum + bytes[i]) & 0xff;
        }
        return sum.toString(16).toUpperCase().padStart(2, '0');
      }

      socket.on('data', (chunk) => {
        buf = Buffer.concat([buf, chunk]);
        let progress = true;

        while (progress && buf.length > 0) {
          progress = false;

          // ENQ (0x05)
          if (buf[0] === 0x05) {
            frames = [];
            hasChecksumError = false;
            socket.write(Buffer.from([0x06])); // ACK
            buf = buf.subarray(1);
            progress = true;
            continue;
          }

          // EOT (0x04)
          if (buf[0] === 0x04) {
            buf = buf.subarray(1);
            if (hasChecksumError) {
              console.warn(`🚫 [${dev.name}] Discarding ASTM transmission due to checksum error.`);
            } else if (frames.length > 0) {
              console.log(`✅ [${dev.name}] ASTM complete (${frames.length} frames). Sending to cloud...`);
              sendPayloadToCloud(dev.apiKey, frames.join('\r\n'));
            }
            frames = [];
            hasChecksumError = false;
            progress = true;
            continue;
          }

          // STX (0x02)
          const stxIdx = buf.indexOf(0x02);
          if (stxIdx !== -1) {
            if (stxIdx > 0) buf = buf.subarray(stxIdx);

            let endIdx = -1;
            for (let i = 1; i < buf.length; i++) {
              if (buf[i] === 0x03 || buf[i] === 0x17) {
                endIdx = i;
                break;
              }
            }

            if (endIdx !== -1 && buf.length >= endIdx + 3) {
              const receivedChecksum = buf.toString('ascii', endIdx + 1, endIdx + 3).trim().toUpperCase();
              const bytesToVerify = buf.subarray(1, endIdx + 1);
              const expectedChecksum = calculateAstmChecksum(bytesToVerify);

              if (receivedChecksum === expectedChecksum) {
                frames.push(buf.toString('utf8', 1, endIdx));
                socket.write(Buffer.from([0x06])); // ACK
              } else {
                hasChecksumError = true;
                console.warn(`❌ [${dev.name}] Checksum mismatch: expected ${expectedChecksum}, got ${receivedChecksum}`);
                socket.write(Buffer.from([0x15])); // NAK
              }

              let advanceIdx = endIdx + 3;
              if (advanceIdx < buf.length && buf[advanceIdx] === 0x0d) advanceIdx++;
              if (advanceIdx < buf.length && buf[advanceIdx] === 0x0a) advanceIdx++;
              buf = buf.subarray(advanceIdx);
              progress = true;
              continue;
            }
          }

          // HL7 MLLP (0x0B ... 0x1C 0x0D)
          if (buf[0] === 0x0b) {
            const fsIdx = buf.indexOf(0x1c);
            if (fsIdx !== -1 && buf.length > fsIdx + 1 && buf[fsIdx + 1] === 0x0d) {
              const hl7Msg = buf.toString('utf8', 1, fsIdx);
              buf = buf.subarray(fsIdx + 2);
              sendPayloadToCloud(dev.apiKey, hl7Msg);

              const msgControlId = hl7Msg.split('\r')[0]?.split('|')[9] || '1';
              const ackMsg = `\x0bMSH|^~\\&|LIS|LAB|||${new Date().toISOString()}||ACK^R01|${msgControlId}|P|2.3.1\rMSA|AA|${msgControlId}\r\x1c\r`;
              socket.write(ackMsg);
              progress = true;
              continue;
            }
          }

          if (buf.length > 0 && buf[0] !== 0x02 && buf[0] !== 0x04 && buf[0] !== 0x05 && buf[0] !== 0x0b) {
            buf = buf.subarray(1);
            progress = true;
          }
        }
      });

      socket.on('end', () => {
        if (!hasChecksumError && frames.length > 0) {
          sendPayloadToCloud(dev.apiKey, frames.join('\r\n'));
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

/**
 * LIS Device Bridge Service (Desktop Daemon)
 * -------------------------------------------
 * High-performance, non-blocking background TCP bridge for Medical Analyzers.
 * Implements strict ASTM E1381 / E1394 and HL7 v2 MLLP protocol state machines.
 *
 * Listens on 0.0.0.0 (all network interfaces) so LAN analyzers (e.g. Mindray, Sysmex, Cobas)
 * can stream test results directly into the LIS desktop engine.
 */

const net = require('net');
const http = require('http');

// ASCII Control Codes
const ENQ = 0x05;
const ACK = 0x06;
const NAK = 0x15;
const EOT = 0x04;
const STX = 0x02;
const ETX = 0x03;
const ETB = 0x17;
const CR  = 0x0d;
const LF  = 0x0a;
const VT  = 0x0b;
const FS  = 0x1c;

class DeviceBridgeService {
  constructor() {
    this.server = null;
    this.activeSockets = new Set();
    this.webPort = 8080;
    this.tcpPort = 5000;
    this.host = '0.0.0.0';
    this.isRunning = false;
    this.deviceApiKey = null;
  }

  getDeviceApiKey() {
    if (this.deviceApiKey) return this.deviceApiKey;
    if (process.env.DEVICE_API_KEY) return process.env.DEVICE_API_KEY;
    try {
      const fs = require('fs');
      const path = require('path');
      const candidates = [
        path.resolve(process.env.LABRYO_DATA_DIR || '', 'lab_store.json'),
        path.resolve(__dirname, '../../web/data/lab_store.json'),
        path.resolve(process.cwd(), 'apps/web/data/lab_store.json'),
        path.resolve(process.cwd(), 'data/lab_store.json'),
      ];
      for (const p of candidates) {
        if (p && fs.existsSync(p)) {
          const store = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (Array.isArray(store.devices) && store.devices[0]?.apiKey) {
            this.deviceApiKey = store.devices[0].apiKey;
            return this.deviceApiKey;
          }
        }
      }
    } catch (e) {}
    return '';
  }

  /**
   * ASTM E1381 Checksum calculation:
   * Sum of bytes from character following STX up to and including ETX/ETB, modulo 256.
   * Formatted as 2-digit uppercase hex string.
   */
  calculateChecksum(buffer) {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum = (sum + buffer[i]) & 0xff;
    }
    return sum.toString(16).toUpperCase().padStart(2, '0');
  }

  /**
   * Start TCP Analyzer Listener
   */
  start(options = {}) {
    if (this.isRunning) {
      console.log('[Device Bridge] Service already running on port', this.tcpPort);
      return Promise.resolve();
    }

    this.webPort = options.webPort || Number(process.env.WEB_PORT) || 8080;
    this.tcpPort = options.port || Number(process.env.DEVICE_TCP_PORT) || 5000;
    this.host = options.host || '0.0.0.0';
    if (options.apiKey) this.deviceApiKey = options.apiKey;

    return new Promise((resolve) => {
      this.server = net.createServer((socket) => {
        const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`🔌 [Device Bridge] Analyzer connected from ${clientInfo}`);
        this.activeSockets.add(socket);

        const session = {
          buffer: Buffer.alloc(0),
          frames: [],
          hasChecksumError: false,
          errorReason: null,
          clientInfo,
        };

        socket.setTimeout(30000);
        socket.on('timeout', () => {
          console.warn(`⏳ [Device Bridge] Socket idle timeout from ${clientInfo}`);
          this.activeSockets.delete(socket);
          socket.destroy();
        });

        socket.on('data', async (chunk) => {
          try {
            if (session.buffer.length + chunk.length > 2 * 1024 * 1024) {
              console.warn(`⚠️ [Device Bridge] Buffer overflow from ${clientInfo}, resetting.`);
              session.buffer = Buffer.alloc(0);
              session.frames = [];
              return;
            }
            session.buffer = Buffer.concat([session.buffer, chunk]);
            await this.processSessionBuffer(socket, session);
          } catch (err) {
            console.error(`❌ [Device Bridge] Chunk processing error:`, err.message);
          }
        });

        socket.on('close', () => {
          console.log(`🔌 [Device Bridge] Analyzer disconnected: ${clientInfo}`);
          this.activeSockets.delete(socket);
        });

        socket.on('error', (err) => {
          console.error(`⚠️ [Device Bridge] Socket error from ${clientInfo}:`, err.message);
          this.activeSockets.delete(socket);
          socket.destroy();
        });
      });

      this.server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`⚠️ [Device Bridge] Port ${this.tcpPort} in use. Will retry or keep existing listener.`);
        } else {
          console.error('❌ [Device Bridge] TCP Server error:', err.message);
        }
        resolve();
      });

      this.server.listen(this.tcpPort, this.host, () => {
        this.isRunning = true;
        console.log(`📡 [Device Bridge] Medical Analyzer Listener ACTIVE on ${this.host}:${this.tcpPort} (ASTM E1381/HL7)`);
        resolve();
      });
    });
  }

  /**
   * ASTM E1381 / E1394 and HL7 MLLP Parser State Machine
   */
  async processSessionBuffer(socket, session) {
    let progress = true;

    while (progress && session.buffer.length > 0) {
      progress = false;

      // 1. Handshake: ENQ (0x05) -> ACK (0x06)
      if (session.buffer[0] === ENQ) {
        console.log(`🔬 [Device Bridge] <ENQ> received -> Responding <ACK>`);
        session.frames = [];
        session.hasChecksumError = false;
        session.errorReason = null;
        socket.write(Buffer.from([ACK]));
        session.buffer = session.buffer.subarray(1);
        progress = true;
        continue;
      }

      // 2. Termination: EOT (0x04)
      if (session.buffer[0] === EOT) {
        console.log(`🏁 [Device Bridge] <EOT> received`);
        session.buffer = session.buffer.subarray(1);

        if (session.hasChecksumError) {
          console.warn(`🚫 [Device Bridge] Transmission REJECTED: corrupted frame (${session.errorReason}).`);
        } else if (session.frames.length > 0) {
          const fullMessage = session.frames.join('\r\n');
          console.log(`✅ [Device Bridge] Transmission complete (${session.frames.length} frames). Forwarding to LIS...`);
          this.forwardToLis(fullMessage, 'ASTM_1394');
        }

        session.frames = [];
        session.hasChecksumError = false;
        session.errorReason = null;
        progress = true;
        continue;
      }

      // 3. ASTM Frame: STX ... ETX/ETB + Checksum
      const stxIdx = session.buffer.indexOf(STX);
      if (stxIdx !== -1) {
        if (stxIdx > 0) {
          session.buffer = session.buffer.subarray(stxIdx);
        }

        let endCharIdx = -1;
        for (let i = 1; i < session.buffer.length; i++) {
          if (session.buffer[i] === ETX || session.buffer[i] === ETB) {
            endCharIdx = i;
            break;
          }
        }

        if (endCharIdx !== -1) {
          if (session.buffer.length >= endCharIdx + 3) {
            const receivedChecksum = session.buffer
              .toString('ascii', endCharIdx + 1, endCharIdx + 3)
              .trim()
              .toUpperCase();

            const bytesToVerify = session.buffer.subarray(1, endCharIdx + 1);
            const expectedChecksum = this.calculateChecksum(bytesToVerify);

            if (receivedChecksum === expectedChecksum) {
              const frameContent = session.buffer.toString('utf8', 1, endCharIdx);
              session.frames.push(frameContent);
              socket.write(Buffer.from([ACK]));
            } else {
              session.hasChecksumError = true;
              session.errorReason = `Checksum mismatch: expected '${expectedChecksum}', got '${receivedChecksum}'`;
              console.warn(`❌ [Device Bridge] Checksum mismatch -> Sending <NAK>`);
              socket.write(Buffer.from([NAK]));
            }

            let advanceIdx = endCharIdx + 3;
            if (advanceIdx < session.buffer.length && session.buffer[advanceIdx] === CR) advanceIdx++;
            if (advanceIdx < session.buffer.length && session.buffer[advanceIdx] === LF) advanceIdx++;

            session.buffer = session.buffer.subarray(advanceIdx);
            progress = true;
            continue;
          }
        }
      }

      // 4. HL7 MLLP: VT (0x0B) ... FS (0x1C) CR (0x0D)
      const vtIdx = session.buffer.indexOf(VT);
      if (vtIdx !== -1) {
        const fsIdx = session.buffer.indexOf(FS, vtIdx + 1);
        if (fsIdx !== -1 && session.buffer.length > fsIdx + 1 && session.buffer[fsIdx + 1] === CR) {
          const hl7Message = session.buffer.toString('utf8', vtIdx + 1, fsIdx);
          session.buffer = session.buffer.subarray(fsIdx + 2);
          console.log(`🏥 [Device Bridge] HL7 MLLP Message received (${hl7Message.length} chars)`);

          this.forwardToLis(hl7Message, 'HL7_V2');

          // Transmit standard HL7 ACK
          const msgControlId = hl7Message.split('\r')[0]?.split('|')[9] || '1';
          const ackMsg = `\x0bMSH|^~\\&|LIS|LAB|||${new Date().toISOString()}||ACK^R01|${msgControlId}|P|2.3.1\rMSA|AA|${msgControlId}\r\x1c\r`;
          socket.write(ackMsg);

          progress = true;
          continue;
        }
      }

      // Skip stray control or whitespace byte if not matching protocols
      if (
        session.buffer.length > 0 &&
        session.buffer[0] !== STX &&
        session.buffer[0] !== ENQ &&
        session.buffer[0] !== EOT &&
        session.buffer[0] !== VT
      ) {
        session.buffer = session.buffer.subarray(1);
        progress = true;
      }
    }
  }

  /**
   * Internal HTTP Forwarder to LIS Ingest API
   */
  forwardToLis(rawPayload, protocol) {
    const apiKey = this.getDeviceApiKey();
    const postData = JSON.stringify({
      apiKey,
      rawPayload,
      protocol,
    });

    const options = {
      hostname: '127.0.0.1',
      port: this.webPort,
      path: '/api/devices/ingest',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-api-key': apiKey,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (parsed.success) {
            console.log(`🎉 [Device Bridge] Successfully imported to LIS! Sample #${parsed.sampleNumber || 'N/A'}, Items: ${parsed.appliedItems || parsed.totalItems || 0}`);
          } else {
            console.warn(`⚠️ [Device Bridge] Ingest returned notice:`, parsed.message || body);
          }
        } catch (e) {
          console.log(`[Device Bridge] Response: status ${res.statusCode}`);
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ [Device Bridge] Failed to forward to LIS engine (127.0.0.1:${this.webPort}):`, err.message);
    });

    req.write(postData);
    req.end();
  }

  /**
   * Stop Service cleanly
   */
  stop() {
    for (const socket of this.activeSockets) {
      try { socket.destroy(); } catch (e) {}
    }
    this.activeSockets.clear();

    if (this.server) {
      try {
        this.server.close();
        console.log('🛑 [Device Bridge] TCP Server stopped.');
      } catch (e) {}
      this.server = null;
    }
    this.isRunning = false;
  }
}

const deviceBridgeService = new DeviceBridgeService();
module.exports = deviceBridgeService;

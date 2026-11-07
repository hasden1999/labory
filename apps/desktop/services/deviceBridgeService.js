/**
 * LIS Device Bridge Service (Desktop Daemon)
 * -------------------------------------------
 * High-performance, non-blocking background TCP bridge for Medical Analyzers.
 * Implements strict ASTM E1381 / E1394 and HL7 v2 MLLP protocol state machines.
 *
 * Supports TWO simultaneous operating modes:
 * 1. TCP Server Mode (0.0.0.0:5000): Listens for analyzers that initiate connections to LIS.
 * 2. TCP Client Mode (Outbound -> Analyzer IP:5100): Connects as a client to analyzers that
 *    operate as a TCP Server (such as Mindray BC-30 / BC-30s / BC-20s on fixed port 5100),
 *    with automatic reconnection, TCP Keep-Alive, immediate MLLP ACK^R01, and LIS ingestion.
 */

const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');

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
    this.clientConnections = new Map(); // deviceId -> { socket, host, port, connecting, apiKey, name }
    this.syncTimer = null;
    this.webPort = 8080;
    this.tcpPort = 5000;
    this.host = process.env.DEVICE_BRIDGE_HOST || (process.env.DEVICE_BRIDGE_ALLOW_LAN === '1' ? '0.0.0.0' : '127.0.0.1');
    this.isRunning = false;
    this.deviceApiKey = null;
  }

  readStoreDevicesFromDisk() {
    try {
      const candidates = [
        path.resolve(process.env.LABRYO_DATA_DIR || '', 'lab_store.json'),
        path.resolve(__dirname, '../../web/data/lab_store.json'),
        path.resolve(process.cwd(), 'apps/web/data/lab_store.json'),
        path.resolve(process.cwd(), 'data/lab_store.json'),
      ];
      for (const p of candidates) {
        if (p && fs.existsSync(p)) {
          const store = JSON.parse(fs.readFileSync(p, 'utf8'));
          if (Array.isArray(store.devices)) {
            return store.devices;
          }
        }
      }
    } catch (e) {}
    return [];
  }

  getDeviceApiKey(preferredKey) {
    if (preferredKey) return preferredKey;
    if (this.deviceApiKey) return this.deviceApiKey;
    if (process.env.DEVICE_API_KEY) return process.env.DEVICE_API_KEY;
    const devices = this.readStoreDevicesFromDisk();
    if (devices.length > 0) {
      const bc30 = devices.find((d) => d.id === 'dev-mindray-bc30' || (d.model && d.model.includes('BC-30')));
      const chosen = bc30 || devices[0];
      if (chosen?.apiKey) {
        this.deviceApiKey = chosen.apiKey;
        return this.deviceApiKey;
      }
    }
    return 'dev-mindray-bc30';
  }

  /**
   * Builds a Mindray & HL7 v2.3.1 compliant MLLP ACK^R01 frame.
   */
  buildHl7Ack(hl7Message) {
    const firstSegment = (hl7Message || '').split(/\r\n|\r|\n/)[0] || '';
    const fields = firstSegment.split('|');
    const sendingApp = fields[2] || 'BC-30s';
    const sendingFac = fields[3] || 'Mindray';
    const msgControlId = fields[9] || '1';
    const procId = fields[10] || 'P';
    const versionId = fields[11] || '2.3.1';
    const charSet = fields[17] || 'UNICODE';
    const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

    return (
      `\x0bMSH|^~\\&|LIS|LAB|${sendingApp}|${sendingFac}|${ts}||ACK^R01|${msgControlId}|${procId}|${versionId}||||||${charSet}\r` +
      `MSA|AA|${msgControlId}||||0\r\x1c\r`
    );
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
   * Start TCP Analyzer Listener + Outbound TCP Client Manager
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

    // Start periodic sync for TCP_CLIENT devices (e.g. Mindray BC-30s on 192.168.1.101:5100)
    this.startClientSyncLoop();

    return new Promise((resolve) => {
      this.server = net.createServer((socket) => {
        const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
        console.log(`🔌 [Device Bridge] Analyzer connected from ${clientInfo}`);
        this.activeSockets.add(socket);

        socket.setKeepAlive(true, 15000);
        socket.setNoDelay(true);

        const session = {
          buffer: Buffer.alloc(0),
          frames: [],
          hasChecksumError: false,
          errorReason: null,
          clientInfo,
          deviceApiKey: null,
        };

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
          console.warn(`⚠️ [Device Bridge] Port ${this.tcpPort} in use. Outbound TCP Client mode remains active.`);
        } else {
          console.error('❌ [Device Bridge] TCP Server error:', err.message);
        }
        this.isRunning = true;
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
   * Polls configured devices and maintains outbound TCP Client connections
   * for analyzers operating as TCP Servers (e.g., Mindray BC-30s on port 5100).
   */
  startClientSyncLoop() {
    if (this.syncTimer) clearInterval(this.syncTimer);
    setTimeout(() => this.syncClientDevices(), 2000);
    this.syncTimer = setInterval(() => this.syncClientDevices(), 5000);
  }

  fetchDevicesFromWeb() {
    return new Promise((resolve) => {
      const req = http.get(
        {
          hostname: '127.0.0.1',
          port: this.webPort,
          path: '/api/devices?bridge=1',
          timeout: 3000,
        },
        (res) => {
          let body = '';
          res.on('data', (d) => { body += d; });
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (Array.isArray(parsed)) return resolve(parsed);
              if (parsed && Array.isArray(parsed.devices)) return resolve(parsed.devices);
            } catch (e) {}
            resolve(this.readStoreDevicesFromDisk());
          });
        }
      );
      req.on('error', () => resolve(this.readStoreDevicesFromDisk()));
      req.on('timeout', () => {
        req.destroy();
        resolve(this.readStoreDevicesFromDisk());
      });
    });
  }

  async syncClientDevices() {
    try {
      const devices = await this.fetchDevicesFromWeb();
      if (!Array.isArray(devices)) return;

      const desiredMap = new Map();
      for (const dev of devices) {
        if (!dev || dev.active === false || dev.status === 'OFFLINE') continue;
        const ip = (dev.ipAddress || '').trim();
        const port = Number(dev.port) || 5100;
        const isClientMode =
          dev.connectionType === 'TCP_CLIENT' ||
          (ip && (port === 5100 || (dev.model && String(dev.model).toUpperCase().includes('BC-30'))));

        if (isClientMode && ip && ip !== '0.0.0.0') {
          desiredMap.set(dev.id, {
            id: dev.id,
            name: dev.name || 'Mindray BC-30s',
            host: ip,
            port,
            apiKey: dev.apiKey || dev.id,
          });
        }
      }

      // Close removed or reconfigured client connections
      for (const [devId, conn] of this.clientConnections.entries()) {
        const target = desiredMap.get(devId);
        if (!target || target.host !== conn.host || target.port !== conn.port) {
          try { conn.socket.destroy(); } catch (e) {}
          this.clientConnections.delete(devId);
        }
      }

      // Open new client connections where needed
      for (const [devId, target] of desiredMap.entries()) {
        if (!this.clientConnections.has(devId)) {
          this.connectToAnalyzerServer(target);
        }
      }
    } catch (e) {}
  }

  connectToAnalyzerServer(target) {
    const socket = new net.Socket();
    const state = {
      socket,
      host: target.host,
      port: target.port,
      connecting: true,
      apiKey: target.apiKey,
      name: target.name,
    };
    this.clientConnections.set(target.id, state);

    const session = {
      buffer: Buffer.alloc(0),
      frames: [],
      hasChecksumError: false,
      errorReason: null,
      clientInfo: `${target.host}:${target.port} (${target.name})`,
      deviceApiKey: target.apiKey,
    };

    socket.connect(target.port, target.host, () => {
      state.connecting = false;
      socket.setKeepAlive(true, 15000);
      socket.setNoDelay(true);
      console.log(`✅ [Device Bridge] Connected as TCP Client to ${target.name} at ${target.host}:${target.port}`);
    });

    socket.on('data', async (chunk) => {
      try {
        if (session.buffer.length + chunk.length > 2 * 1024 * 1024) {
          session.buffer = Buffer.alloc(0);
          session.frames = [];
          return;
        }
        session.buffer = Buffer.concat([session.buffer, chunk]);
        await this.processSessionBuffer(socket, session);
      } catch (err) {
        console.error(`❌ [Device Bridge] TCP Client chunk error (${target.host}:${target.port}):`, err.message);
      }
    });

    socket.on('close', () => {
      const current = this.clientConnections.get(target.id);
      if (current && current.socket === socket) {
        this.clientConnections.delete(target.id);
      }
    });

    socket.on('error', () => {
      // Quietly clean up so the 5s sync loop retries when the analyzer is powered on
      const current = this.clientConnections.get(target.id);
      if (current && current.socket === socket) {
        this.clientConnections.delete(target.id);
      }
      try { socket.destroy(); } catch (e) {}
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
          this.forwardToLis(fullMessage, 'ASTM_1394', session.deviceApiKey);
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

      // 4. HL7 MLLP: VT (0x0B) ... FS (0x1C) [CR (0x0D)]
      const vtIdx = session.buffer.indexOf(VT);
      if (vtIdx !== -1) {
        const fsIdx = session.buffer.indexOf(FS, vtIdx + 1);
        if (fsIdx !== -1) {
          const hl7Message = session.buffer.toString('utf8', vtIdx + 1, fsIdx);
          let advanceIdx = fsIdx + 1;
          while (
            advanceIdx < session.buffer.length &&
            (session.buffer[advanceIdx] === CR || session.buffer[advanceIdx] === LF)
          ) {
            advanceIdx++;
          }
          session.buffer = session.buffer.subarray(advanceIdx);
          console.log(`🏥 [Device Bridge] HL7 MLLP Message received (${hl7Message.length} chars) from ${session.clientInfo}`);

          // Transmit standard HL7 v2.3.1 ACK immediately so analyzer synchronous ACK check succeeds
          try {
            const ackMsg = this.buildHl7Ack(hl7Message);
            socket.write(ackMsg);
          } catch (ackErr) {
            console.error(`⚠️ [Device Bridge] Failed to write HL7 ACK:`, ackErr.message);
          }

          this.forwardToLis(hl7Message, 'HL7_V2', session.deviceApiKey);

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
  forwardToLis(rawPayload, protocol, preferredApiKey) {
    const apiKey = this.getDeviceApiKey(preferredApiKey);
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
        'Content-Type': 'application/json; charset=utf-8',
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
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }

    for (const conn of this.clientConnections.values()) {
      try { conn.socket.destroy(); } catch (e) {}
    }
    this.clientConnections.clear();

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

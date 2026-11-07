/**
 * TCP Device Server & Client Manager for Medical Analyzers (ASTM E1381/E1394 & HL7 MLLP)
 * --------------------------------------------------------------------------------------
 * Handles automated interfacing with lab devices over TCP:
 * 1. TCP Server Mode (Default Port: 5000): Listens for inbound connections from analyzers.
 * 2. TCP Client Mode (Outbound -> Analyzer IP:5100): Connects as a TCP Client to analyzers
 *    operating as TCP Servers (e.g. Mindray BC-30 / BC-30s / BC-20s on fixed port 5100).
 *
 * Implements strict ASTM E1381 low-level framing & checksum validation and HL7 v2.3.1 MLLP:
 * - Handshake: ENQ (0x05) -> ACK (0x06)
 * - Frames: <STX>[frame_bytes]<ETX|ETB>[checksum_hex]<CR><LF>
 * - Checksum: sum([frame_bytes]) % 256 compared with received checksum.
 *   - Match   -> ACK (0x06)
 *   - Mismatch -> NAK (0x15), marks session invalid, REJECTS database save!
 * - Termination: EOT (0x04) -> If clean, parses ASTM 1394 & saves results in DB.
 * - HL7 MLLP: <VT> (0x0B) ... <FS> (0x1C) [<CR> (0x0D)] -> Immediate ACK^R01 + DB ingest.
 */

import net from 'net';
import { prisma } from '../prisma';
import { processDeviceIngest } from './deviceEngine';

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

interface ClientSession {
  buffer: Buffer;
  frames: string[];
  hasChecksumError: boolean;
  errorReason?: string;
  clientInfo: string;
  deviceApiKey?: string;
}

let tcpServerInstance: net.Server | null = null;
const activeSockets = new Set<net.Socket>();
const outboundClients = new Map<string, { socket: net.Socket; host: string; port: number }>();
let clientSyncInterval: NodeJS.Timeout | null = null;

/**
 * Calculates ASTM E1381 2-digit Hex Checksum
 * Sum of byte values from immediately after STX up to and including ETX/ETB modulo 256.
 */
export function calculateAstmChecksum(data: Buffer | Uint8Array): string {
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    sum = (sum + data[i]) & 0xff;
  }
  return sum.toString(16).toUpperCase().padStart(2, '0');
}

/**
 * Builds a Mindray & HL7 v2.3.1 compliant MLLP ACK^R01 message.
 */
export function buildHl7Ack(hl7Message: string): string {
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
 * Finds active ASTM/TCP device in DB or creates a default one.
 */
export async function getOrRegisterAstmDevice() {
  let device = await prisma.labDevice.findFirst({
    where: {
      isActive: true,
      OR: [
        { connectionType: 'TCP_IP' },
        { connectionType: 'TCP_CLIENT' },
        { protocol: 'ASTM_1394' },
        { protocol: 'HL7_V2' },
      ],
    },
    include: {
      mappings: {
        include: { testCatalog: true },
      },
    },
  });

  if (!device) {
    device = await prisma.labDevice.findFirst({
      include: {
        mappings: {
          include: { testCatalog: true },
        },
      },
    });
  }

  if (!device) {
    device = await prisma.labDevice.create({
      data: {
        name: 'جهاز تحليل الدم الآلي (Mindray BC-30s)',
        brand: 'Mindray',
        model: 'BC-30s / BC-5000',
        category: 'CBC',
        connectionType: 'TCP_CLIENT',
        protocol: 'HL7_V2',
        ipAddress: '192.168.1.101',
        port: 5100,
        autoMatchSample: true,
        status: 'ONLINE',
      },
      include: {
        mappings: {
          include: { testCatalog: true },
        },
      },
    });
  }

  return device;
}

/**
 * Periodically checks DB for TCP_CLIENT analyzers (e.g. Mindray BC-30s on 192.168.1.101:5100)
 * and maintains persistent outbound TCP connections.
 */
async function syncOutboundTcpClients() {
  try {
    const devices = await prisma.labDevice.findMany({
      where: { isActive: true },
    });

    const desired = new Map<string, { id: string; name: string; host: string; port: number; apiKey: string }>();
    for (const dev of devices) {
      const ip = (dev.ipAddress || '').trim();
      const port = Number(dev.port) || 5100;
      const isClient =
        dev.connectionType === 'TCP_CLIENT' ||
        (ip && (port === 5100 || (dev.model && dev.model.toUpperCase().includes('BC-30'))));

      if (isClient && ip && ip !== '0.0.0.0') {
        desired.set(dev.id, {
          id: dev.id,
          name: dev.name,
          host: ip,
          port,
          apiKey: dev.apiKey,
        });
      }
    }

    for (const [devId, existing] of outboundClients.entries()) {
      const target = desired.get(devId);
      if (!target || target.host !== existing.host || target.port !== existing.port) {
        try { existing.socket.destroy(); } catch {}
        outboundClients.delete(devId);
      }
    }

    for (const [devId, target] of desired.entries()) {
      if (!outboundClients.has(devId)) {
        const socket = new net.Socket();
        outboundClients.set(devId, { socket, host: target.host, port: target.port });

        const session: ClientSession = {
          buffer: Buffer.alloc(0),
          frames: [],
          hasChecksumError: false,
          clientInfo: `${target.host}:${target.port} (${target.name})`,
          deviceApiKey: target.apiKey,
        };

        socket.connect(target.port, target.host, () => {
          socket.setKeepAlive(true, 15000);
          socket.setNoDelay(true);
          console.log(`✅ [HL7 TCP Client] Connected to analyzer ${target.name} at ${target.host}:${target.port}`);
        });

        socket.on('data', async (chunk) => {
          try {
            if (session.buffer.length + chunk.length > 2 * 1024 * 1024) {
              session.buffer = Buffer.alloc(0);
              session.frames = [];
              return;
            }
            session.buffer = Buffer.concat([session.buffer, chunk]);
            await processSessionBuffer(socket, session);
          } catch (err: any) {
            console.error(`❌ [HL7 TCP Client] Error processing chunk from ${session.clientInfo}:`, err.message);
          }
        });

        socket.on('close', () => {
          const cur = outboundClients.get(devId);
          if (cur && cur.socket === socket) outboundClients.delete(devId);
        });

        socket.on('error', () => {
          const cur = outboundClients.get(devId);
          if (cur && cur.socket === socket) outboundClients.delete(devId);
          try { socket.destroy(); } catch {}
        });
      }
    }
  } catch {}
}

/**
 * Start TCP Device Server on specified port (default: 5000 or process.env.DEVICE_TCP_PORT)
 */
export function startTcpDeviceServer(port?: number): Promise<net.Server> {
  return new Promise((resolve, reject) => {
    if (tcpServerInstance) {
      return resolve(tcpServerInstance);
    }

    const TCP_PORT = port || Number(process.env.DEVICE_TCP_PORT) || 5000;

    if (!clientSyncInterval) {
      setTimeout(() => { syncOutboundTcpClients(); }, 2000);
      clientSyncInterval = setInterval(() => { syncOutboundTcpClients(); }, 5000);
    }

    const server = net.createServer((socket) => {
      const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
      console.log(`🔌 [ASTM TCP] Medical device connected from ${clientInfo}`);
      activeSockets.add(socket);

      socket.setKeepAlive(true, 15000);
      socket.setNoDelay(true);

      const session: ClientSession = {
        buffer: Buffer.alloc(0),
        frames: [],
        hasChecksumError: false,
        clientInfo,
      };

      socket.on('data', async (chunk) => {
        try {
          if (session.buffer.length + chunk.length > 1024 * 1024) {
            console.warn(`⚠️ [ASTM TCP] Runaway buffer detected (>1MB) from ${clientInfo}. Flushing.`);
            session.buffer = Buffer.alloc(0);
            session.frames = [];
            return;
          }
          session.buffer = Buffer.concat([session.buffer, chunk]);
          await processSessionBuffer(socket, session);
        } catch (err: any) {
          console.error(`❌ [ASTM TCP] Error processing chunk from ${clientInfo}:`, err.message);
        }
      });

      socket.on('close', () => {
        console.log(`🔌 [ASTM TCP] Device disconnected: ${clientInfo}`);
        activeSockets.delete(socket);
      });

      socket.on('error', (err) => {
        console.error(`⚠️ [ASTM TCP] Socket error on ${clientInfo}:`, err.message);
        activeSockets.delete(socket);
        socket.destroy();
      });
    });

    server.on('error', (err) => {
      console.error('❌ [ASTM TCP] Server error:', err);
      reject(err);
    });

    server.listen(TCP_PORT, '0.0.0.0', () => {
      console.log(`📡 [ASTM TCP] Medical Analyzer Listener active on 0.0.0.0:${TCP_PORT}`);
      tcpServerInstance = server;
      resolve(server);
    });
  });
}

/**
 * Process buffered bytes according to ASTM E1381 / E1394 & HL7 protocol state machine.
 */
async function processSessionBuffer(socket: net.Socket, session: ClientSession) {
  let progress = true;

  while (progress && session.buffer.length > 0) {
    progress = false;

    // 1. Check for ENQ (0x05) -> Handshake initiation
    if (session.buffer[0] === ENQ) {
      console.log(`🔬 [ASTM TCP] <ENQ> received from ${session.clientInfo} -> Sending <ACK> (0x06)`);
      session.frames = [];
      session.hasChecksumError = false;
      session.errorReason = undefined;
      socket.write(Buffer.from([ACK]));
      session.buffer = session.buffer.subarray(1);
      progress = true;
      continue;
    }

    // 2. Check for EOT (0x04) -> End of Transmission
    if (session.buffer[0] === EOT) {
      console.log(`🏁 [ASTM TCP] <EOT> received from ${session.clientInfo}`);
      session.buffer = session.buffer.subarray(1);

      if (session.hasChecksumError) {
        console.warn(
          `🚫 [ASTM TCP] REJECTED: Transmission completed with checksum errors (${session.errorReason}). ` +
          `Refusing to save ${session.frames.length} frames to database.`
        );
      } else if (session.frames.length > 0) {
        console.log(`✅ [ASTM TCP] Transmission SUCCESS (${session.frames.length} frames). Saving to DB...`);
        const fullMessage = session.frames.join('\r\n');
        
        try {
          const apiKey = session.deviceApiKey || (await getOrRegisterAstmDevice()).apiKey;
          const ingestResult = await processDeviceIngest({
            apiKey,
            rawFrame: fullMessage,
            protocol: 'ASTM_1394',
          });
          console.log(`🎉 [ASTM TCP] Ingest completed:`, {
            sampleNumber: ingestResult.sampleNumber,
            totalItems: ingestResult.totalItems,
            matchedItems: ingestResult.matchedItems,
            appliedItems: ingestResult.appliedItems,
          });
        } catch (dbErr: any) {
          console.error(`❌ [ASTM TCP] Ingestion processing failed:`, dbErr.message);
        }
      }

      // Reset session state
      session.frames = [];
      session.hasChecksumError = false;
      session.errorReason = undefined;
      progress = true;
      continue;
    }

    // 3. Check for ASTM Frame starting with STX (0x02)
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
          const expectedChecksum = calculateAstmChecksum(bytesToVerify);

          if (receivedChecksum === expectedChecksum) {
            const frameContent = session.buffer.toString('utf8', 1, endCharIdx);
            session.frames.push(frameContent);
            console.log(`📦 [ASTM TCP] Frame validated [CS: ${receivedChecksum}] -> Sending <ACK> (0x06)`);
            socket.write(Buffer.from([ACK]));
          } else {
            session.hasChecksumError = true;
            session.errorReason = `Checksum mismatch: expected '${expectedChecksum}', received '${receivedChecksum}'`;
            console.warn(`❌ [ASTM TCP] Checksum error: expected '${expectedChecksum}', got '${receivedChecksum}' -> Sending <NAK> (0x15)`);
            socket.write(Buffer.from([NAK]));
          }

          let advanceIdx = endCharIdx + 3;
          if (advanceIdx < session.buffer.length && session.buffer[advanceIdx] === CR) {
            advanceIdx++;
          }
          if (advanceIdx < session.buffer.length && session.buffer[advanceIdx] === LF) {
            advanceIdx++;
          }

          session.buffer = session.buffer.subarray(advanceIdx);
          progress = true;
          continue;
        }
      }
    }

    // 4. Check for HL7 MLLP (0x0B ... 0x1C [0x0D])
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
        console.log(`🏥 [HL7 TCP] MLLP Message received (${hl7Message.length} chars) from ${session.clientInfo}`);

        // Send HL7 ACK immediately
        try {
          const ackMsg = buildHl7Ack(hl7Message);
          socket.write(ackMsg);
        } catch (ackErr: any) {
          console.error(`⚠️ [HL7 TCP] Failed to write ACK:`, ackErr.message);
        }

        try {
          const apiKey = session.deviceApiKey || (await getOrRegisterAstmDevice()).apiKey;
          const ingestResult = await processDeviceIngest({
            apiKey,
            rawFrame: hl7Message,
            protocol: 'HL7_V2',
          });
          console.log(`✅ [HL7 TCP] ACK transmitted, ingest:`, ingestResult.sampleNumber);
        } catch (err: any) {
          console.error(`❌ [HL7 TCP] Processing error:`, err.message);
        }

        progress = true;
        continue;
      }
    }

    // If first byte is unexpected control character or whitespace, skip it
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
 * Stop TCP Device Server
 */
export function stopTcpDeviceServer(): Promise<void> {
  return new Promise((resolve) => {
    if (clientSyncInterval) {
      clearInterval(clientSyncInterval);
      clientSyncInterval = null;
    }

    for (const conn of outboundClients.values()) {
      try { conn.socket.destroy(); } catch {}
    }
    outboundClients.clear();

    for (const socket of activeSockets) {
      socket.destroy();
    }
    activeSockets.clear();

    if (tcpServerInstance) {
      tcpServerInstance.close(() => {
        console.log('🛑 [ASTM TCP] Server stopped.');
        tcpServerInstance = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

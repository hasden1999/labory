/**
 * TCP Device Server for Medical Analyzers (ASTM E1381/E1394 & HL7 MLLP)
 * ---------------------------------------------------------------------
 * Handles automated interfacing with lab devices over TCP (Default Port: 5000).
 * Implements strict ASTM E1381 low-level framing & checksum validation:
 * - Handshake: ENQ (0x05) -> ACK (0x06)
 * - Frames: <STX>[frame_bytes]<ETX|ETB>[checksum_hex]<CR><LF>
 * - Checksum: sum([frame_bytes]) % 256 compared with received checksum.
 *   - Match   -> ACK (0x06)
 *   - Mismatch -> NAK (0x15), marks session invalid, REJECTS database save!
 * - Termination: EOT (0x04) -> If clean, parses ASTM 1394 & saves results in DB.
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
}

let tcpServerInstance: net.Server | null = null;
const activeSockets = new Set<net.Socket>();

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
 * Finds active ASTM/TCP device in DB or creates a default one.
 */
export async function getOrRegisterAstmDevice() {
  let device = await prisma.labDevice.findFirst({
    where: {
      isActive: true,
      OR: [
        { connectionType: 'TCP_IP' },
        { protocol: 'ASTM_1394' },
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
        name: 'جهاز تحليل الدم الآلي (Mindray ASTM)',
        brand: 'Mindray',
        model: 'BC-5000 / BC-3000',
        category: 'CBC',
        connectionType: 'TCP_IP',
        protocol: 'ASTM_1394',
        port: 5000,
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
 * Start TCP Device Server on specified port (default: 5000 or process.env.DEVICE_TCP_PORT)
 */
export function startTcpDeviceServer(port?: number): Promise<net.Server> {
  return new Promise((resolve, reject) => {
    if (tcpServerInstance) {
      return resolve(tcpServerInstance);
    }

    const TCP_PORT = port || Number(process.env.DEVICE_TCP_PORT) || 5000;

    const server = net.createServer((socket) => {
      const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
      console.log(`🔌 [ASTM TCP] Medical device connected from ${clientInfo}`);
      activeSockets.add(socket);

      const session: ClientSession = {
        buffer: Buffer.alloc(0),
        frames: [],
        hasChecksumError: false,
        clientInfo,
      };

      socket.setTimeout(30000);
      socket.on('timeout', () => {
        console.warn(`⏳ [ASTM TCP] Idle socket timeout from ${clientInfo}`);
        activeSockets.delete(socket);
        socket.destroy();
      });

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
      console.log(`📡 [ASTM TCP] Medical Analyzer Listener active on port ${TCP_PORT}`);
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
          const device = await getOrRegisterAstmDevice();
          const ingestResult = await processDeviceIngest({
            apiKey: device.apiKey,
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
      // Discard junk bytes preceding STX if any
      if (stxIdx > 0) {
        session.buffer = session.buffer.subarray(stxIdx);
      }

      // Find ETX (0x03) or ETB (0x17)
      let endCharIdx = -1;
      for (let i = 1; i < session.buffer.length; i++) {
        if (session.buffer[i] === ETX || session.buffer[i] === ETB) {
          endCharIdx = i;
          break;
        }
      }

      if (endCharIdx !== -1) {
        // We need 2 characters of hex checksum following ETX/ETB
        if (session.buffer.length >= endCharIdx + 3) {
          const receivedChecksum = session.buffer
            .toString('ascii', endCharIdx + 1, endCharIdx + 3)
            .trim()
            .toUpperCase();

          // Calculate checksum from byte immediately after STX (index 1) up to and including ETX/ETB (endCharIdx)
          const bytesToVerify = session.buffer.subarray(1, endCharIdx + 1);
          const expectedChecksum = calculateAstmChecksum(bytesToVerify);

          if (receivedChecksum === expectedChecksum) {
            // Frame is valid!
            const frameContent = session.buffer.toString('utf8', 1, endCharIdx);
            session.frames.push(frameContent);
            console.log(`📦 [ASTM TCP] Frame validated [CS: ${receivedChecksum}] -> Sending <ACK> (0x06)`);
            socket.write(Buffer.from([ACK]));
          } else {
            // Checksum error! Send NAK and mark session corrupted
            session.hasChecksumError = true;
            session.errorReason = `Checksum mismatch: expected '${expectedChecksum}', received '${receivedChecksum}'`;
            console.warn(`❌ [ASTM TCP] Checksum error: expected '${expectedChecksum}', got '${receivedChecksum}' -> Sending <NAK> (0x15)`);
            socket.write(Buffer.from([NAK]));
          }

          // Advance past ETX/ETB + 2 hex digits + optional \r\n
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

    // 4. Check for HL7 MLLP (0x0B ... 0x1C 0x0D)
    const vtIdx = session.buffer.indexOf(VT);
    if (vtIdx !== -1) {
      const fsIdx = session.buffer.indexOf(FS, vtIdx + 1);
      if (fsIdx !== -1 && session.buffer.length > fsIdx + 1 && session.buffer[fsIdx + 1] === CR) {
        const hl7Message = session.buffer.toString('utf8', vtIdx + 1, fsIdx);
        session.buffer = session.buffer.subarray(fsIdx + 2);
        console.log(`🏥 [HL7 TCP] MLLP Message received (${hl7Message.length} chars)`);

        try {
          const device = await getOrRegisterAstmDevice();
          const ingestResult = await processDeviceIngest({
            apiKey: device.apiKey,
            rawFrame: hl7Message,
            protocol: 'HL7_V2',
          });

          // Send HL7 ACK
          const msgControlId = hl7Message.split('\r')[0]?.split('|')[9] || '1';
          const ackMsg = `\x0bMSH|^~\\&|LIS|LAB|||${new Date().toISOString()}||ACK^R01|${msgControlId}|P|2.3.1\rMSA|AA|${msgControlId}\r\x1c\r`;
          socket.write(ackMsg);
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
      // Discard stray byte
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

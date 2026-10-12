import { NextResponse } from 'next/server';
import { getStore } from '../../../../lib/serverStore';

function generateAgentCode(device: any): string {
  const apiKey = device?.apiKey || '';
  const port = device?.port || 5100;
  const devName = (device?.name || 'Medical Analyzer').replace(/['"\\]/g, '');

  return `/**
 * LIS Device Hub - Local Communication Agent (Node.js)
 * Standalone background bridge for ${devName}
 * Protocol: ${device?.protocol || 'HL7_V2 / ASTM_1394'}
 */

const http = require('http');
const net = require('net');

const CONFIG = {
  SERVER_URL: process.env.LIS_SERVER_URL || 'http://127.0.0.1:8080',
  DEVICE_API_KEY: process.env.DEVICE_API_KEY || '${apiKey}',
  TCP_PORT: parseInt(process.env.DEVICE_TCP_PORT || '${port}', 10),
  SERIAL_PORT: process.env.DEVICE_COM_PORT || '${device?.comPort || 'COM1'}',
  BAUD_RATE: parseInt(process.env.DEVICE_BAUD_RATE || '${device?.baudRate || 9600}', 10),
};

console.log('=====================================================');
console.log('🏥 LIS Analyzer Local Agent Started - ${devName}');
console.log('Target LIS Server:', CONFIG.SERVER_URL);
console.log('Listening for Analyzers on TCP Port:', CONFIG.TCP_PORT);
console.log('=====================================================');

// TCP Socket Server for HL7/ASTM over LAN
const tcpServer = net.createServer((socket) => {
  const remote = \`\${socket.remoteAddress}:\${socket.remotePort}\`;
  console.log(\`[TCP] Device connected from \${remote}\`);

  let buffer = '';

  socket.on('data', (chunk) => {
    const raw = chunk.toString();
    buffer += raw;

    // Handle ASTM ENQ / ACK handshake
    if (chunk.includes(0x05)) { // ENQ
      console.log('[ASTM] ENQ received -> Sending ACK (0x06)');
      socket.write(Buffer.from([0x06])); // ACK
    } else if (chunk.includes(0x02)) { // STX
      socket.write(Buffer.from([0x06])); // ACK
    }

    // Handle MLLP HL7 End (0x1C 0x0D) or ASTM EOT (0x04)
    if (chunk.includes(0x04) || chunk.includes(0x1C)) {
      console.log(\`[Data] Full message received (\${buffer.length} bytes). Transmitting to LIS...\`);
      sendToLisServer(buffer);
      buffer = '';
    }
  });

  socket.on('close', () => {
    console.log(\`[TCP] Device disconnected: \${remote}\`);
  });

  socket.on('error', (err) => {
    console.error(\`[TCP Error] \${err.message}\`);
  });
});

tcpServer.listen(CONFIG.TCP_PORT, '127.0.0.1', () => {
  console.log(\`[Ready] TCP Socket Server active on 127.0.0.1:\${CONFIG.TCP_PORT} (Desktop-only loopback)\`);
});

function sendToLisServer(payload) {
  const postData = JSON.stringify({
    apiKey: CONFIG.DEVICE_API_KEY,
    rawPayload: payload,
  });

  const url = new URL(\`\${CONFIG.SERVER_URL}/api/devices/ingest\`);
  const options = {
    hostname: url.hostname,
    port: url.port || 80,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'x-api-key': CONFIG.DEVICE_API_KEY,
    },
  };

  const req = http.request(options, (res) => {
    let body = '';
    res.on('data', (d) => { body += d; });
    res.on('end', () => {
      console.log(\`[LIS Response] Status: \${res.statusCode} -> \${body}\`);
    });
  });

  req.on('error', (e) => {
    console.error(\`[LIS Connection Error] \${e.message}\`);
  });

  req.write(postData);
  req.end();
}
`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get('deviceId');
  const store = getStore();

  const device = deviceId
    ? (store.devices || []).find((d) => d.id === deviceId)
    : (store.devices || [])[0];

  if (deviceId && !device) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 });
  }

  const targetDevice = device || {
    id: 'custom-analyzer',
    name: 'Generic Medical Analyzer',
    apiKey: '',
    port: 5100,
  };

  const code = generateAgentCode(targetDevice);

  return new NextResponse(code, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Content-Disposition': `attachment; filename="lis-agent-${targetDevice.id}.js"`,
    },
  });
}

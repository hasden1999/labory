import { initDbWAL } from '../prisma';
import { startTcpDeviceServer } from './tcpDeviceServer';

async function main() {
  await initDbWAL();
  const PORT = Number(process.env.DEVICE_TCP_PORT) || 5000;
  await startTcpDeviceServer(PORT);
  console.log(`⚡ TCP Device Server running on port ${PORT} (ASTM E1381/E1394).`);
}

main().catch((err) => {
  console.error('Fatal error starting TCP Device Server:', err);
  process.exit(1);
});

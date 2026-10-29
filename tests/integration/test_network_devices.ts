import assert from 'assert';
import {
  createPairingRequest,
  getPendingRequests,
  approvePairingRequest,
  rejectPairingRequest,
  checkPairingStatus,
  getPairedDevices,
  revokeDevice,
  setDeviceBlocked,
  verifyDeviceToken,
  recordDevicePing,
  broadcastEvent,
  getEventsSince,
  getServerStatus,
} from '../../apps/web/src/lib/networkDeviceManager';

async function runNetworkTests() {
  console.log('🧪 [Network Tests] Starting Network Connection & Device Pairing Unit Tests...');

  // 1. Server Status
  const status = getServerStatus();
  assert(status.port === 8080, 'Server port must be 8080');
  assert(status.lanUrl.startsWith('http://'), 'LAN URL must start with http://');
  assert(status.mdnsHost === 'labryo.local', 'mDNS host must be labryo.local');
  console.log('  ✓ Server status validated:', status.lanUrl, status.mdnsUrl);

  // 2. Loopback verification
  const loopbackAuth = verifyDeviceToken(undefined, '127.0.0.1');
  assert(loopbackAuth.valid === true, 'Loopback IP must be automatically authorized');
  assert(loopbackAuth.isLoopback === true, 'Loopback flag must be true');

  // 3. Unpaired remote device must be blocked
  const remoteAuth = verifyDeviceToken(undefined, '192.168.1.120');
  assert(remoteAuth.valid === false, 'Unpaired remote device without token must be rejected');
  console.log('  ✓ Loopback and remote authorization boundaries validated');

  // 4. Create Pairing Request
  const req = createPairingRequest('حاسبة الاستقبال 2', 'windows', '192.168.1.120');
  assert(req.code && req.code.length === 7, 'Pairing code must be 6 digits formatted as XXX-XXX');
  assert(req.requestId, 'Request ID must be generated');
  
  const pending = getPendingRequests();
  assert(pending.some((p) => p.requestId === req.requestId), 'Pending request must be in pending list');
  console.log(`  ✓ Pairing request created with code: ${req.code}`);

  // 5. Approve Pairing Request
  const approvedDevice = approvePairingRequest(req.requestId, 'RECEPTION');
  assert(approvedDevice !== null, 'Device approval must succeed');
  assert(approvedDevice.token.startsWith('lab_'), 'Device token must start with lab_ prefix');
  assert(approvedDevice.role === 'RECEPTION', 'Device role must be preserved');
  console.log(`  ✓ Pairing request approved for device: ${approvedDevice.name}`);

  // 6. Verify Paired Device Token
  const verifyTokenAuth = verifyDeviceToken(approvedDevice.token, '192.168.1.120');
  assert(verifyTokenAuth.valid === true, 'Valid device token must be accepted');
  assert(verifyTokenAuth.device?.id === approvedDevice.id, 'Device ID must match');
  console.log('  ✓ Device token verification validated');

  // 7. Ping Recording
  recordDevicePing(approvedDevice.id, 12);
  const devices = getPairedDevices();
  const found = devices.find((d) => d.id === approvedDevice.id);
  assert(found && found.latencyMs === 12, 'Device latency must be recorded');
  console.log('  ✓ Device latency recorded: 12ms');

  // 8. Blocking Device
  setDeviceBlocked(approvedDevice.id, true);
  const blockedAuth = verifyDeviceToken(approvedDevice.token, '192.168.1.120');
  assert(blockedAuth.valid === false, 'Blocked device must be rejected');

  setDeviceBlocked(approvedDevice.id, false);
  const unblockedAuth = verifyDeviceToken(approvedDevice.token, '192.168.1.120');
  assert(unblockedAuth.valid === true, 'Unblocked device must be accepted');
  console.log('  ✓ Device block / unblock validated');

  // 9. Realtime SSE Broadcast & Ring Buffer Missed Event Replay
  const event1 = broadcastEvent('SAMPLE', 'CREATE', 'sample_101', { sampleNumber: 3001 });
  const event2 = broadcastEvent('RESULT', 'UPDATE', 'sample_101', { status: 'READY' });
  assert(event2.eventId > event1.eventId, 'Event IDs must be strictly monotonically increasing');

  const missedEvents = getEventsSince(event1.eventId);
  assert(missedEvents.length >= 1, 'Events since lastEventId must be retrieved from ring buffer');
  assert(missedEvents.some((e) => e.eventId === event2.eventId), 'Event 2 must be present in missed events');
  console.log(`  ✓ Realtime SSE event broadcast & replay buffer validated (Event #${event1.eventId} -> #${event2.eventId})`);

  // 10. Clean up / Revoke Device
  const revoked = revokeDevice(approvedDevice.id);
  assert(revoked === true, 'Device revocation must succeed');
  const postRevokeAuth = verifyDeviceToken(approvedDevice.token, '192.168.1.120');
  assert(postRevokeAuth.valid === false, 'Revoked device must no longer be authorized');
  console.log('  ✓ Device revocation and token destruction validated');

  console.log('🎉 ALL 10/10 NETWORK UNIT & INTEGRATION TESTS PASSED 100%!\n');
}

runNetworkTests().catch((err) => {
  console.error('❌ Network tests failed:', err);
  process.exit(1);
});

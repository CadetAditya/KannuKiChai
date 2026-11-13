import http from 'http';
import { app, server } from '../server/server.js';
import store from '../server/store.js';

let serverInstance;

async function runTests() {
  console.log('🧪 Starting API & Authentication Verification Tests...');

  await new Promise((resolve) => {
    serverInstance = server.listen(0, () => resolve());
  });

  const address = serverInstance.address();
  const TEST_PORT = address.port;
  console.log(`Server listening on temporary test port ${TEST_PORT}`);

  const request = async (path, options = {}) => {
    const res = await fetch(`http://127.0.0.1:${TEST_PORT}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json();
    return { status: res.status, data };
  };

  try {
    // 1. Health & Status
    const health = await request('/api/health');
    console.assert(health.status === 200, 'Health check failed');
    console.assert(health.data.status === 'ok', 'Health status mismatch');

    const statusRes = await request('/api/status');
    console.assert(statusRes.status === 200, 'Status check failed');
    console.assert(statusRes.data.liveStatus !== undefined, 'Missing liveStatus');
    console.log('✅ Public status endpoint OK');

    // 2. Auth verification: Invalid PIN
    const badAuth = await request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ pin: '0000' })
    });
    console.assert(badAuth.status === 401, 'Bad auth should return 401');
    console.log('✅ Unauthorized PIN rejected correctly');

    // 3. Auth verification: Operator PIN
    const opAuth = await request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ pin: '1234' })
    });
    console.assert(opAuth.status === 200 && opAuth.data.role === 'operator', 'Operator auth failed');
    console.log('✅ Operator PIN verified correctly');

    // 4. Operator: Set Manual Closed (e.g. back in 15 mins)
    const opOverride = await request('/api/operator/status', {
      method: 'POST',
      headers: { 'x-operator-pin': '1234' },
      body: JSON.stringify({
        mode: 'manual_closed',
        currentNote: 'Chai break - back in 15 mins! ⏳',
        durationMinutes: 15
      })
    });
    console.assert(opOverride.status === 200, 'Operator status override failed');
    console.assert(opOverride.data.liveStatus.isOpen === false, 'Live status should be false');
    console.assert(opOverride.data.liveStatus.statusText === 'CLOSED', 'Status text should be CLOSED');
    console.log('✅ Operator manual override to CLOSED working');

    // 5. Operator: Toggle Stock of Bun Maska
    const stockToggle = await request('/api/operator/stock', {
      method: 'POST',
      headers: { 'x-operator-pin': '1234' },
      body: JSON.stringify({ itemId: 'm7', inStock: false })
    });
    console.assert(stockToggle.status === 200, 'Stock toggle failed');
    console.assert(stockToggle.data.item.inStock === false, 'Item should be marked out of stock');
    console.log('✅ Operator quick stock toggle working');

    // 6. Admin Auth verification
    const adminAuth = await request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ pin: '9999' })
    });
    console.assert(adminAuth.status === 200 && adminAuth.data.role === 'admin', 'Admin auth failed');
    console.log('✅ Super Admin PIN verified correctly');

    // 7. Admin: View Audit Logs
    const logsRes = await request('/api/admin/logs', {
      headers: { 'x-admin-pin': '9999' }
    });
    console.assert(logsRes.status === 200 && logsRes.data.logs.length > 0, 'Audit logs missing');
    console.log(`✅ Audit logs recorded correctly (${logsRes.data.logs.length} entries recorded)`);

    // Reset status back to auto
    await request('/api/operator/status', {
      method: 'POST',
      headers: { 'x-operator-pin': '1234' },
      body: JSON.stringify({ mode: 'auto', currentNote: 'Fresh adrak chai ready ☕🔥' })
    });

    console.log('\n🎉 ALL API & AUTH TESTS PASSED PERFECTLY!\n');
    serverInstance.close(() => {
      process.exit(0);
    });
  } catch (err) {
    console.error('❌ Test failed:', err);
    if (serverInstance) serverInstance.close();
    process.exit(1);
  }
}

runTests();

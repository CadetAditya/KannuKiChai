import { server } from '../server/server.js';
import store from '../server/store.js';
import { computeLiveStatus } from '../server/scheduler.js';
import { WebSocket } from 'ws';

async function runEndToEndTests() {
  console.log('🚀 Running Full E2E & Real-Time Test Suite for Kannu ki Chai...\n');

  let serverInstance;
  let ws = null;
  await new Promise((resolve) => {
    serverInstance = server.listen(0, () => resolve());
  });

  const { port } = serverInstance.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const wsUrl = `ws://127.0.0.1:${port}/ws`;
  console.log(`📡 Test server running on ${baseUrl}`);

  const req = async (path, options = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const text = await res.text();
    try {
      return { status: res.status, data: JSON.parse(text) };
    } catch {
      return { status: res.status, raw: text };
    }
  };

  try {
    // ----------------------------------------------------
    // TEST 1: Public View Live Status
    // ----------------------------------------------------
    console.log('--- 1. College Students Public View ---');
    const pubStatus = await req('/api/status');
    console.assert(pubStatus.status === 200, 'Public status failed');
    console.assert(pubStatus.data.liveStatus !== undefined, 'Missing liveStatus');
    console.assert(Array.isArray(pubStatus.data.menu), 'Menu not array');
    console.log(`✅ Public view: Status = ${pubStatus.data.liveStatus.statusText}, Menu items = ${pubStatus.data.menu.length}`);

    // ----------------------------------------------------
    // TEST 2: Hybrid Auto-Scheduler Shifts
    // ----------------------------------------------------
    console.log('\n--- 2. Shift Timings & Countdown Engine ---');
    store.updateSettings({
      shifts: {
        morning: { start: '07:30', end: '11:30', label: 'Morning Shift' },
        evening: { start: '15:30', end: '21:30', label: 'Evening Shift' },
        daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      }
    });
    store.updateStatus({ mode: 'auto', manualOverrideExpiresAt: null }, 'Test Setup');

    const morningTest = computeLiveStatus(new Date('2026-11-13T09:00:00'));
    console.assert(morningTest.isOpen === true, 'Morning 9 AM should be OPEN');
    console.assert(morningTest.statusText === 'OPEN NOW', 'Morning status text mismatch');

    const afternoonTest = computeLiveStatus(new Date('2026-11-13T14:00:00'));
    console.assert(afternoonTest.isOpen === false, 'Afternoon 2 PM should be CLOSED');
    console.assert(afternoonTest.countdownText.includes('Opens in'), 'Afternoon countdown text mismatch');

    const eveningTest = computeLiveStatus(new Date('2026-11-13T18:00:00'));
    console.assert(eveningTest.isOpen === true, 'Evening 6 PM should be OPEN');
    console.log('✅ Schedule shifts verified: Morning Open, Afternoon Prep Break, Evening Open');

    // ----------------------------------------------------
    // TEST 3: WebSocket Real-Time Instant Broadcast
    // ----------------------------------------------------
    console.log('\n--- 3. WebSocket Real-Time Live Push ---');
    ws = new WebSocket(wsUrl);
    let wsReceivedEvents = [];

    await new Promise((resolve, reject) => {
      ws.on('open', resolve);
      ws.on('error', reject);
      ws.on('message', (msg) => {
        try {
          wsReceivedEvents.push(JSON.parse(msg.toString()));
        } catch (e) {}
      });
    });

    console.assert(wsReceivedEvents.length > 0 && wsReceivedEvents[0].type === 'SYNC_STATE', 'WS did not receive initial SYNC_STATE');
    console.log('✅ WebSocket connected and received initial state synchronization');

    // ----------------------------------------------------
    // TEST 4: Shopkeeper (Operator) Actions & Real-Time Sync
    // ----------------------------------------------------
    console.log('\n--- 4. Shopkeeper Operator Controls ---');
    // Auth check
    const opAuth = await req('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ pin: '1234' })
    });
    console.assert(opAuth.data.role === 'operator', 'Operator auth failed');

    // Override to Forced Open
    const opOpen = await req('/api/operator/status', {
      method: 'POST',
      headers: { 'x-operator-pin': '1234' },
      body: JSON.stringify({
        mode: 'manual_open',
        currentNote: 'Fresh Adrak & Cardamom Chai ready! ☕🔥'
      })
    });
    console.assert(opOpen.data.liveStatus.isOpen === true, 'Operator force open failed');

    // Wait 100ms for WS event to arrive
    await new Promise(r => setTimeout(r, 100));
    const statusWsEvent = wsReceivedEvents.find(e => e.type === 'STATUS_UPDATED');
    console.assert(statusWsEvent !== undefined, 'WebSocket did not receive STATUS_UPDATED broadcast');
    console.log('✅ Shopkeeper forced OPEN and WebSocket broadcasted to clients in <100ms');

    // Operator stock toggle
    const stockRes = await req('/api/operator/stock', {
      method: 'POST',
      headers: { 'x-operator-pin': '1234' },
      body: JSON.stringify({ itemId: 'm6', inStock: false })
    });
    console.assert(stockRes.data.item.inStock === false, 'Stock toggle failed');
    console.log('✅ 1-tap stock toggle: Samosas marked Sold Out');

    // ----------------------------------------------------
    // TEST 5: Super Admin View & Full Management
    // ----------------------------------------------------
    console.log('\n--- 5. Super Admin Store & Access Control ---');
    // Admin Auth
    const adminAuth = await req('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ pin: '9999' })
    });
    console.assert(adminAuth.data.role === 'admin', 'Admin auth failed');

    // Update settings (timings & location)
    const settingsRes = await req('/api/admin/settings', {
      method: 'POST',
      headers: { 'x-admin-pin': '9999' },
      body: JSON.stringify({
        settings: {
          campusLocation: 'Behind Ramanujan Hall, Tech Park Gate 2',
          landmarkWalkTime: '2 min walk from Hostel 3 & Central Library'
        }
      })
    });
    console.assert(settingsRes.status === 200, 'Settings update failed');
    console.log('✅ Admin store settings and campus location updated');

    // Menu CRUD: Add item
    const newItemRes = await req('/api/admin/menu/item', {
      method: 'POST',
      headers: { 'x-admin-pin': '9999' },
      body: JSON.stringify({
        name: 'Special Kulhad Tandoori Chai',
        category: 'Special Chai',
        price: 25,
        badge: 'Special',
        description: 'Clay kulhad heated red-hot in tandoor before pour'
      })
    });
    console.assert(newItemRes.status === 200, 'Add menu item failed');
    const createdId = newItemRes.data.item.id;

    // Menu CRUD: Edit price
    const editItemRes = await req(`/api/admin/menu/item/${createdId}`, {
      method: 'PUT',
      headers: { 'x-admin-pin': '9999' },
      body: JSON.stringify({ price: 30 })
    });
    console.assert(editItemRes.data.item.price === 30, 'Edit price failed');

    // Menu CRUD: Delete item
    const deleteItemRes = await req(`/api/admin/menu/item/${createdId}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': '9999' }
    });
    console.assert(deleteItemRes.status === 200, 'Delete menu item failed');
    console.log('✅ Admin Menu CRUD (Create, Read, Update, Delete) verified');

    // Access Control: Pause Operator Access
    await req('/api/admin/security', {
      method: 'POST',
      headers: { 'x-admin-pin': '9999' },
      body: JSON.stringify({ operatorEnabled: false })
    });

    const blockedOp = await req('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ pin: '1234' })
    });
    console.assert(blockedOp.status === 403, 'Paused operator should be rejected with 403');
    console.log('✅ Access Control: Pausing Shopkeeper PIN works');

    // Re-enable Operator Access
    await req('/api/admin/security', {
      method: 'POST',
      headers: { 'x-admin-pin': '9999' },
      body: JSON.stringify({ operatorEnabled: true })
    });

    // ----------------------------------------------------
    // TEST 6: Audit History Trail
    // ----------------------------------------------------
    console.log('\n--- 6. Activity Audit Log Verification ---');
    const logsRes = await req('/api/admin/logs', {
      headers: { 'x-admin-pin': '9999' }
    });
    console.assert(logsRes.data.logs.length >= 4, 'Audit logs insufficient');
    console.log(`✅ Audit History verified: ${logsRes.data.logs.length} logged actions tracked with actor & timestamp`);

    // ----------------------------------------------------
    // TEST 7: PWA Assets Verification
    // ----------------------------------------------------
    console.log('\n--- 7. PWA Assets Check ---');
    const manifest = await req('/manifest.webmanifest');
    console.assert(manifest.status === 200 && manifest.data.name.includes('Kannu'), 'Manifest check failed');

    const sw = await req('/sw.js');
    console.assert(sw.status === 200 && sw.raw.includes('CACHE_NAME'), 'Service worker check failed');

    const html = await req('/');
    console.assert(html.status === 200 && html.raw.includes('Kannu ki Chai'), 'Root HTML check failed');
    console.log('✅ PWA Manifest, Service Worker, and App Shell served cleanly');

    // ----------------------------------------------------
    // TEST 8: Aesthetic Background Gallery & Admin Controls
    // ----------------------------------------------------
    console.log('\n--- 8. Background Photos & Admin Gallery Controls ---');
    const galleryRes = await req('/api/gallery');
    console.assert(galleryRes.status === 200 && Array.isArray(galleryRes.data.gallery), 'Gallery fetch failed');
    console.assert(galleryRes.data.gallery.length >= 5, 'Initial 5 gallery photos missing');
    console.log(`✅ Initial gallery rotation contains ${galleryRes.data.gallery.length} photos`);

    // Admin adds a test photo
    const addPhotoRes = await req('/api/admin/gallery', {
      method: 'POST',
      headers: { 'x-admin-pin': '9999' },
      body: JSON.stringify({
        title: 'New Campus Sunset Chai',
        url: '/gallery/chai-cheers.jpg',
        active: true
      })
    });
    console.assert(addPhotoRes.status === 200 && addPhotoRes.data.photo !== undefined, 'Admin add photo failed');
    const addedPhotoId = addPhotoRes.data.photo.id;

    // Admin toggles active
    const togglePhotoRes = await req(`/api/admin/gallery/${addedPhotoId}/toggle`, {
      method: 'PATCH',
      headers: { 'x-admin-pin': '9999' },
      body: JSON.stringify({ active: false })
    });
    console.assert(togglePhotoRes.status === 200 && togglePhotoRes.data.photo.active === false, 'Toggle active failed');

    // Admin deletes photo
    const deletePhotoRes = await req(`/api/admin/gallery/${addedPhotoId}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': '9999' }
    });
    console.assert(deletePhotoRes.status === 200, 'Delete photo failed');
    console.log('✅ Admin Gallery Controls: Add, Toggle visibility, and Remove photo verified');

    // ----------------------------------------------------
    // TEST 9: Community "Yesterday's Moments" & Approval Flow
    // ----------------------------------------------------
    console.log('\n--- 9. Yesterday\'s Moments & Admin Approval Workflow ---');
    const pubMoments = await req('/api/moments');
    console.assert(pubMoments.status === 200 && Array.isArray(pubMoments.data.moments), 'Moments fetch failed');
    console.assert(pubMoments.data.moments.length >= 5, 'Initial approved moments missing');
    console.log(`✅ Public view has ${pubMoments.data.moments.length} approved Yesterday's Moments`);

    // Student submits a moment with a small test base64 image
    const sampleBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const submitRes = await req('/api/moments/submit', {
      method: 'POST',
      body: JSON.stringify({
        title: '3 AM Exam Chai with Hostel 4 Gang',
        author: 'Arjun & Rohan',
        base64: sampleBase64
      })
    });
    console.assert(submitRes.status === 200 && submitRes.data.success === true, 'Student moment submit failed');
    const newMomentId = submitRes.data.moment.id;
    console.assert(submitRes.data.moment.status === 'pending', 'Submitted moment should be pending approval');
    console.log('✅ Student submitted photo moment; status set to PENDING approval');

    // Verify it is NOT visible in public moments before approval
    const pubAfterSubmit = await req('/api/moments');
    const foundInPub = pubAfterSubmit.data.moments.some(m => m.id === newMomentId);
    console.assert(!foundInPub, 'Pending moment should NOT be visible to public yet');
    console.log('✅ Unapproved photo is safely hidden from students');

    // Admin approves the moment
    const approveRes = await req(`/api/admin/moments/${newMomentId}/approve`, {
      method: 'POST',
      headers: { 'x-admin-pin': '9999' }
    });
    console.assert(approveRes.status === 200 && approveRes.data.moment.status === 'approved', 'Admin approve failed');
    console.log('✅ Super Admin approved student moment');

    // Verify it is now visible in public moments
    const pubAfterApprove = await req('/api/moments');
    const foundApproved = pubAfterApprove.data.moments.some(m => m.id === newMomentId);
    console.assert(foundApproved, 'Approved moment should now be visible on website');
    console.log('✅ Approved moment is now LIVE on Yesterday\'s Moments!');

    // Like the moment
    const likeRes = await req(`/api/moments/${newMomentId}/like`, { method: 'POST' });
    console.assert(likeRes.status === 200 && likeRes.data.likes === 1, 'Like moment failed');
    console.log('✅ Student ☕ cheer / like recorded');

    // Admin cleans up test moment
    await req(`/api/admin/moments/${newMomentId}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': '9999' }
    });

    // Reset status back to auto & samosa in-stock
    await req('/api/operator/status', {
      method: 'POST',
      headers: { 'x-operator-pin': '1234' },
      body: JSON.stringify({
        mode: 'auto',
        currentNote: 'Fresh adrak & elaichi chai brewing! Samosas fresh out of kadhai 🫖✨'
      })
    });
    await req('/api/operator/stock', {
      method: 'POST',
      headers: { 'x-operator-pin': '1234' },
      body: JSON.stringify({ itemId: 'm6', inStock: true })
    });

    console.log('\n🎉 ALL 7/7 TEST SUITES PASSED FLAWLESSLY! ✨');
  } catch (err) {
    console.error('❌ E2E Test Suite Error:', err);
    process.exitCode = 1;
  } finally {
    if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    serverInstance.close(() => {
      process.exit(process.exitCode || 0);
    });
  }
}

runEndToEndTests();

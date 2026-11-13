import express from 'express';
import store from './store.js';
import { computeLiveStatus } from './scheduler.js';

const router = express.Router();

// Middleware: Authenticate Operator
function requireOperator(req, res, next) {
  const pin = req.headers['x-operator-pin'] || req.body.pin;
  const state = store.getState();

  if (!state.auth.operatorEnabled) {
    return res.status(403).json({
      error: 'Operator access is temporarily paused by Admin. Contact store owner.'
    });
  }

  if (pin !== state.auth.operatorPin && pin !== state.auth.adminPin) {
    return res.status(401).json({ error: 'Invalid Operator PIN.' });
  }

  req.actor = pin === state.auth.adminPin ? 'Super Admin' : 'Shopkeeper';
  next();
}

// Middleware: Authenticate Super Admin
function requireAdmin(req, res, next) {
  const pin = req.headers['x-admin-pin'] || req.body.pin;
  const state = store.getState();

  if (pin !== state.auth.adminPin) {
    return res.status(401).json({ error: 'Invalid Super Admin PIN.' });
  }

  req.actor = 'Super Admin';
  next();
}

// 1. Auth verification endpoint
router.post('/auth/verify', (req, res) => {
  const { pin, requestedRole } = req.body;
  const state = store.getState();

  if (!pin) {
    return res.status(400).json({ error: 'PIN is required.' });
  }

  if (pin === state.auth.adminPin) {
    return res.json({
      success: true,
      role: 'admin',
      message: 'Super Admin access granted'
    });
  }

  if (pin === state.auth.operatorPin) {
    if (!state.auth.operatorEnabled) {
      return res.status(403).json({
        error: 'Shopkeeper access has been paused by the Super Admin.'
      });
    }
    return res.json({
      success: true,
      role: 'operator',
      message: 'Shopkeeper access granted'
    });
  }

  return res.status(401).json({ error: 'Incorrect PIN. Please try again.' });
});

// 2. Operator: Update Status / Override
router.post('/operator/status', requireOperator, (req, res) => {
  const { mode, currentNote, durationMinutes } = req.body;

  if (mode && !['auto', 'manual_open', 'manual_closed'].includes(mode)) {
    return res.status(400).json({ error: 'Invalid mode specified.' });
  }

  let manualOverrideExpiresAt = null;
  if (durationMinutes && durationMinutes > 0) {
    manualOverrideExpiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  }

  const updates = {};
  if (mode) updates.mode = mode;
  if (typeof currentNote === 'string') updates.currentNote = currentNote.trim();
  if (mode === 'auto') updates.manualOverrideExpiresAt = null;
  else if (manualOverrideExpiresAt) updates.manualOverrideExpiresAt = manualOverrideExpiresAt;

  const updatedStatus = store.updateStatus(updates, req.actor);
  const liveStatus = computeLiveStatus();

  res.json({
    success: true,
    status: updatedStatus,
    liveStatus
  });
});

// 3. Operator: Toggle Stock
router.post('/operator/stock', requireOperator, (req, res) => {
  const { itemId, inStock } = req.body;

  if (!itemId || typeof inStock !== 'boolean') {
    return res.status(400).json({ error: 'itemId and inStock (boolean) are required.' });
  }

  const updatedItem = store.toggleItemStock(itemId, inStock, req.actor);
  if (!updatedItem) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  res.json({
    success: true,
    item: updatedItem
  });
});

// 4. Admin: Update Store Settings & Shift Timings
router.post('/admin/settings', requireAdmin, (req, res) => {
  const settings = req.body.settings || req.body;
  if (!settings) {
    return res.status(400).json({ error: 'Settings payload required.' });
  }

  const updated = store.updateSettings(settings, req.actor);
  res.json({
    success: true,
    settings: updated,
    liveStatus: computeLiveStatus()
  });
});

// 5. Admin: Security & PIN Management
router.post('/admin/security', requireAdmin, (req, res) => {
  const { operatorPin, adminPin, operatorEnabled } = req.body;
  const updates = {};

  if (operatorPin) {
    if (operatorPin.length < 4) {
      return res.status(400).json({ error: 'Operator PIN must be at least 4 digits.' });
    }
    updates.operatorPin = operatorPin;
  }

  if (adminPin) {
    if (adminPin.length < 4) {
      return res.status(400).json({ error: 'Admin PIN must be at least 4 digits.' });
    }
    updates.adminPin = adminPin;
  }

  if (typeof operatorEnabled === 'boolean') {
    updates.operatorEnabled = operatorEnabled;
  }

  store.updateAuth(updates, req.actor);

  res.json({
    success: true,
    message: 'Security credentials updated successfully',
    operatorEnabled: store.getState().auth.operatorEnabled
  });
});

// 6. Admin: Menu Management (Add, Edit, Delete)
router.post('/admin/menu/item', requireAdmin, (req, res) => {
  const { name, category, price, description, badge, inStock } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Name and price are required.' });
  }

  const state = store.getState();
  const newItem = {
    id: `m-${Date.now()}`,
    name: name.trim(),
    category: category || 'Special Chai',
    price: Number(price) || 0,
    description: description ? description.trim() : '',
    badge: badge ? badge.trim() : null,
    inStock: inStock !== undefined ? inStock : true
  };

  const newMenu = [...state.menu, newItem];
  store.updateMenu(newMenu, req.actor);

  res.json({
    success: true,
    item: newItem,
    menu: newMenu
  });
});

router.put('/admin/menu/item/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const state = store.getState();

  const itemIndex = state.menu.findIndex(m => m.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  const updatedMenu = [...state.menu];
  updatedMenu[itemIndex] = {
    ...updatedMenu[itemIndex],
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : updatedMenu[itemIndex].price
  };

  store.updateMenu(updatedMenu, req.actor);

  res.json({
    success: true,
    item: updatedMenu[itemIndex],
    menu: updatedMenu
  });
});

router.delete('/admin/menu/item/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const state = store.getState();

  const item = state.menu.find(m => m.id === id);
  if (!item) {
    return res.status(404).json({ error: 'Item not found.' });
  }

  const updatedMenu = state.menu.filter(m => m.id !== id);
  store.updateMenu(updatedMenu, req.actor);

  res.json({
    success: true,
    deletedId: id,
    menu: updatedMenu
  });
});

// 7. Admin: Activity Audit Logs
router.get('/admin/logs', requireAdmin, (req, res) => {
  const state = store.getState();
  res.json({
    logs: state.logs,
    count: state.logs.length
  });
});

router.post('/admin/logs/clear', requireAdmin, (req, res) => {
  store.clearLogs(req.actor);
  res.json({
    success: true,
    message: 'Logs cleared successfully'
  });
});

export default router;

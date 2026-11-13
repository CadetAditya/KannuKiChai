import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import store from './store.js';
import { computeLiveStatus } from './scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'data', 'uploads');

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

// 8. Admin: Gallery Management (Upload, Add, Remove, Toggle)
router.get('/gallery', (req, res) => {
  const state = store.getState();
  res.json({
    gallery: state.gallery || []
  });
});

router.post('/admin/gallery', requireAdmin, (req, res) => {
  const { title, url, active } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Image URL is required.' });
  }

  const newPhoto = store.addGalleryPhoto({ title, url, active }, req.actor);
  res.json({
    success: true,
    photo: newPhoto,
    gallery: store.getState().gallery
  });
});

router.post('/admin/gallery/upload', requireAdmin, (req, res) => {
  const { title, base64, filename } = req.body;
  if (!base64) {
    return res.status(400).json({ error: 'Base64 image data is required.' });
  }

  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Extract raw base64 data
    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = '.jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = '.png';
      else if (mime.includes('webp')) ext = '.webp';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64, 'base64');
    }

    const safeName = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    const photo = store.addGalleryPhoto({
      title: title || 'Uploaded Tapri Photo',
      url: publicUrl,
      active: true
    }, req.actor);

    res.json({
      success: true,
      photo,
      gallery: store.getState().gallery
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to save uploaded photo' });
  }
});

router.delete('/admin/gallery/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const removed = store.removeGalleryPhoto(id, req.actor);
  if (!removed) {
    return res.status(404).json({ error: 'Photo not found.' });
  }

  res.json({
    success: true,
    deletedId: id,
    gallery: store.getState().gallery
  });
});

router.patch('/admin/gallery/:id/toggle', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { active } = req.body;
  if (typeof active !== 'boolean') {
    return res.status(400).json({ error: 'Active boolean is required.' });
  }

  const updated = store.toggleGalleryPhoto(id, active, req.actor);
  if (!updated) {
    return res.status(404).json({ error: 'Photo not found.' });
  }

  res.json({
    success: true,
    photo: updated,
    gallery: store.getState().gallery
  });
});

// 9. Community Moments ("Yesterday's Moments" & Student Submissions)
router.get('/moments', (req, res) => {
  const state = store.getState();
  const approved = (state.moments || []).filter(m => m.status === 'approved');
  res.json({
    moments: approved
  });
});

router.post('/moments/submit', (req, res) => {
  const { title, author, base64, filename } = req.body;
  if (!base64) {
    return res.status(400).json({ error: 'Photo is required.' });
  }

  try {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = '.jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) ext = '.png';
      else if (mime.includes('webp')) ext = '.webp';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64, 'base64');
    }

    const safeName = `moment-${Date.now()}-${Math.random().toString(36).substring(2, 6)}${ext}`;
    const filePath = path.join(UPLOADS_DIR, safeName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${safeName}`;
    const newMoment = store.submitMoment({
      title: title || 'Campus Chai Memory',
      author: author || 'Campus Student',
      url: publicUrl
    });

    res.json({
      success: true,
      message: 'Photo submitted successfully! It will appear on Yesterday\'s Moments after admin approval.',
      moment: newMoment
    });
  } catch (err) {
    console.error('Moment submission error:', err);
    res.status(500).json({ error: 'Failed to upload moment' });
  }
});

router.post('/moments/:id/like', (req, res) => {
  const { id } = req.params;
  const updated = store.likeMoment(id);
  if (!updated) {
    return res.status(404).json({ error: 'Moment not found.' });
  }
  res.json({ success: true, likes: updated.likes });
});

router.get('/admin/moments', requireAdmin, (req, res) => {
  const state = store.getState();
  res.json({
    moments: state.moments || []
  });
});

router.post('/admin/moments/:id/approve', requireAdmin, (req, res) => {
  const { id } = req.params;
  const approved = store.approveMoment(id, req.actor);
  if (!approved) {
    return res.status(404).json({ error: 'Moment not found.' });
  }
  res.json({
    success: true,
    moment: approved,
    moments: store.getState().moments
  });
});

router.post('/admin/moments/:id/reject', requireAdmin, (req, res) => {
  const { id } = req.params;
  const rejected = store.rejectMoment(id, req.actor);
  if (!rejected) {
    return res.status(404).json({ error: 'Moment not found.' });
  }
  res.json({
    success: true,
    moments: store.getState().moments
  });
});

router.delete('/admin/moments/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = store.deleteMoment(id, req.actor);
  if (!deleted) {
    return res.status(404).json({ error: 'Moment not found.' });
  }
  res.json({
    success: true,
    deletedId: id,
    moments: store.getState().moments
  });
});

export default router;

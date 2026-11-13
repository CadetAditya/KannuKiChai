import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

const DEFAULT_STATE = {
  settings: {
    shopName: 'Kannu ki Chai',
    tagline: 'Campus Tapri • Kadak Chai & Garma Garam Samosa',
    campusLocation: 'Behind Ramanujan Hall, near Tech Park Nescafe Corner',
    landmarkWalkTime: '3-5 min walk from Hostels 1-5 & Central Library',
    phone: '+91 98765 43210',
    upiId: 'kannukichai@okhdfcbank',
    shifts: {
      morning: { start: '07:30', end: '11:30', label: 'Morning Shift' },
      evening: { start: '15:30', end: '21:30', label: 'Evening Shift' },
      daysActive: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    }
  },
  status: {
    mode: 'auto', // 'auto' | 'manual_open' | 'manual_closed'
    manualOverrideExpiresAt: null,
    currentNote: 'Fresh adrak & elaichi chai brewing! Samosas fresh out of kadhai 🫖✨',
    updatedAt: new Date().toISOString(),
    updatedBy: 'System Default'
  },
  auth: {
    operatorPin: '1234',
    adminPin: '9999',
    operatorEnabled: true
  },
  menu: [
    {
      id: 'm1',
      name: 'Kadak Adrak Chai',
      category: 'Special Chai',
      price: 15,
      inStock: true,
      badge: 'Bestseller',
      description: 'Slow simmered with freshly crushed winter ginger & organic tea leaves'
    },
    {
      id: 'm2',
      name: 'Masala Kulhad Chai',
      category: 'Special Chai',
      price: 20,
      inStock: true,
      badge: 'Must Try',
      description: 'Served in authentic clay kulhad with Kannu special roasted 7-spice blend'
    },
    {
      id: 'm3',
      name: 'Special Elaichi Chai',
      category: 'Special Chai',
      price: 15,
      inStock: true,
      badge: null,
      description: 'Green cardamom pods steeped in rich creamy buffalo milk'
    },
    {
      id: 'm4',
      name: 'Sulaimani Lemon Chai',
      category: 'Special Chai',
      price: 15,
      inStock: true,
      badge: null,
      description: 'Soothing spiced black tea with fresh mint sprigs and citrus squeeze'
    },
    {
      id: 'm5',
      name: 'Cutting Chai',
      category: 'Special Chai',
      price: 10,
      inStock: true,
      badge: 'Campus Fav',
      description: 'Quick student dose: half cup strong, sweet, and piping hot'
    },
    {
      id: 'm6',
      name: 'Garma Garam Samosa (2 pcs)',
      category: 'Snacks & Bites',
      price: 25,
      inStock: true,
      badge: 'Hot Seller',
      description: 'Crispy flaky crust stuffed with spiced potato & peas, served with mint chutney'
    },
    {
      id: 'm7',
      name: 'Bun Maska',
      category: 'Snacks & Bites',
      price: 30,
      inStock: true,
      badge: 'Classic',
      description: 'Soft bakery bun sliced and slathered generously with fresh Amul butter'
    },
    {
      id: 'm8',
      name: 'Cheese Bun Maska',
      category: 'Snacks & Bites',
      price: 45,
      inStock: true,
      badge: null,
      description: 'Toasted bun loaded with creamy butter and grated melting cheddar'
    },
    {
      id: 'm9',
      name: 'Aloo Patties',
      category: 'Snacks & Bites',
      price: 20,
      inStock: true,
      badge: null,
      description: 'Multi-layered crispy puff pastry stuffed with savory mashed potatoes'
    },
    {
      id: 'm10',
      name: 'Osmania Biscuits (3 pcs)',
      category: 'Snacks & Bites',
      price: 15,
      inStock: true,
      badge: null,
      description: 'Crisp melt-in-the-mouth buttery biscuits, perfect for chai dunking'
    },
    {
      id: 'm11',
      name: 'Cold Coffee with Cream',
      category: 'Cold Beverages',
      price: 40,
      inStock: true,
      badge: 'Popular',
      description: 'Thick blended iced coffee topped with chocolate syrup drizzle'
    },
    {
      id: 'm12',
      name: 'Shikanji / Nimbu Paani',
      category: 'Cold Beverages',
      price: 20,
      inStock: true,
      badge: null,
      description: 'Chilled freshly squeezed lemonade with black salt and roasted cumin'
    }
  ],
  logs: [
    {
      id: 'log-1',
      timestamp: new Date().toISOString(),
      actor: 'System',
      action: 'INIT',
      details: 'Kannu ki Chai live system initialized with default shift schedule.'
    }
  ]
};

class Store {
  constructor() {
    this.data = { ...DEFAULT_STATE };
    this.listeners = new Set();
    this.init();
  }

  init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Merge with defaults to ensure all fields exist
        this.data = {
          settings: { ...DEFAULT_STATE.settings, ...(parsed.settings || {}) },
          status: { ...DEFAULT_STATE.status, ...(parsed.status || {}) },
          auth: { ...DEFAULT_STATE.auth, ...(parsed.auth || {}) },
          menu: Array.isArray(parsed.menu) ? parsed.menu : DEFAULT_STATE.menu,
          logs: Array.isArray(parsed.logs) ? parsed.logs : DEFAULT_STATE.logs
        };
      } else {
        this.persist();
      }
    } catch (err) {
      console.error('Error loading store, using defaults:', err);
      this.data = { ...DEFAULT_STATE };
    }
  }

  persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write store file:', err);
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(event, payload) {
    for (const cb of this.listeners) {
      try {
        cb(event, payload);
      } catch (e) {
        console.error('Listener notification error:', e);
      }
    }
  }

  getState() {
    return this.data;
  }

  addLog(actor, action, details) {
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      actor,
      action,
      details
    };
    // Keep last 300 logs
    this.data.logs.unshift(logEntry);
    if (this.data.logs.length > 300) {
      this.data.logs = this.data.logs.slice(0, 300);
    }
    this.persist();
    this.notify('NEW_LOG', logEntry);
    return logEntry;
  }

  updateStatus(updates, actor = 'System') {
    const oldMode = this.data.status.mode;
    const oldNote = this.data.status.currentNote;

    this.data.status = {
      ...this.data.status,
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: actor
    };

    let logMessage = `Status updated by ${actor}. Mode: ${this.data.status.mode}`;
    if (updates.currentNote && updates.currentNote !== oldNote) {
      logMessage += ` | Note: "${updates.currentNote}"`;
    }
    this.addLog(actor, 'STATUS_UPDATE', logMessage);

    this.persist();
    this.notify('STATUS_UPDATED', this.data.status);
    return this.data.status;
  }

  updateSettings(settingsUpdates, actor = 'Super Admin') {
    this.data.settings = {
      ...this.data.settings,
      ...settingsUpdates
    };
    this.addLog(actor, 'SETTINGS_UPDATE', 'Store settings and shift timings updated.');
    this.persist();
    this.notify('SETTINGS_UPDATED', this.data.settings);
    return this.data.settings;
  }

  updateAuth(authUpdates, actor = 'Super Admin') {
    this.data.auth = {
      ...this.data.auth,
      ...authUpdates
    };
    this.addLog(actor, 'SECURITY_UPDATE', 'Access credentials or operator permissions updated.');
    this.persist();
    return true;
  }

  toggleItemStock(itemId, inStock, actor = 'Operator') {
    const item = this.data.menu.find(m => m.id === itemId);
    if (item) {
      item.inStock = inStock;
      this.addLog(actor, 'MENU_STOCK', `${item.name} marked as ${inStock ? 'IN STOCK' : 'SOLD OUT'}`);
      this.persist();
      this.notify('MENU_UPDATED', this.data.menu);
      return item;
    }
    return null;
  }

  updateMenu(newMenu, actor = 'Super Admin') {
    this.data.menu = newMenu;
    this.addLog(actor, 'MENU_UPDATE', 'Menu inventory and pricing structure updated.');
    this.persist();
    this.notify('MENU_UPDATED', this.data.menu);
    return this.data.menu;
  }

  clearLogs(actor = 'Super Admin') {
    this.data.logs = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        actor,
        action: 'LOGS_CLEARED',
        details: 'Audit history cleared by administrator.'
      }
    ];
    this.persist();
    this.notify('LOGS_CLEARED', this.data.logs);
  }
}

export const store = new Store();
export default store;

import { WebSocketServer, WebSocket } from 'ws';
import store from './store.js';
import { computeLiveStatus } from './scheduler.js';

let wss = null;
let lastCalculatedStatus = null;

export function setupRealtime(server) {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Send immediate snapshot on connect
    const fullState = getLivePayload();
    ws.send(JSON.stringify({
      type: 'SYNC_STATE',
      payload: fullState
    }));

    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
        }
      } catch (e) {
        // ignore malformed message
      }
    });

    ws.on('close', () => {
      // client disconnected
      broadcastClientCount();
    });

    broadcastClientCount();
  });

  // Keep-alive heartbeat every 30s
  const interval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Periodic status transition watcher (every 10 seconds)
  // If in auto mode and time crosses into a new shift or out of one, broadcast immediately!
  setInterval(() => {
    checkAndBroadcastAutoTransition();
  }, 10000);

  // Subscribe to store updates and broadcast to all connected clients
  store.subscribe((event, payload) => {
    broadcast(event, {
      ...payload,
      liveStatus: computeLiveStatus()
    });
  });

  return wss;
}

export function getClientCount() {
  if (!wss) return 0;
  let count = 0;
  wss.clients.forEach(c => {
    if (c.readyState === WebSocket.OPEN) count++;
  });
  return count;
}

function broadcastClientCount() {
  const count = getClientCount();
  broadcast('ACTIVE_VIEWERS', { count });
}

export function broadcast(type, payload) {
  if (!wss) return;
  const message = JSON.stringify({
    type,
    payload,
    timestamp: new Date().toISOString()
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(message);
      } catch (err) {
        console.error('Failed to send to client:', err);
      }
    }
  });
}

export function checkAndBroadcastAutoTransition() {
  const currentStatus = computeLiveStatus();
  if (!lastCalculatedStatus) {
    lastCalculatedStatus = currentStatus;
    return;
  }

  // Check if open/closed status or shift changed
  if (
    currentStatus.isOpen !== lastCalculatedStatus.isOpen ||
    currentStatus.currentShift !== lastCalculatedStatus.currentShift
  ) {
    lastCalculatedStatus = currentStatus;
    broadcast('STATUS_TRANSITION', {
      liveStatus: currentStatus,
      message: `Status automatically transitioned to ${currentStatus.statusText}`
    });
  }
}

export function getLivePayload() {
  const state = store.getState();
  const liveStatus = computeLiveStatus();
  lastCalculatedStatus = liveStatus;

  return {
    liveStatus,
    settings: state.settings,
    menu: state.menu,
    gallery: state.gallery || [],
    operatorEnabled: state.auth.operatorEnabled,
    activeViewers: getClientCount(),
    serverTime: new Date().toISOString()
  };
}

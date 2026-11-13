import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { sound } from '../utils/sound';

const RealtimeContext = createContext(null);

export function RealtimeProvider({ children }) {
  const [data, setData] = useState({
    liveStatus: {
      isOpen: false,
      mode: 'auto',
      statusText: 'LOADING...',
      badgeText: 'Connecting to Tapri...',
      accentColor: 'rose',
      countdownText: 'Checking live timings...',
      targetTime: null,
      secondsLeft: null,
      currentShift: '',
      nextAction: '',
      currentNote: 'Brewing fresh tea...',
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    },
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
    menu: [],
    gallery: [],
    operatorEnabled: true,
    activeViewers: 1,
    serverTime: new Date().toISOString()
  });

  const [connected, setConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  
  // Auth state for Operator / Admin
  const [authRole, setAuthRole] = useState(null); // null | 'operator' | 'admin'
  const [authPin, setAuthPin] = useState('');

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const prevStatusRef = useRef(null);

  const fetchSnapshot = async () => {
    try {
      const res = await fetch('/api/status');
      if (res.ok) {
        const json = await res.json();
        setData(prev => ({ ...prev, ...json }));
        setLastSyncTime(new Date());
      }
    } catch (err) {
      console.warn('Fallback status poll failed:', err);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchSnapshot();

    // WebSocket connection logic
    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            handleWsMessage(msg);
          } catch (err) {
            console.error('Error handling WS message:', err);
          }
        };

        ws.onclose = () => {
          setConnected(false);
          reconnectTimeoutRef.current = setTimeout(connectWS, 2500);
        };

        ws.onerror = () => {
          setConnected(false);
        };
      } catch (e) {
        setConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWS, 3000);
      }
    };

    connectWS();

    // Fallback periodic poll every 10s
    const pollInterval = setInterval(() => {
      if (!connected) {
        fetchSnapshot();
      }
    }, 10000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pollInterval);
    };
  }, []);

  const handleWsMessage = (msg) => {
    setLastSyncTime(new Date());

    switch (msg.type) {
      case 'SYNC_STATE':
        setData(prev => ({ ...prev, ...msg.payload }));
        break;

      case 'STATUS_UPDATED':
      case 'STATUS_TRANSITION':
        setData(prev => {
          const newLive = msg.payload.liveStatus || { ...prev.liveStatus, ...msg.payload };
          // Check if open/closed state flipped to trigger sound
          if (prevStatusRef.current !== null && prevStatusRef.current !== newLive.isOpen) {
            if (newLive.isOpen) {
              sound.playSuccess();
            } else {
              sound.playWarning();
            }
          }
          prevStatusRef.current = newLive.isOpen;
          return {
            ...prev,
            liveStatus: newLive
          };
        });
        break;

      case 'MENU_UPDATED':
        setData(prev => ({
          ...prev,
          menu: Array.isArray(msg.payload) ? msg.payload : msg.payload.menu || prev.menu
        }));
        break;

      case 'GALLERY_UPDATED':
        setData(prev => ({
          ...prev,
          gallery: Array.isArray(msg.payload) ? msg.payload : msg.payload.gallery || prev.gallery
        }));
        break;

      case 'SETTINGS_UPDATED':
        setData(prev => ({
          ...prev,
          settings: { ...prev.settings, ...(msg.payload.settings || msg.payload) },
          liveStatus: msg.payload.liveStatus || prev.liveStatus
        }));
        break;

      case 'ACTIVE_VIEWERS':
        setData(prev => ({
          ...prev,
          activeViewers: msg.payload.count || prev.activeViewers
        }));
        break;

      default:
        break;
    }
  };

  const logout = () => {
    setAuthRole(null);
    setAuthPin('');
    sound.playTap();
  };

  return (
    <RealtimeContext.Provider
      value={{
        ...data,
        connected,
        lastSyncTime,
        authRole,
        setAuthRole,
        authPin,
        setAuthPin,
        logout,
        refresh: fetchSnapshot
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within RealtimeProvider');
  }
  return context;
}

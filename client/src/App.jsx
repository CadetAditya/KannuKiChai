import React, { useState } from 'react';
import { RealtimeProvider, useRealtime } from './context/RealtimeContext';
import { Lock, Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';
import { sound } from './utils/sound';
import StatusCard from './components/StatusCard';
import LiveNotesBanner from './components/LiveNotesBanner';
import WhatsAppShare from './components/WhatsAppShare';
import ScheduleModal from './components/ScheduleModal';
import StudentMenu from './components/StudentMenu';
import PinModal from './components/PinModal';
import OperatorView from './components/OperatorView';
import AdminDashboard from './components/admin/AdminDashboard';
import InstallPrompt from './components/InstallPrompt';
import AestheticBackground from './components/AestheticBackground';
import YesterdaysMoments from './components/YesterdaysMoments';

function Header() {
  const { settings, activeViewers, connected } = useRealtime();
  const [soundOn, setSoundOn] = useState(sound.enabled);

  const toggleSound = () => {
    const next = sound.toggleSound();
    setSoundOn(next);
  };

  return (
    <header className="sticky top-0 z-30 px-4 py-3 bg-[#f7f4ed]/90 backdrop-blur-md border-b border-stone-200/90 shadow-sm">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-md shadow-orange-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-xl">
              ☕
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-stone-900 font-heading">
              {settings.shopName}
            </h1>
            <p className="text-[11px] text-stone-500 line-clamp-1 font-medium">
              {settings.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Viewers Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-stone-200/90 text-[11px] text-stone-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-bold text-xs text-stone-900">{activeViewers}</span>
            <span className="hidden xs:inline text-[10px] text-stone-400">watching</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-2 rounded-xl bg-white/90 border border-stone-200/90 text-stone-600 hover:text-stone-900 active:scale-95 transition-all shadow-sm"
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} className="text-stone-400" />}
          </button>
        </div>
      </div>
    </header>
  );
}

function MainContent() {
  const { authRole, settings } = useRealtime();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#f7f4ed] text-[#1c150f]">
      {/* Aesthetic rotating tapri background photos with soft light scrim */}
      <AestheticBackground />

      <Header />
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-5 pb-28 space-y-4">
        {authRole === 'admin' ? (
          <AdminDashboard />
        ) : authRole === 'operator' ? (
          <OperatorView />
        ) : (
          <div className="py-2 space-y-4">
            {/* 1. Large High-Contrast Status Card (OPEN / CLOSED) */}
            <StatusCard onOpenSchedule={() => setShowSchedule(true)} />

            {/* 2. Yesterday's Moments with Share Option & Admin Approval */}
            <YesterdaysMoments />

            {/* Footer with Discreet Staff Padlock */}
            <footer className="pt-6 pb-4 text-center space-y-2">
              <p className="text-[11px] text-stone-400">
                Kannu ki Chai • Campus Tapri Live Status ☕
              </p>
              <div className="flex items-center justify-center">
                <button
                  onClick={() => {
                    sound.playTap();
                    setShowPinModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white border border-stone-200/90 text-[11px] font-semibold text-stone-600 hover:text-stone-900 shadow-sm transition-all active:scale-95"
                >
                  <Lock size={12} className="text-orange-500" />
                  <span>Staff / Admin Login</span>
                </button>
              </div>
            </footer>
          </div>
        )}
      </main>

      {/* Tapri Shift Timings Drawer */}
      <ScheduleModal isOpen={showSchedule} onClose={() => setShowSchedule(false)} />

      {/* Security PIN Keypad Modal */}
      <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} />

      {/* PWA Home Screen Prompt */}
      <InstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <RealtimeProvider>
      <MainContent />
    </RealtimeProvider>
  );
}

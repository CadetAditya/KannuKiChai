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

function Header() {
  const { settings, activeViewers, connected } = useRealtime();
  const [soundOn, setSoundOn] = useState(sound.enabled);

  const toggleSound = () => {
    const next = sound.toggleSound();
    setSoundOn(next);
  };

  return (
    <header className="sticky top-0 z-30 px-4 py-3 bg-[#0d0906]/90 backdrop-blur-md border-b border-[#2a1a10]">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 p-0.5 shadow-lg shadow-orange-950/40 flex items-center justify-center">
            <div className="w-full h-full bg-[#170f0a] rounded-[14px] flex items-center justify-center text-xl">
              ☕
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5 font-heading">
              {settings.shopName}
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                Tapri
              </span>
            </h1>
            <p className="text-[11px] text-[#a89080] line-clamp-1">
              {settings.tagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Viewers Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1b120c] border border-[#382214] text-[11px] text-[#d4bca9]">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <span className="font-semibold text-xs text-white">{activeViewers}</span>
            <span className="hidden xs:inline text-[10px] text-[#9a8274]">live</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-2 rounded-xl bg-[#1b120c] border border-[#382214] text-[#d4bca9] hover:text-white active:scale-95 transition-all"
          >
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} className="text-[#886d5d]" />}
          </button>
        </div>
      </div>
    </header>
  );
}

function MainContent() {
  const { authRole } = useRealtime();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);

  return (
    <div className="relative min-h-screen flex flex-col bg-[#0b0704] text-[#f7eee4]">
      {/* Aesthetic rotating tapri background photos with Ken Burns effect */}
      <AestheticBackground />

      <Header />
      <main className="relative z-10 flex-1 max-w-md w-full mx-auto px-4 py-4 pb-28 space-y-4">
        {authRole === 'admin' ? (
          <AdminDashboard />
        ) : authRole === 'operator' ? (
          <OperatorView />
        ) : (
          <>
            {/* Large High-Contrast Status Card */}
            <StatusCard onOpenSchedule={() => setShowSchedule(true)} />

            {/* Live Shop Notes Banner */}
            <LiveNotesBanner />

            {/* 1-Tap WhatsApp Sharing */}
            <WhatsAppShare />

            {/* Live Menu & Availability */}
            <StudentMenu />

            {/* Footer with Subtle Padlock */}
            <footer className="pt-8 pb-4 text-center space-y-2">
              <p className="text-[11px] text-[#786153]">
                Kannu ki Chai • Built for campus life ☕
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => {
                    sound.playTap();
                    setShowPinModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#170e09] hover:bg-[#22150e] border border-[#2e1d13] text-[11px] font-medium text-[#9a8274] hover:text-[#d4bca9] transition-all"
                >
                  <Lock size={12} className="text-orange-400" />
                  <span>Staff Login</span>
                </button>
              </div>
            </footer>
          </>
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

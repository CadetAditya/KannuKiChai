import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { sound } from '../utils/sound';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Check if user dismissed previously
      if (!localStorage.getItem('kannu_install_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    sound.playTap();
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      sound.playSuccess();
    }
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    sound.playTap();
    setShowPrompt(false);
    localStorage.setItem('kannu_install_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 p-3 rounded-2xl bg-[#1d120a] border border-orange-500/40 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom-3">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-950/50">
          <Smartphone size={18} />
        </div>
        <div>
          <p className="text-xs font-bold text-white font-heading">
            Install Kannu ki Chai App
          </p>
          <p className="text-[10px] text-[#a89080]">
            Add to home screen for 1-tap live status
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-xs font-bold text-white flex items-center gap-1 shadow-sm"
        >
          <Download size={13} /> Install
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-[#8a7263] hover:text-white"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}

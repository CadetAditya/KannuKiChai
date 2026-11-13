import React, { useState, useEffect } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import ChaiSteamingCup from './ChaiSteamingCup';
import { Clock, Sparkles, AlertCircle, CheckCircle2, ChevronRight, MapPin } from 'lucide-react';
import { sound } from '../utils/sound';

export default function StatusCard({ onOpenSchedule }) {
  const { liveStatus, settings } = useRealtime();
  const [secondsRemaining, setSecondsRemaining] = useState(liveStatus.secondsLeft || 0);

  useEffect(() => {
    setSecondsRemaining(liveStatus.secondsLeft || 0);
  }, [liveStatus.secondsLeft, liveStatus.targetTime, liveStatus.mode]);

  // Live second-by-second countdown decrement
  useEffect(() => {
    if (!liveStatus.targetTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const target = new Date(liveStatus.targetTime);
      const diffSecs = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
      setSecondsRemaining(diffSecs);
    }, 1000);

    return () => clearInterval(interval);
  }, [liveStatus.targetTime]);

  const formatCountdown = () => {
    if (secondsRemaining <= 0) {
      return liveStatus.countdownText || 'Schedule in transition...';
    }
    const hours = Math.floor(secondsRemaining / 3600);
    const minutes = Math.floor((secondsRemaining % 3600) / 60);
    const seconds = secondsRemaining % 60;

    const pad = (n) => (n < 10 ? `0${n}` : n);

    if (liveStatus.isOpen) {
      if (hours > 0) {
        return `Closes in ${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
      }
      return `Closes in ${minutes}m ${pad(seconds)}s`;
    } else {
      if (hours > 0) {
        return `Opens in ${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
      }
      return `Opens in ${minutes}m ${pad(seconds)}s`;
    }
  };

  const isOpen = liveStatus.isOpen;

  return (
    <div
      onClick={() => sound.playTap()}
      className={`relative overflow-hidden rounded-3xl p-6 transition-all duration-300 ${
        isOpen
          ? 'bg-gradient-to-b from-[#0a2618] via-[#091b12] to-[#07130d] border-2 border-emerald-500/60 glow-open'
          : 'bg-gradient-to-b from-[#2d0f12] via-[#1c0a0c] to-[#120708] border-2 border-rose-500/60 glow-closed'
      }`}
    >
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isOpen ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isOpen ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            ></span>
          </span>
          <span className={isOpen ? 'text-emerald-300' : 'text-rose-300'}>
            {liveStatus.badgeText || (isOpen ? 'Shift Live' : 'Currently Paused')}
          </span>
        </div>

        {/* Live sync pulse */}
        <div className="text-[10px] font-semibold text-[#a89080] flex items-center gap-1 bg-[#150e09]/60 px-2 py-0.5 rounded-full border border-white/5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span>Live Sync</span>
        </div>
      </div>

      {/* Steaming Chai or Sleeping Kettle */}
      <div className="my-1">
        <ChaiSteamingCup isOpen={isOpen} />
      </div>

      {/* Big High-Contrast Status Text */}
      <div className="text-center mt-3">
        <h2
          className={`text-4xl xs:text-5xl font-black tracking-tight font-heading drop-shadow-md ${
            isOpen ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isOpen ? 'OPEN NOW' : 'CLOSED'}
        </h2>

        {/* Live Countdown Clock */}
        <div className="mt-2.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-black/40 border border-white/10 shadow-inner">
          <Clock size={16} className={isOpen ? 'text-emerald-400 animate-pulse' : 'text-rose-400'} />
          <span className="font-mono text-sm sm:text-base font-bold text-white tracking-wider">
            {formatCountdown()}
          </span>
        </div>

        {/* Shift Details & Next Action */}
        <p className="mt-3 text-xs text-[#d1bcae] max-w-xs mx-auto line-clamp-1 font-medium">
          {liveStatus.currentShift ? `Current: ${liveStatus.currentShift}` : ''}
        </p>
        {liveStatus.nextAction && (
          <p className="text-[11px] text-[#9a8274] mt-0.5">
            {liveStatus.nextAction}
          </p>
        )}
      </div>

      {/* Bottom Schedule Shortcut */}
      {onOpenSchedule && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playTap();
            onOpenSchedule();
          }}
          className="mt-5 w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-[0.99] border border-white/5 text-xs text-[#d4bca9] transition-all"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <span className="text-orange-400">🕒</span> View Today's Tapri Shift Timings
          </span>
          <ChevronRight size={14} className="text-[#a89080]" />
        </button>
      )}
    </div>
  );
}

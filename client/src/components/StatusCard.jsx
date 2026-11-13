import React, { useState, useEffect } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import ChaiSteamingCup from './ChaiSteamingCup';
import { Clock, ChevronRight, Flame, Megaphone } from 'lucide-react';
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
      if (liveStatus.countdownText && !liveStatus.countdownText.toLowerCase().includes('manual')) {
        return liveStatus.countdownText;
      }
      return liveStatus.isOpen ? 'Serving Fresh Chai ☕' : 'Currently Closed';
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
      className={`relative overflow-hidden rounded-3xl p-6 sm:p-7 transition-all duration-300 backdrop-blur-md ${
        isOpen
          ? 'bg-white/95 border-2 border-emerald-500 shadow-2xl shadow-emerald-800/10 glow-open'
          : 'bg-white/95 border-2 border-rose-400 shadow-2xl shadow-rose-800/10 glow-closed'
      }`}
    >
      {/* Steaming Chai or Sleeping Kettle */}
      <div className="my-2">
        <ChaiSteamingCup isOpen={isOpen} />
      </div>

      {/* Big High-Contrast Status Text */}
      <div className="text-center mt-2">
        <h2
          className={`text-5xl xs:text-6xl font-black tracking-tight font-heading ${
            isOpen ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {isOpen ? 'OPEN NOW' : 'CLOSED'}
        </h2>

        {/* Live Countdown Clock */}
        <div
          className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-2xl font-mono text-sm sm:text-base font-bold shadow-sm ${
            isOpen
              ? 'bg-emerald-50 text-emerald-950 border border-emerald-200'
              : 'bg-rose-50 text-rose-950 border border-rose-200'
          }`}
        >
          <Clock size={16} className={isOpen ? 'text-emerald-600 animate-pulse' : 'text-rose-500'} />
          <span className="tracking-wide">{formatCountdown()}</span>
        </div>

        {/* Shift Details & Next Action */}
        {liveStatus.currentShift && !liveStatus.currentShift.toLowerCase().includes('manual') && (
          <p className="mt-3.5 text-xs text-stone-700 max-w-xs mx-auto line-clamp-1 font-semibold">
            {`Current: ${liveStatus.currentShift}`}
          </p>
        )}
        {liveStatus.nextAction && !liveStatus.nextAction.toLowerCase().includes('auto schedule') && (
          <p className="text-[11px] text-stone-500 mt-0.5">
            {liveStatus.nextAction}
          </p>
        )}
      </div>

      {/* Embedded Live Shop Note (if posted by shopkeeper) */}
      {liveStatus.currentNote && (
        <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200/90 flex items-start gap-2.5 text-left">
          <div className="p-1.5 rounded-xl bg-orange-500 text-white flex-shrink-0 mt-0.5 shadow-sm">
            <Flame size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700">
                Live Tapri Note
              </span>
            </div>
            <p className="text-xs font-bold text-stone-900 leading-snug mt-0.5">
              {liveStatus.currentNote}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Schedule Shortcut */}
      {onOpenSchedule && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            sound.playTap();
            onOpenSchedule();
          }}
          className="mt-4 w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-stone-50 hover:bg-stone-100 active:scale-[0.99] border border-stone-200/90 text-xs font-semibold text-stone-700 transition-all shadow-sm"
        >
          <span className="flex items-center gap-1.5">
            <span className="text-orange-500">🕒</span> View Shift Timings & Campus Spot
          </span>
          <ChevronRight size={14} className="text-stone-400" />
        </button>
      )}
    </div>
  );
}

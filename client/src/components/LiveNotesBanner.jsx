import React from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Megaphone, Flame, Clock } from 'lucide-react';

export default function LiveNotesBanner() {
  const { liveStatus } = useRealtime();

  if (!liveStatus.currentNote) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-950/60 via-[#1e130c] to-amber-950/50 border border-orange-500/30 p-3.5 shadow-lg shadow-orange-950/20">
      {/* Decorative flame ember glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none"></div>

      <div className="flex items-start gap-3 relative z-10">
        <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex-shrink-0 mt-0.5">
          <Flame size={18} className="animate-pulse text-orange-400" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
              <Megaphone size={12} /> Live Tapri Update
            </span>
            <span className="text-[10px] text-[#9a8274] flex items-center gap-1">
              <Clock size={10} /> Live
            </span>
          </div>

          <p className="text-sm font-semibold text-white/95 leading-snug">
            {liveStatus.currentNote}
          </p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Power, Flame, Moon, Clock, Check, AlertCircle, LogOut, Sparkles, RefreshCw } from 'lucide-react';
import { sound } from '../utils/sound';

export default function OperatorView() {
  const { liveStatus, menu, authPin, logout, refresh } = useRealtime();
  const [loading, setLoading] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [feedback, setFeedback] = useState('');

  const PRESET_NOTES = [
    { label: 'Fresh adrak chai ready ☕🔥', note: 'Fresh adrak chai ready ☕🔥', duration: null },
    { label: 'Masala chai boiling 🫖', note: 'Masala chai boiling hot! Grab your cutting 🫖', duration: null },
    { label: 'Back in 15 mins ⏳', note: 'Chai break - back in 15 mins! ⏳', duration: 15, setMode: 'manual_closed' },
    { label: 'Taking 10 min break ⏸️', note: 'Short milk refill break - back in 10 mins ⏸️', duration: 10, setMode: 'manual_closed' },
    { label: 'Closed early today 🌙', note: 'Milk and stock over. Closed early for today 🌙', duration: null, setMode: 'manual_closed' },
    { label: 'Only Bun Maska & Chai left! 🥯', note: 'Samosas over! Only Bun Maska & hot chai available 🥯☕', duration: null }
  ];

  const showFeedback = (msg) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3000);
  };

  const handleStatusChange = async (mode, note = null, durationMinutes = null) => {
    setLoading(true);
    sound.playTap();

    try {
      const payload = { mode };
      if (note !== null) payload.currentNote = note;
      if (durationMinutes !== null) payload.durationMinutes = durationMinutes;

      const res = await fetch('/api/operator/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-operator-pin': authPin
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        sound.playSuccess();
        showFeedback(`Status switched to ${mode.toUpperCase()}!`);
        refresh();
      } else {
        sound.playWarning();
        showFeedback(data.error || 'Failed to update status');
      }
    } catch (err) {
      sound.playWarning();
      showFeedback('Network error updating status');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPreset = (preset) => {
    const targetMode = preset.setMode || liveStatus.mode;
    handleStatusChange(targetMode, preset.note, preset.duration);
  };

  const handleCustomNoteSubmit = (e) => {
    e.preventDefault();
    if (!customNote.trim()) return;
    handleStatusChange(liveStatus.mode, customNote.trim(), null);
    setCustomNote('');
  };

  const handleToggleStock = async (item) => {
    sound.playTap();
    const nextStock = !item.inStock;

    try {
      const res = await fetch('/api/operator/stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-operator-pin': authPin
        },
        body: JSON.stringify({
          itemId: item.id,
          inStock: nextStock
        })
      });

      if (res.ok) {
        sound.playSuccess();
        showFeedback(`${item.name}: ${nextStock ? 'IN STOCK' : 'SOLD OUT'}`);
        refresh();
      }
    } catch (err) {
      sound.playWarning();
      showFeedback('Failed to update stock');
    }
  };

  return (
    <div className="space-y-4">
      {/* Operator Header Bar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1c120b] border border-[#3d2415]">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-orange-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
            Shopkeeper Operator Mode
          </span>
          <h2 className="text-base font-bold text-white font-heading">
            Live Tapri Controls
          </h2>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold active:scale-95 transition-all"
        >
          <LogOut size={14} /> Lock & Exit
        </button>
      </div>

      {/* Floating feedback alert */}
      {feedback && (
        <div className="p-3 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <span>{feedback}</span>
          <Check size={14} />
        </div>
      )}

      {/* Live Status Indicator Preview */}
      <div className="p-3.5 rounded-2xl bg-[#140e0a] border border-[#2b1c13] flex items-center justify-between">
        <div>
          <span className="text-[11px] text-[#8a7263]">Students currently see:</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-3 h-3 rounded-full ${liveStatus.isOpen ? 'bg-emerald-500 shadow-md shadow-emerald-500/50' : 'bg-rose-500 shadow-md shadow-rose-500/50'}`}></span>
            <span className={`text-lg font-black font-heading ${liveStatus.isOpen ? 'text-emerald-400' : 'text-rose-400'}`}>
              {liveStatus.statusText}
            </span>
            <span className="text-xs text-[#a89080] font-mono">
              ({liveStatus.mode})
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#8a7263]">Current Note:</span>
          <p className="text-xs text-white max-w-[140px] truncate font-medium">
            {liveStatus.currentNote || 'None'}
          </p>
        </div>
      </div>

      {/* THREE LARGE THUMB-FRIENDLY OVERRIDE BUTTONS */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a8274] px-1 font-heading">
          Instant 1-Tap Status Override
        </h3>

        <div className="grid grid-cols-1 gap-2.5">
          {/* 1. FORCE OPEN SHOP */}
          <button
            disabled={loading}
            onClick={() => handleStatusChange('manual_open', 'Fresh adrak chai ready ☕🔥', null)}
            className={`w-full py-4 px-5 rounded-2xl font-black text-base flex items-center justify-between transition-all active:scale-[0.98] shadow-lg ${
              liveStatus.mode === 'manual_open'
                ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/40 shadow-emerald-950/60'
                : 'bg-[#0f291b] hover:bg-[#133523] text-emerald-300 border-2 border-emerald-500/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-black/20 text-emerald-300 text-xl">☕</span>
              <div className="text-left">
                <div className="text-lg leading-tight font-heading">OPEN SHOP</div>
                <div className="text-[11px] font-normal opacity-80">Force OPEN override for students</div>
              </div>
            </div>
            {liveStatus.mode === 'manual_open' && (
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold">ACTIVE</span>
            )}
          </button>

          {/* 2. FORCE CLOSE SHOP */}
          <button
            disabled={loading}
            onClick={() => handleStatusChange('manual_closed', 'Tapri temporarily closed', null)}
            className={`w-full py-4 px-5 rounded-2xl font-black text-base flex items-center justify-between transition-all active:scale-[0.98] shadow-lg ${
              liveStatus.mode === 'manual_closed'
                ? 'bg-rose-600 text-white ring-4 ring-rose-500/40 shadow-rose-950/60'
                : 'bg-[#2b1014] hover:bg-[#36151a] text-rose-300 border-2 border-rose-500/40'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-black/20 text-rose-300 text-xl">🌙</span>
              <div className="text-left">
                <div className="text-lg leading-tight font-heading">CLOSE SHOP</div>
                <div className="text-[11px] font-normal opacity-80">Force CLOSED override for students</div>
              </div>
            </div>
            {liveStatus.mode === 'manual_closed' && (
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold">ACTIVE</span>
            )}
          </button>

          {/* 3. AUTO SCHEDULE */}
          <button
            disabled={loading}
            onClick={() => handleStatusChange('auto', null, null)}
            className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-between transition-all active:scale-[0.98] shadow-md ${
              liveStatus.mode === 'auto'
                ? 'bg-orange-600 text-white ring-2 ring-orange-500/40 shadow-orange-950/60'
                : 'bg-[#1b120c] hover:bg-[#261910] text-[#c4b0a2] border border-[#3b2518]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-orange-400" />
              <div className="text-left">
                <div className="font-heading">AUTO SCHEDULE</div>
                <div className="text-[11px] font-normal opacity-75">Follow shift morning/evening timer</div>
              </div>
            </div>
            {liveStatus.mode === 'auto' && (
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold">ACTIVE</span>
            )}
          </button>
        </div>
      </div>

      {/* ONE-TAP PRESET NOTES */}
      <div className="space-y-2 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a8274] px-1 font-heading">
          Rush Hour 1-Tap Preset Notes
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {PRESET_NOTES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleApplyPreset(preset)}
              className="p-3 rounded-xl bg-[#170f0a] hover:bg-[#22160f] active:scale-95 border border-[#2d1c12] text-left transition-all"
            >
              <p className="text-xs font-bold text-white leading-tight font-heading">
                {preset.label}
              </p>
              {preset.duration && (
                <span className="mt-1 inline-block text-[10px] text-amber-400 font-mono">
                  ⏳ {preset.duration}m auto timer
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Custom note form */}
        <form onSubmit={handleCustomNoteSubmit} className="pt-1 flex gap-2">
          <input
            type="text"
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            placeholder="Or type custom live note..."
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#140e0a] border border-[#2d1b11] text-xs text-white placeholder-[#786153] focus:outline-none focus:border-orange-500/50"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-xs font-bold text-white transition-all"
          >
            Post
          </button>
        </form>
      </div>

      {/* QUICK ITEM STOCK TOGGLES */}
      <div className="space-y-2 pt-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#9a8274] font-heading">
            1-Tap Menu Stock Status
          </h3>
          <span className="text-[11px] text-[#8a7263]">Tap to toggle in stock / sold out</span>
        </div>

        <div className="space-y-1.5 max-h-72 overflow-y-auto no-scrollbar pr-1">
          {menu.map(item => (
            <div
              key={item.id}
              onClick={() => handleToggleStock(item)}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] ${
                item.inStock
                  ? 'bg-[#150f0b] border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-[#1d0d10] border-rose-500/30 hover:border-rose-500/50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${item.inStock ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-rose-400 shadow-sm shadow-rose-400'}`}></span>
                <div>
                  <h4 className="text-xs font-bold text-white font-heading">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-[#8a7263]">
                    ₹{item.price} • {item.category}
                  </span>
                </div>
              </div>

              {/* Large Thumb Toggle Badge */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStock(item);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all ${
                  item.inStock
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}
              >
                {item.inStock ? 'IN STOCK' : 'SOLD OUT'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


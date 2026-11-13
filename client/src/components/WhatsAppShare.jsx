import React, { useState } from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { sound } from '../utils/sound';

export default function WhatsAppShare() {
  const { liveStatus, settings } = useRealtime();
  const [copied, setCopied] = useState(false);

  const generateShareMessage = () => {
    const statusEmoji = liveStatus.isOpen ? '🟢' : '🔴';
    const statusWord = liveStatus.isOpen ? 'OPEN NOW' : 'CLOSED';
    const noteText = liveStatus.currentNote ? `\n📢 Note: "${liveStatus.currentNote}"` : '';
    const countdown = liveStatus.countdownText ? `\n⏳ ${liveStatus.countdownText}` : '';
    const location = settings.campusLocation ? `\n📍 Landmark: ${settings.campusLocation}` : '';
    const appUrl = window.location.href;

    return (
      `☕ *${settings.shopName}* is ${statusEmoji} *${statusWord}*!${noteText}${countdown}${location}\n\n` +
      `Check live status before walking over:\n${appUrl}`
    );
  };

  const handleWhatsAppClick = () => {
    sound.playTap();
    const text = generateShareMessage();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopy = () => {
    sound.playSuccess();
    const text = generateShareMessage();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="rounded-2xl bg-white/90 border border-stone-200/90 shadow-sm p-3.5 space-y-2.5 backdrop-blur-sm">
      <div className="flex items-center justify-between text-xs text-stone-600">
        <span className="font-bold text-stone-800 flex items-center gap-1.5 font-heading">
          <MessageSquare size={14} className="text-emerald-600" /> Share with Hostel Friends
        </span>
        <span className="text-[11px] text-stone-400">1-Tap Live Status</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Direct WhatsApp Share button */}
        <button
          onClick={handleWhatsAppClick}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 active:scale-95 font-bold text-xs text-white shadow-md shadow-emerald-700/20 transition-all"
        >
          <Share2 size={15} />
          <span>WhatsApp Status</span>
        </button>

        {/* Copy text button */}
        <button
          onClick={handleCopy}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200/90 active:scale-95 border border-stone-200/90 text-xs font-bold text-stone-700 transition-all"
        >
          {copied ? (
            <>
              <Check size={15} className="text-emerald-600" />
              <span className="text-emerald-700 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={15} className="text-stone-500" />
              <span>Copy Message</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

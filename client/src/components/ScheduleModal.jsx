import React from 'react';
import { useRealtime } from '../context/RealtimeContext';
import { X, Clock, Sun, Moon, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { sound } from '../utils/sound';

export default function ScheduleModal({ isOpen, onClose }) {
  const { settings, liveStatus } = useRealtime();

  if (!isOpen) return null;

  const { shifts } = settings;

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    const min = m < 10 ? `0${m}` : m;
    return `${hour}:${min} ${period}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#130d09] border border-[#301c10] rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#26150b] pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Clock size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-white font-heading">
                Tapri Timings & Schedule
              </h3>
              <p className="text-[11px] text-[#9a8274]">
                Daily Morning & Evening Shifts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-white/5 text-[#a89080] hover:text-white hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shifts List */}
        <div className="space-y-2.5">
          {/* Morning Shift */}
          <div className="rounded-2xl bg-[#1b120c] border border-[#382214] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Sun size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white font-heading">
                    {shifts.morning.label || 'Morning Shift'}
                  </span>
                  {liveStatus.isOpen && liveStatus.currentShift?.includes('Morning') && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#bfaea2] font-mono mt-0.5">
                  {formatTime(shifts.morning.start)} - {formatTime(shifts.morning.end)}
                </p>
              </div>
            </div>
            <span className="text-xs text-[#a89080] text-right font-medium">
              Chai & Bun Maska
            </span>
          </div>

          {/* Afternoon Tea Prep Break */}
          <div className="rounded-xl bg-[#150e09]/60 border border-[#26150b] px-3.5 py-2.5 flex items-center justify-between text-xs text-[#8a7263]">
            <span className="flex items-center gap-1.5">
              <span>⏸️</span> Afternoon Fresh Batch Prep & Rest
            </span>
            <span className="font-mono text-[11px]">
              {formatTime(shifts.morning.end)} - {formatTime(shifts.evening.start)}
            </span>
          </div>

          {/* Evening Shift */}
          <div className="rounded-2xl bg-[#1b120c] border border-[#382214] p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Moon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-white font-heading">
                    {shifts.evening.label || 'Evening Shift'}
                  </span>
                  {liveStatus.isOpen && liveStatus.currentShift?.includes('Evening') && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#bfaea2] font-mono mt-0.5">
                  {formatTime(shifts.evening.start)} - {formatTime(shifts.evening.end)}
                </p>
              </div>
            </div>
            <span className="text-xs text-[#a89080] text-right font-medium">
              Samosa & Kulhad Rush
            </span>
          </div>
        </div>

        {/* Location Landmark & Campus Info */}
        <div className="rounded-2xl bg-[#18100b] border border-[#331e12] p-3.5 space-y-2">
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white">Campus Tapri Spot</p>
              <p className="text-xs text-[#c4b0a2] mt-0.5">
                {settings.campusLocation}
              </p>
              <p className="text-[11px] text-orange-400/90 font-medium mt-1">
                🚶 {settings.landmarkWalkTime}
              </p>
            </div>
          </div>
        </div>

        {/* Days Active */}
        <div className="flex items-center justify-between text-xs text-[#9a8274] px-1">
          <span>Weekly Days:</span>
          <span className="text-white font-medium">
            {shifts.daysActive?.join(', ') || 'All Days Active'}
          </span>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-[#20150f] hover:bg-[#291b13] border border-[#3b2518] text-xs font-bold text-white transition-all"
        >
          Close Schedule
        </button>
      </div>
    </div>
  );
}

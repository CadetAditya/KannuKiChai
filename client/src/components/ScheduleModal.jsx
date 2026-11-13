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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#faf7f2] border border-stone-200 rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl text-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-orange-100 text-orange-600 border border-orange-200">
              <Clock size={18} />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900 font-heading">
                Tapri Timings & Schedule
              </h3>
              <p className="text-[11px] text-stone-500">
                Daily Morning & Evening Shifts
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Shifts List */}
        <div className="space-y-2.5">
          {/* Morning Shift */}
          <div className="rounded-2xl bg-white border border-stone-200 p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Sun size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-stone-900 font-heading">
                    {shifts.morning.label || 'Morning Shift'}
                  </span>
                  {liveStatus.isOpen && liveStatus.currentShift?.includes('Morning') && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 font-mono mt-0.5 font-semibold">
                  {formatTime(shifts.morning.start)} - {formatTime(shifts.morning.end)}
                </p>
              </div>
            </div>
            <span className="text-xs text-stone-500 text-right font-medium">
              Chai & Bun Maska
            </span>
          </div>

          {/* Afternoon Tea Prep Break */}
          <div className="rounded-xl bg-stone-100/80 border border-stone-200 px-3.5 py-2.5 flex items-center justify-between text-xs text-stone-600">
            <span className="flex items-center gap-1.5 font-medium">
              <span>⏸️</span> Afternoon Fresh Batch Prep & Rest
            </span>
            <span className="font-mono text-[11px] font-semibold text-stone-500">
              {formatTime(shifts.morning.end)} - {formatTime(shifts.evening.start)}
            </span>
          </div>

          {/* Evening Shift */}
          <div className="rounded-2xl bg-white border border-stone-200 p-3.5 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <Moon size={20} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-sm text-stone-900 font-heading">
                    {shifts.evening.label || 'Evening Shift'}
                  </span>
                  {liveStatus.isOpen && liveStatus.currentShift?.includes('Evening') && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-600 font-mono mt-0.5 font-semibold">
                  {formatTime(shifts.evening.start)} - {formatTime(shifts.evening.end)}
                </p>
              </div>
            </div>
            <span className="text-xs text-stone-500 text-right font-medium">
              Samosa & Kulhad Rush
            </span>
          </div>
        </div>

        {/* Location Landmark & Campus Info */}
        <div className="rounded-2xl bg-white border border-stone-200 p-3.5 space-y-2 shadow-sm">
          <div className="flex items-start gap-2.5">
            <MapPin size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-stone-900">Campus Tapri Spot</p>
              <p className="text-xs text-stone-600 mt-0.5">
                {settings.campusLocation}
              </p>
              <p className="text-[11px] text-orange-600 font-medium mt-1">
                🚶 {settings.landmarkWalkTime}
              </p>
            </div>
          </div>
        </div>

        {/* Days Active */}
        <div className="flex items-center justify-between text-xs text-stone-500 px-1">
          <span>Weekly Days:</span>
          <span className="text-stone-800 font-semibold">
            {shifts.daysActive?.join(', ') || 'All Days Active'}
          </span>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-xs font-bold text-white transition-all shadow-sm"
        >
          Close Schedule
        </button>
      </div>
    </div>
  );
}
